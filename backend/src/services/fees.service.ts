import { FeeStructure, Prisma } from "@prisma/client";
import { prisma } from "../config/database.config";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import {
  FeesStructureType,
  FeesStructureUpdateType,
  UpdateFeeStructureStatusType,
} from "../validations/input.validations";

const log = createModuleLogger("FeeModule");

const MAX_PAGE_SIZE = 100;

const resolveRecurringMonth = (
  isRecurring: boolean | undefined,
  recurringMonth: number | null | undefined,
): number | null | undefined => {
  if (isRecurring === false) return null;
  if (isRecurring === true) return recurringMonth ?? null;
  return recurringMonth;
};

async function assertUniqueFeeName(
  name: string,
  classGroupId: string,
  academicYearId: string,
  excludeId?: string,
): Promise<void> {
  const duplicate = await prisma.feeStructure.findFirst({
    where: {
      classGroupId,
      academicYearId,
      name: { equals: name.trim(), mode: "insensitive" },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (duplicate) {
    log.warn("Fee Structure with this name already exists", {
      name,
      classGroupId,
      academicYearId,
    });
    throw new Error("A fee with this name already exists for this class group");
  }
}

export async function createFeeStructureService(
  adminId: string,
  classGroupId: string,
  data: FeesStructureType,
  context: AuditContext,
  statusCode: number,
): Promise<FeeStructure> {
  try {
    log.info("Starting service to create fee structure", {
      requestPayload: data,
      ipAddress: context.ipAddress,
      classGroupId,
    });

    const [academicYear, classGroupExists] = await Promise.all([
      prisma.academicYear.findFirst({ where: { isCurrent: true } }),
      prisma.classGroup.findUnique({ where: { id: classGroupId } }),
    ]);

    if (!academicYear) {
      log.warn("Academic Year not found");
      throw new Error("Academic Year not found");
    }

    if (!classGroupExists) {
      log.warn("Class Group does not exist");
      throw new Error("Class Group does not exist");
    }

    await assertUniqueFeeName(data.name, classGroupId, academicYear.id);

    const isRecurring = data.isRecurring ?? false;

    const newFeeStructure = await prisma.feeStructure.create({
      data: {
        academicYearId: academicYear.id,
        classGroupId,
        name: data.name.trim(),
        amount: data.amount,
        description: data.description?.trim() || null,
        isRecurring,
        recurringMonth:
          resolveRecurringMonth(isRecurring, data.recurringMonth) ?? null,
      },
    });

    log.info("Fee structure created", {
      feeId: newFeeStructure.id,
      classGroupId,
    });

    await createSystemLog({
      level: "INFO",
      message: "Fee Structure created successfully",
      module: "FeeStructure",
      context,
      statusCode,
      metadata: {
        feeId: newFeeStructure.id,
        name: newFeeStructure.name,
        amount: newFeeStructure.amount,
        classGroupId: newFeeStructure.classGroupId,
        isRecurring: newFeeStructure.isRecurring,
      },
    });

    await createAuditLog({
      performedById: adminId,
      action: "CREATE",
      module: "Fees",
      resourceId: newFeeStructure.id,
      resourceType: "FeeStructure",
      newValues: {
        name: newFeeStructure.name,
        amount: newFeeStructure.amount,
        classGroupId: newFeeStructure.classGroupId,
        isRecurring: newFeeStructure.isRecurring,
        recurringMonth: newFeeStructure.recurringMonth,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    return newFeeStructure;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to create fee structure", {
      error: err.message,
      ipAddress: context.ipAddress,
      classGroupId,
    });
    throw err;
  }
}

export async function updateFeeStructureService(
  adminId: string,
  feeId: string,
  data: FeesStructureUpdateType,
  context: AuditContext,
  statusCode: number,
): Promise<FeeStructure> {
  try {
    log.info("Starting service to update the fee structure", {
      data,
      adminId,
      feeId,
      ipAddress: context.ipAddress,
    });

    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id: feeId },
    });

    if (!feeStructure) {
      log.warn("Fee Structure not found", { feeId });
      throw new Error("Fee Structure not found");
    }

    if (
      data.name &&
      data.name.trim().toLowerCase() !== feeStructure.name.toLowerCase()
    ) {
      await assertUniqueFeeName(
        data.name,
        feeStructure.classGroupId,
        feeStructure.academicYearId,
        feeId,
      );
    }

    const updateData: Prisma.FeeStructureUpdateInput = {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.description !== undefined && {
        description: data.description.trim() || null,
      }),
      ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
    };

    const recurringMonth = resolveRecurringMonth(
      data.isRecurring,
      data.recurringMonth,
    );
    if (recurringMonth !== undefined) {
      updateData.recurringMonth = recurringMonth;
    }

    const updatedFeeStructure = await prisma.feeStructure.update({
      where: { id: feeId },
      data: updateData,
    });

    log.info("Fee structure updated", {
      feeId,
      changedFields: Object.keys(updateData),
    });

    await createSystemLog({
      level: "INFO",
      message: "Fee Structure updated successfully",
      module: "FeeStructure",
      context,
      statusCode,
      metadata: {
        feeId,
        name: updatedFeeStructure.name,
        amount: updatedFeeStructure.amount,
        classGroupId: updatedFeeStructure.classGroupId,
        isRecurring: updatedFeeStructure.isRecurring,
      },
    });

    await createAuditLog({
      performedById: adminId,
      action: "UPDATE",
      module: "Fees",
      resourceId: updatedFeeStructure.id,
      resourceType: "FeeStructure",
      oldValues: {
        name: feeStructure.name,
        amount: feeStructure.amount,
        description: feeStructure.description,
        isRecurring: feeStructure.isRecurring,
        recurringMonth: feeStructure.recurringMonth,
      },
      newValues: {
        name: updatedFeeStructure.name,
        amount: updatedFeeStructure.amount,
        description: updatedFeeStructure.description,
        isRecurring: updatedFeeStructure.isRecurring,
        recurringMonth: updatedFeeStructure.recurringMonth,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    return updatedFeeStructure;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to update fee structure", {
      feeId,
      adminId,
      ipAddress: context.ipAddress,
      error: err.message,
    });
    throw err;
  }
}

export async function getFeeStructureForClassService(
  classGroupId: string,
  adminId: string,
  context: AuditContext,
  statusCode: number,
  page: number = 1,
  limit: number = 10,
): Promise<{
  data: FeeStructure[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, limit));

    log.info("Starting service to fetch fee structure of the class group", {
      classGroupId,
      adminId,
      page: safePage,
      limit: safeLimit,
      ipAddress: context.ipAddress,
    });

    const academicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
    });

    if (!academicYear) {
      log.warn("Current academic year not found");
      throw new Error("Current academic year not found");
    }

    const where: Prisma.FeeStructureWhereInput = {
      classGroupId,
      academicYearId: academicYear.id,
    };

    const [feeStructureOfClass, total] = await prisma.$transaction([
      prisma.feeStructure.findMany({
        where,
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        orderBy: { createdAt: "desc" },
        include: {
          classGroup: {
            select: { name: true },
          },
        },
      }),
      prisma.feeStructure.count({ where }),
    ]);

    await createSystemLog({
      level: "INFO",
      module: "FeeStructure",
      message: "Fetched Fee Structure",
      context,
      statusCode,
      metadata: {
        adminId,
        classGroupId,
        total,
      },
    });

    log.info(`Fetched fee structure for class group ${classGroupId}`, {
      total,
      page: safePage,
      limit: safeLimit,
    });

    return {
      data: feeStructureOfClass,
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    };
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to fetch fee structure of class group ${classGroupId}`, {
      error: err.message,
      ipAddress: context.ipAddress,
      classGroupId,
      adminId,
    });
    throw err;
  }
}

export async function updateFeeStructureStatusService(
  adminId: string,
  feeId: string,
  data: UpdateFeeStructureStatusType,
  context: AuditContext,
  statusCode: number,
): Promise<FeeStructure> {
  try {
    log.info("Updating fee structure status", {
      adminId,
      feeId,
      isActive: data.isActive,
      ipAddress: context.ipAddress,
    });

    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id: feeId },
    });

    if (!feeStructure) {
      log.warn("Fee Structure not found", { feeId });
      throw new Error("Fee Structure not found");
    }

    if (feeStructure.isActive === data.isActive) return feeStructure;

    const updated = await prisma.feeStructure.update({
      where: { id: feeId },
      data: { isActive: data.isActive },
    });

    await createSystemLog({
      level: "INFO",
      message: `Fee Structure ${data.isActive ? "activated" : "deactivated"}`,
      module: "FeeStructure",
      context,
      statusCode,
      metadata: { feeId, name: updated.name, isActive: updated.isActive },
    });

    await createAuditLog({
      performedById: adminId,
      action: "STATUS_CHANGE",
      module: "Fees",
      resourceId: updated.id,
      resourceType: "FeeStructure",
      oldValues: { isActive: feeStructure.isActive },
      newValues: { isActive: updated.isActive },
      context,
      isSuccessful: true,
      statusCode,
    });

    return updated;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to update fee structure status", {
      feeId,
      adminId,
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}
