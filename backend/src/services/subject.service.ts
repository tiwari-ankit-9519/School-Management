import { Subject } from "@prisma/client";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { SubjectInput } from "../validations/input.validations";
import { createModuleLogger } from "../config/logger.config";
import { prisma } from "../config/database.config";
import { createAuditLog, createSystemLog } from "../utils/audit.util";

const log = createModuleLogger("SubjectSerivce");

export async function createSubjectService(
  adminId: string,
  schoolId: string,
  data: SubjectInput,
  context: AuditContext,
  statusCode: number,
): Promise<Subject> {
  try {
    log.info("Starting subject creation service", {
      schoolId,
      adminId,
      subjectName: data.name,
      subjectCode: data.code,
      ipAddress: context.ipAddress,
    });

    const subjectExists = await prisma.subject.findUnique({
      where: {
        schoolId_code: {
          schoolId,
          code: data.code,
        },
      },
    });

    if (subjectExists) {
      log.warn("Subject with same code already exists", {
        subjectCode: data.code,
      });
      throw new Error("Subject with same code already exists");
    }

    const newSubject = await prisma.subject.create({
      data: {
        schoolId,
        name: data.name,
        code: data.code,
      },
    });

    await createSystemLog({
      level: "INFO",
      module: "SubjectService",
      context,
      statusCode,
      message: "Subject created successfully",
      metadata: {
        schoolId,
        adminId,
        subjectName: data.name,
        subjectCode: data.code,
        ipAddress: context.ipAddress,
      },
    });

    await createAuditLog({
      schoolId,
      performedById: adminId,
      action: "CREATE",
      module: "Subject",
      resourceId: newSubject.id,
      resourceType: "SubjectCreation",
      newValues: {
        subjectId: newSubject.id,
        subjectName: newSubject.name,
        subjectCode: newSubject.code,
      },
      context,
      isSuccessful: true,
      statusCode,
    });

    log.info("Subject created successfully", {
      newSubject,
    });

    return newSubject;
  } catch (error) {
    const err = error as Error;
    log.error("Failed to create subject", {
      error: err.message,
      ipAddress: context.ipAddress,
      schoolId,
    });
    throw err;
  }
}
