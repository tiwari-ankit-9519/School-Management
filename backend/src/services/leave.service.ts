import { LeaveRequest, LeaveStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../config/database.config";
import { createAuditLog, createSystemLog } from "@/src/utils/audit.util";
import { CACHE_KEYS, CACHE_TTL, getCache, setCache } from "../utils/cache.util";
import { AuditContext } from "../middlewares/request-logger.middleware";
import {
  CreateLeaveRequestInput,
  ReviewLeaveRequestInput,
} from "../validations/input.validations";
import { createModuleLogger } from "../config/logger.config";

const log = createModuleLogger("LeaveService");

export async function applyLeaveRequestByStudentService(
  requesterId: string,
  role: Role,
  context: AuditContext,
  statusCode: number,
  data: CreateLeaveRequestInput,
): Promise<LeaveRequest> {
  try {
    log.info(
      `Starting service to apply for leave for requesterId ${requesterId}`,
      {
        ipAddress: context.ipAddress,
      },
    );

    const student = await prisma.student.findFirst({
      where: { userId: requesterId },
    });
    if (!student) {
      log.warn(`Student profile not found for user ${requesterId}`);
      throw new Error(`Student profile not found`);
    }

    log.info(`Student found, fetching active enrollment`, { requesterId });

    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id, status: "ACTIVE" },
      select: { classId: true },
    });
    if (!enrollment) {
      log.warn(`No active enrollment found for student ${student.id}`);
      throw new Error(`No active enrollment found for student`);
    }

    log.info(`Enrollment found, validating leave dates`, { requesterId });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = new Date(data.fromDate);
    const to = new Date(data.toDate);
    const maxPastDays = 7;
    const maxFutureDays = 60;
    const minAllowedDate = new Date(today);
    minAllowedDate.setDate(today.getDate() - maxPastDays);
    const maxAllowedDate = new Date(today);
    maxAllowedDate.setDate(today.getDate() + maxFutureDays);

    if (from < minAllowedDate) {
      log.warn(
        `Leave request cannot be applied more than ${maxPastDays} days in the past`,
      );
      throw new Error(
        `Leave request cannot be applied more than ${maxPastDays} days in the past`,
      );
    }
    if (from > maxAllowedDate) {
      log.warn(
        `Leave request cannot be applied more than ${maxFutureDays} days in advance`,
      );
      throw new Error(
        `Leave request cannot be applied more than ${maxFutureDays} days in advance`,
      );
    }
    if (to > maxAllowedDate) {
      log.warn(
        `Leave request toDate cannot exceed ${maxFutureDays} days in advance`,
      );
      throw new Error(
        `Leave request toDate cannot exceed ${maxFutureDays} days in advance`,
      );
    }

    log.info(`Date validation passed, creating leave request`, { requesterId });

    const leaveApplied = await prisma.leaveRequest.create({
      data: {
        fromDate: data.fromDate,
        toDate: data.toDate,
        reason: data.reason,
        studentId: student.id,
        classId: enrollment.classId,
        requesterId,
        requesterRole: role,
      },
    });

    log.info(`Leave request created`, {
      leaveId: leaveApplied.id,
      requesterId,
    });

    await createSystemLog({
      level: "INFO",
      module: "LeaveRequestModule",
      message: "Leave applied successfully for student",
      context,
      statusCode,
      metadata: {
        requesterId,
        role,
        classId: enrollment.classId,
      },
    });

    await createAuditLog({
      performedById: requesterId,
      action: "CREATE",
      module: "LeaveRequestModule",
      resourceId: leaveApplied.id,
      resourceType: "Leave",
      context,
      statusCode,
      isSuccessful: true,
      newValues: {
        id: leaveApplied.id,
        studentId: student.id,
        classId: enrollment.classId,
        requestedBy: requesterId,
      },
    });

    log.info(`Leave applied successfully for student`, {
      leaveId: leaveApplied.id,
      requesterId,
    });
    return leaveApplied;
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error. Failed to apply for leaves", {
      error: err.message,
      ipAddress: context.ipAddress,
      requesterId,
    });
    throw err;
  }
}

export async function getLeaveRequestsOfStudentForClassTeacherService(
  reviewerId: string,
  classId: string,
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  filters: {
    status?: LeaveStatus;
    studentId?: string;
  },
): Promise<{
  data: LeaveRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(
      `Starting service to fetch student leave requests for class teacher`,
      {
        ipAddress: context.ipAddress,
        reviewerId,
      },
    );

    const classTeacher = await prisma.classTeacher.findFirst({
      where: {
        teacher: { userId: reviewerId },
        classId,
      },
    });
    if (!classTeacher) {
      log.warn(
        `Teacher ${reviewerId} is not the class teacher for class ${classId}`,
        {
          reviewerId,
          classId,
        },
      );
      throw new Error(
        `You are not authorized to view leave requests for this class`,
      );
    }

    log.info(`Class teacher verified, checking cache`, { reviewerId, classId });

    const cacheKey = CACHE_KEYS.studentLeaveRequest(
      reviewerId,
      classId,
      page,
      limit,
      filters?.status || "ALL",
      filters?.studentId || "ALL",
    );

    const cached = await getCache<{
      data: LeaveRequest[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);
    if (cached) {
      log.info("Returning from cache", { cacheKey });
      return cached;
    }

    log.info(`Cache miss, querying database`, {
      reviewerId,
      classId,
      page,
      limit,
    });

    const where: Prisma.LeaveRequestWhereInput = {
      classId,
      requesterRole: "STUDENT",
    };
    if (filters?.status) where.status = filters.status;
    if (filters?.studentId) where.studentId = filters.studentId;

    const [leaveRequests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    log.info(`Database query successful`, { total, page, limit, classId });

    const response = {
      data: leaveRequests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, response, CACHE_TTL.ADMISSION_APPLICATIONS_LIST);
    log.info(`Leave requests cached successfully`, { cacheKey });

    await createSystemLog({
      level: "INFO",
      module: "GetLeaveRequestsForClassTeacher",
      message: "Fetched student leave requests for class teacher",
      context,
      statusCode,
      metadata: { reviewerId, classId, filters },
    });

    log.info(`Fetched student leave requests successfully`, {
      reviewerId,
      classId,
      total,
    });
    return response;
  } catch (error) {
    const err = error as Error;
    log.error(`Internal Server Error. Failed to fetch student leave requests`, {
      error: err.message,
      ipAddress: context.ipAddress,
      reviewerId,
    });
    throw err;
  }
}

export async function reviewLeaveRequestOfStudentByClassTeacherService(
  leaveId: string,
  reviewerId: string,
  context: AuditContext,
  statusCode: number,
  data: ReviewLeaveRequestInput,
): Promise<void> {
  try {
    log.info(
      `Starting service to review student leave request for leave id ${leaveId}`,
      {
        ipAddress: context.ipAddress,
        reviewerId,
      },
    );

    const appliedLeave = await prisma.leaveRequest.findFirst({
      where: {
        id: leaveId,
        requesterRole: "STUDENT",
      },
    });
    if (!appliedLeave) {
      log.warn(`Student leave request not found with id ${leaveId}`, {
        leaveId,
      });
      throw new Error(`Leave request not found`);
    }

    log.info(`Leave request found, validating status`, { leaveId, reviewerId });

    if (appliedLeave.status !== "PENDING") {
      log.warn(
        `Leave request ${leaveId} has already been reviewed with status ${appliedLeave.status}`,
        { leaveId, reviewerId },
      );
      throw new Error(
        `Leave request has already been reviewed with status ${appliedLeave.status}`,
      );
    }

    log.info(`Status valid, validating class teacher`, { leaveId, reviewerId });

    const classTeacher = await prisma.classTeacher.findFirst({
      where: {
        teacher: { userId: reviewerId },
        classId: appliedLeave.classId!,
      },
    });
    if (!classTeacher) {
      log.warn(
        `Teacher ${reviewerId} is not the class teacher for class ${appliedLeave.classId}`,
        { reviewerId, classId: appliedLeave.classId },
      );
      throw new Error(
        `You are not authorized to review leave requests for this class`,
      );
    }

    log.info(`Class teacher verified, updating leave request`, {
      leaveId,
      reviewerId,
    });

    const oldValues = {
      status: appliedLeave.status,
      reviewedBy: appliedLeave.reviewedBy,
      reviewedAt: appliedLeave.reviewedAt,
      remarks: appliedLeave.remarks,
    };

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: data.status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        ...(data.remarks && { remarks: data.remarks }),
      },
    });

    log.info(`Leave request updated successfully`, {
      leaveId,
      status: data.status,
      reviewerId,
    });

    await createSystemLog({
      level: "INFO",
      module: "ReviewLeaveRequestModule",
      message: `Student leave request ${data.status.toLowerCase()} successfully`,
      context,
      statusCode,
      metadata: {
        reviewerId,
        leaveId,
        classId: appliedLeave.classId,
        status: data.status,
      },
    });

    await createAuditLog({
      performedById: reviewerId,
      action: "UPDATE",
      module: "LeaveRequestModule",
      resourceId: updatedLeave.id,
      resourceType: "Leave",
      context,
      statusCode,
      isSuccessful: true,
      oldValues,
      newValues: {
        status: updatedLeave.status,
        reviewedBy: reviewerId,
        reviewedAt: updatedLeave.reviewedAt,
        remarks: updatedLeave.remarks,
      },
    });

    log.info(`Student leave request review completed successfully`, {
      leaveId,
      reviewerId,
      status: data.status,
    });
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error. Failed to review student leave request", {
      error: err.message,
      ipAddress: context.ipAddress,
      leaveId,
      reviewerId,
    });
    throw err;
  }
}

export async function applyLeaveRequestByTeacherService(
  requesterId: string,
  role: Role,
  context: AuditContext,
  statusCode: number,
  data: CreateLeaveRequestInput,
): Promise<LeaveRequest> {
  try {
    log.info(
      `Starting service to apply leaves for teacher with id ${requesterId}`,
      {
        ipAddress: context.ipAddress,
      },
    );

    const teacherExists = await prisma.teacher.findFirst({
      where: { userId: requesterId },
    });
    if (!teacherExists) {
      log.warn(`Teacher profile not found for user ${requesterId}`);
      throw new Error(`Teacher profile not found`);
    }

    log.info(`Teacher found, validating leave dates`, { requesterId });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = new Date(data.fromDate);
    const to = new Date(data.toDate);
    const maxPastDays = 7;
    const maxFutureDays = 60;
    const minAllowedDate = new Date(today);
    minAllowedDate.setDate(today.getDate() - maxPastDays);
    const maxAllowedDate = new Date(today);
    maxAllowedDate.setDate(today.getDate() + maxFutureDays);

    if (from < minAllowedDate) {
      log.warn(
        `Leave request cannot be applied more than ${maxPastDays} days in the past`,
      );
      throw new Error(
        `Leave request cannot be applied more than ${maxPastDays} days in the past`,
      );
    }
    if (from > maxAllowedDate) {
      log.warn(
        `Leave request cannot be applied more than ${maxFutureDays} days in advance`,
      );
      throw new Error(
        `Leave request cannot be applied more than ${maxFutureDays} days in advance`,
      );
    }
    if (to > maxAllowedDate) {
      log.warn(
        `Leave request toDate cannot exceed ${maxFutureDays} days in advance`,
      );
      throw new Error(
        `Leave request toDate cannot exceed ${maxFutureDays} days in advance`,
      );
    }

    log.info(`Date validation passed, creating leave request`, { requesterId });

    const leaveApplied = await prisma.leaveRequest.create({
      data: {
        requesterId,
        requesterRole: role,
        teacherId: teacherExists.id,
        fromDate: data.fromDate,
        toDate: data.toDate,
        reason: data.reason,
      },
    });

    log.info(`Leave request created`, {
      leaveId: leaveApplied.id,
      requesterId,
    });

    await createSystemLog({
      level: "INFO",
      module: "LeaveRequestModule",
      message: "Leave applied successfully for teacher",
      context,
      statusCode,
      metadata: {
        requesterId,
        role,
        teacherId: teacherExists.id,
      },
    });

    await createAuditLog({
      performedById: requesterId,
      action: "CREATE",
      module: "LeaveRequestModule",
      resourceId: leaveApplied.id,
      resourceType: "Leave",
      context,
      statusCode,
      isSuccessful: true,
      newValues: {
        id: leaveApplied.id,
        teacherId: teacherExists.id,
        requestedBy: requesterId,
      },
    });

    log.info(`Leave applied successfully for teacher`, {
      leaveId: leaveApplied.id,
      requesterId,
      teacherId: teacherExists.id,
    });
    return leaveApplied;
  } catch (error) {
    const err = error as Error;
    log.error(`Internal Server Error. Failed to apply for leave`, {
      error: err.message,
      ipAddress: context.ipAddress,
      requesterId,
    });
    throw err;
  }
}

export async function getLeaveRequestsOfTeacherForModeratorService(
  adminId: string,
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  filters: {
    status?: LeaveStatus;
    teacherId?: string;
  },
): Promise<{
  data: LeaveRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(`Starting service to fetch teacher leave requests for admin`, {
      ipAddress: context.ipAddress,
      adminId,
    });

    const cacheKey = CACHE_KEYS.teacherLeaveRequest(
      adminId,
      page,
      limit,
      filters?.status || "ALL",
      filters?.teacherId || "ALL",
    );

    const cached = await getCache<{
      data: LeaveRequest[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);
    if (cached) {
      log.info("Returning from cache", { cacheKey });
      return cached;
    }

    log.info(`Cache miss, querying database`, { adminId, page, limit });

    const where: Prisma.LeaveRequestWhereInput = {
      requesterRole: "TEACHER",
    };
    if (filters?.status) where.status = filters.status;
    if (filters?.teacherId) where.teacherId = filters.teacherId;

    const [leaveRequests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    log.info(`Database query successful`, { total, page, limit });

    const response = {
      data: leaveRequests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, response, CACHE_TTL.ADMISSION_APPLICATIONS_LIST);
    log.info(`Leave requests cached successfully`, { cacheKey });

    await createSystemLog({
      level: "INFO",
      module: "GetLeaveRequestsForAdmin",
      message: "Fetched all teacher leave requests for admin",
      context,
      statusCode,
      metadata: { adminId, filters },
    });

    log.info(`Fetched teacher leave requests successfully`, { adminId, total });
    return response;
  } catch (error) {
    const err = error as Error;
    log.error(`Internal Server Error. Failed to fetch teacher leave requests`, {
      error: err.message,
      ipAddress: context.ipAddress,
      adminId,
    });
    throw err;
  }
}

export async function reviewLeaveRequestOfTeacherForModeratorService(
  leaveId: string,
  reviewerId: string,
  context: AuditContext,
  statusCode: number,
  data: ReviewLeaveRequestInput,
): Promise<void> {
  try {
    log.info(
      `Starting service to review teacher leave request for leave id ${leaveId}`,
      {
        ipAddress: context.ipAddress,
        reviewerId,
      },
    );

    const appliedLeave = await prisma.leaveRequest.findFirst({
      where: {
        id: leaveId,
        requesterRole: "TEACHER",
      },
    });
    if (!appliedLeave) {
      log.warn(`Teacher leave request not found with id ${leaveId}`, {
        leaveId,
      });
      throw new Error(`Leave request not found`);
    }

    log.info(`Leave request found, validating status`, { leaveId, reviewerId });

    if (appliedLeave.status !== "PENDING") {
      log.warn(
        `Leave request ${leaveId} has already been reviewed with status ${appliedLeave.status}`,
        { leaveId, reviewerId },
      );
      throw new Error(
        `Leave request has already been reviewed with status ${appliedLeave.status}`,
      );
    }

    log.info(`Validation passed, updating leave request`, {
      leaveId,
      reviewerId,
    });

    const oldValues = {
      status: appliedLeave.status,
      reviewedBy: appliedLeave.reviewedBy,
      reviewedAt: appliedLeave.reviewedAt,
      remarks: appliedLeave.remarks,
    };

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: data.status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        ...(data.remarks && { remarks: data.remarks }),
      },
    });

    log.info(`Leave request updated successfully`, {
      leaveId,
      status: data.status,
      reviewerId,
    });

    await createSystemLog({
      level: "INFO",
      module: "ReviewLeaveRequestModule",
      message: `Teacher leave request ${data.status.toLowerCase()} successfully by moderator`,
      context,
      statusCode,
      metadata: {
        reviewerId,
        leaveId,
        status: data.status,
      },
    });

    await createAuditLog({
      performedById: reviewerId,
      action: "UPDATE",
      module: "LeaveRequestModule",
      resourceId: updatedLeave.id,
      resourceType: "Leave",
      context,
      statusCode,
      isSuccessful: true,
      oldValues,
      newValues: {
        status: updatedLeave.status,
        reviewedBy: reviewerId,
        reviewedAt: updatedLeave.reviewedAt,
        remarks: updatedLeave.remarks,
      },
    });

    log.info(`Teacher leave request review completed successfully`, {
      leaveId,
      reviewerId,
      status: data.status,
    });
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error. Failed to review teacher leave request", {
      error: err.message,
      ipAddress: context.ipAddress,
      leaveId,
      reviewerId,
    });
    throw err;
  }
}

export async function applyLeaveRequestByModeratorService(
  requesterId: string,
  role: Role,
  context: AuditContext,
  statusCode: number,
  data: CreateLeaveRequestInput,
): Promise<LeaveRequest> {
  try {
    log.info(
      `Starting service to apply leaves for moderator with id ${requesterId}`,
      {
        ipAddress: context.ipAddress,
      },
    );

    const moderatorExists = await prisma.admin.findFirst({
      where: { userId: requesterId },
    });
    if (!moderatorExists) {
      log.warn(`Moderator profile not found for user ${requesterId}`);
      throw new Error(`Moderator profile not found`);
    }

    log.info(`Moderator found, validating leave dates`, { requesterId });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = new Date(data.fromDate);
    const to = new Date(data.toDate);
    const maxPastDays = 7;
    const maxFutureDays = 60;
    const minAllowedDate = new Date(today);
    minAllowedDate.setDate(today.getDate() - maxPastDays);
    const maxAllowedDate = new Date(today);
    maxAllowedDate.setDate(today.getDate() + maxFutureDays);

    if (from < minAllowedDate) {
      log.warn(
        `Leave request cannot be applied more than ${maxPastDays} days in the past`,
      );
      throw new Error(
        `Leave request cannot be applied more than ${maxPastDays} days in the past`,
      );
    }
    if (from > maxAllowedDate) {
      log.warn(
        `Leave request cannot be applied more than ${maxFutureDays} days in advance`,
      );
      throw new Error(
        `Leave request cannot be applied more than ${maxFutureDays} days in advance`,
      );
    }
    if (to > maxAllowedDate) {
      log.warn(
        `Leave request toDate cannot exceed ${maxFutureDays} days in advance`,
      );
      throw new Error(
        `Leave request toDate cannot exceed ${maxFutureDays} days in advance`,
      );
    }

    log.info(`Date validation passed, creating leave request`, { requesterId });

    const leaveApplied = await prisma.leaveRequest.create({
      data: {
        requesterId,
        requesterRole: role,
        fromDate: data.fromDate,
        toDate: data.toDate,
        reason: data.reason,
      },
    });

    log.info(`Leave request created`, {
      leaveId: leaveApplied.id,
      requesterId,
    });

    await createSystemLog({
      level: "INFO",
      module: "LeaveRequestModule",
      message: "Leave applied successfully for moderator",
      context,
      statusCode,
      metadata: {
        requesterId,
        role,
        moderatorId: moderatorExists.id,
      },
    });

    await createAuditLog({
      performedById: requesterId,
      action: "CREATE",
      module: "LeaveRequestModule",
      resourceId: leaveApplied.id,
      resourceType: "Leave",
      context,
      statusCode,
      isSuccessful: true,
      newValues: {
        id: leaveApplied.id,
        moderatorId: moderatorExists.id,
        requestedBy: requesterId,
      },
    });

    log.info(`Leave applied successfully for moderator`, {
      leaveId: leaveApplied.id,
      requesterId,
      moderatorId: moderatorExists.id,
    });
    return leaveApplied;
  } catch (error) {
    const err = error as Error;
    log.error(`Internal Server Error. Failed to apply for leave`, {
      error: err.message,
      ipAddress: context.ipAddress,
      requesterId,
    });
    throw err;
  }
}

export async function getLeaveRequestsOfModeratorForAdminService(
  adminId: string,
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  filters: {
    status?: LeaveStatus;
    moderatorId?: string;
  },
): Promise<{
  data: LeaveRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(`Starting service to fetch moderator leave requests for admin`, {
      ipAddress: context.ipAddress,
      adminId,
    });

    const cacheKey = CACHE_KEYS.moderatorLeaveRequest(
      adminId,
      page,
      limit,
      filters?.status || "ALL",
      filters?.moderatorId || "ALL",
    );

    const cached = await getCache<{
      data: LeaveRequest[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);
    if (cached) {
      log.info("Returning from cache", { cacheKey });
      return cached;
    }

    log.info(`Cache miss, querying database`, { adminId, page, limit });

    const where: Prisma.LeaveRequestWhereInput = {
      requesterRole: "MODERATOR",
      requesterId: {
        in: await prisma.user
          .findMany({
            where: { role: "MODERATOR" },
            select: { id: true },
          })
          .then((users) => users.map((u) => u.id)),
      },
    };
    if (filters?.status) where.status = filters.status;
    if (filters?.moderatorId) where.requesterId = filters.moderatorId;

    const [leaveRequests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    log.info(`Database query successful`, { total, page, limit });

    const response = {
      data: leaveRequests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, response, CACHE_TTL.ADMISSION_APPLICATIONS_LIST);
    log.info(`Leave requests cached successfully`, { cacheKey });

    await createSystemLog({
      level: "INFO",
      module: "GetLeaveRequestsForSuperAdmin",
      message: "Fetched all moderator leave requests for admin",
      context,
      statusCode,
      metadata: { adminId, filters },
    });

    log.info(`Fetched moderator leave requests successfully`, {
      adminId,
      total,
    });
    return response;
  } catch (error) {
    const err = error as Error;
    log.error(
      `Internal Server Error. Failed to fetch moderator leave requests`,
      {
        error: err.message,
        ipAddress: context.ipAddress,
        adminId,
      },
    );
    throw err;
  }
}

export async function reviewLeaveRequestOfModeratorForAdminService(
  leaveId: string,
  reviewerId: string,
  context: AuditContext,
  statusCode: number,
  data: ReviewLeaveRequestInput,
): Promise<void> {
  try {
    log.info(
      `Starting service to review moderator leave request for leave id ${leaveId}`,
      {
        ipAddress: context.ipAddress,
        reviewerId,
      },
    );

    const appliedLeave = await prisma.leaveRequest.findFirst({
      where: {
        id: leaveId,
        requesterRole: "MODERATOR",
      },
    });
    if (!appliedLeave) {
      log.warn(`Moderator leave request not found with id ${leaveId}`, {
        leaveId,
      });
      throw new Error(`Leave request not found`);
    }

    log.info(`Leave request found, validating status`, { leaveId, reviewerId });

    if (appliedLeave.status !== "PENDING") {
      log.warn(
        `Leave request ${leaveId} has already been reviewed with status ${appliedLeave.status}`,
        { leaveId, reviewerId },
      );
      throw new Error(
        `Leave request has already been reviewed with status ${appliedLeave.status}`,
      );
    }

    log.info(`Validation passed, updating leave request`, {
      leaveId,
      reviewerId,
    });

    const oldValues = {
      status: appliedLeave.status,
      reviewedBy: appliedLeave.reviewedBy,
      reviewedAt: appliedLeave.reviewedAt,
      remarks: appliedLeave.remarks,
    };

    const updatedLeave = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: data.status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        ...(data.remarks && { remarks: data.remarks }),
      },
    });

    log.info(`Leave request updated successfully`, {
      leaveId,
      status: data.status,
      reviewerId,
    });

    await createSystemLog({
      level: "INFO",
      module: "ReviewLeaveRequestModule",
      message: `Moderator leave request ${data.status.toLowerCase()} successfully by admin`,
      context,
      statusCode,
      metadata: {
        reviewerId,
        leaveId,
        status: data.status,
      },
    });

    await createAuditLog({
      performedById: reviewerId,
      action: "UPDATE",
      module: "LeaveRequestModule",
      resourceId: updatedLeave.id,
      resourceType: "Leave",
      context,
      statusCode,
      isSuccessful: true,
      oldValues,
      newValues: {
        status: updatedLeave.status,
        reviewedBy: reviewerId,
        reviewedAt: updatedLeave.reviewedAt,
        remarks: updatedLeave.remarks,
      },
    });

    log.info(`Moderator leave request review completed successfully`, {
      leaveId,
      reviewerId,
      status: data.status,
    });
  } catch (error) {
    const err = error as Error;
    log.error(
      "Internal Server Error. Failed to review moderator leave request",
      {
        error: err.message,
        ipAddress: context.ipAddress,
        leaveId,
        reviewerId,
      },
    );
    throw err;
  }
}

export async function getMyLeaveRequestsService(
  requesterId: string,
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
  filters: {
    status?: LeaveStatus;
  },
): Promise<{
  data: LeaveRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    log.info(
      `Starting service to fetch leave requests for requester ${requesterId}`,
      {
        ipAddress: context.ipAddress,
        requesterId,
      },
    );

    const cacheKey = CACHE_KEYS.myLeaveRequests(
      requesterId,
      page,
      limit,
      filters?.status || "ALL",
    );

    const cached = await getCache<{
      data: LeaveRequest[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(cacheKey);
    if (cached) {
      log.info("Returning from cache", { cacheKey });
      return cached;
    }

    log.info(`Cache miss, querying database`, { requesterId, page, limit });

    const where: Prisma.LeaveRequestWhereInput = {
      requesterId,
    };
    if (filters?.status) where.status = filters.status;

    const [leaveRequests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    log.info(`Database query successful`, { total, page, limit, requesterId });

    const response = {
      data: leaveRequests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await setCache(cacheKey, response, CACHE_TTL.ADMISSION_APPLICATIONS_LIST);
    log.info(`Leave requests cached successfully`, { cacheKey });

    await createSystemLog({
      level: "INFO",
      module: "GetMyLeaveRequests",
      message: "Fetched own leave requests successfully",
      context,
      statusCode,
      metadata: { requesterId, filters },
    });

    log.info(`Fetched own leave requests successfully`, { requesterId, total });
    return response;
  } catch (error) {
    const err = error as Error;
    log.error(`Internal Server Error. Failed to fetch own leave requests`, {
      error: err.message,
      ipAddress: context.ipAddress,
      requesterId,
    });
    throw err;
  }
}
