import { Prisma, Role } from "@prisma/client";
import { AuditContext } from "../middlewares/request-logger.middleware";
import { createModuleLogger } from "../config/logger.config";
import { prisma } from "../config/database.config";
import { createAuditLog, createSystemLog } from "../utils/audit.util";
import {
  CACHE_KEYS,
  CACHE_TTL,
  getCache,
  setCache,
  deleteCache,
} from "../utils/cache.util";

const log = createModuleLogger("ProfileService");

export interface UpdateStudentProfileInput {
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  bloodGroup?: string;
  medicalConditions?: string;
  emergencyContact?: string;
}

export interface UpdateTeacherProfileInput {
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  qualification?: string;
  experience?: number;
  specialization?: string;
  photoUrl?: string;
}

export interface UpdateParentProfileInput {
  email?: string;
  phone?: string;
  alternatePhone?: string;
}

export interface UpdateAdminProfileInput {
  email?: string;
  phone?: string;
  designation?: string;
  department?: string;
  photoUrl?: string;
}

export interface UpdateSuperAdminProfileInput {
  email?: string;
  phone?: string;
  photoUrl?: string;
}

async function assertEmailNotTaken(
  email: string,
  currentUserId: string,
): Promise<void> {
  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: currentUserId } },
    select: { id: true },
  });
  if (existing) {
    throw new Error(`Email ${email} is already in use`);
  }
}

export async function updateStudentProfileService(
  userId: string,
  data: UpdateStudentProfileInput,
  context: AuditContext,
  statusCode: number,
) {
  try {
    log.info(`Updating student profile for user ${userId}`, {
      ipAddress: context.ipAddress,
      userId,
    });

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true },
    });

    if (!existing || !existing.student) {
      throw new Error(`Student not found`);
    }

    if (data.email && data.email !== existing.email) {
      await assertEmailNotTaken(data.email, userId);
    }

    const { email, phone, ...studentFields } = data;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          ...(email !== undefined && { email }),
          ...(phone !== undefined && { phone }),
        },
        select: { id: true, email: true, phone: true, role: true },
      });

      const updatedStudent = await tx.student.update({
        where: { userId },
        data: {
          ...(studentFields.address !== undefined && {
            address: studentFields.address,
          }),
          ...(studentFields.city !== undefined && { city: studentFields.city }),
          ...(studentFields.state !== undefined && {
            state: studentFields.state,
          }),
          ...(studentFields.pincode !== undefined && {
            pincode: studentFields.pincode,
          }),
          ...(studentFields.bloodGroup !== undefined && {
            bloodGroup: studentFields.bloodGroup,
          }),
          ...(studentFields.medicalConditions !== undefined && {
            medicalConditions: studentFields.medicalConditions,
          }),
          ...(studentFields.emergencyContact !== undefined && {
            emergencyContact: studentFields.emergencyContact,
          }),
        },
      });

      return { user: updatedUser, student: updatedStudent };
    });

    await deleteCache(CACHE_KEYS.userProfile(userId));

    await createSystemLog({
      level: "INFO",
      module: "ProfileService",
      message: "Student profile updated successfully",
      context,
      statusCode,
      metadata: { userId },
    });

    await createAuditLog({
      context,
      module: "ProfileService",
      statusCode,
      action: "UPDATE",
      performedById: userId,
      resourceId: existing.student.id,
      resourceType: "Student",
      oldValues: {
        email: existing.email,
        phone: existing.phone,
        student: existing.student,
      },
      newValues: updated,
      isSuccessful: true,
    });

    log.info(`Student profile updated for user ${userId}`);
    return updated;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to update student profile`, {
      error: err.message,
      ipAddress: context.ipAddress,
      userId,
    });
    throw err;
  }
}

export async function updateTeacherProfileService(
  userId: string,
  data: UpdateTeacherProfileInput,
  context: AuditContext,
  statusCode: number,
) {
  try {
    log.info(`Updating teacher profile for user ${userId}`, {
      ipAddress: context.ipAddress,
      userId,
    });

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true },
    });

    if (!existing || !existing.teacher) {
      throw new Error(`Teacher not found`);
    }

    if (data.email && data.email !== existing.email) {
      await assertEmailNotTaken(data.email, userId);
    }

    const { email, phone, ...teacherFields } = data;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          ...(email !== undefined && { email }),
          ...(phone !== undefined && { phone }),
        },
        select: { id: true, email: true, phone: true, role: true },
      });

      const updatedTeacher = await tx.teacher.update({
        where: { userId },
        data: {
          ...(teacherFields.address !== undefined && {
            address: teacherFields.address,
          }),
          ...(teacherFields.city !== undefined && { city: teacherFields.city }),
          ...(teacherFields.state !== undefined && {
            state: teacherFields.state,
          }),
          ...(teacherFields.pincode !== undefined && {
            pincode: teacherFields.pincode,
          }),
          ...(teacherFields.qualification !== undefined && {
            qualification: teacherFields.qualification,
          }),
          ...(teacherFields.experience !== undefined && {
            experience: teacherFields.experience,
          }),
          ...(teacherFields.specialization !== undefined && {
            specialization: teacherFields.specialization,
          }),
          ...(teacherFields.photoUrl !== undefined && {
            photoUrl: teacherFields.photoUrl,
          }),
        },
      });

      return { user: updatedUser, teacher: updatedTeacher };
    });

    await deleteCache(CACHE_KEYS.userProfile(userId));

    await createSystemLog({
      level: "INFO",
      module: "ProfileService",
      message: "Teacher profile updated successfully",
      context,
      statusCode,
      metadata: { userId },
    });

    await createAuditLog({
      context,
      module: "ProfileService",
      statusCode,
      action: "UPDATE",
      performedById: userId,
      resourceId: existing.teacher.id,
      resourceType: "Teacher",
      oldValues: {
        email: existing.email,
        phone: existing.phone,
        teacher: existing.teacher,
      },
      newValues: updated,
      isSuccessful: true,
    });

    log.info(`Teacher profile updated for user ${userId}`);
    return updated;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to update teacher profile`, {
      error: err.message,
      ipAddress: context.ipAddress,
      userId,
    });
    throw err;
  }
}

export async function updateParentProfileService(
  userId: string,
  data: UpdateParentProfileInput,
  context: AuditContext,
  statusCode: number,
) {
  try {
    log.info(`Updating parent profile for user ${userId}`, {
      ipAddress: context.ipAddress,
      userId,
    });

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      include: { parent: true },
    });

    if (!existing || !existing.parent) {
      throw new Error(`Parent not found`);
    }

    if (data.email && data.email !== existing.email) {
      await assertEmailNotTaken(data.email, userId);
    }

    const { email, phone, alternatePhone } = data;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          ...(email !== undefined && { email }),
          ...(phone !== undefined && { phone }),
        },
        select: { id: true, email: true, phone: true, role: true },
      });

      const updatedParent = await tx.parent.update({
        where: { userId },
        data: {
          ...(alternatePhone !== undefined && { alternatePhone }),
        },
      });

      return { user: updatedUser, parent: updatedParent };
    });

    await deleteCache(CACHE_KEYS.userProfile(userId));

    await createSystemLog({
      level: "INFO",
      module: "ProfileService",
      message: "Parent profile updated successfully",
      context,
      statusCode,
      metadata: { userId },
    });

    await createAuditLog({
      context,
      module: "ProfileService",
      statusCode,
      action: "UPDATE",
      performedById: userId,
      resourceId: existing.parent.id,
      resourceType: "Parent",
      oldValues: {
        email: existing.email,
        phone: existing.phone,
        parent: existing.parent,
      },
      newValues: updated,
      isSuccessful: true,
    });

    log.info(`Parent profile updated for user ${userId}`);
    return updated;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to update parent profile`, {
      error: err.message,
      ipAddress: context.ipAddress,
      userId,
    });
    throw err;
  }
}

export async function updateAdminProfileService(
  userId: string,
  data: UpdateAdminProfileInput,
  context: AuditContext,
  statusCode: number,
) {
  try {
    log.info(`Updating admin profile for user ${userId}`, {
      ipAddress: context.ipAddress,
      userId,
    });

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      include: { admin: true },
    });

    if (!existing || !existing.admin) {
      throw new Error(`Admin not found`);
    }

    if (existing.role !== Role.ADMIN && existing.role !== Role.MODERATOR) {
      throw new Error(`User is not an admin or moderator`);
    }

    if (data.email && data.email !== existing.email) {
      await assertEmailNotTaken(data.email, userId);
    }

    const { email, phone, ...adminFields } = data;

    const updated = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          ...(email !== undefined && { email }),
          ...(phone !== undefined && { phone }),
        },
        select: { id: true, email: true, phone: true, role: true },
      });

      const updatedAdmin = await tx.admin.update({
        where: { userId },
        data: {
          ...(adminFields.designation !== undefined && {
            designation: adminFields.designation,
          }),
          ...(adminFields.department !== undefined && {
            department: adminFields.department,
          }),
          ...(adminFields.photoUrl !== undefined && {
            photoUrl: adminFields.photoUrl,
          }),
        },
      });

      return { user: updatedUser, admin: updatedAdmin };
    });

    await deleteCache(CACHE_KEYS.userProfile(userId));

    await createSystemLog({
      level: "INFO",
      module: "ProfileService",
      message: "Admin profile updated successfully",
      context,
      statusCode,
      metadata: { userId },
    });

    await createAuditLog({
      context,
      module: "ProfileService",
      statusCode,
      action: "UPDATE",
      performedById: userId,
      resourceId: existing.admin.id,
      resourceType: "Admin",
      oldValues: {
        email: existing.email,
        phone: existing.phone,
        admin: existing.admin,
      },
      newValues: updated,
      isSuccessful: true,
    });

    log.info(`Admin profile updated for user ${userId}`);
    return updated;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to update admin profile`, {
      error: err.message,
      ipAddress: context.ipAddress,
      userId,
    });
    throw err;
  }
}

export async function getMyProfileService(
  userId: string,
  role: Role,
  context: AuditContext,
  statusCode: number,
) {
  try {
    log.info(`Fetching profile for user ${userId}`, {
      ipAddress: context.ipAddress,
      userId,
      role,
    });

    const cacheKey = CACHE_KEYS.userProfile(userId);
    const cached = await getCache(cacheKey);
    if (cached) {
      log.info(`Returning profile from cache`, { cacheKey });
      return cached;
    }

    const includeMap: Record<Role, Prisma.UserInclude> = {
      STUDENT: { student: true },
      TEACHER: { teacher: true },
      PARENT: { parent: true },
      ADMIN: { admin: true },
      MODERATOR: { admin: true },
    };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        regNumber: true,
        role: true,
        email: true,
        phone: true,
        isActive: true,
        isVerified: true,
        lastLoginAt: true,
        createdAt: true,
        student: role === Role.STUDENT,
        teacher: role === Role.TEACHER,
        parent: role === Role.PARENT,
        admin: role === Role.ADMIN || role === Role.MODERATOR,
      },
    });

    if (!user) {
      throw new Error(`User not found`);
    }

    await setCache(cacheKey, user, CACHE_TTL.USER_PROFILE);

    await createSystemLog({
      level: "INFO",
      module: "ProfileService",
      message: "Fetched user profile",
      context,
      statusCode,
      metadata: { userId, role },
    });

    return user;
  } catch (error) {
    const err = error as Error;
    log.error(`Failed to fetch profile`, {
      error: err.message,
      ipAddress: context.ipAddress,
      userId,
    });
    throw err;
  }
}
