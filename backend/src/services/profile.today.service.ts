import {
  AttendanceStatus,
  DayOfWeek,
  EnrollmentStatus,
  ExamType,
  FeeStatus,
  Prisma,
  Role,
} from "@prisma/client";
import { prisma } from "../config/database.config";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { getCache, setCache } from "../utils/cache.util";
import { OPEN_FEE_STATUSES, getBillBalance } from "../utils/fees.utils";

const log = createModuleLogger("ProfileTodayService");

const SCHOOL_TIMEZONE = "Asia/Kolkata";
const DAY_MS = 86_400_000;
const EXAM_WINDOW_DAYS = 7;
const TODAY_CACHE_TTL = 60;
const RECENT_ATTENDANCE_DAYS = 6;

const WEEK_DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

const DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: SCHOOL_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const WEEKDAY_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: SCHOOL_TIMEZONE,
  weekday: "long",
});
const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: SCHOOL_TIMEZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

interface SchoolClock {
  ymd: string;
  today: Date;
  dayOfWeek: DayOfWeek;
  time: string;
}

export interface TodayPeriod {
  periodNumber: number;
  startTime: string;
  endTime: string;
  room: string | null;
  subjectName: string;
  teacherName: string;
  className: string;
}

export interface TodayExam {
  id: string;
  title: string;
  examType: ExamType;
  date: string;
  startTime: string;
  subjectName: string;
  className: string;
  childName: string | null;
}

export interface ExamOutlook {
  count: number;
  byDay: number[];
  next: TodayExam | null;
}

export interface FeeOutlook {
  pendingCount: number;
  overdueCount: number;
  dueAmount: number;
}

interface TodayBase {
  date: string;
  dayOfWeek: DayOfWeek;
  time: string;
  holiday: string | null;
}

export interface StudentToday extends TodayBase {
  role: "STUDENT";
  className: string | null;
  periodsToday: number;
  nextPeriod: TodayPeriod | null;
  weekLoad: number[];
  exams: ExamOutlook;
  attendanceToday: AttendanceStatus | null;
  recentAttendance: AttendanceStatus[];
  fees: FeeOutlook;
}

export interface TeacherToday extends TodayBase {
  role: "TEACHER";
  periodsToday: number;
  nextPeriod: TodayPeriod | null;
  weekLoad: number[];
  exams: ExamOutlook;
  classTeacherOf: {
    classId: string;
    className: string;
    students: number;
    attendanceMarked: boolean;
  }[];
}

export interface ParentToday extends TodayBase {
  role: "PARENT";
  children: {
    studentId: string;
    name: string;
    className: string | null;
    periodsToday: number;
    attendanceToday: AttendanceStatus | null;
  }[];
  periodsToday: number;
  exams: ExamOutlook;
  fees: FeeOutlook;
}

export interface AdminToday extends TodayBase {
  role: "ADMIN" | "MODERATOR";
  attendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
    marked: number;
    enrolled: number;
    rate: number | null;
  };
  attendanceTrend: (number | null)[];
  pending: {
    admissions: number;
    teacherApplications: number;
    leaveRequests: number;
    total: number;
  };
  exams: ExamOutlook;
}

export type TodaySummary =
  | StudentToday
  | TeacherToday
  | ParentToday
  | AdminToday;

const periodSelect = {
  periodNumber: true,
  startTime: true,
  endTime: true,
  room: true,
  subject: { select: { name: true } },
  teacher: { select: { firstName: true, lastName: true } },
  class: { select: { name: true, section: true } },
} satisfies Prisma.TimetableSelect;

type PeriodRow = Prisma.TimetableGetPayload<{ select: typeof periodSelect }>;

const examSelect = {
  id: true,
  title: true,
  examType: true,
  date: true,
  startTime: true,
  endTime: true,
  classId: true,
  subject: { select: { name: true } },
  class: { select: { name: true, section: true } },
} satisfies Prisma.ExamScheduleSelect;

type ExamRow = Prisma.ExamScheduleGetPayload<{ select: typeof examSelect }>;

const feeSelect = {
  status: true,
  dueDate: true,
  amountDue: true,
  amountPaid: true,
  waivedAmount: true,
} satisfies Prisma.FeePaymentSelect;

type FeeRow = Prisma.FeePaymentGetPayload<{ select: typeof feeSelect }>;

const getSchoolClock = (now: Date = new Date()): SchoolClock => {
  const ymd = DATE_FORMAT.format(now);
  const weekday = WEEKDAY_FORMAT.format(now).toUpperCase();
  return {
    ymd,
    today: new Date(`${ymd}T00:00:00.000Z`),
    dayOfWeek:
      Object.values(DayOfWeek).find((day) => day === weekday) ??
      DayOfWeek.MONDAY,
    time: TIME_FORMAT.format(now),
  };
};

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_MS);

const examWindow = (today: Date) => ({
  gte: today,
  lt: addDays(today, EXAM_WINDOW_DAYS),
});

const getCurrentYearId = async () =>
  (
    await prisma.academicYear.findFirst({
      where: { isCurrent: true },
      select: { id: true },
    })
  )?.id ?? null;

const toClassName = (
  cls: { name: string; section: string } | null | undefined,
) => (cls ? `${cls.name}-${cls.section}` : "");

const toPeriod = (row: PeriodRow): TodayPeriod => ({
  periodNumber: row.periodNumber,
  startTime: row.startTime,
  endTime: row.endTime,
  room: row.room,
  subjectName: row.subject.name,
  teacherName: `${row.teacher.firstName} ${row.teacher.lastName}`,
  className: toClassName(row.class),
});

const pickCurrentOrNext = (
  rows: PeriodRow[],
  clock: SchoolClock,
): TodayPeriod | null => {
  const match = rows.find((row) => row.endTime > clock.time);
  return match ? toPeriod(match) : null;
};

const toWeekLoad = (
  groups: { dayOfWeek: DayOfWeek; _count: { _all: number } }[],
) =>
  WEEK_DAYS.map(
    (day) => groups.find((group) => group.dayOfWeek === day)?._count._all ?? 0,
  );

const toByDay = (dates: Date[], today: Date) => {
  const counts = Array.from({ length: EXAM_WINDOW_DAYS }, () => 0);
  dates.forEach((date) => {
    const index = Math.round((date.getTime() - today.getTime()) / DAY_MS);
    if (index >= 0 && index < EXAM_WINDOW_DAYS) counts[index] += 1;
  });
  return counts;
};

const buildExamOutlook = (
  exams: ExamRow[],
  clock: SchoolClock,
  childNameForClass: (classId: string) => string | null = () => null,
): ExamOutlook => {
  const upcoming = exams.find(
    (exam) =>
      exam.date.getTime() > clock.today.getTime() || exam.endTime > clock.time,
  );
  return {
    count: exams.length,
    byDay: toByDay(
      exams.map((exam) => exam.date),
      clock.today,
    ),
    next: upcoming
      ? {
          id: upcoming.id,
          title: upcoming.title,
          examType: upcoming.examType,
          date: upcoming.date.toISOString(),
          startTime: upcoming.startTime,
          subjectName: upcoming.subject.name,
          className: toClassName(upcoming.class),
          childName: childNameForClass(upcoming.classId),
        }
      : null,
  };
};

const buildFeeOutlook = (rows: FeeRow[], today: Date): FeeOutlook => {
  const owing = rows.filter((row) => getBillBalance(row) > 0);
  return {
    pendingCount: owing.length,
    overdueCount: owing.filter(
      (row) => row.status === FeeStatus.OVERDUE || row.dueDate < today,
    ).length,
    dueAmount: owing.reduce((sum, row) => sum + getBillBalance(row), 0),
  };
};

async function buildStudentToday(
  userId: string,
  clock: SchoolClock,
  base: TodayBase,
): Promise<StudentToday> {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!student) throw new Error("Student not found");

  const yearId = await getCurrentYearId();
  const enrollment = yearId
    ? await prisma.enrollment.findFirst({
        where: {
          studentId: student.id,
          academicYearId: yearId,
          status: EnrollmentStatus.ACTIVE,
        },
        select: {
          classId: true,
          class: { select: { name: true, section: true } },
        },
      })
    : null;
  const classId = enrollment?.classId ?? null;

  const [periods, weekGroups, exams, attendanceToday, recent, fees] =
    await Promise.all([
      classId
        ? prisma.timetable.findMany({
            where: { classId, dayOfWeek: clock.dayOfWeek, isActive: true },
            select: periodSelect,
            orderBy: { periodNumber: "asc" },
          })
        : Promise.resolve([]),
      classId
        ? prisma.timetable.groupBy({
            by: ["dayOfWeek"],
            where: { classId, isActive: true },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      classId
        ? prisma.examSchedule.findMany({
            where: { classId, date: examWindow(clock.today) },
            select: examSelect,
            orderBy: [{ date: "asc" }, { startTime: "asc" }],
          })
        : Promise.resolve([]),
      prisma.studentAttendance.findFirst({
        where: { studentId: student.id, date: clock.today },
        select: { status: true },
      }),
      prisma.studentAttendance.findMany({
        where: { studentId: student.id, date: { lte: clock.today } },
        select: { status: true },
        orderBy: { date: "desc" },
        take: RECENT_ATTENDANCE_DAYS,
      }),
      prisma.feePayment.findMany({
        where: { studentId: student.id, status: { in: OPEN_FEE_STATUSES } },
        select: feeSelect,
      }),
    ]);

  return {
    ...base,
    role: "STUDENT",
    className: enrollment ? toClassName(enrollment.class) : null,
    periodsToday: periods.length,
    nextPeriod: pickCurrentOrNext(periods, clock),
    weekLoad: toWeekLoad(weekGroups),
    exams: buildExamOutlook(exams, clock),
    attendanceToday: attendanceToday?.status ?? null,
    recentAttendance: recent.map((row) => row.status).reverse(),
    fees: buildFeeOutlook(fees, clock.today),
  };
}

async function buildTeacherToday(
  userId: string,
  clock: SchoolClock,
  base: TodayBase,
): Promise<TeacherToday> {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!teacher) throw new Error("Teacher not found");

  const yearId = await getCurrentYearId();

  const [periods, weekGroups, exams, classTeachers] = await Promise.all([
    prisma.timetable.findMany({
      where: {
        teacherId: teacher.id,
        dayOfWeek: clock.dayOfWeek,
        isActive: true,
      },
      select: periodSelect,
      orderBy: { startTime: "asc" },
    }),
    prisma.timetable.groupBy({
      by: ["dayOfWeek"],
      where: { teacherId: teacher.id, isActive: true },
      _count: { _all: true },
    }),
    prisma.examSchedule.findMany({
      where: { teacherId: teacher.id, date: examWindow(clock.today) },
      select: examSelect,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.classTeacher.findMany({
      where: {
        teacherId: teacher.id,
        ...(yearId ? { class: { academicYearId: yearId } } : {}),
      },
      select: {
        classId: true,
        class: {
          select: {
            name: true,
            section: true,
            _count: {
              select: {
                enrollments: { where: { status: EnrollmentStatus.ACTIVE } },
              },
            },
          },
        },
      },
    }),
  ]);

  const classIds = classTeachers.map((ct) => ct.classId);
  const markedGroups = classIds.length
    ? await prisma.studentAttendance.groupBy({
        by: ["classId"],
        where: { classId: { in: classIds }, date: clock.today },
        _count: { _all: true },
      })
    : [];
  const markedIds = new Set(markedGroups.map((group) => group.classId));

  return {
    ...base,
    role: "TEACHER",
    periodsToday: periods.length,
    nextPeriod: pickCurrentOrNext(periods, clock),
    weekLoad: toWeekLoad(weekGroups),
    exams: buildExamOutlook(exams, clock),
    classTeacherOf: classTeachers.map((ct) => ({
      classId: ct.classId,
      className: toClassName(ct.class),
      students: ct.class._count.enrollments,
      attendanceMarked: markedIds.has(ct.classId),
    })),
  };
}

async function buildParentToday(
  userId: string,
  clock: SchoolClock,
  base: TodayBase,
): Promise<ParentToday> {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!parent) throw new Error("Parent not found");

  const yearId = await getCurrentYearId();
  const links = await prisma.parentStudent.findMany({
    where: { parentId: parent.id },
    select: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          enrollments: {
            where: {
              status: EnrollmentStatus.ACTIVE,
              ...(yearId ? { academicYearId: yearId } : {}),
            },
            select: {
              classId: true,
              class: { select: { name: true, section: true } },
            },
            take: 1,
          },
        },
      },
    },
  });

  const children = links.map((link) => ({
    studentId: link.student.id,
    name: link.student.firstName,
    classId: link.student.enrollments[0]?.classId ?? null,
    className: link.student.enrollments[0]
      ? toClassName(link.student.enrollments[0].class)
      : null,
  }));
  const studentIds = children.map((child) => child.studentId);
  const classIds = Array.from(
    new Set(
      children.flatMap((child) => (child.classId ? [child.classId] : [])),
    ),
  );

  const [periodGroups, attendance, exams, fees] = await Promise.all([
    classIds.length
      ? prisma.timetable.groupBy({
          by: ["classId"],
          where: {
            classId: { in: classIds },
            dayOfWeek: clock.dayOfWeek,
            isActive: true,
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    studentIds.length
      ? prisma.studentAttendance.findMany({
          where: { studentId: { in: studentIds }, date: clock.today },
          select: { studentId: true, status: true },
        })
      : Promise.resolve([]),
    classIds.length
      ? prisma.examSchedule.findMany({
          where: { classId: { in: classIds }, date: examWindow(clock.today) },
          select: examSelect,
          orderBy: [{ date: "asc" }, { startTime: "asc" }],
        })
      : Promise.resolve([]),
    studentIds.length
      ? prisma.feePayment.findMany({
          where: {
            studentId: { in: studentIds },
            status: { in: OPEN_FEE_STATUSES },
          },
          select: feeSelect,
        })
      : Promise.resolve([]),
  ]);

  const periodsByClass = new Map(
    periodGroups.map((group) => [group.classId, group._count._all]),
  );
  const attendanceByStudent = new Map(
    attendance.map((row) => [row.studentId, row.status]),
  );
  const childSummaries = children.map((child) => ({
    studentId: child.studentId,
    name: child.name,
    className: child.className,
    periodsToday: child.classId ? (periodsByClass.get(child.classId) ?? 0) : 0,
    attendanceToday: attendanceByStudent.get(child.studentId) ?? null,
  }));

  return {
    ...base,
    role: "PARENT",
    children: childSummaries,
    periodsToday: childSummaries.reduce(
      (sum, child) => sum + child.periodsToday,
      0,
    ),
    exams: buildExamOutlook(
      exams,
      clock,
      (classId) =>
        children.find((child) => child.classId === classId)?.name ?? null,
    ),
    fees: buildFeeOutlook(fees, clock.today),
  };
}

async function buildAdminToday(
  role: Role,
  clock: SchoolClock,
  base: TodayBase,
): Promise<AdminToday> {
  const yearId = await getCurrentYearId();
  const trendStart = addDays(clock.today, -RECENT_ATTENDANCE_DAYS);

  const [
    todayGroups,
    trendGroups,
    enrolled,
    admissions,
    teacherApplications,
    leaveRequests,
    exams,
  ] = await Promise.all([
    prisma.studentAttendance.groupBy({
      by: ["status"],
      where: { date: clock.today },
      _count: { _all: true },
    }),
    prisma.studentAttendance.groupBy({
      by: ["date", "status"],
      where: { date: { gte: trendStart, lte: clock.today } },
      _count: { _all: true },
    }),
    prisma.enrollment.count({
      where: {
        status: EnrollmentStatus.ACTIVE,
        ...(yearId ? { academicYearId: yearId } : {}),
      },
    }),
    prisma.admissionApplication.count({ where: { status: "PENDING" } }),
    prisma.teacherApplication.count({ where: { status: "PENDING" } }),
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.examSchedule.findMany({
      where: { date: examWindow(clock.today) },
      select: examSelect,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
  ]);

  const countFor = (status: AttendanceStatus) =>
    todayGroups.find((group) => group.status === status)?._count._all ?? 0;
  const present = countFor(AttendanceStatus.PRESENT);
  const late = countFor(AttendanceStatus.LATE);
  const absent = countFor(AttendanceStatus.ABSENT);
  const excused = countFor(AttendanceStatus.EXCUSED);
  const working = present + late + absent + excused;

  const attendanceTrend = Array.from(
    { length: RECENT_ATTENDANCE_DAYS + 1 },
    (_, index) => {
      const day = addDays(trendStart, index).getTime();
      const rows = trendGroups.filter((group) => group.date.getTime() === day);
      const total = rows
        .filter((row) => row.status !== AttendanceStatus.HOLIDAY)
        .reduce((sum, row) => sum + row._count._all, 0);
      const attended = rows
        .filter(
          (row) =>
            row.status === AttendanceStatus.PRESENT ||
            row.status === AttendanceStatus.LATE,
        )
        .reduce((sum, row) => sum + row._count._all, 0);
      return total > 0 ? Math.round((attended / total) * 100) : null;
    },
  );

  const examsToday = exams.filter(
    (exam) => exam.date.getTime() === clock.today.getTime(),
  );
  const outlook = buildExamOutlook(exams, clock);

  return {
    ...base,
    role: role === Role.MODERATOR ? "MODERATOR" : "ADMIN",
    attendance: {
      present,
      absent,
      late,
      excused,
      marked: working,
      enrolled,
      rate: working > 0 ? Math.round(((present + late) / working) * 100) : null,
    },
    attendanceTrend,
    pending: {
      admissions,
      teacherApplications,
      leaveRequests,
      total: admissions + teacherApplications + leaveRequests,
    },
    exams: { ...outlook, count: examsToday.length },
  };
}

export async function getMyTodayService(
  userId: string,
  role: Role,
  context: AuditContext,
): Promise<TodaySummary> {
  const clock = getSchoolClock();
  const cacheKey = `user:${userId}:today:${clock.ymd}`;

  try {
    const cached = await getCache(cacheKey);
    if (cached) {
      log.info("Returning today summary from cache", { cacheKey });
      return cached as TodaySummary;
    }

    log.info(`Building today summary for user ${userId}`, {
      ipAddress: context.ipAddress,
      userId,
      role,
    });

    const holiday = await prisma.holiday.findUnique({
      where: { date: clock.today },
      select: { name: true },
    });
    const base: TodayBase = {
      date: clock.ymd,
      dayOfWeek: clock.dayOfWeek,
      time: clock.time,
      holiday: holiday?.name ?? null,
    };

    let summary: TodaySummary;
    switch (role) {
      case Role.STUDENT:
        summary = await buildStudentToday(userId, clock, base);
        break;
      case Role.TEACHER:
        summary = await buildTeacherToday(userId, clock, base);
        break;
      case Role.PARENT:
        summary = await buildParentToday(userId, clock, base);
        break;
      case Role.ADMIN:
      case Role.MODERATOR:
        summary = await buildAdminToday(role, clock, base);
        break;
      default:
        throw new Error(`Today summary not supported for role: ${role}`);
    }

    await setCache(cacheKey, summary, TODAY_CACHE_TTL);
    return summary;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to build today summary", {
      error: err.message,
      ipAddress: context.ipAddress,
      userId,
    });
    throw err;
  }
}
