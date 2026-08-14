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
} from "@prisma/client";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { createModuleLogger } from "../config/logger.config";
import { prisma } from "../config/database.config";

const log = createModuleLogger("DashboardService");

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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const currentAcademicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
      select: { id: true, name: true },
    });

    const [
      classCount,
      parentCount,
      studentGroups,
      teacherGroups,
      adminGroups,
      admissionGroups,
      teacherApplicationGroups,
      feePaymentGroups,
      feeCollectedAgg,
      feeExpectedAgg,
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
      prisma.feePayment.aggregate({
        _sum: { amountPaid: true },
      }),
      currentAcademicYear
        ? prisma.feeStructure.aggregate({
            where: { academicYearId: currentAcademicYear.id, isActive: true },
            _sum: { amount: true },
          })
        : Promise.resolve({ _sum: { amount: 0 } }),
      prisma.leaveRequest.groupBy({
        by: ["status", "requesterRole"],
        _count: { _all: true },
      }),
      prisma.studentAttendance.groupBy({
        by: ["status"],
        where: { date: { gte: todayStart, lte: todayEnd } },
        _count: { _all: true },
      }),
      prisma.teacherAttendance.groupBy({
        by: ["status"],
        where: { date: { gte: todayStart, lte: todayEnd } },
        _count: { _all: true },
      }),
    ]);

    const studentByStatus = Object.fromEntries(
      Object.values(EnrollmentStatus).map((s) => [s, 0]),
    ) as Record<EnrollmentStatus, number>;
    studentGroups.forEach((g) => {
      studentByStatus[g.enrollmentStatus] = g._count._all;
    });

    const teacherByStatus = Object.fromEntries(
      Object.values(EmploymentStatus).map((s) => [s, 0]),
    ) as Record<EmploymentStatus, number>;
    teacherGroups.forEach((g) => {
      teacherByStatus[g.employmentStatus] = g._count._all;
    });

    const adminByStatus = Object.fromEntries(
      Object.values(EmploymentStatus).map((s) => [s, 0]),
    ) as Record<EmploymentStatus, number>;
    adminGroups.forEach((g) => {
      adminByStatus[g.employmentStatus] = g._count._all;
    });

    const admissionByStatus = Object.fromEntries(
      Object.values(AdmissionStatus).map((s) => [s, 0]),
    ) as Record<AdmissionStatus, number>;
    admissionGroups.forEach((g) => {
      admissionByStatus[g.status] = g._count._all;
    });

    const teacherApplicationByStatus = Object.fromEntries(
      Object.values(ApplicationStatus).map((s) => [s, 0]),
    ) as Record<ApplicationStatus, number>;
    teacherApplicationGroups.forEach((g) => {
      teacherApplicationByStatus[g.status] = g._count._all;
    });

    const feePaymentByStatus = Object.fromEntries(
      Object.values(FeeStatus).map((s) => [s, 0]),
    ) as Record<FeeStatus, number>;
    feePaymentGroups.forEach((g) => {
      feePaymentByStatus[g.status] = g._count._all;
    });

    const studentLeaveByStatus = Object.fromEntries(
      Object.values(LeaveStatus).map((s) => [s, 0]),
    ) as Record<LeaveStatus, number>;
    const teacherLeaveByStatus = Object.fromEntries(
      Object.values(LeaveStatus).map((s) => [s, 0]),
    ) as Record<LeaveStatus, number>;
    leaveRequestGroups.forEach((g) => {
      if (g.requesterRole === "STUDENT") {
        studentLeaveByStatus[g.status] = g._count._all;
      } else if (g.requesterRole === "TEACHER") {
        teacherLeaveByStatus[g.status] = g._count._all;
      }
    });

    const todayStudentAttendance = Object.fromEntries(
      Object.values(AttendanceStatus).map((s) => [s, 0]),
    ) as Record<AttendanceStatus, number>;
    todayStudentAttendanceGroups.forEach((g) => {
      todayStudentAttendance[g.status] = g._count._all;
    });

    const todayTeacherAttendance = Object.fromEntries(
      Object.values(AttendanceStatus).map((s) => [s, 0]),
    ) as Record<AttendanceStatus, number>;
    todayTeacherAttendanceGroups.forEach((g) => {
      todayTeacherAttendance[g.status] = g._count._all;
    });

    const sumValues = (record: Record<string, number>) =>
      Object.values(record).reduce((a, b) => a + b, 0);

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
        collected: feeCollectedAgg._sum.amountPaid ?? 0,
        expected: feeExpectedAgg._sum.amount ?? 0,
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
