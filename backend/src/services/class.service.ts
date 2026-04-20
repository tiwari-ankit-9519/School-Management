import { Class } from "@prisma/client";
import { createModuleLogger } from "../config/logger.config";
import { AuditContext } from "../middlewares/request-logger.middleware";
import {
  AssignTeacherToSubjectInput,
  ClassInput,
} from "../validations/input.validations";
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

export async function assignClassTeacherService(
  moderatorId: string,
  data: AssignTeacherToSubjectInput,
  context: AuditContext,
  statusCode: number,
): Promise<void> {
  try {
    log.info(
      `Starting service to assign class teacher to class with classId ${data.classId}`,
      {
        ipAddress: context.ipAddress,
        classId: data.classId,
        teacherId: data.teacherId,
      },
    );

    const classTeacherExists = await prisma.classTeacher.findUnique({
      where: {
        classId_teacherId: {
          classId: data.classId,
          teacherId: data.teacherId,
        },
      },
    });

    if (classTeacherExists) {
      log.warn(`Class Teacher is already assigned to class`, {
        classId: data.classId,
        teacherId: data.teacherId,
      });
      throw new Error("Class Teacher is already assigned to class");
    }

    const newClassTeacher = await prisma.classTeacher.create({
      data: {
        classId: data.classId,
        teacherId: data.teacherId,
        isPrimary: true,
      },
    });

    log.info(
      `Teacher with id ${data.teacherId} is assigned as class teacher with classId ${data.classId}`,
    );

    await createAuditLog({
      performedById: moderatorId,
      action: "CREATE",
      module: "Class",
      resourceId: newClassTeacher.id,
      resourceType: "Class Teacher",
      newValues: {
        newClassTeacher,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    await createSystemLog({
      level: "INFO",
      module: "ClassTeacherService",
      context,
      statusCode,
      message: "Class Teacher assigned successfully",
      metadata: {
        newClassTeacher,
      },
    });
  } catch (error) {
    const err = error as Error;
    log.error(
      `Failed to assign class teacher to class with classId ${data.classId}`,
      {
        ipAddress: context.ipAddress,
        classId: data.classId,
        teacherId: data.teacherId,
        error: err.message,
      },
    );
    throw err;
  }
}

export async function getAllClassesService(
  schoolId: string,
  academicYearId: string,
  context: AuditContext,
  statusCode: number,
): Promise<Class[]> {
  try {
    log.info(
      `Getting all classes for school with schoolId ${schoolId} for academicYear ${academicYearId}`,
    );

    const classes = await prisma.class.findMany({
      where: {
        schoolId,
        academicYearId,
      },
    });

    if (classes.length === 0) {
      log.warn(
        `No classes found for school ${schoolId} for academicYear ${academicYearId}`,
      );
      throw new Error(
        `No classes found for school ${schoolId} for academicYear ${academicYearId}`,
      );
    }

    await createSystemLog({
      level: "INFO",
      module: "Class",
      message: `Fetched all classes for school ${schoolId} for academicYear ${academicYearId}`,
      metadata: {
        schoolId,
        academicYearId,
        totalClass: classes.length,
      },
      context,
      statusCode,
    });

    return classes;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to get all classes`, {
      error: err.message,
      ipAddress: context.ipAddress,
      schoolId,
      academicYearId,
    });
    throw err;
  }
}

export async function getSingleClassService(
  schoolId: string,
  classId: string,
  context: AuditContext,
  statusCode: number,
): Promise<Class> {
  try {
    log.info(
      `Starting service to fetch class with id ${classId} for school with schoolId ${schoolId}`,
    );

    const classExists = await prisma.class.findUnique({
      where: {
        id: classId,
        schoolId,
      },
    });

    if (!classExists) {
      log.warn(`No class exists with classId ${classId}`);
      throw new Error(`No class exists with classId ${classId}`);
    }

    log.info(`Fetched class with classId ${classId}`);

    await createSystemLog({
      level: "INFO",
      module: "Class Module",
      message: "Class Fetched successfully",
      context,
      metadata: {
        schoolId,
        classId,
      },
      statusCode,
    });

    return classExists;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to fetch class with classId ${classId}`, {
      error: err.message,
      ipAddress: context.ipAddress,
      schoolId,
    });
    throw err;
  }
}
