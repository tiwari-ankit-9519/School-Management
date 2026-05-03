import { Prisma, Role } from "@prisma/client";
import { prisma } from "../config/database.config";
import { createModuleLogger } from "../config/logger.config";

const log = createModuleLogger("RegistrationNumberServiceModule");

export async function generateRegistrationNumber(
  schoolId: string,
  role: Role,
  tx?: Prisma.TransactionClient,
): Promise<string> {
  const client = tx ?? prisma;

  log.info("Generating registration number started", {
    schoolId,
    role,
  });

  const prefixMap: Partial<Record<Role, string>> = {
    ADMIN: "ADM",
    MODERATOR: "MOD",
    TEACHER: "TEA",
    STUDENT: "STU",
    PARENT: "PAR",
  };

  const prefix = prefixMap[role];

  if (!prefix) {
    log.warn("Unsupported role for registration number", {
      schoolId,
      role,
    });

    throw new Error(`Registration number not supported for role: ${role}`);
  }

  log.debug("Prefix resolved", {
    schoolId,
    role,
    prefix,
  });

  try {
    log.debug("Updating registration counter", {
      schoolId,
      role,
    });

    const counter = await client.registrationCounter.upsert({
      where: {
        schoolId_role: { schoolId, role },
      },
      update: {
        lastCount: { increment: 1 },
      },
      create: {
        schoolId,
        role,
        lastCount: 1,
      },
      select: { lastCount: true },
    });

    const registrationNumber = `${prefix}${String(counter.lastCount).padStart(4, "0")}`;

    log.info("Registration number generated successfully", {
      schoolId,
      role,
      registrationNumber,
      counter: counter.lastCount,
    });

    return registrationNumber;
  } catch (error: any) {
    log.error("Failed to generate registration number", {
      schoolId,
      role,
      error: error.message,
    });

    throw error;
  }
}
