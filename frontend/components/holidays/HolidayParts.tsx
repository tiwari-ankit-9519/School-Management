"use client";
import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  CalendarHeart,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TONE_CLASSES } from "@/components/dashboard/DashboardWidgets";
import {
  FieldError,
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import { DatePickerField } from "@/components/forms/DatePickerField";
import {
  getHolidayAttendanceConflict,
  useCreateHoliday,
  useDeleteHoliday,
  useUpdateHoliday,
} from "@/hooks/useHoliday";
import { useTranslations } from "@/hooks/useTranslations";
import {
  CreateHolidayPayload,
  Holiday,
  HolidayAttendanceConflict,
  UpdateHolidayPayload,
} from "@/types";

type Translate = ReturnType<typeof useTranslations<"holidays">>;

const DAY_MS = 86_400_000;
const SLATE_TONE =
  "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300";
const SKY_TONE =
  "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";

export const holidayYmd = (holiday: Pick<Holiday, "date">) =>
  holiday.date.slice(0, 10);

const utcDate = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);

export const daysBetween = (fromYmd: string, toYmd: string) =>
  Math.round((utcDate(toYmd).getTime() - utcDate(fromYmd).getTime()) / DAY_MS);

export const formatHolidayDate = (
  ymd: string,
  options: Intl.DateTimeFormatOptions,
) => utcDate(ymd).toLocaleDateString("en-IN", { ...options, timeZone: "UTC" });

export interface PendingConflict {
  mode: "create" | "update";
  holidayId?: string;
  payload: CreateHolidayPayload | UpdateHolidayPayload;
  conflict: HolidayAttendanceConflict;
}

const buildSchema = (t: Translate) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(2, { error: t("errNameShort") })
      .max(100, { error: t("errNameLong") }),
    date: z
      .string()
      .min(1, { error: t("errDateRequired") })
      .refine((value) => utcDate(value).getUTCDay() !== 0, {
        error: t("errSunday"),
      }),
    description: z
      .string()
      .trim()
      .max(300, { error: t("errDescriptionLong") }),
  });

type HolidayFormValues = z.infer<ReturnType<typeof buildSchema>>;

interface HolidayFormDialogProps {
  open: boolean;
  holiday: Holiday | null;
  onOpenChange: (open: boolean) => void;
  onConflict: (pending: PendingConflict) => void;
}

export const HolidayFormDialog = ({
  open,
  holiday,
  onOpenChange,
  onConflict,
}: HolidayFormDialogProps) => {
  const t = useTranslations("holidays");
  const schema = useMemo(() => buildSchema(t), [t]);
  const isEdit = !!holiday;
  const { mutate: createHoliday, isPending: isCreating } = useCreateHoliday();
  const { mutate: updateHoliday, isPending: isUpdating } = useUpdateHoliday(
    holiday?.id ?? "",
  );
  const isPending = isCreating || isUpdating;

  const defaults: HolidayFormValues = {
    name: holiday?.name ?? "",
    date: holiday ? holidayYmd(holiday) : "",
    description: holiday?.description ?? "",
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<HolidayFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const handleConflict = (
    error: unknown,
    pending: Omit<PendingConflict, "conflict">,
  ) => {
    const conflict = getHolidayAttendanceConflict(error);
    if (!conflict) return;
    onOpenChange(false);
    onConflict({ ...pending, conflict });
  };

  const onSubmit = (values: HolidayFormValues) => {
    if (!isEdit) {
      const payload: CreateHolidayPayload = {
        name: values.name,
        date: values.date,
        description: values.description || undefined,
      };
      createHoliday(payload, {
        onSuccess: () => onOpenChange(false),
        onError: (error) => handleConflict(error, { mode: "create", payload }),
      });
      return;
    }

    const payload: UpdateHolidayPayload = {
      ...(values.name !== defaults.name && { name: values.name }),
      ...(values.date !== defaults.date && { date: values.date }),
      ...(values.description !== defaults.description && {
        description: values.description,
      }),
    };
    if (Object.keys(payload).length === 0) {
      onOpenChange(false);
      return;
    }
    updateHoliday(payload, {
      onSuccess: () => onOpenChange(false),
      onError: (error) =>
        handleConflict(error, {
          mode: "update",
          holidayId: holiday.id,
          payload,
        }),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !isPending && onOpenChange(next)}
    >
      <DialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-4 space-y-0 text-left">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${TONE_CLASSES.amber}`}
          >
            {isEdit ? (
              <Pencil className="size-5" />
            ) : (
              <CalendarHeart className="size-5" />
            )}
          </span>
          <div className="space-y-1">
            <DialogTitle className="font-jakarta text-lg font-bold text-foreground">
              {isEdit ? t("editTitle") : t("addTitle")}
            </DialogTitle>
            <DialogDescription className="font-manrope text-sm text-muted-foreground">
              {isEdit ? t("editSub") : t("addSub")}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label
              htmlFor="holiday-name"
              className="font-manrope text-xs font-normal text-foreground/70"
            >
              {t("fieldName")}
            </Label>
            <Input
              id="holiday-name"
              placeholder={t("namePlaceholder")}
              aria-invalid={!!errors.name}
              className={fieldClass(!!errors.name)}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="holiday-date"
              className="font-manrope text-xs font-normal text-foreground/70"
            >
              {t("fieldDate")}
            </Label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DatePickerField
                  id="holiday-date"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("datePlaceholder")}
                  invalid={!!errors.date}
                  disableSundays
                />
              )}
            />
            <FieldError message={errors.date?.message} />
            <p className="font-manrope text-[11px] text-muted-foreground">
              {t("dateHint")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="holiday-description"
              className="font-manrope text-xs font-normal text-foreground/70"
            >
              {t("fieldDescription")}
            </Label>
            <Textarea
              id="holiday-description"
              rows={3}
              placeholder={t("descriptionPlaceholder")}
              aria-invalid={!!errors.description}
              className="resize-none rounded-lg border-input bg-card font-manrope text-sm focus-visible:border-indigo-500 focus-visible:ring-0 dark:bg-card"
              {...register("description")}
            />
            <FieldError message={errors.description?.message} />
          </div>

          <DialogFooter className="gap-2 pt-1 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className={`h-11 flex-1 text-sm ${OUTLINE_PILL_CLASS}`}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending || (isEdit && !isDirty)}
              className={`h-11 flex-1 gap-2 text-sm ${PRIMARY_PILL_CLASS}`}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending
                ? t("saving")
                : isEdit
                  ? t("saveChanges")
                  : t("addHoliday")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface HolidayConflictDialogProps {
  pending: PendingConflict | null;
  onOpenChange: (open: boolean) => void;
}

export const HolidayConflictDialog = ({
  pending,
  onOpenChange,
}: HolidayConflictDialogProps) => {
  const t = useTranslations("holidays");
  const { mutate: createHoliday, isPending: isCreating } = useCreateHoliday();
  const { mutate: updateHoliday, isPending: isUpdating } = useUpdateHoliday(
    pending?.holidayId ?? "",
  );
  const isPending = isCreating || isUpdating;

  const confirm = () => {
    if (!pending) return;
    const onSuccess = () => onOpenChange(false);
    if (pending.mode === "create") {
      createHoliday(
        {
          ...(pending.payload as CreateHolidayPayload),
          overrideAttendance: true,
        },
        { onSuccess },
      );
    } else {
      updateHoliday(
        { ...pending.payload, overrideAttendance: true },
        { onSuccess },
      );
    }
  };

  const counts = pending?.conflict;

  return (
    <AlertDialog
      open={!!pending}
      onOpenChange={(next) => !isPending && onOpenChange(next)}
    >
      <AlertDialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
        <AlertDialogHeader className="items-start text-left">
          <span
            className={`mb-2 flex h-11 w-11 items-center justify-center rounded-xl border ${TONE_CLASSES.amber}`}
          >
            <AlertTriangle className="size-5" />
          </span>
          <AlertDialogTitle className="font-jakarta text-lg font-bold text-foreground">
            {t("conflictTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription className="font-manrope text-sm text-muted-foreground">
            {counts
              ? `${t("conflictSubPrefix")} ${formatHolidayDate(counts.date, { day: "numeric", month: "long", year: "numeric" })}.`
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {counts && (
          <div className="grid grid-cols-3 gap-2 font-manrope text-xs">
            {[
              { label: t("students"), value: counts.students },
              { label: t("teachers"), value: counts.teachers },
              { label: t("staff"), value: counts.admins },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-center"
              >
                <p className="font-jakarta text-lg font-bold text-foreground">
                  {item.value}
                </p>
                <p className="text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        <p
          className={`rounded-xl border px-3 py-2 font-manrope text-xs ${TONE_CLASSES.amber}`}
        >
          {t("conflictWarning")}
        </p>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={isPending}
            className={`h-11 flex-1 text-sm ${OUTLINE_PILL_CLASS}`}
          >
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              confirm();
            }}
            disabled={isPending}
            className="h-11 flex-1 gap-2 rounded-full bg-amber-600 font-manrope text-sm font-semibold text-white shadow-none hover:bg-amber-500"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {t("conflictConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface DeleteHolidayDialogProps {
  holiday: Holiday | null;
  onOpenChange: (open: boolean) => void;
}

export const DeleteHolidayDialog = ({
  holiday,
  onOpenChange,
}: DeleteHolidayDialogProps) => {
  const t = useTranslations("holidays");
  const { mutate: deleteHoliday, isPending } = useDeleteHoliday();

  return (
    <AlertDialog
      open={!!holiday}
      onOpenChange={(next) => !isPending && onOpenChange(next)}
    >
      <AlertDialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
        <AlertDialogHeader className="items-start text-left">
          <span
            className={`mb-2 flex h-11 w-11 items-center justify-center rounded-xl border ${TONE_CLASSES.red}`}
          >
            <Trash2 className="size-5" />
          </span>
          <AlertDialogTitle className="font-jakarta text-lg font-bold text-foreground">
            {t("deleteTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription className="font-manrope text-sm text-muted-foreground">
            {holiday
              ? `${holiday.name} · ${formatHolidayDate(holidayYmd(holiday), {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}`
              : ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p className="font-manrope text-xs text-muted-foreground">
          {t("deleteWarning")}
        </p>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            disabled={isPending}
            className={`h-11 flex-1 text-sm ${OUTLINE_PILL_CLASS}`}
          >
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              if (holiday)
                deleteHoliday(holiday.id, {
                  onSuccess: () => onOpenChange(false),
                });
            }}
            disabled={isPending}
            className="h-11 flex-1 gap-2 rounded-full bg-red-600 font-manrope text-sm font-semibold text-white shadow-none hover:bg-red-500"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {t("deleteConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface HolidayRowProps {
  holiday: Holiday;
  today: string;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (holiday: Holiday) => void;
  onDelete: (holiday: Holiday) => void;
}

export const HolidayRow = ({
  holiday,
  today,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: HolidayRowProps) => {
  const t = useTranslations("holidays");
  const ymd = holidayYmd(holiday);
  const days = daysBetween(today, ymd);

  const status =
    days === 0
      ? { label: t("today"), tone: TONE_CLASSES.emerald }
      : days < 0
        ? { label: t("past"), tone: SLATE_TONE }
        : days === 1
          ? { label: t("tomorrow"), tone: TONE_CLASSES.amber }
          : {
              label: `${t("inPrefix")} ${days} ${t("daysSuffix")}`,
              tone: days <= 7 ? TONE_CLASSES.amber : SKY_TONE,
            };

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3.5 sm:px-5 ${days < 0 ? "opacity-70" : ""}`}
    >
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
        <span className="font-jakarta text-lg leading-none font-bold text-amber-700 dark:text-amber-300">
          {formatHolidayDate(ymd, { day: "2-digit" })}
        </span>
        <span className="mt-0.5 font-manrope text-[10px] font-medium text-amber-700/80 uppercase dark:text-amber-300/80">
          {formatHolidayDate(ymd, { weekday: "short" })}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-jakarta text-sm font-semibold text-foreground">
          {holiday.name}
        </p>
        <p className="truncate font-manrope text-xs text-muted-foreground">
          {holiday.description ||
            formatHolidayDate(ymd, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
        </p>
      </div>
      <Badge
        variant="outline"
        className={`hidden shrink-0 rounded-full font-manrope text-[11px] font-medium sm:inline-flex ${status.tone}`}
      >
        {status.label}
      </Badge>
      {(canEdit || canDelete) && (
        <div className="flex shrink-0 items-center gap-1">
          {canEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onEdit(holiday)}
              aria-label={`${t("edit")} ${holiday.name}`}
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Pencil className="size-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onDelete(holiday)}
              aria-label={`${t("delete")} ${holiday.name}`}
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export const HolidaysSkeleton = () => (
  <div className="space-y-5">
    <div className="space-y-2">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-24 rounded-2xl" />
      ))}
    </div>
    <Skeleton className="h-96 rounded-2xl" />
  </div>
);
