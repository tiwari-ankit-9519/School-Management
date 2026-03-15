import "dotenv/config";
import { prisma } from "@/src/config/database.config";
import { createModuleLogger, logAudit, logSecurityEvent } from "@/src/config/logger.config";
import { hashPassword } from "@/src/utils/password";

const log = createModuleLogger("SuperAdminSeeder");

const SUPER_ADMIN_DATA = {
  email: "tiwari.ankit3105@gmail.com",
  password: "Admin@123456",
  firstName: "Ankit",
  lastName: "Tiwari",
  gender: "MALE" as const,
};

async function createSuperAdmin(): Promise<void> {
  log.info("Starting Super Admin seeder...");

  try {
    await prisma.$connect();
    log.info("Database connected");

    const existing = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      select: { id: true, regNumber: true, email: true },
    });

    if (existing) {
      log.warn("Super Admin already exists, skipping creation", {
        id: existing.id,
        regNumber: existing.regNumber,
        email: existing.email,
      });

      logAudit("READ", "system-seeder", existing.id, {
        action: "SUPER_ADMIN_SEED_SKIPPED",
        reason: "Super Admin already exists",
        existingRegNumber: existing.regNumber,
        existingEmail: existing.email,
      });

      return;
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN_DATA.email },
      select: { id: true, role: true },
    });

    if (existingEmail) {
      log.error("Email already in use by another user", {
        email: SUPER_ADMIN_DATA.email,
        existingRole: existingEmail.role,
        existingId: existingEmail.id,
      });

      logSecurityEvent("SEED_EMAIL_CONFLICT", "system", null, {
        email: SUPER_ADMIN_DATA.email,
        conflictingUserId: existingEmail.id,
        conflictingRole: existingEmail.role,
      });

      throw new Error(`Email ${SUPER_ADMIN_DATA.email} is already in use`);
    }

    log.info("Hashing password...");
    const passwordHash = await hashPassword(SUPER_ADMIN_DATA.password);
    log.info("Password hashed successfully");

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          schoolId: null,
          regNumber: "SADM001",
          role: "SUPER_ADMIN",
          email: SUPER_ADMIN_DATA.email,
          passwordHash,
          isActive: true,
          isVerified: true,
        },
      });

      log.info("User record created", {
        userId: user.id,
        regNumber: user.regNumber,
        role: user.role,
      });

      const superAdmin = await tx.superAdmin.create({
        data: {
          userId: user.id,
          firstName: SUPER_ADMIN_DATA.firstName,
          lastName: SUPER_ADMIN_DATA.lastName,
          gender: SUPER_ADMIN_DATA.gender,
        },
      });

      log.info("SuperAdmin profile created", {
        superAdminId: superAdmin.id,
        userId: user.id,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
      });

      return { user, superAdmin };
    });

    logAudit("CREATE", "system-seeder", result.user.id, {
      action: "SUPER_ADMIN_CREATED",
      userId: result.user.id,
      regNumber: result.user.regNumber,
      email: result.user.email,
      firstName: result.superAdmin.firstName,
      lastName: result.superAdmin.lastName,
      role: result.user.role,
      isActive: result.user.isActive,
      isVerified: result.user.isVerified,
    });

    log.info("Super Admin created successfully", {
      userId: result.user.id,
      regNumber: result.user.regNumber,
      email: result.user.email,
      firstName: result.superAdmin.firstName,
      lastName: result.superAdmin.lastName,
      role: result.user.role,
      isActive: result.user.isActive,
      isVerified: result.user.isVerified,
      createdAt: result.user.createdAt,
    });
  } catch (error) {
    const err = error as Error;

    logAudit("CREATE", "system-seeder", null, {
      action: "SUPER_ADMIN_SEED_FAILED",
      error: err.message,
    });

    log.error("Failed to create Super Admin", {
      error: err.message,
      stack: process.env.ENABLE_STACK_TRACE === "true" ? err.stack : undefined,
    });

    throw error;
  } finally {
    await prisma.$disconnect();
    log.info("Database disconnected");
  }
}

createSuperAdmin()
  .then(() => {
    log.info("Super Admin seeder completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    const err = error as Error;
    log.error("Super Admin seeder failed", { error: err.message });
    process.exit(1);
  });