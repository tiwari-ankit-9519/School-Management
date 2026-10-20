import { FeeStatus, Prisma, Role, TransactionStatus } from "@prisma/client";
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
  CollectFeePaymentType,
  FeePaymentListQueryType,
  ReverseFeeTransactionType,
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

const currentEnrollmentSelect = (academicYearId?: string) => ({
  where: {
    status: "ACTIVE" as const,
    ...(academicYearId ? { academicYearId } : {}),
  },
  orderBy: { enrolledAt: "desc" as const },
  take: 1,
  select: {
    rollNumber: true,
    class: { select: { id: true, name: true, section: true } },
  },
});

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
        enrollments: currentEnrollmentSelect(academicYearId),
      },
    },
    _count: { select: { transactions: true } },
  }) satisfies Prisma.FeePaymentSelect;

const transactionSelect = {
  id: true,
  amount: true,
  paymentMode: true,
  referenceNumber: true,
  receiptNumber: true,
  paidAt: true,
  remarks: true,
  status: true,
  reversedAt: true,
  reversalReason: true,
  emailedAt: true,
  createdAt: true,
  collectedBy: { select: personSelect },
  reversedBy: { select: personSelect },
} satisfies Prisma.FeeTransactionSelect;

type TransactionRow = Prisma.FeeTransactionGetPayload<{
  select: typeof transactionSelect;
}>;

const formatTransaction = (row: TransactionRow) => ({
  id: row.id,
  amount: row.amount,
  paymentMode: row.paymentMode,
  referenceNumber: row.referenceNumber,
  receiptNumber: row.receiptNumber,
  paidAt: row.paidAt,
  remarks: row.remarks,
  status: row.status,
  reversedAt: row.reversedAt,
  reversalReason: row.reversalReason,
  emailedAt: row.emailedAt,
  createdAt: row.createdAt,
  collectedBy: toPersonName(row.collectedBy),
  reversedBy: toPersonName(row.reversedBy),
});

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

async function lockBill(
  tx: Prisma.TransactionClient,
  billId: string,
): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "FeePayment" WHERE "id" = ${billId} FOR UPDATE`;
}

async function buildListWhere(query: FeePaymentListQueryType): Promise<{
  where: Prisma.FeePaymentWhereInput;
  academicYearId: string | undefined;
}> {
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

  return { where, academicYearId };
}

export async function listFeePaymentsService(
  query: FeePaymentListQueryType,
  userId: string,
  context: AuditContext,
  statusCode: number,
) {
  try {
    log.info("Listing fee payments", {
      userId,
      query,
      ipAddress: context.ipAddress,
    });

    const { where, academicYearId } = await buildListWhere(query);
    const skip = (query.page - 1) * query.limit;

    const [bills, total, totals] = await Promise.all([
      prisma.feePayment.findMany({
        where,
        select: billListSelect(academicYearId),
        orderBy: [{ [query.sortBy]: query.order }, { id: "asc" }],
        skip,
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
      message: "Fee payments listed",
      context,
      statusCode,
      metadata: { userId, total, page: query.page },
    });

    return {
      data: bills.map((bill) => ({
        ...bill,
        balance: getBillBalance(bill),
        transactionCount: bill._count.transactions,
        student: {
          id: bill.student.id,
          firstName: bill.student.firstName,
          lastName: bill.student.lastName,
          regNumber: bill.student.user.regNumber,
          className: bill.student.enrollments[0]
            ? `${bill.student.enrollments[0].class.name}-${bill.student.enrollments[0].class.section}`
            : null,
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
    log.error("Failed to list fee payments", {
      userId,
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function getFeePaymentDetailService(
  billId: string,
  userId: string,
  context: AuditContext,
  statusCode: number,
) {
  try {
    const bill = await prisma.feePayment.findUnique({
      where: { id: billId },
      select: {
        ...billListSelect(),
        waiverReason: true,
        waivedAt: true,
        remarks: true,
        waivedBy: { select: personSelect },
        feeStructure: {
          select: {
            id: true,
            name: true,
            isRecurring: true,
            recurringMonth: true,
            academicYear: { select: { id: true, name: true } },
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: { select: { regNumber: true, email: true, phone: true } },
            enrollments: currentEnrollmentSelect(),
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
        },
        transactions: {
          select: transactionSelect,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!bill) {
      log.warn("Fee bill not found", { billId });
      throw new Error("Fee bill not found");
    }

    await createSystemLog({
      level: "INFO",
      module: "FeePaymentService",
      message: "Fee bill viewed",
      context,
      statusCode,
      metadata: { userId, billId },
    });

    const enrollment = bill.student.enrollments[0];

    return {
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
      remarks: bill.remarks,
      waiverReason: bill.waiverReason,
      waivedAt: bill.waivedAt,
      waivedBy: toPersonName(bill.waivedBy),
      feeStructure: bill.feeStructure,
      student: {
        id: bill.student.id,
        firstName: bill.student.firstName,
        lastName: bill.student.lastName,
        regNumber: bill.student.user.regNumber,
        email: bill.student.user.email,
        phone: bill.student.user.phone,
        className: enrollment
          ? `${enrollment.class.name}-${enrollment.class.section}`
          : null,
        rollNumber: enrollment?.rollNumber ?? null,
        guardians: bill.student.parentLinks.map((link) => ({
          relation: link.parentType,
          name: `${link.parent.firstName} ${link.parent.lastName}`,
          email: link.parent.user.email,
          phone: link.parent.user.phone,
        })),
      },
      transactions: bill.transactions.map(formatTransaction),
    };
  } catch (error) {
    const err = error as Error;
    log.error("Failed to get fee bill", {
      billId,
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

export async function collectFeePaymentService(
  billId: string,
  data: CollectFeePaymentType,
  collectorId: string,
  context: AuditContext,
  statusCode: number,
) {
  try {
    log.info("Collecting fee payment", {
      billId,
      collectorId,
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
          await lockBill(tx, billId);

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
              paymentDate: true,
              feeStructure: { select: { name: true, academicYearId: true } },
            },
          });

          if (!bill) throw new Error("Fee bill not found");

          const balance = getBillBalance(bill);
          if (bill.status === FeeStatus.WAIVED || balance <= MONEY_EPSILON) {
            throw new Error("This bill is already settled");
          }
          if (amount - balance > MONEY_EPSILON) {
            throw new Error(
              `Amount exceeds the remaining balance of Rs. ${balance.toFixed(2)}`,
            );
          }
          if (!allowPartial && Math.abs(amount - balance) > MONEY_EPSILON) {
            throw new Error(
              `Partial payments are turned off. Collect the full balance of Rs. ${balance.toFixed(2)}`,
            );
          }

          const receiptNumber = await generateReceiptNumber(
            tx,
            bill.feeStructure.academicYearId,
          );

          const transaction = await tx.feeTransaction.create({
            data: {
              feePaymentId: bill.id,
              amount,
              paymentMode: data.paymentMode,
              referenceNumber: data.referenceNumber?.trim() || null,
              receiptNumber,
              paidAt,
              remarks: data.remarks?.trim() || null,
              collectedById: collectorId,
            },
            select: transactionSelect,
          });

          const amountPaid = roundMoney(bill.amountPaid + amount);
          const status = resolveBillStatus(
            {
              amountDue: bill.amountDue,
              amountPaid,
              waivedAmount: bill.waivedAmount,
              dueDate: bill.dueDate,
            },
            today,
          );

          const updatedBill = await tx.feePayment.update({
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
              studentId: true,
              amountDue: true,
              amountPaid: true,
              waivedAmount: true,
              status: true,
            },
          });

          return { bill, updatedBill, transaction };
        });

        await clearFeeCaches(result.bill.studentId);

        await createAuditLog({
          performedById: collectorId,
          action: "CREATE",
          module: "FeePayment",
          resourceId: result.transaction.receiptNumber,
          resourceType: "FeeTransaction",
          oldValues: {
            amountPaid: result.bill.amountPaid,
            status: result.bill.status,
          },
          newValues: {
            receiptNumber: result.transaction.receiptNumber,
            amount,
            paymentMode: data.paymentMode,
            referenceNumber: data.referenceNumber ?? null,
            amountPaid: result.updatedBill.amountPaid,
            status: result.updatedBill.status,
          },
          context,
          isSuccessful: true,
          statusCode,
        });

        await createSystemLog({
          level: "INFO",
          module: "FeePaymentService",
          message: "Fee payment collected",
          context,
          statusCode,
          metadata: {
            billId,
            receiptNumber: result.transaction.receiptNumber,
            amount,
            status: result.updatedBill.status,
          },
        });

        log.info("Fee payment collected", {
          billId,
          receiptNumber: result.transaction.receiptNumber,
          status: result.updatedBill.status,
        });

        return {
          bill: {
            ...result.updatedBill,
            balance: getBillBalance(result.updatedBill),
          },
          transaction: formatTransaction(result.transaction),
        };
      } catch (error) {
        if (isReceiptCollision(error) && attempt < MAX_RECEIPT_RETRIES) {
          log.warn("Receipt number collision, retrying", { billId, attempt });
          continue;
        }
        throw error;
      }
    }
  } catch (error) {
    const err = error as Error;
    log.error("Failed to collect fee payment", {
      billId,
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
      await lockBill(tx, billId);

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

export async function reverseFeeTransactionService(
  transactionId: string,
  data: ReverseFeeTransactionType,
  adminId: string,
  context: AuditContext,
  statusCode: number,
) {
  try {
    log.info("Reversing fee transaction", {
      transactionId,
      adminId,
      ipAddress: context.ipAddress,
    });

    const today = getSchoolToday();

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.feeTransaction.findUnique({
        where: { id: transactionId },
        select: {
          id: true,
          feePaymentId: true,
          amount: true,
          status: true,
          receiptNumber: true,
        },
      });

      if (!existing) throw new Error("Payment not found");

      await lockBill(tx, existing.feePaymentId);

      const transaction = await tx.feeTransaction.findUniqueOrThrow({
        where: { id: transactionId },
        select: {
          id: true,
          feePaymentId: true,
          amount: true,
          status: true,
          receiptNumber: true,
        },
      });

      if (transaction.status === TransactionStatus.REVERSED) {
        throw new Error("This payment has already been reversed");
      }

      const bill = await tx.feePayment.findUniqueOrThrow({
        where: { id: transaction.feePaymentId },
        select: {
          id: true,
          studentId: true,
          amountDue: true,
          amountPaid: true,
          waivedAmount: true,
          dueDate: true,
          status: true,
        },
      });

      const reversed = await tx.feeTransaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.REVERSED,
          reversedById: adminId,
          reversedAt: new Date(),
          reversalReason: data.reason.trim(),
        },
        select: transactionSelect,
      });

      const latestRemaining = await tx.feeTransaction.findFirst({
        where: { feePaymentId: bill.id, status: TransactionStatus.SUCCESS },
        orderBy: { paidAt: "desc" },
        select: { paidAt: true },
      });

      const amountPaid = roundMoney(
        Math.max(0, bill.amountPaid - transaction.amount),
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

      const updatedBill = await tx.feePayment.update({
        where: { id: bill.id },
        data: {
          amountPaid,
          status,
          paymentDate: latestRemaining?.paidAt ?? null,
        },
        select: {
          id: true,
          studentId: true,
          amountDue: true,
          amountPaid: true,
          waivedAmount: true,
          status: true,
        },
      });

      return { bill, updatedBill, reversed };
    });

    await clearFeeCaches(result.bill.studentId);

    await createAuditLog({
      performedById: adminId,
      action: "UPDATE",
      module: "FeePayment",
      resourceId: result.reversed.receiptNumber,
      resourceType: "FeeTransactionReversal",
      oldValues: {
        transactionStatus: TransactionStatus.SUCCESS,
        billAmountPaid: result.bill.amountPaid,
        billStatus: result.bill.status,
      },
      newValues: {
        transactionStatus: TransactionStatus.REVERSED,
        billAmountPaid: result.updatedBill.amountPaid,
        billStatus: result.updatedBill.status,
        reason: data.reason,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    log.info("Fee transaction reversed", {
      transactionId,
      receiptNumber: result.reversed.receiptNumber,
      billStatus: result.updatedBill.status,
    });

    return {
      bill: {
        ...result.updatedBill,
        balance: getBillBalance(result.updatedBill),
      },
      transaction: formatTransaction(result.reversed),
    };
  } catch (error) {
    const err = error as Error;
    log.error("Failed to reverse fee transaction", {
      transactionId,
      adminId,
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}

const myBillSelect = {
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
    select: {
      name: true,
      isRecurring: true,
      academicYear: { select: { name: true } },
    },
  },
  transactions: {
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      paymentMode: true,
      receiptNumber: true,
      paidAt: true,
      status: true,
    },
  },
} satisfies Prisma.FeePaymentSelect;

type MyBillRow = Prisma.FeePaymentGetPayload<{ select: typeof myBillSelect }>;

const summarizeBills = (bills: MyBillRow[], today: Date) => {
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
  };
};

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
    const academicYearId = await getCurrentAcademicYearId();

    const children = await Promise.all(
      students.map(async (student) => {
        const [bills, enrollment] = await Promise.all([
          prisma.feePayment.findMany({
            where: { studentId: student.id },
            select: myBillSelect,
            orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
          }),
          prisma.enrollment.findFirst({
            where: {
              studentId: student.id,
              status: "ACTIVE",
              ...(academicYearId ? { academicYearId } : {}),
            },
            select: { class: { select: { name: true, section: true } } },
          }),
        ]);

        return {
          studentId: student.id,
          name: `${student.firstName} ${student.lastName}`,
          className: enrollment
            ? `${enrollment.class.name}-${enrollment.class.section}`
            : null,
          summary: summarizeBills(bills, today),
          bills: bills.map((bill) => ({
            ...bill,
            balance: getBillBalance(bill),
            isOverdue:
              getBillBalance(bill) > MONEY_EPSILON && bill.dueDate < today,
          })),
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
