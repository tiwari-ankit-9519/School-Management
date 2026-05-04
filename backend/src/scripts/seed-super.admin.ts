import "dotenv/config";
import { prisma } from "@/src/config/database.config";
import {
  createModuleLogger,
  logAudit,
  logSecurityEvent,
} from "@/src/config/logger.config";
import { hashPassword } from "@/src/utils/password";
import { Module } from "@prisma/client";
import { generateRegistrationNumber } from "../utils/registration.util";

const log = createModuleLogger("Seeder");

const SCHOOL_CONFIG_DATA = {
  name: "Your School Name",
  code: "SCH001",
  address: "123 School Street",
  city: "City",
  state: "State",
  country: "Country",
  pincode: "000000",
  phone: "+000000000000",
  email: "school@example.com",
  website: "https://example.com",
  establishedYear: 2000,
  affiliationNumber: "AFF001",
  boardType: "CBSE",
  isActive: true,
};

const ADMIN_DATA = {
  email: "tiwari.ankit3105@gmail.com",
  password: "Admin@123456",
  firstName: "Ankit",
  lastName: "Tiwari",
  gender: "MALE" as const,
  designation: "Principal",
  department: "Administration",
};

const ALL_MODULES: Module[] = [
  "ACADEMIC_YEAR",
  "CLASS",
  "SUBJECT",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "PARENT",
  "ADMISSION_APPLICATION",
  "TEACHER_APPLICATION",
  "TEACHER_SUBJECT",
  "CLASS_TEACHER",
  "ENROLLMENT",
  "TIMETABLE",
  "HOLIDAY",
  "STUDENT_ATTENDANCE",
  "TEACHER_ATTENDANCE",
  "EXAM_SCHEDULE",
  "MARK",
  "FEE_STRUCTURE",
  "FEE_PAYMENT",
  "LEAVE_REQUEST",
  "ANNOUNCEMENT",
  "NOTIFICATION",
  "DOCUMENT",
  "AUDIT_LOG",
  "SYSTEM_LOG",
  "IP_BLACKLIST",
  "RATE_LIMIT",
];

async function seedSchoolConfig(): Promise<void> {
  log.info("Seeding school config...");

  const existing = await prisma.schoolConfig.findFirst();
  if (existing) {
    log.warn("School config already exists, skipping", {
      id: existing.id,
      name: existing.name,
    });
    return;
  }

  const schoolConfig = await prisma.schoolConfig.create({
    data: SCHOOL_CONFIG_DATA,
  });

  logAudit("CREATE", "system-seeder", schoolConfig.id, {
    action: "SCHOOL_CONFIG_CREATED",
    name: schoolConfig.name,
    code: schoolConfig.code,
  });

  log.info("School config seeded successfully", {
    id: schoolConfig.id,
    name: schoolConfig.name,
  });
}

async function seedAdmin(): Promise<void> {
  log.info("Seeding admin user...");

  const existing = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, regNumber: true, email: true },
  });

  if (existing) {
    log.warn("Admin already exists, skipping", {
      id: existing.id,
      regNumber: existing.regNumber,
      email: existing.email,
    });
    return;
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: ADMIN_DATA.email },
    select: { id: true, role: true },
  });

  if (existingEmail) {
    log.error("Admin email already in use", {
      email: ADMIN_DATA.email,
      existingRole: existingEmail.role,
    });
    logSecurityEvent("SEED_EMAIL_CONFLICT", "system", null, {
      email: ADMIN_DATA.email,
      conflictingUserId: existingEmail.id,
      conflictingRole: existingEmail.role,
    });
    throw new Error(`Email ${ADMIN_DATA.email} is already in use`);
  }

  const passwordHash = await hashPassword(ADMIN_DATA.password);

  const result = await prisma.$transaction(async (tx) => {
    const regNumber = await generateRegistrationNumber("ADMIN", tx);

    const user = await tx.user.create({
      data: {
        regNumber,
        role: "ADMIN",
        email: ADMIN_DATA.email,
        passwordHash,
        isActive: true,
        isVerified: true,
      },
    });

    const admin = await tx.admin.create({
      data: {
        userId: user.id,
        firstName: ADMIN_DATA.firstName,
        lastName: ADMIN_DATA.lastName,
        gender: ADMIN_DATA.gender,
        designation: ADMIN_DATA.designation,
        department: ADMIN_DATA.department,
      },
    });

    await tx.userPermission.createMany({
      data: ALL_MODULES.map((module) => ({
        userId: user.id,
        module,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        canApprove: true,
        canExport: true,
      })),
    });

    return { user, admin };
  });

  logAudit("CREATE", "system-seeder", result.user.id, {
    action: "ADMIN_CREATED",
    userId: result.user.id,
    regNumber: result.user.regNumber,
    email: result.user.email,
    firstName: result.admin.firstName,
    lastName: result.admin.lastName,
    permissionsGranted: "ALL_MODULES_FULL_ACCESS",
  });

  log.info("Admin seeded successfully", {
    userId: result.user.id,
    regNumber: result.user.regNumber,
    email: result.user.email,
  });
}

async function main(): Promise<void> {
  log.info("Starting seeders...");
  try {
    await prisma.$connect();
    log.info("Database connected");

    await seedSchoolConfig();
    await seedAdmin();

    log.info("All seeders completed successfully");
  } catch (error) {
    const err = error as Error;
    logAudit("CREATE", "system-seeder", null, {
      action: "SEED_FAILED",
      error: err.message,
    });
    log.error("Seeder failed", {
      error: err.message,
      stack: process.env.ENABLE_STACK_TRACE === "true" ? err.stack : undefined,
    });
    throw error;
  } finally {
    await prisma.$disconnect();
    log.info("Database disconnected");
  }
}

main()
  .then(() => {
    log.info("Seeder process completed");
    process.exit(0);
  })
  .catch((error) => {
    const err = error as Error;
    log.error("Seeder process failed", { error: err.message });
    process.exit(1);
  });
