import {
  AdmissionStatus,
  ApplicationStatus,
  AttendanceStatus,
  EmploymentStatus,
  EnrollmentStatus,
  ExamType,
  LeaveStatus,
  Module,
  PaymentMode,
  Role,
  TransactionStatus,
} from "@prisma/client";
import { prisma } from "../config/database.config";
import { createModuleLogger } from "../config/logger.config";
import { getCache, setCache } from "../utils/cache.util";
import {
  OPEN_FEE_STATUSES,
  getBillBalance,
  roundMoney,
} from "../utils/fees.utils";

const log = createModuleLogger("DashboardOverviewService");

const SCHOOL_TIMEZONE = "Asia/Kolkata";
const DAY_MS = 86_400_000;
const OVERVIEW_CACHE_TTL_SECONDS = 60;
const CALENDAR_CACHE_TTL_SECONDS = 300;
const UPCOMING_DAYS = 30;
const UPCOMING_LIMIT = 12;
const DEFAULTER_LIMIT = 5;
const RECENT_PAYMENT_LIMIT = 6;
const ADMISSION_LOOKBACK_DAYS = 180;
const WEEK_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SCHOOL_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: SCHOOL_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export interface DashboardAccess {
  students: boolean;
  teachers: boolean;
  studentAttendance: boolean;
  teacherAttendance: boolean;
  fees: boolean;
  admissions: boolean;
  teacherApplications: boolean;
  classes: boolean;
  leaves: boolean;
}

export interface TrendStat {
  value: number;
  previous: number | null;
  changePercent: number | null;
}

export interface AttendanceTodayStat {
  isHoliday: boolean;
  holidayName: string | null;
  present: number;
  late: number;
  absent: number;
  excused: number;
  marked: number;
  enrolled: number;
  percent: number | null;
  weekAveragePercent: number | null;
  changePoints: number | null;
}

export interface WeeklyAttendanceDay {
  date: string;
  label: string;
  isHoliday: boolean;
  holidayName: string | null;
  isFuture: boolean;
  marked: number;
  presentPercent: number;
  latePercent: number;
  absentPercent: number;
}

export interface MonthlyFeePoint {
  month: string;
  label: string;
  collected: number;
  billed: number;
}

export interface FeeDefaulter {
  studentId: string;
  name: string;
  regNumber: string;
  className: string | null;
  overdueAmount: number;
  overdueCount: number;
  oldestDueDate: string;
}

export interface RecentPayment {
  receiptId: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentMode: PaymentMode;
  paidAt: string;
}

export interface SeatsByGroup {
  classGroupId: string;
  name: string;
  classCount: number;
  capacity: number;
  filled: number;
}

export interface TeacherAttendanceTodayStat {
  total: number;
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  notMarked: number;
}

export interface AdmissionsFunnel {
  since: string;
  applied: number;
  pending: number;
  waitlisted: number;
  slotOffered: number;
  approved: number;
  rejected: number;
  enrolled: number;
}

export interface PendingCounts {
  admissions: number | null;
  teacherApplications: number | null;
  studentLeaves: number | null;
  teacherLeaves: number | null;
}

export type DashboardEventType = "EXAM" | "HOLIDAY";

export interface DashboardEvent {
  id: string;
  type: DashboardEventType;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  examType: ExamType | null;
  className: string | null;
  subjectName: string | null;
  description: string | null;
}

export interface DashboardOverview {
  generatedAt: string;
  today: string;
  academicYear: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  access: DashboardAccess;
  pending: PendingCounts;
  stats: {
    students: TrendStat | null;
    teachers: TrendStat | null;
    attendanceToday: AttendanceTodayStat | null;
    feeCollected: TrendStat | null;
  };
  weeklyAttendance: { weekStart: string; days: WeeklyAttendanceDay[] } | null;
  monthlyFees: MonthlyFeePoint[] | null;
  feeDefaulters: FeeDefaulter[] | null;
  recentPayments: RecentPayment[] | null;
  seatsByGroup: SeatsByGroup[] | null;
  teacherAttendanceToday: TeacherAttendanceTodayStat | null;
  admissionsFunnel: AdmissionsFunnel | null;
  upcoming: DashboardEvent[];
}

export interface DashboardCalendar {
  month: string;
  events: DashboardEvent[];
}

interface YearRef {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

const FULL_ACCESS: DashboardAccess = {
  students: true,
  teachers: true,
  studentAttendance: true,
  teacherAttendance: true,
  fees: true,
  admissions: true,
  teacherApplications: true,
  classes: true,
  leaves: true,
};

const toSchoolYmd = (date: Date): string => SCHOOL_DATE_FORMAT.format(date);
const fromYmd = (ymd: string): Date => new Date(`${ymd}T00:00:00.000Z`);
const toYmd = (date: Date): string => date.toISOString().slice(0, 10);
const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * DAY_MS);
const roundOne = (value: number): number => Math.round(value * 10) / 10;

const percentChange = (
  current: number,
  previous: number | null,
): number | null =>
  previous !== null && previous > 0
    ? roundOne(((current - previous) / previous) * 100)
    : null;

const percentOf = (part: number, whole: number): number =>
  whole > 0 ? roundOne((part / whole) * 100) : 0;

const toClassName = (
  cls: { name: string; section: string } | null | undefined,
): string | null => (cls ? `${cls.name}-${cls.section}` : null);

const monthLabel = (month: string): string => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString(
    "en-IN",
    {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  );
};

const accessSignature = (access: DashboardAccess): string =>
  Object.values(access)
    .map((allowed) => (allowed ? "1" : "0"))
    .join("");

async function resolveAccess(
  userId: string,
  role: Role,
): Promise<DashboardAccess> {
  if (role === Role.ADMIN) return FULL_ACCESS;

  const permissions = await prisma.userPermission.findMany({
    where: { userId, canRead: true },
    select: { module: true },
  });
  const allowed = new Set(permissions.map((permission) => permission.module));

  return {
    students: allowed.has(Module.STUDENT),
    teachers: allowed.has(Module.TEACHER),
    studentAttendance: allowed.has(Module.STUDENT_ATTENDANCE),
    teacherAttendance: allowed.has(Module.TEACHER_ATTENDANCE),
    fees: allowed.has(Module.FEE_PAYMENT),
    admissions: allowed.has(Module.ADMISSION_APPLICATION),
    teacherApplications: allowed.has(Module.TEACHER_APPLICATION),
    classes: allowed.has(Module.CLASS),
    leaves: allowed.has(Module.LEAVE_REQUEST),
  };
}

async function getAcademicContext(): Promise<{
  current: YearRef | null;
  previous: YearRef | null;
}> {
  const yearSelect = {
    id: true,
    name: true,
    startDate: true,
    endDate: true,
  } as const;
  const current = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
    select: yearSelect,
  });
  if (!current) return { current: null, previous: null };

  const previous = await prisma.academicYear.findFirst({
    where: { endDate: { lt: current.startDate } },
    orderBy: { endDate: "desc" },
    select: yearSelect,
  });

  return { current, previous };
}

async function getStudentStat(
  current: YearRef,
  previous: YearRef | null,
): Promise<TrendStat> {
  const [value, previousValue] = await Promise.all([
    prisma.enrollment.count({
      where: { academicYearId: current.id, status: EnrollmentStatus.ACTIVE },
    }),
    previous
      ? prisma.enrollment.count({ where: { academicYearId: previous.id } })
      : Promise.resolve(null),
  ]);
  return {
    value,
    previous: previousValue,
    changePercent: percentChange(value, previousValue),
  };
}

async function getTeacherStat(today: Date): Promise<TrendStat> {
  const sameDayLastYear = addDays(today, -365);
  const [value, previousValue] = await Promise.all([
    prisma.teacher.count({
      where: {
        employmentStatus: {
          in: [EmploymentStatus.ACTIVE, EmploymentStatus.ON_LEAVE],
        },
      },
    }),
    prisma.teacher.count({
      where: {
        joiningDate: { lte: sameDayLastYear },
        employmentStatus: { not: EmploymentStatus.TERMINATED },
      },
    }),
  ]);
  return {
    value,
    previous: previousValue,
    changePercent: percentChange(value, previousValue),
  };
}

const tallyAttendance = (
  groups: { status: AttendanceStatus; _count: { _all: number } }[],
) => {
  const count = (status: AttendanceStatus) =>
    groups.find((group) => group.status === status)?._count._all ?? 0;
  const present = count(AttendanceStatus.PRESENT);
  const late = count(AttendanceStatus.LATE);
  const absent = count(AttendanceStatus.ABSENT);
  const excused = count(AttendanceStatus.EXCUSED);
  return {
    present,
    late,
    absent,
    excused,
    marked: present + late + absent + excused,
  };
};

async function getAttendanceTodayStat(
  today: Date,
  current: YearRef | null,
): Promise<AttendanceTodayStat> {
  const weekAgo = addDays(today, -7);

  const [todayGroups, pastGroups, holiday, enrolled] = await Promise.all([
    prisma.studentAttendance.groupBy({
      by: ["status"],
      where: { date: today },
      _count: { _all: true },
    }),
    prisma.studentAttendance.groupBy({
      by: ["date", "status"],
      where: { date: { gte: weekAgo, lt: today } },
      _count: { _all: true },
    }),
    prisma.holiday.findUnique({
      where: { date: today },
      select: { name: true },
    }),
    current
      ? prisma.enrollment.count({
          where: {
            academicYearId: current.id,
            status: EnrollmentStatus.ACTIVE,
          },
        })
      : Promise.resolve(0),
  ]);

  const tally = tallyAttendance(todayGroups);
  const percent =
    tally.marked > 0
      ? percentOf(tally.present + tally.late, tally.marked)
      : null;

  const byDay = new Map<
    string,
    { status: AttendanceStatus; _count: { _all: number } }[]
  >();
  pastGroups.forEach((group) => {
    const key = toYmd(group.date);
    byDay.set(key, [
      ...(byDay.get(key) ?? []),
      { status: group.status, _count: group._count },
    ]);
  });
  const dailyPercents = Array.from(byDay.values())
    .map(tallyAttendance)
    .filter((day) => day.marked > 0)
    .map((day) => ((day.present + day.late) / day.marked) * 100);
  const weekAveragePercent = dailyPercents.length
    ? roundOne(
        dailyPercents.reduce((sum, value) => sum + value, 0) /
          dailyPercents.length,
      )
    : null;

  return {
    isHoliday: !!holiday,
    holidayName: holiday?.name ?? null,
    ...tally,
    enrolled,
    percent,
    weekAveragePercent,
    changePoints:
      percent !== null && weekAveragePercent !== null
        ? roundOne(percent - weekAveragePercent)
        : null,
  };
}

async function getFeeCollectedStat(
  today: Date,
  current: YearRef,
  previous: YearRef | null,
): Promise<TrendStat> {
  const elapsedMs = Math.max(0, today.getTime() - current.startDate.getTime());

  const [currentSum, previousSum] = await Promise.all([
    prisma.feeReceipt.aggregate({
      where: { academicYearId: current.id, status: TransactionStatus.SUCCESS },
      _sum: { totalAmount: true },
    }),
    previous
      ? prisma.feeReceipt.aggregate({
          where: {
            academicYearId: previous.id,
            status: TransactionStatus.SUCCESS,
            paidAt: {
              lt: new Date(previous.startDate.getTime() + elapsedMs + DAY_MS),
            },
          },
          _sum: { totalAmount: true },
        })
      : Promise.resolve(null),
  ]);

  const value = roundMoney(currentSum._sum.totalAmount ?? 0);
  const previousValue = previousSum
    ? roundMoney(previousSum._sum.totalAmount ?? 0)
    : null;
  return {
    value,
    previous: previousValue,
    changePercent: percentChange(value, previousValue),
  };
}

async function getWeeklyAttendance(
  today: Date,
): Promise<{ weekStart: string; days: WeeklyAttendanceDay[] }> {
  const offset = (today.getUTCDay() + 6) % 7;
  const monday = addDays(today, -offset);
  const saturday = addDays(monday, 5);

  const [groups, holidays] = await Promise.all([
    prisma.studentAttendance.groupBy({
      by: ["date", "status"],
      where: { date: { gte: monday, lte: saturday } },
      _count: { _all: true },
    }),
    prisma.holiday.findMany({
      where: { date: { gte: monday, lte: saturday } },
      select: { date: true, name: true },
    }),
  ]);

  const holidayByDay = new Map(
    holidays.map((holiday) => [toYmd(holiday.date), holiday.name]),
  );

  const days = WEEK_DAY_LABELS.map((label, index) => {
    const date = addDays(monday, index);
    const key = toYmd(date);
    const tally = tallyAttendance(
      groups
        .filter((group) => toYmd(group.date) === key)
        .map((group) => ({ status: group.status, _count: group._count })),
    );
    return {
      date: key,
      label,
      isHoliday: holidayByDay.has(key),
      holidayName: holidayByDay.get(key) ?? null,
      isFuture: date > today,
      marked: tally.marked,
      presentPercent: percentOf(tally.present, tally.marked),
      latePercent: percentOf(tally.late, tally.marked),
      absentPercent: percentOf(tally.absent + tally.excused, tally.marked),
    };
  });

  return { weekStart: toYmd(monday), days };
}

const academicMonths = (year: YearRef): string[] => {
  const months: string[] = [];
  const cursor = new Date(
    Date.UTC(year.startDate.getUTCFullYear(), year.startDate.getUTCMonth(), 1),
  );
  const last = new Date(
    Date.UTC(year.endDate.getUTCFullYear(), year.endDate.getUTCMonth(), 1),
  );
  while (cursor <= last && months.length < 24) {
    months.push(
      `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`,
    );
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
};

async function getMonthlyFees(current: YearRef): Promise<MonthlyFeePoint[]> {
  const [collectedRows, billedRows] = await Promise.all([
    prisma.$queryRaw<{ month: string; total: number }[]>`
      SELECT to_char(("paidAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM') AS month,
             COALESCE(SUM("totalAmount"), 0)::float AS total
      FROM "FeeReceipt"
      WHERE "academicYearId" = ${current.id} AND "status" = 'SUCCESS'
      GROUP BY 1`,
    prisma.$queryRaw<{ month: string; total: number }[]>`
      SELECT COALESCE(fp."billingPeriod",
                      to_char((fp."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM')) AS month,
             COALESCE(SUM(fp."amountDue"), 0)::float AS total
      FROM "FeePayment" fp
      JOIN "FeeStructure" fs ON fs."id" = fp."feeStructureId"
      WHERE fs."academicYearId" = ${current.id}
      GROUP BY 1`,
  ]);

  const collectedByMonth = new Map(
    collectedRows.map((row) => [row.month, Number(row.total)]),
  );
  const billedByMonth = new Map(
    billedRows.map((row) => [row.month, Number(row.total)]),
  );

  return academicMonths(current).map((month) => ({
    month,
    label: monthLabel(month),
    collected: roundMoney(collectedByMonth.get(month) ?? 0),
    billed: roundMoney(billedByMonth.get(month) ?? 0),
  }));
}

async function getFeeDefaulters(
  today: Date,
  current: YearRef,
): Promise<FeeDefaulter[]> {
  const groups = await prisma.feePayment.groupBy({
    by: ["studentId"],
    where: {
      feeStructure: { academicYearId: current.id },
      status: { in: OPEN_FEE_STATUSES },
      dueDate: { lt: today },
    },
    _sum: { amountDue: true, amountPaid: true, waivedAmount: true },
    _count: { _all: true },
    _min: { dueDate: true },
  });

  const ranked = groups
    .map((group) => ({
      studentId: group.studentId,
      overdueAmount: getBillBalance({
        amountDue: group._sum.amountDue ?? 0,
        amountPaid: group._sum.amountPaid ?? 0,
        waivedAmount: group._sum.waivedAmount ?? 0,
      }),
      overdueCount: group._count._all,
      oldestDueDate: group._min.dueDate,
    }))
    .filter((row) => row.overdueAmount > 0)
    .sort((a, b) => b.overdueAmount - a.overdueAmount)
    .slice(0, DEFAULTER_LIMIT);

  if (ranked.length === 0) return [];

  const students = await prisma.student.findMany({
    where: { id: { in: ranked.map((row) => row.studentId) } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      user: { select: { regNumber: true } },
      enrollments: {
        where: { academicYearId: current.id },
        orderBy: { enrolledAt: "desc" },
        take: 1,
        select: { class: { select: { name: true, section: true } } },
      },
    },
  });
  const studentById = new Map(students.map((student) => [student.id, student]));

  return ranked.flatMap((row) => {
    const student = studentById.get(row.studentId);
    if (!student) return [];
    return [
      {
        studentId: row.studentId,
        name: `${student.firstName} ${student.lastName}`,
        regNumber: student.user.regNumber,
        className: toClassName(student.enrollments[0]?.class),
        overdueAmount: roundMoney(row.overdueAmount),
        overdueCount: row.overdueCount,
        oldestDueDate: row.oldestDueDate
          ? toYmd(row.oldestDueDate)
          : toYmd(today),
      },
    ];
  });
}

async function getRecentPayments(): Promise<RecentPayment[]> {
  const receipts = await prisma.feeReceipt.findMany({
    where: { status: TransactionStatus.SUCCESS },
    orderBy: { paidAt: "desc" },
    take: RECENT_PAYMENT_LIMIT,
    select: {
      id: true,
      receiptNumber: true,
      totalAmount: true,
      paymentMode: true,
      paidAt: true,
      student: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return receipts.map((receipt) => ({
    receiptId: receipt.id,
    receiptNumber: receipt.receiptNumber,
    studentId: receipt.student.id,
    studentName: `${receipt.student.firstName} ${receipt.student.lastName}`,
    amount: receipt.totalAmount,
    paymentMode: receipt.paymentMode,
    paidAt: receipt.paidAt.toISOString(),
  }));
}

async function getSeatsByGroup(current: YearRef): Promise<SeatsByGroup[]> {
  const classes = await prisma.class.findMany({
    where: { academicYearId: current.id },
    select: {
      capacity: true,
      classGroupId: true,
      classGroup: { select: { name: true } },
      _count: {
        select: { enrollments: { where: { status: EnrollmentStatus.ACTIVE } } },
      },
    },
  });

  const groups = new Map<string, SeatsByGroup>();
  classes.forEach((cls) => {
    const entry = groups.get(cls.classGroupId) ?? {
      classGroupId: cls.classGroupId,
      name: cls.classGroup.name,
      classCount: 0,
      capacity: 0,
      filled: 0,
    };
    entry.classCount += 1;
    entry.capacity += cls.capacity;
    entry.filled += cls._count.enrollments;
    groups.set(cls.classGroupId, entry);
  });

  return Array.from(groups.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "en", { numeric: true }),
  );
}

async function getTeacherAttendanceToday(
  today: Date,
): Promise<TeacherAttendanceTodayStat> {
  const [total, groups, leaves] = await Promise.all([
    prisma.teacher.count({
      where: {
        employmentStatus: {
          in: [EmploymentStatus.ACTIVE, EmploymentStatus.ON_LEAVE],
        },
      },
    }),
    prisma.teacherAttendance.groupBy({
      by: ["status"],
      where: { date: today },
      _count: { _all: true },
    }),
    prisma.leaveRequest.findMany({
      where: {
        requesterRole: Role.TEACHER,
        status: LeaveStatus.APPROVED,
        teacherId: { not: null },
        fromDate: { lte: today },
        toDate: { gte: today },
      },
      select: { teacherId: true },
      distinct: ["teacherId"],
    }),
  ]);

  const tally = tallyAttendance(groups);
  return {
    total,
    present: tally.present,
    late: tally.late,
    absent: tally.absent + tally.excused,
    onLeave: leaves.length,
    notMarked: Math.max(0, total - tally.marked),
  };
}

async function getAdmissionsFunnel(
  current: YearRef,
  previous: YearRef | null,
): Promise<AdmissionsFunnel> {
  const since = previous
    ? previous.endDate
    : addDays(current.startDate, -ADMISSION_LOOKBACK_DAYS);

  const [groups, enrolled] = await Promise.all([
    prisma.admissionApplication.groupBy({
      by: ["status"],
      where: { appliedAt: { gte: since } },
      _count: { _all: true },
    }),
    prisma.enrollment.count({
      where: {
        academicYearId: current.id,
        student: { admissionId: { not: null } },
      },
    }),
  ]);

  const count = (status: AdmissionStatus) =>
    groups.find((group) => group.status === status)?._count._all ?? 0;

  return {
    since: toYmd(since),
    applied: groups.reduce((sum, group) => sum + group._count._all, 0),
    pending: count(AdmissionStatus.PENDING),
    waitlisted: count(AdmissionStatus.WAITLISTED),
    slotOffered: count(AdmissionStatus.SLOT_OFFERED),
    approved: count(AdmissionStatus.APPROVED),
    rejected:
      count(AdmissionStatus.REJECTED) +
      count(AdmissionStatus.OFFER_EXPIRED) +
      count(AdmissionStatus.OFFER_DECLINED),
    enrolled,
  };
}

async function getPendingCounts(
  access: DashboardAccess,
): Promise<PendingCounts> {
  const [admissions, teacherApplications, studentLeaves, teacherLeaves] =
    await Promise.all([
      access.admissions
        ? prisma.admissionApplication.count({
            where: { status: AdmissionStatus.PENDING },
          })
        : Promise.resolve(null),
      access.teacherApplications
        ? prisma.teacherApplication.count({
            where: {
              status: {
                in: [ApplicationStatus.PENDING, ApplicationStatus.SHORTLISTED],
              },
            },
          })
        : Promise.resolve(null),
      access.leaves
        ? prisma.leaveRequest.count({
            where: { status: LeaveStatus.PENDING, requesterRole: Role.STUDENT },
          })
        : Promise.resolve(null),
      access.leaves
        ? prisma.leaveRequest.count({
            where: { status: LeaveStatus.PENDING, requesterRole: Role.TEACHER },
          })
        : Promise.resolve(null),
    ]);

  return { admissions, teacherApplications, studentLeaves, teacherLeaves };
}

async function getEvents(
  from: Date,
  toExclusive: Date,
  limit?: number,
): Promise<DashboardEvent[]> {
  const [exams, holidays] = await Promise.all([
    prisma.examSchedule.findMany({
      where: { date: { gte: from, lt: toExclusive } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      ...(limit ? { take: limit } : {}),
      select: {
        id: true,
        title: true,
        examType: true,
        date: true,
        startTime: true,
        endTime: true,
        instructions: true,
        class: { select: { name: true, section: true } },
        subject: { select: { name: true } },
      },
    }),
    prisma.holiday.findMany({
      where: { date: { gte: from, lt: toExclusive } },
      orderBy: { date: "asc" },
      select: { id: true, name: true, date: true, description: true },
    }),
  ]);

  const events: DashboardEvent[] = [
    ...holidays.map((holiday) => ({
      id: holiday.id,
      type: "HOLIDAY" as const,
      title: holiday.name,
      date: toYmd(holiday.date),
      startTime: null,
      endTime: null,
      examType: null,
      className: null,
      subjectName: null,
      description: holiday.description,
    })),
    ...exams.map((exam) => ({
      id: exam.id,
      type: "EXAM" as const,
      title: exam.title,
      date: toYmd(exam.date),
      startTime: exam.startTime,
      endTime: exam.endTime,
      examType: exam.examType,
      className: toClassName(exam.class),
      subjectName: exam.subject.name,
      description: exam.instructions,
    })),
  ].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.type === b.type ? 0 : a.type === "HOLIDAY" ? -1 : 1) ||
      (a.startTime ?? "").localeCompare(b.startTime ?? ""),
  );

  return limit ? events.slice(0, limit) : events;
}

async function settle<T>(
  enabled: boolean,
  section: string,
  task: () => Promise<T | null>,
): Promise<T | null> {
  if (!enabled) return null;
  try {
    return await task();
  } catch (error) {
    log.error("Dashboard section failed", {
      section,
      error: (error as Error).message,
    });
    return null;
  }
}

export async function getDashboardOverviewService(
  userId: string,
  role: Role,
): Promise<DashboardOverview> {
  const today = fromYmd(toSchoolYmd(new Date()));
  const access = await resolveAccess(userId, role);
  const cacheKey = `dashboard:overview:${toYmd(today)}:${accessSignature(access)}`;

  const cached = await getCache<DashboardOverview>(cacheKey);
  if (cached) return cached;

  log.info("Building dashboard overview", { userId, role, access });

  const { current, previous } = await getAcademicContext();

  const [
    students,
    teachers,
    attendanceToday,
    feeCollected,
    weeklyAttendance,
    monthlyFees,
    feeDefaulters,
    recentPayments,
    seatsByGroup,
    teacherAttendanceToday,
    admissionsFunnel,
    pending,
    upcoming,
  ] = await Promise.all([
    settle(access.students, "students", () =>
      current ? getStudentStat(current, previous) : Promise.resolve(null),
    ),
    settle(access.teachers, "teachers", () => getTeacherStat(today)),
    settle(access.studentAttendance, "attendanceToday", () =>
      getAttendanceTodayStat(today, current),
    ),
    settle(access.fees, "feeCollected", () =>
      current
        ? getFeeCollectedStat(today, current, previous)
        : Promise.resolve(null),
    ),
    settle(access.studentAttendance, "weeklyAttendance", () =>
      getWeeklyAttendance(today),
    ),
    settle(access.fees, "monthlyFees", () =>
      current ? getMonthlyFees(current) : Promise.resolve(null),
    ),
    settle(access.fees, "feeDefaulters", () =>
      current ? getFeeDefaulters(today, current) : Promise.resolve(null),
    ),
    settle(access.fees, "recentPayments", () => getRecentPayments()),
    settle(access.classes, "seatsByGroup", () =>
      current ? getSeatsByGroup(current) : Promise.resolve(null),
    ),
    settle(access.teacherAttendance, "teacherAttendanceToday", () =>
      getTeacherAttendanceToday(today),
    ),
    settle(access.admissions, "admissionsFunnel", () =>
      current ? getAdmissionsFunnel(current, previous) : Promise.resolve(null),
    ),
    settle(true, "pending", () => getPendingCounts(access)),
    settle(true, "upcoming", () =>
      getEvents(today, addDays(today, UPCOMING_DAYS + 1), UPCOMING_LIMIT),
    ),
  ]);

  const overview: DashboardOverview = {
    generatedAt: new Date().toISOString(),
    today: toYmd(today),
    academicYear: current
      ? {
          id: current.id,
          name: current.name,
          startDate: toYmd(current.startDate),
          endDate: toYmd(current.endDate),
        }
      : null,
    access,
    pending: pending ?? {
      admissions: null,
      teacherApplications: null,
      studentLeaves: null,
      teacherLeaves: null,
    },
    stats: { students, teachers, attendanceToday, feeCollected },
    weeklyAttendance,
    monthlyFees,
    feeDefaulters,
    recentPayments,
    seatsByGroup,
    teacherAttendanceToday,
    admissionsFunnel,
    upcoming: upcoming ?? [],
  };

  await setCache(cacheKey, overview, OVERVIEW_CACHE_TTL_SECONDS);
  log.info("Dashboard overview built", { userId, role });

  return overview;
}

export async function getDashboardCalendarService(
  month: string,
): Promise<DashboardCalendar> {
  const cacheKey = `dashboard:calendar:${month}`;
  const cached = await getCache<DashboardCalendar>(cacheKey);
  if (cached) return cached;

  const [year, monthNumber] = month.split("-").map(Number);
  const from = new Date(Date.UTC(year, monthNumber - 1, 1));
  const toExclusive = new Date(Date.UTC(year, monthNumber, 1));

  const calendar: DashboardCalendar = {
    month,
    events: await getEvents(from, toExclusive),
  };

  await setCache(cacheKey, calendar, CALENDAR_CACHE_TTL_SECONDS);
  return calendar;
}
