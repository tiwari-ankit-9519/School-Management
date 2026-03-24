import { Class } from "@prisma/client";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { ClassInput } from "../validations/input.validations";
import { prisma } from "../config/database.config";
import { createAuditLog, createSystemLog } from "../utils/audit.util";

const log = createModuleLogger("ClassService");

export async function createClassService(
  academicYearId: string,
  schoolId: string,
  adminId: string,
  data: ClassInput,
  context: AuditContext,
  statusCode: number,
): Promise<Class> {
  try {
    log.info("Class creation service started", {
      ipAddress: context.ipAddress,
      className: data.name,
      capacity: data.capacity,
      academicYearId,
      adminId,
      schoolId,
    });

    const academicYear = await prisma.academicYear.findFirst({
      where: {
        id: academicYearId,
        schoolId,
      },
    });

    if (!academicYear) {
      log.warn("Academic Year not found for this school", {
        academicYearId,
      });
      throw new Error("Academic Year not found for this school");
    }

    const classExists = await prisma.class.findFirst({
      where: {
        name: data.name,
        section: data.section,
        schoolId,
        academicYearId,
      },
    });

    if (classExists) {
      log.warn("Class already exists", {
        classExists,
      });
      throw new Error("Class already exists");
    }

    const newClass = await prisma.class.create({
      data: {
        name: data.name,
        section: data.section,
        capacity: data.capacity,
        roomNumber: data.roomNumber,
        academicYearId,
        schoolId,
      },
    });

    await createSystemLog({
      level: "INFO",
      module: "ClassService",
      message: "Class created successfully",
      context,
      statusCode,
      metadata: {
        ipAddress: context.ipAddress,
        className: data.name,
        capacity: data.capacity,
        academicYearId,
        adminId,
        schoolId,
      },
    });

    await createAuditLog({
      schoolId,
      performedById: adminId,
      action: "CREATE",
      module: "Class",
      resourceId: newClass.id,
      resourceType: "ClassService",
      newValues: {
        schoolId,
        className: newClass.name,
        classId: newClass.id,
        studentCapacity: newClass.capacity,
        section: newClass.section,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    log.info("Class created successfully", {
      class: newClass,
    });

    return newClass;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to create class", {
      error: err.message,
      ipAddress: context.ipAddress,
    });
    throw err;
  }
}
