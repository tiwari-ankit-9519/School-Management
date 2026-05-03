import { Module, Prisma } from "@prisma/client";

export const DEFAULT_TEACHER_PERMISSIONS: Omit<
  Prisma.UserPermissionCreateManyInput,
  "userId"
>[] = [
  { module: Module.TIMETABLE, canRead: true },
  { module: Module.SUBJECT, canRead: true },
  { module: Module.CLASS, canRead: true },
  {
    module: Module.STUDENT_ATTENDANCE,
    canRead: true,
    canCreate: true,
    canUpdate: true,
  },
  { module: Module.TEACHER_ATTENDANCE, canRead: true },
  { module: Module.EXAM_SCHEDULE, canRead: true },
  { module: Module.MARK, canRead: true, canCreate: true, canUpdate: true },
  { module: Module.ANNOUNCEMENT, canRead: true },
  { module: Module.LEAVE_REQUEST, canRead: true, canCreate: true },
  { module: Module.DOCUMENT, canRead: true, canCreate: true },
].map((p) => ({
  canCreate: false,
  canUpdate: false,
  canDelete: false,
  canApprove: false,
  canExport: false,
  ...p,
}));

export function mergePermissions(
  defaults: Omit<Prisma.UserPermissionCreateManyInput, "userId">[],
  overrides: Omit<Prisma.UserPermissionCreateManyInput, "userId">[],
): Omit<Prisma.UserPermissionCreateManyInput, "userId">[] {
  const map = new Map(defaults.map((p) => [p.module, { ...p }]));

  for (const override of overrides) {
    const existing = map.get(override.module);
    if (existing) {
      map.set(override.module, {
        ...existing,
        canCreate: override.canCreate || existing.canCreate,
        canRead: override.canRead || existing.canRead,
        canUpdate: override.canUpdate || existing.canUpdate,
        canDelete: override.canDelete || existing.canDelete,
        canApprove: override.canApprove || existing.canApprove,
        canExport: override.canExport || existing.canExport,
      });
    } else {
      map.set(override.module, override);
    }
  }

  return Array.from(map.values());
}

export const DEFAULT_ADMIN_PERMISSIONS: Omit<
  Prisma.UserPermissionCreateManyInput,
  "userId"
>[] = Object.values(Module).map((module) => ({
  module,
  canCreate: true,
  canRead: true,
  canUpdate: true,
  canDelete: true,
  canApprove: true,
  canExport: true,
}));
