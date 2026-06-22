import { prisma } from "../config/database.config";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import {
  FeesStructureType,
  FeesStructureUpdateType,
} from "../validations/input.validations";
import { FeeStructure } from "@prisma/client";

const log = createModuleLogger("FeeModule");

export async function createFeeStructureService(
  adminId: string,
  classId: string,
  data: FeesStructureType,
  context: AuditContext,
  statusCode: number,
): Promise<FeeStructure> {
  try {
    log.info("Starting service to create fee structure", {
      requestPayload: data,
      ipAddress: context.ipAddress,
      classId,
    });

    const academicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
    });

    if (!academicYear) {
      log.warn(`Academic Year not found`);
      throw new Error(`Academic Year not found`);
    }

    const [feeStructure, classExists] = await Promise.all([
      prisma.feeStructure.findFirst({
        where: { classId, academicYearId: academicYear.id, name: data.name },
      }),
      prisma.class.findFirst({
        where: { id: classId },
      }),
    ]);

    if (feeStructure) {
      log.warn("Fee Structure already exists");
      throw new Error("Fee Structure already exists");
    }
    if (!classExists) {
      log.warn("Class does not exists");
      throw new Error("Class does not exists");
    }

    const ADMISSION_FEE_GRACE_PERIOD_DAYS = 30;
    const dueDate = new Date(academicYear.startDate);
    dueDate.setDate(dueDate.getDate() + ADMISSION_FEE_GRACE_PERIOD_DAYS);

    log.info(`The due date for the admission fees is ${dueDate}`);

    const newFeeStructure = await prisma.feeStructure.create({
      data: {
        academicYearId: academicYear.id,
        classId,
        name: data.name,
        amount: data.amount,
        dueDate,
        description: data.description,
        recurringMonth: data.recurringMonth,
        isRecurring: data.isRecurring,
      },
    });

    await createSystemLog({
      level: "INFO",
      message: "Fee Structure create successfully",
      module: "Fee Structure",
      context,
      statusCode,
      metadata: {
        name: newFeeStructure.name,
        amount: newFeeStructure.amount,
        dueDate: newFeeStructure.dueDate,
        classId: newFeeStructure.classId,
        isRecurring: newFeeStructure.isRecurring,
      },
    });

    await createAuditLog({
      performedById: adminId,
      action: "CREATE",
      module: "Fees",
      resourceId: newFeeStructure.id,
      resourceType: "FeeStructureCreation",
      newValues: {
        name: newFeeStructure.name,
        amount: newFeeStructure.amount,
        dueDate: newFeeStructure.dueDate,
        classId: newFeeStructure.classId,
        isRecurring: newFeeStructure.isRecurring,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    return newFeeStructure;
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error.", {
      error: err.message,
      ipAddress: context.ipAddress,
      classId,
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
      log.warn("Fee Structure not found");
      throw new Error("Fee Structure not found");
    }

    const updatedFeeStructure = await prisma.feeStructure.update({
      where: { id: feeId },
      data: {
        name: data.name,
        amount: data.amount,
        description: data.description,
        recurringMonth: data.recurringMonth,
        isRecurring: data.isRecurring,
      },
    });

    log.info("Fee structure updated", {
      updateFeeStructureService,
    });

    await createSystemLog({
      level: "INFO",
      message: "Fee Structure updated successfully",
      module: "Fee Structure",
      context,
      statusCode,
      metadata: {
        name: updatedFeeStructure.name,
        amount: updatedFeeStructure.amount,
        dueDate: updatedFeeStructure.dueDate,
        classId: updatedFeeStructure.classId,
        isRecurring: updatedFeeStructure.isRecurring,
      },
    });

    await createAuditLog({
      performedById: adminId,
      action: "CREATE",
      module: "Fees",
      resourceId: updatedFeeStructure.id,
      resourceType: "FeeStructureCreation",
      oldValues: {
        amount: feeStructure.amount,
        isRecurring: feeStructure.isRecurring,
        description: feeStructure.description,
      },
      newValues: {
        name: updatedFeeStructure.name,
        amount: updatedFeeStructure.amount,
        dueDate: updatedFeeStructure.dueDate,
        classId: updatedFeeStructure.classId,
        isRecurring: updatedFeeStructure.isRecurring,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    return updatedFeeStructure;
  } catch (error) {
    const err = error as Error;
    log.error("Internal Server Error", {
      feeId,
      adminId,
      ipAddress: context.ipAddress,
      error: err.message,
    });
    throw err;
  }
}

export async function getFeeStructureForClassService(
  classId: string,
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
    log.info(`Starting service to fetch fee structure of the class`, {
      classId,
      adminId,
      ipAddress: context.ipAddress,
    });

    const academicYear = await prisma.academicYear.findFirst({
      where: { isCurrent: true },
    });

    if (!academicYear) {
      log.warn(`Current academic year not found`);
      throw new Error(`Current academic year not found`);
    }

    const [feeStructureOfClass, total] = await prisma.$transaction([
      prisma.feeStructure.findMany({
        where: { classId, academicYearId: academicYear.id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.feeStructure.count({
        where: { classId, academicYearId: academicYear.id },
      }),
    ]);

    if (!feeStructureOfClass.length) {
      log.warn(`Fee Structure not found`);
      throw new Error(`Fee Structure not found`);
    }

    const response = {
      data: feeStructureOfClass,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    await createSystemLog({
      level: "INFO",
      module: "FeeStructureModule",
      message: "Fetched Fee Structure",
      context,
      statusCode,
      metadata: {
        adminId,
        classId,
      },
    });

    log.info(`Fetched fee structure for classs with id ${classId}`, {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });

    return response;
  } catch (error) {
    const err = error as Error;
    log.error(
      `Internal Server Error. Failed to fetch fee structure of class ${classId}`,
      {
        error: err.message,
        ipAddress: context.ipAddress,
        classId,
        adminId,
      },
    );
    throw err;
  }
}
