import {
  getCache,
  setCache,
  CACHE_KEYS,
  CACHE_TTL,
} from "@/src/utils/cache.util";
import {
  EnrollmentStatus,
  EmploymentStatus,
  AdmissionStatus,
  ApplicationStatus,
  FeeStatus,
  LeaveStatus,
  AttendanceStatus,
  Prisma,
} from "@prisma/client";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { createModuleLogger } from "../config/logger.config";
import { prisma } from "../config/database.config";

const log = createModuleLogger("DashboardService");

const SCHOOL_TIMEZONE = "Asia/Kolkata";

const SCHOOL_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: SCHOOL_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const getSchoolToday = (now: Date = new Date()): Date =>
  new Date(`${SCHOOL_DATE_FORMAT.format(now)}T00:00:00.000Z`);

export interface DashboardCounts {
  academicYear: {
    id: string;
    name: string;
  } | null;
  students: {
    total: number;
    byStatus: Record<EnrollmentStatus, number>;
  };
  teachers: {
    total: number;
    byStatus: Record<EmploymentStatus, number>;
  };
  admins: {
    total: number;
    byStatus: Record<EmploymentStatus, number>;
  };
  parentCount: number;
  classCount: number;
  admissionApplications: {
    total: number;
    byStatus: Record<AdmissionStatus, number>;
  };
  teacherApplications: {
    total: number;
    byStatus: Record<ApplicationStatus, number>;
  };
  feePayments: {
    total: number;
    byStatus: Record<FeeStatus, number>;
  };
  feeRevenue: {
    collected: number;
    expected: number;
  };
  studentLeaveRequests: {
    total: number;
    byStatus: Record<LeaveStatus, number>;
  };
  teacherLeaveRequests: {
    total: number;
    byStatus: Record<LeaveStatus, number>;
  };
  todayAttendance: {
    students: Record<AttendanceStatus, number>;
    teachers: Record<AttendanceStatus, number>;
  };
}

const emptyCounts = <T extends string>(values: T[]): Record<T, number> =>
  Object.fromEntries(values.map((value) => [value, 0])) as Record<T, number>;

const sumValues = (record: Record<string, number>) =>
  Object.values(record).reduce((a, b) => a + b, 0);

export async function getDashboardCountsService(
  adminId: string,
  context: AuditContext,
  statusCode: number,
): Promise<DashboardCounts> {
  try {
    log.info("Starting service to get the dashboard summary counts", {
      adminId,
      ipAddress: context.ipAddress,
    });

    const cacheKey = CACHE_KEYS.dashboardSummary();
    const cached = await getCache<DashboardCounts>(cacheKey);
    if (cached) {
      log.info("Dashboard summary counts served from cache", {
        adminId,
        ipAddress: context.ipAddress,
      });
      return cached;
    }

    const today = getSchoolToday();

    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
      select: { id: true, name: true },
    });

    const currentYearBills: Prisma.FeePaymentWhereInput | null =
      currentAcademicYear
        ? {
            feeStructure: { academicYearId: currentAcademicYear.id },
            status: { not: FeeStatus.WAIVED },
          }
        : null;

    const [
      classCount,
      parentCount,
      studentGroups,
      teacherGroups,
      adminGroups,
      admissionGroups,
      teacherApplicationGroups,
      feePaymentGroups,
      feeBillsAgg,
      leaveRequestGroups,
      todayStudentAttendanceGroups,
      todayTeacherAttendanceGroups,
    ] = await Promise.all([
      prisma.class.count(),
      prisma.parent.count(),
      prisma.student.groupBy({
        by: ["enrollmentStatus"],
        _count: { _all: true },
      }),
      prisma.teacher.groupBy({
        by: ["employmentStatus"],
        _count: { _all: true },
      }),
      prisma.admin.groupBy({
        by: ["employmentStatus"],
        _count: { _all: true },
      }),
      prisma.admissionApplication.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.teacherApplication.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.feePayment.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      currentYearBills
        ? prisma.feePayment.aggregate({
            where: currentYearBills,
            _sum: { amountDue: true, amountPaid: true },
          })
        : Promise.resolve({ _sum: { amountDue: 0, amountPaid: 0 } }),
      prisma.leaveRequest.groupBy({
        by: ["status", "requesterRole"],
        _count: { _all: true },
      }),
      prisma.studentAttendance.groupBy({
        by: ["status"],
        where: { date: today },
        _count: { _all: true },
      }),
      prisma.teacherAttendance.groupBy({
        by: ["status"],
        where: { date: today },
        _count: { _all: true },
      }),
    ]);

    const studentByStatus = emptyCounts(Object.values(EnrollmentStatus));
    studentGroups.forEach((g) => {
      studentByStatus[g.enrollmentStatus] = g._count._all;
    });

    const teacherByStatus = emptyCounts(Object.values(EmploymentStatus));
    teacherGroups.forEach((g) => {
      teacherByStatus[g.employmentStatus] = g._count._all;
    });

    const adminByStatus = emptyCounts(Object.values(EmploymentStatus));
    adminGroups.forEach((g) => {
      adminByStatus[g.employmentStatus] = g._count._all;
    });

    const admissionByStatus = emptyCounts(Object.values(AdmissionStatus));
    admissionGroups.forEach((g) => {
      admissionByStatus[g.status] = g._count._all;
    });

    const teacherApplicationByStatus = emptyCounts(
      Object.values(ApplicationStatus),
    );
    teacherApplicationGroups.forEach((g) => {
      teacherApplicationByStatus[g.status] = g._count._all;
    });

    const feePaymentByStatus = emptyCounts(Object.values(FeeStatus));
    feePaymentGroups.forEach((g) => {
      feePaymentByStatus[g.status] = g._count._all;
    });

    const studentLeaveByStatus = emptyCounts(Object.values(LeaveStatus));
    const teacherLeaveByStatus = emptyCounts(Object.values(LeaveStatus));
    leaveRequestGroups.forEach((g) => {
      if (g.requesterRole === "STUDENT") {
        studentLeaveByStatus[g.status] = g._count._all;
      } else if (g.requesterRole === "TEACHER") {
        teacherLeaveByStatus[g.status] = g._count._all;
      }
    });

    const todayStudentAttendance = emptyCounts(Object.values(AttendanceStatus));
    todayStudentAttendanceGroups.forEach((g) => {
      todayStudentAttendance[g.status] = g._count._all;
    });

    const todayTeacherAttendance = emptyCounts(Object.values(AttendanceStatus));
    todayTeacherAttendanceGroups.forEach((g) => {
      todayTeacherAttendance[g.status] = g._count._all;
    });

    const result: DashboardCounts = {
      academicYear: currentAcademicYear,
      students: {
        total: sumValues(studentByStatus),
        byStatus: studentByStatus,
      },
      teachers: {
        total: sumValues(teacherByStatus),
        byStatus: teacherByStatus,
      },
      admins: {
        total: sumValues(adminByStatus),
        byStatus: adminByStatus,
      },
      parentCount,
      classCount,
      admissionApplications: {
        total: sumValues(admissionByStatus),
        byStatus: admissionByStatus,
      },
      teacherApplications: {
        total: sumValues(teacherApplicationByStatus),
        byStatus: teacherApplicationByStatus,
      },
      feePayments: {
        total: sumValues(feePaymentByStatus),
        byStatus: feePaymentByStatus,
      },
      feeRevenue: {
        collected: feeBillsAgg._sum.amountPaid ?? 0,
        expected: feeBillsAgg._sum.amountDue ?? 0,
      },
      studentLeaveRequests: {
        total: sumValues(studentLeaveByStatus),
        byStatus: studentLeaveByStatus,
      },
      teacherLeaveRequests: {
        total: sumValues(teacherLeaveByStatus),
        byStatus: teacherLeaveByStatus,
      },
      todayAttendance: {
        students: todayStudentAttendance,
        teachers: todayTeacherAttendance,
      },
    };

    await setCache(cacheKey, result, CACHE_TTL.DASHBOARD_SUMMARY);

    log.info("Successfully fetched dashboard summary counts", {
      adminId,
      ipAddress: context.ipAddress,
      statusCode,
    });

    return result;
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error. Failed to get dashboard summary counts", {
      ipAddress: context.ipAddress,
      error: err.message,
      adminId,
    });
    throw err;
  }
}
