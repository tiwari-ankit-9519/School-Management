// app/admin/moderators/[id]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  ShieldCheck,
  ShieldOff,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Save,
  X,
  Fingerprint,
  CalendarCheck,
  Check,
} from "lucide-react";
import {
  useGetSingleAdmin,
  useUpdateUserPermissions,
} from "@/hooks/useModerator";
import { useTranslations } from "@/hooks/useTranslations";
import { Module, UserPermission, AdminAttendance } from "@/types";

const formatDate = (dateStr: string | null) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const formatDateTime = (dateStr: string | null) =>
  dateStr
    ? new Date(dateStr).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const PERMISSION_FLAGS = [
  "canCreate",
  "canRead",
  "canUpdate",
  "canDelete",
  "canApprove",
  "canExport",
] as const;

type PermissionFlag = (typeof PERMISSION_FLAGS)[number];

type EditableModulePermission = {
  module: Module;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
};

const ATTENDANCE_STYLES: Record<string, string> = {
  PRESENT: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  ABSENT: "border-red-500/20 bg-red-500/10 text-red-400",
  HALF_DAY: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  LEAVE: "border-white/10 bg-white/5 text-white/40",
};

const AttendanceBadge = ({ status }: { status: string }) => {
  const style =
    ATTENDANCE_STYLES[status] ?? "border-white/10 bg-white/5 text-white/40";
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-manrope text-[11px] capitalize ${style}`}
    >
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
};

const InfoCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="rounded-xl border border-white/10 bg-white/4 px-4 py-3">
    <div className="flex items-center gap-1.5 text-white/30">
      <Icon className="h-3 w-3" />
      <span className="font-manrope text-[11px] font-medium uppercase tracking-widest">
        {label}
      </span>
    </div>
    <p className="mt-1.5 font-jakarta text-sm font-semibold text-white truncate">
      {value}
    </p>
  </div>
);

const SingleAdminInfoPage = () => {
  const t = useTranslations("adminDetail");
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const adminId = params.id;

  const { data: admin, isLoading } = useGetSingleAdmin(adminId);
  const { mutate: updatePermissions, isPending: isSaving } =
    useUpdateUserPermissions(adminId);

  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [draftPermissions, setDraftPermissions] = useState<
    EditableModulePermission[]
  >([]);
  const [moduleToAdd, setModuleToAdd] = useState<string>("");

  const startEditingPermissions = () => {
    if (!admin) return;
    setDraftPermissions(
      admin.user.userPermission.map((p: UserPermission) => ({
        module: p.module,
        canCreate: p.canCreate,
        canRead: p.canRead,
        canUpdate: p.canUpdate,
        canDelete: p.canDelete,
        canApprove: p.canApprove,
        canExport: p.canExport,
      })),
    );
    setModuleToAdd("");
    setIsEditingPermissions(true);
  };

  const cancelEditingPermissions = () => {
    setIsEditingPermissions(false);
    setDraftPermissions([]);
    setModuleToAdd("");
  };

  const toggleFlag = (module: Module, flag: PermissionFlag) => {
    setDraftPermissions((prev: EditableModulePermission[]) =>
      prev.map((p) => (p.module === module ? { ...p, [flag]: !p[flag] } : p)),
    );
  };

  const removeModule = (module: Module) => {
    setDraftPermissions((prev: EditableModulePermission[]) =>
      prev.filter((p) => p.module !== module),
    );
  };

  const addModule = () => {
    if (!moduleToAdd) return;
    setDraftPermissions((prev: EditableModulePermission[]) => [
      ...prev,
      {
        module: moduleToAdd as Module,
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
        canApprove: false,
        canExport: false,
      },
    ]);
    setModuleToAdd("");
  };

  const handleSave = () => {
    if (!admin) return;
    updatePermissions(
      { userId: admin.userId, permissions: draftPermissions },
      {
        onSuccess: () => {
          setIsEditingPermissions(false);
        },
      },
    );
  };

  const availableModulesToAdd = Object.values(Module).filter(
    (m) =>
      !draftPermissions.some((p: EditableModulePermission) => p.module === m),
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050810]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
          <span className="font-manrope text-sm text-white/30">
            {t("loading")}
          </span>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050810] text-white/40 font-manrope text-sm">
        {t("notFound")}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-3 pb-6 sm:px-8 pt-10 sm:pt-8 sm:pb-10">
      <div
        className="pointer-events-none fixed inset-0 select-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, #1e3a5f18 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, #6366f10a 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Back */}
        <button
          onClick={() => router.push("/admin/moderators")}
          className="mb-4 flex items-center gap-1.5 rounded-lg px-2 py-1 font-manrope text-xs text-white/40 transition-colors hover:text-white/70"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("back")}
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            {admin.photoUrl ? (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10">
                <Image
                  src={admin.photoUrl}
                  alt={`${admin.firstName} ${admin.lastName}`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
                <UserIcon className="h-6 w-6 text-indigo-400" />
              </div>
            )}
            <div>
              <h1 className="font-jakarta text-xl sm:text-2xl font-extrabold text-white">
                {admin.firstName} {admin.lastName}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-manrope text-[11px] text-white/40">
                  {admin.user.role}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-manrope text-[11px] ${
                    admin.user.isActive
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border-red-500/20 bg-red-500/10 text-red-400"
                  }`}
                >
                  {admin.user.isActive ? (
                    <ShieldCheck className="h-3 w-3" />
                  ) : (
                    <ShieldOff className="h-3 w-3" />
                  )}
                  {admin.user.isActive ? t("active") : t("inactive")}
                </span>
                {admin.user.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-manrope text-[11px] text-indigo-300">
                    <BadgeCheck className="h-3 w-3" />
                    {t("verified")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Info grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 sm:gap-3"
        >
          <InfoCard
            icon={Briefcase}
            label={t("designation")}
            value={admin.designation ?? "—"}
          />
          <InfoCard
            icon={Building2}
            label={t("department")}
            value={admin.department ?? "—"}
          />
          <InfoCard
            icon={Calendar}
            label={t("joiningDate")}
            value={formatDate(admin.joiningDate)}
          />
          <InfoCard
            icon={Fingerprint}
            label={t("regNumber")}
            value={admin.user.regNumber}
          />
          <InfoCard
            icon={Mail}
            label={t("email")}
            value={admin.user.email ?? "—"}
          />
          <InfoCard
            icon={Phone}
            label={t("phone")}
            value={admin.user.phone ?? "—"}
          />
          <InfoCard
            icon={Clock}
            label={t("lastLogin")}
            value={formatDateTime(admin.user.lastLoginAt)}
          />
          <InfoCard
            icon={CalendarCheck}
            label={t("createdOn")}
            value={formatDate(admin.createdAt)}
          />
        </motion.div>

        {/* Permissions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mb-6 relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />

          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <h2 className="font-jakarta text-sm font-bold text-white">
              {t("permissionsTitle")}
            </h2>
            {!isEditingPermissions ? (
              <button
                onClick={startEditingPermissions}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 font-manrope text-xs text-white/60 transition-colors hover:border-indigo-500/40 hover:text-indigo-300"
              >
                <Pencil className="h-3 w-3" />
                {t("editPermissions")}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelEditingPermissions}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 font-manrope text-xs text-white/40 transition-colors hover:text-white/70"
                >
                  <X className="h-3 w-3" />
                  {t("cancel")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 font-jakarta text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  {t("save")}
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-160">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="px-5 py-3 text-left font-manrope text-[11px] font-medium uppercase tracking-widest text-white/30">
                    {t("colModule")}
                  </th>
                  {PERMISSION_FLAGS.map((flag) => (
                    <th
                      key={flag}
                      className="px-2 py-3 text-center font-manrope text-[11px] font-medium uppercase tracking-widest text-white/30"
                    >
                      {t(`flag_${flag}`)}
                    </th>
                  ))}
                  {isEditingPermissions && <th className="w-10" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {(isEditingPermissions
                  ? draftPermissions
                  : admin.user.userPermission
                ).length === 0 ? (
                  <tr>
                    <td
                      colSpan={PERMISSION_FLAGS.length + 2}
                      className="px-5 py-8 text-center font-manrope text-xs text-white/20"
                    >
                      {t("noPermissions")}
                    </td>
                  </tr>
                ) : (
                  (isEditingPermissions
                    ? draftPermissions
                    : (admin.user.userPermission as EditableModulePermission[])
                  ).map((perm: EditableModulePermission) => (
                    <tr key={perm.module}>
                      <td className="px-5 py-3 font-manrope text-xs font-semibold text-white/70">
                        {t(`module_${perm.module}`)}
                      </td>
                      {PERMISSION_FLAGS.map((flag) => (
                        <td key={flag} className="px-2 py-3 text-center">
                          {isEditingPermissions ? (
                            <input
                              type="checkbox"
                              checked={perm[flag]}
                              onChange={() => toggleFlag(perm.module, flag)}
                              className="h-3.5 w-3.5 accent-indigo-500"
                            />
                          ) : perm[flag] ? (
                            <Check className="mx-auto h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <span className="text-white/15">—</span>
                          )}
                        </td>
                      ))}
                      {isEditingPermissions && (
                        <td className="px-2 py-3 text-center">
                          <button
                            onClick={() => removeModule(perm.module)}
                            className="text-white/20 transition-colors hover:text-red-400"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <AnimatePresence>
            {isEditingPermissions && availableModulesToAdd.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 border-t border-white/8 px-5 py-3.5"
              >
                <select
                  value={moduleToAdd}
                  onChange={(e) => setModuleToAdd(e.target.value)}
                  className="h-8 flex-1 max-w-xs appearance-none rounded-lg border border-white/10 bg-white/5 px-3 font-manrope text-xs text-white focus:border-indigo-500/50 focus:outline-none"
                >
                  <option value="" className="bg-[#070c18]">
                    {t("selectModule")}
                  </option>
                  {availableModulesToAdd.map((m) => (
                    <option key={m} value={m} className="bg-[#070c18]">
                      {t(`module_${m}`)}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addModule}
                  disabled={!moduleToAdd}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 font-manrope text-xs text-indigo-300 transition-colors hover:bg-indigo-500/20 disabled:opacity-40"
                >
                  <Plus className="h-3 w-3" />
                  {t("addModule")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Attendance */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.26 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
          <div className="border-b border-white/8 px-5 py-4">
            <h2 className="font-jakarta text-sm font-bold text-white">
              {t("attendanceTitle")}
            </h2>
          </div>

          {admin.adminAttendance.length === 0 ? (
            <div className="px-5 py-8 text-center font-manrope text-xs text-white/20">
              {t("noAttendance")}
            </div>
          ) : (
            <div className="divide-y divide-white/6">
              {admin.adminAttendance.map((record: AdminAttendance) => (
                <div
                  key={record.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-3.5 w-3.5 text-white/20" />
                    <span className="font-manrope text-xs text-white/60">
                      {formatDate(record.date)}
                    </span>
                    <AttendanceBadge status={record.status as string} />
                  </div>
                  {record.remarks && (
                    <span className="font-manrope text-[11px] text-white/30 italic">
                      {record.remarks}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SingleAdminInfoPage;
