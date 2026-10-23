import { Module, Role } from "@prisma/client";
import { prisma } from "../config/database.config";
import { createModuleLogger } from "../config/logger.config";

const log = createModuleLogger("MyPermissionsService");

export interface PermissionFlags {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
}

export interface MyPermissions {
  role: Role;
  isAdmin: boolean;
  permissions: Record<Module, PermissionFlags>;
}

const ALL_FLAGS: PermissionFlags = {
  canCreate: true,
  canRead: true,
  canUpdate: true,
  canDelete: true,
  canApprove: true,
  canExport: true,
};

const NO_FLAGS: PermissionFlags = {
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canDelete: false,
  canApprove: false,
  canExport: false,
};

const buildMap = (flags: PermissionFlags): Record<Module, PermissionFlags> =>
  Object.fromEntries(
    Object.values(Module).map((module) => [module, { ...flags }]),
  ) as Record<Module, PermissionFlags>;

export async function getMyPermissionsService(
  userId: string,
  role: Role,
): Promise<MyPermissions> {
  if (role === Role.ADMIN) {
    return { role, isAdmin: true, permissions: buildMap(ALL_FLAGS) };
  }

  const permissions = buildMap(NO_FLAGS);

  if (role === Role.MODERATOR) {
    const rows = await prisma.userPermission.findMany({
      where: { userId },
      select: {
        module: true,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        canApprove: true,
        canExport: true,
      },
    });

    rows.forEach(({ module, ...flags }) => {
      permissions[module] = flags;
    });

    log.info("Resolved moderator permissions", {
      userId,
      modules: rows.length,
    });
  }

  return { role, isAdmin: false, permissions };
}
