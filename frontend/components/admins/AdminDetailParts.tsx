"use client";
import { useMemo, useState } from "react";
import {
  CalendarCheck,
  Check,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CARD_CLASS,
  TONE_CLASSES,
} from "@/components/dashboard/DashboardWidgets";
import {
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import { formatEnum } from "@/components/admissions/AdmissionDetailParts";
import { useUpdateUserPermissions } from "@/hooks/useModerator";
import { useTranslations } from "@/hooks/useTranslations";
import {
  AdminAttendance,
  AttendanceStatus,
  Module,
  UserPermission,
} from "@/types";

export const PERMISSION_FLAGS = [
  "canCreate",
  "canRead",
  "canUpdate",
  "canDelete",
  "canApprove",
  "canExport",
] as const;
type PermissionFlag = (typeof PERMISSION_FLAGS)[number];

export interface EditablePermission {
  module: Module;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
}

const SLATE_TONE =
  "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300";

const ATTENDANCE_CONFIG: Record<string, { tone: string; dot: string }> = {
  [AttendanceStatus.PRESENT]: {
    tone: TONE_CLASSES.emerald,
    dot: "bg-emerald-500",
  },
  [AttendanceStatus.LATE]: { tone: TONE_CLASSES.amber, dot: "bg-amber-500" },
  [AttendanceStatus.ABSENT]: { tone: TONE_CLASSES.red, dot: "bg-red-500" },
  [AttendanceStatus.EXCUSED]: {
    tone: TONE_CLASSES.violet,
    dot: "bg-violet-500",
  },
  [AttendanceStatus.HOLIDAY]: { tone: SLATE_TONE, dot: "bg-slate-400" },
};

const toEditable = (permission: UserPermission): EditablePermission => ({
  module: permission.module,
  canCreate: permission.canCreate,
  canRead: permission.canRead,
  canUpdate: permission.canUpdate,
  canDelete: permission.canDelete,
  canApprove: permission.canApprove,
  canExport: permission.canExport,
});

export const getAccessLevel = (permission: EditablePermission) => {
  const granted = PERMISSION_FLAGS.filter((flag) => permission[flag]).length;
  if (granted === PERMISSION_FLAGS.length) return "full" as const;
  if (granted === 1 && permission.canRead) return "read" as const;
  if (granted === 0) return "none" as const;
  return "partial" as const;
};

const ACCESS_TONES = {
  full: TONE_CLASSES.emerald,
  partial: TONE_CLASSES.indigo,
  read: SLATE_TONE,
  none: TONE_CLASSES.red,
} as const;

const ACCESS_LABEL_KEYS = {
  full: "accessFull",
  partial: "accessPartial",
  read: "accessRead",
  none: "accessNone",
} as const;

interface PermissionsCardProps {
  adminId: string;
  userId: string;
  permissions: UserPermission[];
}

export const PermissionsCard = ({
  adminId,
  userId,
  permissions,
}: PermissionsCardProps) => {
  const t = useTranslations("adminDetail");
  const { mutate: updatePermissions, isPending } =
    useUpdateUserPermissions(adminId);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<EditablePermission[]>([]);
  const [moduleToAdd, setModuleToAdd] = useState("");
  const [search, setSearch] = useState("");

  const saved = useMemo(() => permissions.map(toEditable), [permissions]);
  const rows = isEditing ? draft : saved;
  const isDirty = isEditing && JSON.stringify(draft) !== JSON.stringify(saved);

  const moduleLabel = (module: Module) =>
    t(`module_${module}` as Parameters<typeof t>[0]);
  const flagLabel = (flag: PermissionFlag) =>
    t(`flag_${flag}` as Parameters<typeof t>[0]);

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      t(`module_${row.module}` as Parameters<typeof t>[0])
        .toLowerCase()
        .includes(query),
    );
  }, [rows, search, t]);

  const availableModules = Object.values(Module).filter(
    (m) => !draft.some((p) => p.module === m),
  );

  const startEditing = () => {
    setDraft(saved);
    setModuleToAdd("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraft([]);
    setModuleToAdd("");
  };

  const setFlag = (module: Module, flag: PermissionFlag, value: boolean) =>
    setDraft((prev) =>
      prev.map((p) => (p.module === module ? { ...p, [flag]: value } : p)),
    );

  const setRow = (module: Module, value: boolean) =>
    setDraft((prev) =>
      prev.map((p) =>
        p.module === module
          ? {
              ...p,
              canCreate: value,
              canRead: value,
              canUpdate: value,
              canDelete: value,
              canApprove: value,
              canExport: value,
            }
          : p,
      ),
    );

  const removeModule = (module: Module) =>
    setDraft((prev) => prev.filter((p) => p.module !== module));

  const addModule = () => {
    const selectedModule = Object.values(Module).find((m) => m === moduleToAdd);
    if (!selectedModule) return;
    setDraft((prev) => [
      ...prev,
      {
        module: selectedModule,
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

  const handleSave = () =>
    updatePermissions(
      { userId, permissions: draft },
      { onSuccess: () => setIsEditing(false) },
    );

  const headClass =
    "h-11 px-2 text-center font-manrope text-[10px] font-medium tracking-wider text-muted-foreground uppercase";

  return (
    <Card className={`${CARD_CLASS} overflow-hidden`}>
      <div className="flex flex-col gap-3 px-4 pt-4 pb-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${TONE_CLASSES.indigo}`}
          >
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-jakarta text-base font-semibold text-foreground">
                {t("permissionsTitle")}
              </h3>
              {isDirty && (
                <Badge
                  variant="outline"
                  className={`rounded-full font-manrope text-[10px] ${TONE_CLASSES.amber}`}
                >
                  {t("unsavedChanges")}
                </Badge>
              )}
            </div>
            <p className="font-manrope text-xs text-muted-foreground">
              {rows.length} {t("modulesGranted")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-52">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchModules")}
              aria-label={t("searchModules")}
              className={`${fieldClass(false)} h-9 rounded-full pl-8 text-xs`}
            />
          </div>
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={cancelEditing}
                className={`h-9 shrink-0 gap-1.5 px-3 text-xs ${OUTLINE_PILL_CLASS}`}
              >
                <X className="size-3.5" />
                {t("cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || isPending}
                className={`h-9 shrink-0 gap-1.5 px-4 text-xs ${PRIMARY_PILL_CLASS}`}
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                {t("save")}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={startEditing}
              className={`h-9 shrink-0 gap-1.5 px-3 text-xs ${OUTLINE_PILL_CLASS}`}
            >
              <Pencil className="size-3.5" />
              {t("editPermissions")}
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <div className="overflow-x-auto">
        <Table className="min-w-160">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="h-11 px-5 font-manrope text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                {t("colModule")}
              </TableHead>
              {isEditing && (
                <TableHead className={headClass}>{t("rowAll")}</TableHead>
              )}
              {PERMISSION_FLAGS.map((flag) => (
                <TableHead key={flag} className={headClass}>
                  <span className="block">{flagLabel(flag)}</span>
                  <span className="block font-normal text-muted-foreground/70 normal-case">
                    {rows.filter((r) => r[flag]).length}/{rows.length}
                  </span>
                </TableHead>
              ))}
              <TableHead className={headClass}>
                {isEditing ? "" : t("colAccess")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={PERMISSION_FLAGS.length + 3}
                  className="py-10 text-center font-manrope text-xs text-muted-foreground"
                >
                  {rows.length === 0
                    ? t("noPermissions")
                    : t("noModuleMatches")}
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => {
                const granted = PERMISSION_FLAGS.filter(
                  (flag) => row[flag],
                ).length;
                const rowState =
                  granted === PERMISSION_FLAGS.length
                    ? true
                    : granted === 0
                      ? false
                      : "indeterminate";
                const level = getAccessLevel(row);
                return (
                  <TableRow
                    key={row.module}
                    className="border-border hover:bg-muted/50"
                  >
                    <TableCell className="px-5 py-2.5 font-manrope text-sm font-medium text-foreground">
                      {moduleLabel(row.module)}
                    </TableCell>
                    {isEditing && (
                      <TableCell className="px-2 py-2.5 text-center">
                        <Checkbox
                          checked={rowState}
                          onCheckedChange={(value) =>
                            setRow(row.module, value === true)
                          }
                          aria-label={`${t("rowAll")}: ${moduleLabel(row.module)}`}
                          className="data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600 data-[state=indeterminate]:border-indigo-600 data-[state=indeterminate]:bg-indigo-600 data-[state=indeterminate]:text-white"
                        />
                      </TableCell>
                    )}
                    {PERMISSION_FLAGS.map((flag) => (
                      <TableCell key={flag} className="px-2 py-2.5 text-center">
                        {isEditing ? (
                          <Checkbox
                            checked={row[flag]}
                            onCheckedChange={(value) =>
                              setFlag(row.module, flag, value === true)
                            }
                            aria-label={`${flagLabel(flag)}: ${moduleLabel(row.module)}`}
                            className="data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600"
                          />
                        ) : row[flag] ? (
                          <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Check className="size-3.5" />
                          </span>
                        ) : (
                          <Minus className="mx-auto size-3.5 text-muted-foreground/40" />
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="px-2 py-2.5 text-center">
                      {isEditing ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeModule(row.module)}
                          aria-label={`${t("removeModule")}: ${moduleLabel(row.module)}`}
                          className="h-7 w-7 rounded-full text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        >
                          <X className="size-3.5" />
                        </Button>
                      ) : (
                        <Badge
                          variant="outline"
                          className={`rounded-full font-manrope text-[10px] font-medium ${ACCESS_TONES[level]}`}
                        >
                          {t(ACCESS_LABEL_KEYS[level])}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {isEditing && availableModules.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
            <Select value={moduleToAdd} onValueChange={setModuleToAdd}>
              <SelectTrigger
                className={`${fieldClass(false)} w-full data-[size=default]:h-9 sm:max-w-xs dark:hover:bg-card`}
              >
                <SelectValue placeholder={t("selectModule")} />
              </SelectTrigger>
              <SelectContent className="max-h-72 rounded-xl">
                {availableModules.map((module) => (
                  <SelectItem
                    key={module}
                    value={module}
                    className="font-manrope text-sm"
                  >
                    {moduleLabel(module)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={addModule}
              disabled={!moduleToAdd}
              className={`h-9 gap-1.5 px-4 text-xs ${OUTLINE_PILL_CLASS} border-indigo-500/30 text-indigo-700 dark:border-indigo-500/30 dark:text-indigo-300`}
            >
              <Plus className="size-3.5" />
              {t("addModule")}
            </Button>
            <p className="font-manrope text-[11px] text-muted-foreground sm:ml-auto">
              {t("addModuleHint")}
            </p>
          </div>
        </>
      )}
    </Card>
  );
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const getAttendanceRate = (records: AdminAttendance[]) => {
  const working = records.filter(
    (r) => r.status !== AttendanceStatus.HOLIDAY,
  ).length;
  const present = records.filter(
    (r) =>
      r.status === AttendanceStatus.PRESENT ||
      r.status === AttendanceStatus.LATE,
  ).length;
  return working > 0 ? Math.round((present / working) * 100) : null;
};

export const AdminAttendanceCard = ({
  records,
}: {
  records: AdminAttendance[];
}) => {
  const t = useTranslations("adminDetail");
  const rate = getAttendanceRate(records);
  const recent = [...records]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <Card className={`${CARD_CLASS} p-5`}>
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${TONE_CLASSES.emerald}`}
        >
          <CalendarCheck className="size-4" />
        </span>
        <div>
          <h3 className="font-jakarta text-base font-semibold text-foreground">
            {t("attendanceTitle")}
          </h3>
          <p className="font-manrope text-xs text-muted-foreground">
            {records.length} {t("daysRecorded")}
          </p>
        </div>
      </div>

      {records.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center font-manrope text-sm text-muted-foreground">
          {t("noAttendance")}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr] md:items-center">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="font-manrope text-[11px] tracking-wider text-muted-foreground uppercase">
                {t("attendanceRate")}
              </p>
              <p className="mt-1.5 font-jakarta text-3xl font-bold text-foreground">
                {rate !== null ? `${rate}%` : "—"}
              </p>
              <Progress
                value={rate ?? 0}
                className="mt-2 h-1.5 bg-muted *:bg-emerald-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.values(AttendanceStatus).map((status) => (
                <Badge
                  key={status}
                  variant="outline"
                  className={`gap-1.5 rounded-full px-3 py-1 font-manrope text-xs font-medium ${ATTENDANCE_CONFIG[status].tone}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${ATTENDANCE_CONFIG[status].dot}`}
                  />
                  {formatEnum(status)}
                  <span className="font-semibold">
                    {records.filter((r) => r.status === status).length}
                  </span>
                </Badge>
              ))}
            </div>
          </div>
          <div className="divide-y divide-border rounded-xl border border-border">
            {recent.map((record) => (
              <div
                key={record.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5"
              >
                <div>
                  <p className="font-jakarta text-sm font-medium text-foreground">
                    {formatDate(record.date)}
                  </p>
                  {record.remarks && (
                    <p className="font-manrope text-[11px] text-muted-foreground italic">
                      {record.remarks}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`rounded-full font-manrope text-[11px] font-medium ${ATTENDANCE_CONFIG[record.status]?.tone ?? SLATE_TONE}`}
                >
                  {formatEnum(record.status)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export const AdminDetailSkeleton = () => (
  <div className="space-y-5">
    <Skeleton className="h-8 w-36 rounded-full" />
    <Skeleton className="h-52 rounded-2xl" />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-60 rounded-2xl" />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    </div>
  </div>
);
