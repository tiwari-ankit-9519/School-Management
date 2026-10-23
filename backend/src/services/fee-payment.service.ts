import {
  EnrollmentStatus,
  FeeStatus,
  Prisma,
  Role,
  TransactionStatus,
} from "@prisma/client";
import { prisma } from "../config/database.config";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import {
  CACHE_KEYS,
  deleteCache,
  deleteCacheByPattern,
} from "../utils/cache.util";
import {
  OPEN_FEE_STATUSES,
  getBillBalance,
  resolveBillStatus,
  roundMoney,
} from "../utils/fees.utils";
import { generateReceiptNumber } from "./fee-receipt.service";
import {
  CollectStudentFeesType,
  FeePaymentListQueryType,
  FeeStudentListQueryType,
  ReverseFeeReceiptType,
  WaiveFeePaymentType,
} from "../validations/input.validations";

const log = createModuleLogger("FeePaymentService");

const SCHOOL_TIMEZONE = "Asia/Kolkata";
const MONEY_EPSILON = 0.005;
const MAX_RECEIPT_RETRIES = 3;

const SCHOOL_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: SCHOOL_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const getSchoolToday = (now: Date = new Date()): Date =>
  new Date(`${SCHOOL_DATE_FORMAT.format(now)}T00:00:00.000Z`);

const toPaidAt = (paidAt: string | undefined): Date => {
  if (!paidAt) return new Date();
  return paidAt === SCHOOL_DATE_FORMAT.format(new Date())
    ? new Date()
    : new Date(`${paidAt}T12:00:00+05:30`);
};

const personSelect = {
  id: true,
  regNumber: true,
  admin: { select: { firstName: true, lastName: true } },
  teacher: { select: { firstName: true, lastName: true } },
} satisfies Prisma.UserSelect;

type PersonRow = Prisma.UserGetPayload<{ select: typeof personSelect }>;

const toPersonName = (person: PersonRow | null): string | null => {
  if (!person) return null;
  const named = person.admin ?? person.teacher;
  return named ? `${named.firstName} ${named.lastName}` : person.regNumber;
};

const toClassName = (
  cls: { name: string; section: string } | null | undefined,
): string | null => (cls ? `${cls.name}-${cls.section}` : null);

const receiptSummarySelect = {
  id: true,
  receiptNumber: true,
  totalAmount: true,
  paymentMode: true,
  referenceNumber: true,
  paidAt: true,
  remarks: true,
  status: true,
  reversedAt: true,
  reversalReason: true,
  createdAt: true,
  academicYear: { select: { id: true, name: true } },
  collectedBy: { select: personSelect },
  reversedBy: { select: personSelect },
  allocations: {
    orderBy: { feePayment: { dueDate: "asc" } },
    select: {
      amount: true,
      feePayment: {
        select: {
          id: true,
          billingPeriod: true,
          feeStructure: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.FeeReceiptSelect;

type ReceiptSummaryRow = Prisma.FeeReceiptGetPayload<{
  select: typeof receiptSummarySelect;
}>;

const formatReceipt = (receipt: ReceiptSummaryRow) => ({
  id: receipt.id,
  receiptNumber: receipt.receiptNumber,
  totalAmount: receipt.totalAmount,
  paymentMode: receipt.paymentMode,
  referenceNumber: receipt.referenceNumber,
  paidAt: receipt.paidAt,
  remarks: receipt.remarks,
  status: receipt.status,
  reversedAt: receipt.reversedAt,
  reversalReason: receipt.reversalReason,
  createdAt: receipt.createdAt,
  academicYear: receipt.academicYear,
  collectedBy: toPersonName(receipt.collectedBy),
  reversedBy: toPersonName(receipt.reversedBy),
  items: receipt.allocations.map((allocation) => ({
    billId: allocation.feePayment.id,
    feeName: allocation.feePayment.feeStructure.name,
    billingPeriod: allocation.feePayment.billingPeriod,
    amount: allocation.amount,
  })),
});

interface BillMoney {
  amountDue: number;
  amountPaid: number;
  waivedAmount: number;
  dueDate: Date;
  status: FeeStatus;
}

const summarizeBills = (bills: BillMoney[], today: Date) => {
  const billed = roundMoney(
    bills.reduce((sum, bill) => sum + bill.amountDue, 0),
  );
  const paid = roundMoney(
    bills.reduce((sum, bill) => sum + bill.amountPaid, 0),
  );
  const waived = roundMoney(
    bills.reduce((sum, bill) => sum + bill.waivedAmount, 0),
  );
  const open = bills.filter((bill) => getBillBalance(bill) > MONEY_EPSILON);
  return {
    billed,
    paid,
    waived,
    outstanding: roundMoney(
      open.reduce((sum, bill) => sum + getBillBalance(bill), 0),
    ),
    overdueCount: open.filter(
      (bill) => bill.status === FeeStatus.OVERDUE || bill.dueDate < today,
    ).length,
    openCount: open.length,
    billCount: bills.length,
  };
};

async function getCurrentAcademicYearId(): Promise<string | null> {
  const year = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
    select: { id: true },
  });
  return year?.id ?? null;
}

async function clearFeeCaches(studentId: string): Promise<void> {
  const people = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      userId: true,
      parentLinks: { select: { parent: { select: { userId: true } } } },
    },
  });

  const userIds = [
    people?.userId,
    ...(people?.parentLinks.map((link) => link.parent.userId) ?? []),
  ].filter((id): id is string => !!id);

  await Promise.all([
    deleteCache(CACHE_KEYS.dashboardSummary()),
    ...userIds.map((userId) => deleteCacheByPattern(`user:${userId}:today:*`)),
  ]);
}

const isReceiptCollision = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002" &&
  JSON.stringify(error.meta?.target ?? "").includes("receiptNumber");

async function lockBills(
  tx: Prisma.TransactionClient,
  billIds: string[],
): Promise<void> {
  if (billIds.length === 0) return;
  const ordered = [...billIds].sort();
  await tx.$queryRaw`SELECT "id" FROM "FeePayment" WHERE "id" IN (${Prisma.join(ordered)}) ORDER BY "id" FOR UPDATE`;
}

export async function listFeeStudentsService(
  query: FeeStudentListQueryType,
  userId: string,
  context: AuditContext,
  statusCode: number,
) {
  try {
    log.info("Listing fee students", {
      userId,
      query,
      ipAddress: context.ipAddress,
    });

    const academicYearId =
      query.academicYearId ?? (await getCurrentAcademicYearId());
    if (!academicYearId) {
      return {
        data: [],
        total: 0,
        page: query.page,
        limit: query.limit,
        totalPages: 0,
        totals: {
          students: 0,
          billed: 0,
          collected: 0,
          waived: 0,
          outstanding: 0,
          withDues: 0,
          withOverdue: 0,
        },
      };
    }

    const today = getSchoolToday();
    const classFilter: Prisma.EnrollmentWhereInput = {
      academicYearId,
      ...(query.classId ? { classId: query.classId } : {}),
      ...(query.classGroupId
        ? { class: { classGroupId: query.classGroupId } }
        : {}),
    };
    const hasClassFilter = !!query.classId || !!query.classGroupId;

    const studentWhere: Prisma.StudentWhereInput = {
      AND: [
        hasClassFilter
          ? { enrollments: { some: classFilter } }
          : {
              OR: [
                {
                  enrollments: {
                    some: { academicYearId, status: EnrollmentStatus.ACTIVE },
                  },
                },
                { feePayments: { some: { feeStructure: { academicYearId } } } },
              ],
            },
        ...(query.search
          ? [
              {
                OR: [
                  {
                    firstName: {
                      contains: query.search,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    lastName: {
                      contains: query.search,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    user: {
                      regNumber: {
                        contains: query.search,
                        mode: "insensitive" as const,
                      },
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    };

    const students = await prisma.student.findMany({
      where: studentWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        user: { select: { regNumber: true } },
        enrollments: {
          where: { academicYearId },
          orderBy: { enrolledAt: "desc" },
          take: 1,
          select: {
            status: true,
            rollNumber: true,
            class: { select: { id: true, name: true, section: true } },
          },
        },
      },
    });

    const studentIds = students.map((student) => student.id);
    const yearBills: Prisma.FeePaymentWhereInput = {
      studentId: { in: studentIds },
      feeStructure: { academicYearId },
    };

    const [sums, overdueGroups, lastPayments] = studentIds.length
      ? await Promise.all([
          prisma.feePayment.groupBy({
            by: ["studentId"],
            where: yearBills,
            _sum: { amountDue: true, amountPaid: true, waivedAmount: true },
            _count: { _all: true },
          }),
          prisma.feePayment.groupBy({
            by: ["studentId"],
            where: {
              ...yearBills,
              status: { in: OPEN_FEE_STATUSES },
              dueDate: { lt: today },
            },
            _count: { _all: true },
          }),
          prisma.feeReceipt.groupBy({
            by: ["studentId"],
            where: {
              studentId: { in: studentIds },
              academicYearId,
              status: TransactionStatus.SUCCESS,
            },
            _max: { paidAt: true },
          }),
        ])
      : [[], [], []];

    const sumByStudent = new Map(sums.map((row) => [row.studentId, row]));
    const overdueByStudent = new Map(
      overdueGroups.map((row) => [row.studentId, row._count._all]),
    );
    const lastPaidByStudent = new Map(
      lastPayments.map((row) => [row.studentId, row._max.paidAt]),
    );

    const rows = students.map((student) => {
      const sum = sumByStudent.get(student.id);
      const billed = roundMoney(sum?._sum.amountDue ?? 0);
      const paid = roundMoney(sum?._sum.amountPaid ?? 0);
      const waived = roundMoney(sum?._sum.waivedAmount ?? 0);
      const enrollment = student.enrollments[0];
      return {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        regNumber: student.user.regNumber,
        className: toClassName(enrollment?.class),
        classId: enrollment?.class.id ?? null,
        rollNumber: enrollment?.rollNumber ?? null,
        enrollmentStatus: enrollment?.status ?? null,
        billCount: sum?._count._all ?? 0,
        billed,
        paid,
        waived,
        outstanding: roundMoney(Math.max(0, billed - paid - waived)),
        overdueCount: overdueByStudent.get(student.id) ?? 0,
        lastPaymentAt: lastPaidByStudent.get(student.id) ?? null,
      };
    });

    const filtered = rows.filter((row) => {
      if (query.dueStatus === "DUE") return row.outstanding > MONEY_EPSILON;
      if (query.dueStatus === "OVERDUE") return row.overdueCount > 0;
      if (query.dueStatus === "CLEARED")
        return row.billCount > 0 && row.outstanding <= MONEY_EPSILON;
      return true;
    });

    const direction = query.order === "asc" ? 1 : -1;
    const byName = (a: (typeof rows)[number], b: (typeof rows)[number]) =>
      `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`,
      );

    filtered.sort((a, b) => {
      if (query.sortBy === "name") return byName(a, b) * direction;
      if (query.sortBy === "overdue")
        return (a.overdueCount - b.overdueCount) * direction || byName(a, b);
      if (query.sortBy === "lastPayment") {
        const aTime = a.lastPaymentAt ? new Date(a.lastPaymentAt).getTime() : 0;
        const bTime = b.lastPaymentAt ? new Date(b.lastPaymentAt).getTime() : 0;
        return (aTime - bTime) * direction || byName(a, b);
      }
      return (a.outstanding - b.outstanding) * direction || byName(a, b);
    });

    const totals = filtered.reduce(
      (acc, row) => ({
        students: acc.students + 1,
        billed: acc.billed + row.billed,
        collected: acc.collected + row.paid,
        waived: acc.waived + row.waived,
        outstanding: acc.outstanding + row.outstanding,
        withDues: acc.withDues + (row.outstanding > MONEY_EPSILON ? 1 : 0),
        withOverdue: acc.withOverdue + (row.overdueCount > 0 ? 1 : 0),
      }),
      {
        students: 0,
        billed: 0,
        collected: 0,
        waived: 0,
        outstanding: 0,
        withDues: 0,
        withOverdue: 0,
      },
    );

    const start = (query.page - 1) * query.limit;

    await createSystemLog({
      level: "INFO",
      module: "FeePaymentService",
      message: "Fee students listed",
      context,
      statusCode,
      metadata: { userId, total: filtered.length, page: query.page },
    });

    return {
      data: filtered.slice(start, start + query.limit),
      total: filtered.length,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(filtered.length / query.limit),
      totals: {
        ...totals,
        billed: roundMoney(totals.billed),
        collected: roundMoney(totals.collected),
        waived: roundMoney(totals.waived),
        outstanding: roundMoney(totals.outstanding),
      },
    };
  } catch (error) {
    const err = error as Error;
    log.error("Failed to list fee students", {
      userId,
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

const billListSelect = (academicYearId?: string) =>
  ({
    id: true,
    amountDue: true,
    amountPaid: true,
    waivedAmount: true,
    status: true,
    dueDate: true,
    billingPeriod: true,
    paymentDate: true,
    createdAt: true,
    feeStructure: {
      select: { id: true, name: true, isRecurring: true, recurringMonth: true },
    },
    student: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        user: { select: { regNumber: true } },
        enrollments: {
          where: { ...(academicYearId ? { academicYearId } : {}) },
          orderBy: { enrolledAt: "desc" as const },
          take: 1,
          select: {
            rollNumber: true,
            class: { select: { id: true, name: true, section: true } },
          },
        },
      },
    },
    _count: { select: { allocations: true } },
  }) satisfies Prisma.FeePaymentSelect;

export async function listFeePaymentsService(
  query: FeePaymentListQueryType,
  userId: string,
  context: AuditContext,
  statusCode: number,
) {
  try {
    log.info("Listing fee bills", {
      userId,
      query,
      ipAddress: context.ipAddress,
    });

    const academicYearId =
      query.academicYearId ?? (await getCurrentAcademicYearId()) ?? undefined;
    const today = getSchoolToday();

    const where: Prisma.FeePaymentWhereInput = {
      feeStructure: {
        ...(academicYearId ? { academicYearId } : {}),
        ...(query.classGroupId ? { classGroupId: query.classGroupId } : {}),
      },
      ...(query.feeStructureId ? { feeStructureId: query.feeStructureId } : {}),
      ...(query.billingPeriod ? { billingPeriod: query.billingPeriod } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.overdueOnly
        ? { status: { in: OPEN_FEE_STATUSES }, dueDate: { lt: today } }
        : {}),
      ...(query.classId
        ? {
            student: {
              enrollments: {
                some: {
                  classId: query.classId,
                  ...(academicYearId ? { academicYearId } : {}),
                },
              },
            },
          }
        : {}),
    };

    if (query.search) {
      where.AND = [
        {
          student: {
            OR: [
              { firstName: { contains: query.search, mode: "insensitive" } },
              { lastName: { contains: query.search, mode: "insensitive" } },
              {
                user: {
                  regNumber: { contains: query.search, mode: "insensitive" },
                },
              },
            ],
          },
        },
      ];
    }

    const [bills, total, totals] = await Promise.all([
      prisma.feePayment.findMany({
        where,
        select: billListSelect(academicYearId),
        orderBy: [{ [query.sortBy]: query.order }, { id: "asc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.feePayment.count({ where }),
      prisma.feePayment.aggregate({
        where,
        _sum: { amountDue: true, amountPaid: true, waivedAmount: true },
      }),
    ]);

    const billed = roundMoney(totals._sum.amountDue ?? 0);
    const collected = roundMoney(totals._sum.amountPaid ?? 0);
    const waived = roundMoney(totals._sum.waivedAmount ?? 0);

    await createSystemLog({
      level: "INFO",
      module: "FeePaymentService",
      message: "Fee bills listed",
      context,
      statusCode,
      metadata: { userId, total, page: query.page },
    });

    return {
      data: bills.map((bill) => ({
        id: bill.id,
        amountDue: bill.amountDue,
        amountPaid: bill.amountPaid,
        waivedAmount: bill.waivedAmount,
        balance: getBillBalance(bill),
        status: bill.status,
        dueDate: bill.dueDate,
        billingPeriod: bill.billingPeriod,
        paymentDate: bill.paymentDate,
        createdAt: bill.createdAt,
        receiptCount: bill._count.allocations,
        feeStructure: bill.feeStructure,
        student: {
          id: bill.student.id,
          firstName: bill.student.firstName,
          lastName: bill.student.lastName,
          regNumber: bill.student.user.regNumber,
          className: toClassName(bill.student.enrollments[0]?.class),
          rollNumber: bill.student.enrollments[0]?.rollNumber ?? null,
        },
      })),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
      totals: {
        billed,
        collected,
        waived,
        outstanding: roundMoney(Math.max(0, billed - collected - waived)),
      },
    };
  } catch (error) {
    const err = error as Error;
    log.error("Failed to list fee bills", {
      userId,
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

const studentBillSelect = {
  id: true,
  amountDue: true,
  amountPaid: true,
  waivedAmount: true,
  status: true,
  dueDate: true,
  billingPeriod: true,
  paymentDate: true,
  createdAt: true,
  waiverReason: true,
  waivedAt: true,
  waivedBy: { select: personSelect },
  feeStructure: {
    select: {
      id: true,
      name: true,
      isRecurring: true,
      recurringMonth: true,
      academicYear: {
        select: { id: true, name: true, isCurrent: true, startDate: true },
      },
    },
  },
} satisfies Prisma.FeePaymentSelect;

type StudentBillRow = Prisma.FeePaymentGetPayload<{
  select: typeof studentBillSelect;
}>;

const groupBillsByYear = (bills: StudentBillRow[], today: Date) => {
  const years = new Map<
    string,
    {
      academicYearId: string;
      name: string;
      isCurrent: boolean;
      startDate: Date;
      bills: StudentBillRow[];
    }
  >();

  bills.forEach((bill) => {
    const year = bill.feeStructure.academicYear;
    const entry = years.get(year.id) ?? {
      academicYearId: year.id,
      name: year.name,
      isCurrent: year.isCurrent,
      startDate: year.startDate,
      bills: [],
    };
    entry.bills.push(bill);
    years.set(year.id, entry);
  });

  return Array.from(years.values())
    .sort(
      (a, b) =>
        Number(b.isCurrent) - Number(a.isCurrent) ||
        b.startDate.getTime() - a.startDate.getTime(),
    )
    .map((year) => ({
      academicYearId: year.academicYearId,
      name: year.name,
      isCurrent: year.isCurrent,
      summary: summarizeBills(year.bills, today),
      bills: year.bills.map((bill) => ({
        id: bill.id,
        amountDue: bill.amountDue,
        amountPaid: bill.amountPaid,
        waivedAmount: bill.waivedAmount,
        balance: getBillBalance(bill),
        isOverdue: getBillBalance(bill) > MONEY_EPSILON && bill.dueDate < today,
        status: bill.status,
        dueDate: bill.dueDate,
        billingPeriod: bill.billingPeriod,
        paymentDate: bill.paymentDate,
        createdAt: bill.createdAt,
        waiverReason: bill.waiverReason,
        waivedAt: bill.waivedAt,
        waivedBy: toPersonName(bill.waivedBy),
        feeStructure: {
          id: bill.feeStructure.id,
          name: bill.feeStructure.name,
          isRecurring: bill.feeStructure.isRecurring,
          recurringMonth: bill.feeStructure.recurringMonth,
        },
      })),
    }));
};

export async function getFeeStudentDetailService(
  studentId: string,
  userId: string,
  context: AuditContext,
  statusCode: number,
) {
  try {
    const today = getSchoolToday();

    const [student, bills, receipts] = await Promise.all([
      prisma.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          user: { select: { regNumber: true, email: true, phone: true } },
          enrollments: {
            orderBy: { enrolledAt: "desc" },
            take: 1,
            select: {
              status: true,
              rollNumber: true,
              class: { select: { id: true, name: true, section: true } },
              academicYear: { select: { name: true } },
            },
          },
          parentLinks: {
            select: {
              parentType: true,
              parent: {
                select: {
                  firstName: true,
                  lastName: true,
                  user: { select: { email: true, phone: true } },
                },
              },
            },
          },
        },
      }),
      prisma.feePayment.findMany({
        where: { studentId },
        select: studentBillSelect,
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      }),
      prisma.feeReceipt.findMany({
        where: { studentId },
        select: receiptSummarySelect,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!student) {
      log.warn("Student not found for fee detail", { studentId });
      throw new Error("Student not found");
    }

    const enrollment = student.enrollments[0];

    await createSystemLog({
      level: "INFO",
      module: "FeePaymentService",
      message: "Student fee detail viewed",
      context,
      statusCode,
      metadata: { userId, studentId },
    });

    return {
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        regNumber: student.user.regNumber,
        email: student.user.email,
        phone: student.user.phone,
        className: toClassName(enrollment?.class),
        rollNumber: enrollment?.rollNumber ?? null,
        enrollmentStatus: enrollment?.status ?? null,
        session: enrollment?.academicYear.name ?? null,
        guardians: student.parentLinks.map((link) => ({
          relation: link.parentType,
          name: `${link.parent.firstName} ${link.parent.lastName}`,
          email: link.parent.user.email,
          phone: link.parent.user.phone,
        })),
      },
      summary: summarizeBills(bills, today),
      years: groupBillsByYear(bills, today),
      receipts: receipts.map(formatReceipt),
    };
  } catch (error) {
    const err = error as Error;
    log.error("Failed to get student fee detail", {
      studentId,
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function collectStudentFeesService(
  studentId: string,
  data: CollectStudentFeesType,
  collectorId: string,
  context: AuditContext,
  statusCode: number,
) {
  try {
    log.info("Collecting student fees", {
      studentId,
      collectorId,
      billCount: data.billIds.length,
      amount: data.amount,
      mode: data.paymentMode,
      ipAddress: context.ipAddress,
    });

    const school = await prisma.schoolConfig.findFirst({
      select: { allowPartialPayments: true },
    });
    const allowPartial = school?.allowPartialPayments ?? true;
    const amount = roundMoney(data.amount);
    const paidAt = toPaidAt(data.paidAt);
    const today = getSchoolToday();

    let attempt = 0;
    while (true) {
      attempt += 1;
      try {
        const result = await prisma.$transaction(async (tx) => {
          await lockBills(tx, data.billIds);

          const bills = await tx.feePayment.findMany({
            where: { id: { in: data.billIds } },
            select: {
              id: true,
              studentId: true,
              amountDue: true,
              amountPaid: true,
              waivedAmount: true,
              dueDate: true,
              createdAt: true,
              status: true,
              paymentDate: true,
              feeStructure: { select: { name: true, academicYearId: true } },
            },
          });

          if (bills.length !== data.billIds.length) {
            throw new Error("One or more selected bills were not found");
          }
          if (bills.some((bill) => bill.studentId !== studentId)) {
            throw new Error("All selected bills must belong to this student");
          }

          const academicYearIds = new Set(
            bills.map((bill) => bill.feeStructure.academicYearId),
          );
          if (academicYearIds.size > 1) {
            throw new Error(
              "Bills from different sessions must be collected on separate receipts",
            );
          }

          const settled = bills.filter(
            (bill) =>
              bill.status === FeeStatus.WAIVED ||
              getBillBalance(bill) <= MONEY_EPSILON,
          );
          if (settled.length > 0) {
            throw new Error(
              `Already settled: ${settled.map((bill) => bill.feeStructure.name).join(", ")}. Remove them and try again`,
            );
          }

          const ordered = [...bills].sort(
            (a, b) =>
              a.dueDate.getTime() - b.dueDate.getTime() ||
              a.createdAt.getTime() - b.createdAt.getTime(),
          );
          const combinedBalance = roundMoney(
            ordered.reduce((sum, bill) => sum + getBillBalance(bill), 0),
          );

          if (amount - combinedBalance > MONEY_EPSILON) {
            throw new Error(
              `Amount exceeds the combined balance of Rs. ${combinedBalance.toFixed(2)}`,
            );
          }
          if (
            !allowPartial &&
            Math.abs(amount - combinedBalance) > MONEY_EPSILON
          ) {
            throw new Error(
              `Partial payments are turned off. Collect the full balance of Rs. ${combinedBalance.toFixed(2)}`,
            );
          }

          let remaining = amount;
          const allocations: { billId: string; amount: number }[] = [];
          for (const bill of ordered) {
            if (remaining <= MONEY_EPSILON) break;
            const share = roundMoney(Math.min(remaining, getBillBalance(bill)));
            allocations.push({ billId: bill.id, amount: share });
            remaining = roundMoney(remaining - share);
          }

          const academicYearId = ordered[0].feeStructure.academicYearId;
          const receiptNumber = await generateReceiptNumber(tx, academicYearId);

          const receipt = await tx.feeReceipt.create({
            data: {
              receiptNumber,
              studentId,
              academicYearId,
              totalAmount: amount,
              paymentMode: data.paymentMode,
              referenceNumber: data.referenceNumber?.trim() || null,
              paidAt,
              remarks: data.remarks?.trim() || null,
              collectedById: collectorId,
              allocations: {
                create: allocations.map((allocation) => ({
                  feePaymentId: allocation.billId,
                  amount: allocation.amount,
                })),
              },
            },
            select: receiptSummarySelect,
          });

          const updatedBills = await Promise.all(
            allocations.map(async (allocation) => {
              const bill = ordered.find(
                (item) => item.id === allocation.billId,
              );
              if (!bill) throw new Error("Bill disappeared during collection");
              const amountPaid = roundMoney(
                bill.amountPaid + allocation.amount,
              );
              const status = resolveBillStatus(
                {
                  amountDue: bill.amountDue,
                  amountPaid,
                  waivedAmount: bill.waivedAmount,
                  dueDate: bill.dueDate,
                },
                today,
              );
              return tx.feePayment.update({
                where: { id: bill.id },
                data: {
                  amountPaid,
                  status,
                  paymentDate:
                    !bill.paymentDate || paidAt > bill.paymentDate
                      ? paidAt
                      : bill.paymentDate,
                },
                select: {
                  id: true,
                  amountDue: true,
                  amountPaid: true,
                  waivedAmount: true,
                  status: true,
                },
              });
            }),
          );

          return { receipt, updatedBills, combinedBalance };
        });

        await clearFeeCaches(studentId);

        await createAuditLog({
          performedById: collectorId,
          action: "CREATE",
          module: "FeePayment",
          resourceId: result.receipt.receiptNumber,
          resourceType: "FeeReceipt",
          newValues: {
            receiptNumber: result.receipt.receiptNumber,
            studentId,
            totalAmount: amount,
            paymentMode: data.paymentMode,
            referenceNumber: data.referenceNumber ?? null,
            allocations: result.receipt.allocations.map((allocation) => ({
              billId: allocation.feePayment.id,
              fee: allocation.feePayment.feeStructure.name,
              amount: allocation.amount,
            })),
          },
          context,
          isSuccessful: true,
          statusCode,
        });

        await createSystemLog({
          level: "INFO",
          module: "FeePaymentService",
          message: "Student fees collected",
          context,
          statusCode,
          metadata: {
            studentId,
            receiptNumber: result.receipt.receiptNumber,
            amount,
            bills: result.updatedBills.length,
          },
        });

        log.info("Student fees collected", {
          studentId,
          receiptNumber: result.receipt.receiptNumber,
          bills: result.updatedBills.length,
        });

        return {
          receipt: formatReceipt(result.receipt),
          bills: result.updatedBills.map((bill) => ({
            ...bill,
            balance: getBillBalance(bill),
          })),
          balanceRemaining: roundMoney(
            Math.max(0, result.combinedBalance - amount),
          ),
        };
      } catch (error) {
        if (isReceiptCollision(error) && attempt < MAX_RECEIPT_RETRIES) {
          log.warn("Receipt number collision, retrying", {
            studentId,
            attempt,
          });
          continue;
        }
        throw error;
      }
    }
  } catch (error) {
    const err = error as Error;
    log.error("Failed to collect student fees", {
      studentId,
      collectorId,
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function waiveFeePaymentService(
  billId: string,
  data: WaiveFeePaymentType,
  userId: string,
  context: AuditContext,
  statusCode: number,
) {
  try {
    log.info("Waiving fee", {
      billId,
      userId,
      amount: data.amount ?? "full balance",
      ipAddress: context.ipAddress,
    });

    const today = getSchoolToday();

    const result = await prisma.$transaction(async (tx) => {
      await lockBills(tx, [billId]);

      const bill = await tx.feePayment.findUnique({
        where: { id: billId },
        select: {
          id: true,
          studentId: true,
          amountDue: true,
          amountPaid: true,
          waivedAmount: true,
          dueDate: true,
          status: true,
          waiverReason: true,
        },
      });

      if (!bill) throw new Error("Fee bill not found");

      const balance = getBillBalance(bill);
      if (balance <= MONEY_EPSILON)
        throw new Error("This bill has no balance left to waive");

      const waiveAmount = roundMoney(data.amount ?? balance);
      if (waiveAmount - balance > MONEY_EPSILON) {
        throw new Error(
          `Waiver exceeds the remaining balance of Rs. ${balance.toFixed(2)}`,
        );
      }

      const waivedAmount = roundMoney(bill.waivedAmount + waiveAmount);
      const status = resolveBillStatus(
        {
          amountDue: bill.amountDue,
          amountPaid: bill.amountPaid,
          waivedAmount,
          dueDate: bill.dueDate,
        },
        today,
      );
      const reasonEntry = `Rs. ${waiveAmount.toFixed(2)}: ${data.reason.trim()}`;

      const updatedBill = await tx.feePayment.update({
        where: { id: bill.id },
        data: {
          waivedAmount,
          status,
          waiverReason: bill.waiverReason
            ? `${bill.waiverReason}\n${reasonEntry}`
            : reasonEntry,
          waivedById: userId,
          waivedAt: new Date(),
        },
        select: {
          id: true,
          studentId: true,
          amountDue: true,
          amountPaid: true,
          waivedAmount: true,
          status: true,
          waiverReason: true,
        },
      });

      return { bill, updatedBill, waiveAmount };
    });

    await clearFeeCaches(result.bill.studentId);

    await createAuditLog({
      performedById: userId,
      action: "APPROVE",
      module: "FeePayment",
      resourceId: billId,
      resourceType: "FeeWaiver",
      oldValues: {
        waivedAmount: result.bill.waivedAmount,
        status: result.bill.status,
      },
      newValues: {
        waivedAmount: result.updatedBill.waivedAmount,
        status: result.updatedBill.status,
        amountWaivedNow: result.waiveAmount,
        reason: data.reason,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    log.info("Fee waived", {
      billId,
      amount: result.waiveAmount,
      status: result.updatedBill.status,
    });

    return {
      ...result.updatedBill,
      balance: getBillBalance(result.updatedBill),
    };
  } catch (error) {
    const err = error as Error;
    log.error("Failed to waive fee", {
      billId,
      userId,
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function reverseFeeReceiptService(
  receiptId: string,
  data: ReverseFeeReceiptType,
  adminId: string,
  context: AuditContext,
  statusCode: number,
) {
  try {
    log.info("Reversing fee receipt", {
      receiptId,
      adminId,
      ipAddress: context.ipAddress,
    });

    const today = getSchoolToday();

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.feeReceipt.findUnique({
        where: { id: receiptId },
        select: { id: true, allocations: { select: { feePaymentId: true } } },
      });
      if (!existing) throw new Error("Receipt not found");

      await lockBills(
        tx,
        existing.allocations.map((allocation) => allocation.feePaymentId),
      );

      const receipt = await tx.feeReceipt.findUniqueOrThrow({
        where: { id: receiptId },
        select: {
          id: true,
          receiptNumber: true,
          studentId: true,
          status: true,
          totalAmount: true,
          allocations: { select: { feePaymentId: true, amount: true } },
        },
      });

      if (receipt.status === TransactionStatus.REVERSED) {
        throw new Error("This receipt has already been reversed");
      }

      const reversed = await tx.feeReceipt.update({
        where: { id: receipt.id },
        data: {
          status: TransactionStatus.REVERSED,
          reversedById: adminId,
          reversedAt: new Date(),
          reversalReason: data.reason.trim(),
        },
        select: receiptSummarySelect,
      });

      const updatedBills = await Promise.all(
        receipt.allocations.map(async (allocation) => {
          const bill = await tx.feePayment.findUniqueOrThrow({
            where: { id: allocation.feePaymentId },
            select: {
              id: true,
              amountDue: true,
              amountPaid: true,
              waivedAmount: true,
              dueDate: true,
              status: true,
            },
          });

          const latestRemaining = await tx.feeAllocation.findFirst({
            where: {
              feePaymentId: bill.id,
              receipt: { status: TransactionStatus.SUCCESS },
            },
            orderBy: { receipt: { paidAt: "desc" } },
            select: { receipt: { select: { paidAt: true } } },
          });

          const amountPaid = roundMoney(
            Math.max(0, bill.amountPaid - allocation.amount),
          );
          const status = resolveBillStatus(
            {
              amountDue: bill.amountDue,
              amountPaid,
              waivedAmount: bill.waivedAmount,
              dueDate: bill.dueDate,
            },
            today,
          );

          return tx.feePayment.update({
            where: { id: bill.id },
            data: {
              amountPaid,
              status,
              paymentDate: latestRemaining?.receipt.paidAt ?? null,
            },
            select: {
              id: true,
              amountDue: true,
              amountPaid: true,
              waivedAmount: true,
              status: true,
            },
          });
        }),
      );

      return { receipt, reversed, updatedBills };
    });

    await clearFeeCaches(result.receipt.studentId);

    await createAuditLog({
      performedById: adminId,
      action: "UPDATE",
      module: "FeePayment",
      resourceId: result.receipt.receiptNumber,
      resourceType: "FeeReceiptReversal",
      oldValues: {
        status: TransactionStatus.SUCCESS,
        totalAmount: result.receipt.totalAmount,
      },
      newValues: {
        status: TransactionStatus.REVERSED,
        reason: data.reason,
        bills: result.updatedBills.map((bill) => ({
          billId: bill.id,
          amountPaid: bill.amountPaid,
          status: bill.status,
        })),
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    log.info("Fee receipt reversed", {
      receiptId,
      receiptNumber: result.receipt.receiptNumber,
      bills: result.updatedBills.length,
    });

    return {
      receipt: formatReceipt(result.reversed),
      bills: result.updatedBills.map((bill) => ({
        ...bill,
        balance: getBillBalance(bill),
      })),
    };
  } catch (error) {
    const err = error as Error;
    log.error("Failed to reverse fee receipt", {
      receiptId,
      adminId,
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function getMyFeesService(
  userId: string,
  role: Role,
  context: AuditContext,
  statusCode: number,
) {
  try {
    log.info("Fetching my fees", {
      userId,
      role,
      ipAddress: context.ipAddress,
    });

    let students: { id: string; firstName: string; lastName: string }[] = [];

    if (role === Role.STUDENT) {
      const student = await prisma.student.findUnique({
        where: { userId },
        select: { id: true, firstName: true, lastName: true },
      });
      if (!student) throw new Error("Student not found");
      students = [student];
    } else if (role === Role.PARENT) {
      const links = await prisma.parentStudent.findMany({
        where: { parent: { userId } },
        select: {
          student: { select: { id: true, firstName: true, lastName: true } },
        },
      });
      students = links.map((link) => link.student);
    } else {
      throw new Error("Only students and parents can view their own fees");
    }

    const today = getSchoolToday();

    const children = await Promise.all(
      students.map(async (student) => {
        const [bills, receipts, enrollment] = await Promise.all([
          prisma.feePayment.findMany({
            where: { studentId: student.id },
            select: studentBillSelect,
            orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
          }),
          prisma.feeReceipt.findMany({
            where: { studentId: student.id },
            select: receiptSummarySelect,
            orderBy: { createdAt: "desc" },
          }),
          prisma.enrollment.findFirst({
            where: { studentId: student.id, status: EnrollmentStatus.ACTIVE },
            orderBy: { enrolledAt: "desc" },
            select: { class: { select: { name: true, section: true } } },
          }),
        ]);

        return {
          studentId: student.id,
          name: `${student.firstName} ${student.lastName}`,
          className: toClassName(enrollment?.class),
          summary: summarizeBills(bills, today),
          years: groupBillsByYear(bills, today),
          receipts: receipts.map((receipt) => {
            const formatted = formatReceipt(receipt);
            return {
              id: formatted.id,
              receiptNumber: formatted.receiptNumber,
              totalAmount: formatted.totalAmount,
              paymentMode: formatted.paymentMode,
              paidAt: formatted.paidAt,
              status: formatted.status,
              academicYear: formatted.academicYear,
              items: formatted.items,
            };
          }),
        };
      }),
    );

    await createSystemLog({
      level: "INFO",
      module: "FeePaymentService",
      message: "My fees fetched",
      context,
      statusCode,
      metadata: { userId, role, childCount: children.length },
    });

    return { children };
  } catch (error) {
    const err = error as Error;
    log.error("Failed to fetch my fees", {
      userId,
      role,
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}
