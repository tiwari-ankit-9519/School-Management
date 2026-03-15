import type { AuditContext } from "@/src/middlewares/request-logger.middleware";
import type { AuditAction, LogLevel, Prisma } from "@prisma/client";
import { prisma } from "@/src/config/database.config";
import { createModuleLogger } from "@/src/config/logger.config";

const log = createModuleLogger("AuditService");

interface CreateAuditLogParams {
  schoolId?: string;
  performedById: string;
  targetUserId?: string;
  action: AuditAction;
  module: string;
  resourceId?: string;
  resourceType?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  isSuccessful?: boolean;
  failureReason?: string;
  statusCode?: number;
  duration?: number;
  context: AuditContext;
}

interface CreateSystemLogParams {
  schoolId?: string;
  userId?: string;
  level: LogLevel;
  message: string;
  module: string;
  error?: string;
  stackTrace?: string;
  statusCode?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  context: AuditContext;
}

export async function createAuditLog(
  params: CreateAuditLogParams,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        school: params.schoolId
          ? { connect: { id: params.schoolId } }
          : undefined,
        performedBy: { connect: { id: params.performedById } },
        targetUser: params.targetUserId
          ? { connect: { id: params.targetUserId } }
          : undefined,
        action: params.action,
        module: params.module,
        resourceId: params.resourceId,
        resourceType: params.resourceType,
        oldValues: params.oldValues as Prisma.InputJsonValue | undefined,
        newValues: params.newValues as Prisma.InputJsonValue | undefined,
        isSuccessful: params.isSuccessful ?? true,
        failureReason: params.failureReason,
        statusCode: params.statusCode,
        duration: params.duration,
        ipAddress: params.context.ipAddress,
        userAgent: params.context.userAgent,
        sessionId: params.context.sessionId,
        requestId: params.context.requestId,
        country: params.context.country,
        region: params.context.region,
        city: params.context.city,
        latitude: params.context.latitude,
        longitude: params.context.longitude,
        isp: params.context.isp,
      },
    });
  } catch (error) {
    const err = error as Error;
    log.error("Failed to create audit log", {
      error: err.message,
      module: params.module,
      action: params.action,
    });
  }
}

export async function createSystemLog(
  params: CreateSystemLogParams,
): Promise<void> {
  try {
    await prisma.systemLog.create({
      data: {
        school: params.schoolId
          ? { connect: { id: params.schoolId } }
          : undefined,
        user: params.userId
          ? { connect: { id: params.userId } }
          : undefined,
        level: params.level,
        message: params.message,
        module: params.module,
        method: params.context.method,
        path: params.context.endpoint,
        ipAddress: params.context.ipAddress,
        userAgent: params.context.userAgent,
        requestId: params.context.requestId,
        traceId: params.context.traceId,
        spanId: params.context.spanId,
        statusCode: params.statusCode,
        duration: params.duration,
        error: params.error,
        stackTrace: params.stackTrace,
        metadata: params.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    const err = error as Error;
    log.error("Failed to create system log", {
      error: err.message,
      module: params.module,
    });
  }
}