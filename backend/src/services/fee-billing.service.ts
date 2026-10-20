import { EnrollmentStatus, FeeStatus } from "@prisma/client";
import { prisma } from "../config/database.config";
import { createModuleLogger } from "../config/logger.config";
import { OVERDUE_ELIGIBLE_STATUSES } from "../utils/fees.utils";
import {
  CACHE_KEYS,
  deleteCache,
  deleteCacheByPattern,
} from "../utils/cache.util";

const log = createModuleLogger("FeeBillingService");

const SCHOOL_TIMEZONE = "Asia/Kolkata";
const DEFAULT_DUE_DAY = 10;
const MAX_DUE_DAY = 28;
const LATE_BILL_GRACE_DAYS = 7;
const DAY_MS = 86_400_000;

const SCHOOL_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: SCHOOL_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

interface SchoolMonth {
  year: number;
  month: number;
  today: Date;
  billingPeriod: string;
}

export interface FeeBillingResult {
  billingPeriod: string;
  structuresBilled: number;
  billsCreated: number;
  markedOverdue: number;
  skippedReason: string | null;
}

const getSchoolMonth = (now: Date): SchoolMonth => {
  const ymd = SCHOOL_DATE_FORMAT.format(now);
  const [year, month] = ymd.split("-").map(Number);
  return {
    year,
    month,
    today: new Date(`${ymd}T00:00:00.000Z`),
    billingPeriod: `${year}-${String(month).padStart(2, "0")}`,
  };
};

const resolveDueDate = (
  year: number,
  month: number,
  today: Date,
  configuredDueDay: number | null | undefined,
): Date => {
  const dueDay = Math.min(
    MAX_DUE_DAY,
    Math.max(1, configuredDueDay ?? DEFAULT_DUE_DAY),
  );
  const scheduled = new Date(Date.UTC(year, month - 1, dueDay));
  return scheduled < today
    ? new Date(today.getTime() + LATE_BILL_GRACE_DAYS * DAY_MS)
    : scheduled;
};

async function markOverdueBills(today: Date): Promise<number> {
  const result = await prisma.feePayment.updateMany({
    where: {
      status: { in: OVERDUE_ELIGIBLE_STATUSES },
      dueDate: { lt: today },
    },
    data: { status: FeeStatus.OVERDUE },
  });
  return result.count;
}

export async function generateRecurringFeeBillsService(
  now: Date = new Date(),
): Promise<FeeBillingResult> {
  const { year, month, today, billingPeriod } = getSchoolMonth(now);
  const result: FeeBillingResult = {
    billingPeriod,
    structuresBilled: 0,
    billsCreated: 0,
    markedOverdue: 0,
    skippedReason: null,
  };

  try {
    log.info("Starting recurring fee billing", { billingPeriod });

    const [school, academicYear] = await Promise.all([
      prisma.schoolConfig.findFirst({ select: { feeDueDay: true } }),
      prisma.academicYear.findFirst({
        where: { isCurrent: true },
        select: { id: true, name: true, startDate: true, endDate: true },
      }),
    ]);

    const periodStart = new Date(Date.UTC(year, month - 1, 1));
    const periodEnd = new Date(Date.UTC(year, month, 1));

    if (!academicYear) {
      result.skippedReason = "No current academic year";
    } else if (
      periodEnd <= academicYear.startDate ||
      periodStart > academicYear.endDate
    ) {
      result.skippedReason = `Billing month ${billingPeriod} is outside academic year ${academicYear.name}`;
    } else {
      const dueDate = resolveDueDate(year, month, today, school?.feeDueDay);

      const structures = await prisma.feeStructure.findMany({
        where: {
          academicYearId: academicYear.id,
          isActive: true,
          isRecurring: true,
          OR: [{ recurringMonth: null }, { recurringMonth: month }],
        },
        select: { id: true, name: true, amount: true, classGroupId: true },
      });

      for (const structure of structures) {
        const enrollments = await prisma.enrollment.findMany({
          where: {
            academicYearId: academicYear.id,
            status: EnrollmentStatus.ACTIVE,
            class: { classGroupId: structure.classGroupId },
          },
          select: { studentId: true },
        });

        if (enrollments.length === 0) continue;

        const created = await prisma.feePayment.createMany({
          data: enrollments.map(({ studentId }) => ({
            studentId,
            feeStructureId: structure.id,
            amountDue: structure.amount,
            amountPaid: 0,
            status: FeeStatus.PENDING,
            dueDate,
            billingPeriod,
          })),
          skipDuplicates: true,
        });

        if (created.count > 0) {
          result.structuresBilled += 1;
          result.billsCreated += created.count;
          log.info("Recurring fee bills created", {
            feeStructureId: structure.id,
            feeName: structure.name,
            billingPeriod,
            created: created.count,
            eligibleStudents: enrollments.length,
          });
        }
      }
    }

    result.markedOverdue = await markOverdueBills(today);

    if (result.billsCreated > 0 || result.markedOverdue > 0) {
      await Promise.all([
        deleteCache(CACHE_KEYS.dashboardSummary()),
        deleteCacheByPattern("user:*:today:*"),
      ]);
    }

    log.info("Recurring fee billing finished", { ...result });
    return result;
  } catch (error) {
    const err = error as Error;
    log.error("Recurring fee billing failed", {
      billingPeriod,
      error: err.message,
    });
    throw err;
  }
}
