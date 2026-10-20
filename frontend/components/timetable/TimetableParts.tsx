"use client";
import { Fragment, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftRight,
  Clock,
  DoorOpen,
  Loader2,
  Pencil,
  Plus,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useUpdateTimeTable } from "@/hooks/useTimeTable";
import { useTranslations } from "@/hooks/useTranslations";
import {
  UpdateTimetableFormValues,
  updateTimetableSchema,
} from "@/validations/validations";
import { DayOfWeek, TimetableListItem } from "@/types";

export const WEEK_DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

export const DAY_LABEL_KEYS = {
  [DayOfWeek.MONDAY]: "dayMonday",
  [DayOfWeek.TUESDAY]: "dayTuesday",
  [DayOfWeek.WEDNESDAY]: "dayWednesday",
  [DayOfWeek.THURSDAY]: "dayThursday",
  [DayOfWeek.FRIDAY]: "dayFriday",
  [DayOfWeek.SATURDAY]: "daySaturday",
  [DayOfWeek.SUNDAY]: "daySunday",
} as const;

export const DAY_SHORT_KEYS = {
  [DayOfWeek.MONDAY]: "shortMonday",
  [DayOfWeek.TUESDAY]: "shortTuesday",
  [DayOfWeek.WEDNESDAY]: "shortWednesday",
  [DayOfWeek.THURSDAY]: "shortThursday",
  [DayOfWeek.FRIDAY]: "shortFriday",
  [DayOfWeek.SATURDAY]: "shortSaturday",
  [DayOfWeek.SUNDAY]: "shortSunday",
} as const;

export interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

export interface TeacherOption {
  id: string;
  name: string;
  specialization: string | null;
}

export interface Lookup {
  subjects: Map<string, SubjectOption>;
  teachers: Map<string, TeacherOption>;
}

const SUBJECT_PALETTE = [
  "border-indigo-500/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200",
  "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  "border-violet-500/30 bg-violet-500/10 text-violet-800 dark:text-violet-200",
  "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200",
];

export const subjectTone = (seed?: string | null) => {
  const hash = Array.from(seed ?? "").reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return SUBJECT_PALETTE[hash % SUBJECT_PALETTE.length];
};

export const addMinutes = (time: string, minutes: number) => {
  const [hours, mins] = time.split(":").map(Number);
  const total = Math.min(
    23 * 60 + 59,
    Math.max(0, (hours || 0) * 60 + (mins || 0) + minutes),
  );
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

export const suggestTimes = (period: number, existing: TimetableListItem[]) => {
  const match = existing.find((entry) => entry.periodNumber === period);
  if (match) return { startTime: match.startTime, endTime: match.endTime };
  const startTime = addMinutes("08:00", (period - 1) * 45);
  return { startTime, endTime: addMinutes(startTime, 40) };
};

const slotKey = (day: DayOfWeek, period: number) => `${day}-${period}`;

interface ViewProps {
  entries: TimetableListItem[];
  days: DayOfWeek[];
  lookup: Lookup;
  isHighlighted: (entry: TimetableListItem) => boolean;
  swapMode: boolean;
  selectedIds: string[];
  onEntryClick: (entry: TimetableListItem) => void;
}

interface WeeklyGridProps extends ViewProps {
  maxPeriod: number;
  onEmptyClick: (day: DayOfWeek, period: number) => void;
}

const EntryCard = ({
  entry,
  lookup,
  dimmed,
  selected,
  swapMode,
  onClick,
}: {
  entry: TimetableListItem;
  lookup: Lookup;
  dimmed: boolean;
  selected: boolean;
  swapMode: boolean;
  onClick: () => void;
}) => {
  const t = useTranslations("timetable");
  const subject = lookup.subjects.get(entry.subjectId);
  const teacher = lookup.teachers.get(entry.teacherId);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={swapMode ? selected : undefined}
      aria-label={`${subject?.name ?? t("unknownSubject")}, ${entry.startTime}–${entry.endTime}`}
      className={`group relative flex h-full min-h-24 w-full flex-col gap-1 rounded-xl border p-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${subjectTone(
        entry.subjectId,
      )} ${dimmed ? "opacity-30" : ""} ${entry.isActive ? "" : "border-dashed opacity-60"} ${
        selected ? "ring-2 ring-indigo-600 ring-offset-2 ring-offset-card" : ""
      }`}
    >
      <span className="flex items-start justify-between gap-1">
        <span className="line-clamp-1 font-jakarta text-xs font-bold">
          {subject?.name ?? t("unknownSubject")}
        </span>
        {swapMode ? (
          <ArrowLeftRight className="size-3 shrink-0 opacity-60" />
        ) : (
          <Pencil className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
        )}
      </span>
      <span className="flex items-center gap-1 font-manrope text-[11px] opacity-80">
        <User className="size-3 shrink-0" />
        <span className="truncate">{teacher?.name ?? t("unknownTeacher")}</span>
      </span>
      <span className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-0.5 font-manrope text-[10px] opacity-75">
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {entry.startTime}–{entry.endTime}
        </span>
        {entry.room && (
          <span className="flex items-center gap-1">
            <DoorOpen className="size-3" />
            {entry.room}
          </span>
        )}
      </span>
    </button>
  );
};

export const WeeklyGrid = ({
  entries,
  days,
  maxPeriod,
  lookup,
  isHighlighted,
  swapMode,
  selectedIds,
  onEntryClick,
  onEmptyClick,
}: WeeklyGridProps) => {
  const t = useTranslations("timetable");
  const bySlot = useMemo(
    () =>
      new Map(entries.map((e) => [slotKey(e.dayOfWeek, e.periodNumber), e])),
    [entries],
  );
  const periods = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-max gap-2 p-4 sm:p-5"
        style={{
          gridTemplateColumns: `64px repeat(${days.length}, minmax(160px, 1fr))`,
        }}
      >
        <div />
        {days.map((day) => (
          <div key={day} className="rounded-xl bg-muted px-3 py-2 text-center">
            <p className="font-jakarta text-xs font-bold tracking-wide text-foreground uppercase">
              {t(DAY_SHORT_KEYS[day])}
            </p>
            <p className="font-manrope text-[10px] text-muted-foreground">
              {entries.filter((e) => e.dayOfWeek === day).length}{" "}
              {t("periodsShort")}
            </p>
          </div>
        ))}

        {periods.map((period) => {
          const sample = entries.find((e) => e.periodNumber === period);
          return (
            <Fragment key={period}>
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-1 py-2 text-center">
                <span className="font-jakarta text-sm font-bold text-foreground">
                  {t("periodShort")}
                  {period}
                </span>
                {sample && (
                  <span className="font-manrope text-[10px] text-muted-foreground">
                    {sample.startTime}
                  </span>
                )}
              </div>
              {days.map((day) => {
                const entry = bySlot.get(slotKey(day, period));
                if (entry) {
                  return (
                    <EntryCard
                      key={day}
                      entry={entry}
                      lookup={lookup}
                      dimmed={!isHighlighted(entry)}
                      selected={selectedIds.includes(entry.id)}
                      swapMode={swapMode}
                      onClick={() => onEntryClick(entry)}
                    />
                  );
                }
                return swapMode ? (
                  <div
                    key={day}
                    className="min-h-24 rounded-xl border border-dashed border-border bg-muted/20"
                  />
                ) : (
                  <button
                    key={day}
                    type="button"
                    onClick={() => onEmptyClick(day, period)}
                    aria-label={`${t("addPeriodAt")} ${t(DAY_LABEL_KEYS[day])} ${t("periodShort")}${period}`}
                    className="group flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:text-indigo-400"
                  >
                    <span className="flex items-center gap-1 font-manrope text-[11px] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                      <Plus className="size-3.5" />
                      {t("add")}
                    </span>
                  </button>
                );
              })}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

export const DayList = ({
  entries,
  days,
  lookup,
  isHighlighted,
  swapMode,
  selectedIds,
  onEntryClick,
}: ViewProps) => {
  const t = useTranslations("timetable");

  return (
    <div className="space-y-4 p-4 sm:p-5">
      {days.map((day) => {
        const dayEntries = entries
          .filter((e) => e.dayOfWeek === day)
          .sort((a, b) => a.periodNumber - b.periodNumber);
        return (
          <section key={day} className="rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-2.5">
              <p className="font-jakarta text-sm font-semibold text-foreground">
                {t(DAY_LABEL_KEYS[day])}
              </p>
              <Badge
                variant="outline"
                className="rounded-full border-border bg-background font-manrope text-[10px] text-muted-foreground"
              >
                {dayEntries.length} {t("periodsShort")}
              </Badge>
            </div>
            {dayEntries.length === 0 ? (
              <p className="px-4 py-5 text-center font-manrope text-xs text-muted-foreground">
                {t("noPeriodsDay")}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {dayEntries.map((entry) => {
                  const subject = lookup.subjects.get(entry.subjectId);
                  const teacher = lookup.teachers.get(entry.teacherId);
                  const selected = selectedIds.includes(entry.id);
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => onEntryClick(entry)}
                      aria-pressed={swapMode ? selected : undefined}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                        isHighlighted(entry) ? "" : "opacity-30"
                      } ${selected ? "bg-indigo-500/10" : ""}`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-jakarta text-xs font-bold ${subjectTone(
                          entry.subjectId,
                        )}`}
                      >
                        {t("periodShort")}
                        {entry.periodNumber}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-jakarta text-sm font-semibold text-foreground">
                          {subject?.name ?? t("unknownSubject")}
                        </span>
                        <span className="block truncate font-manrope text-[11px] text-muted-foreground">
                          {teacher?.name ?? t("unknownTeacher")}
                          {entry.room
                            ? ` · ${t("roomLabel")} ${entry.room}`
                            : ""}
                        </span>
                      </span>
                      <span className="shrink-0 font-manrope text-xs font-medium text-foreground/80">
                        {entry.startTime}–{entry.endTime}
                      </span>
                      {swapMode ? (
                        <ArrowLeftRight
                          className={`size-4 shrink-0 ${selected ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground"}`}
                        />
                      ) : (
                        <Pencil className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export const TimetableSkeleton = () => (
  <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-7 sm:p-5">
    {Array.from({ length: 28 }).map((_, i) => (
      <Skeleton key={i} className="h-24 rounded-xl" />
    ))}
  </div>
);

interface EditEntryDialogProps {
  entry: TimetableListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: SubjectOption[];
  teachers: TeacherOption[];
}

export const EditEntryDialog = ({
  entry,
  open,
  onOpenChange,
  subjects,
  teachers,
}: EditEntryDialogProps) => {
  const t = useTranslations("timetable");
  const { mutate: updateEntry, isPending } = useUpdateTimeTable(
    entry?.id ?? "",
  );

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<UpdateTimetableFormValues>({
    resolver: zodResolver(updateTimetableSchema),
    defaultValues: {
      startTime: entry?.startTime ?? "",
      endTime: entry?.endTime ?? "",
      room: entry?.room ?? "",
      subjectId: entry?.subjectId,
      teacherId: entry?.teacherId,
    },
  });

  const onSubmit = (values: UpdateTimetableFormValues) => {
    if (values.endTime <= values.startTime) {
      setError("endTime", { message: t("endAfterStart") });
      return;
    }
    updateEntry(
      { data: { ...values, room: values.room?.trim() || undefined } },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-border bg-card sm:max-w-lg">
        <DialogHeader className="flex-row items-start gap-4 space-y-0 text-left">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-jakarta text-sm font-bold ${subjectTone(entry.subjectId)}`}
          >
            {t("periodShort")}
            {entry.periodNumber}
          </span>
          <div className="space-y-1">
            <DialogTitle className="font-jakarta text-lg font-bold text-foreground">
              {t("editTitle")}
            </DialogTitle>
            <DialogDescription className="font-manrope text-sm text-muted-foreground">
              {t(DAY_LABEL_KEYS[entry.dayOfWeek])} · {t("periodLabel")}{" "}
              {entry.periodNumber}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Controller
              control={control}
              name="subjectId"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label className="font-manrope text-xs font-normal text-foreground/70">
                    {t("fieldSubject")}
                  </Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className={`${fieldClass(!!errors.subjectId)} w-full data-[size=default]:h-10 dark:hover:bg-card`}
                    >
                      <SelectValue placeholder={t("pickSubject")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 rounded-xl">
                      {subjects.map((subject) => (
                        <SelectItem
                          key={subject.id}
                          value={subject.id}
                          className="font-manrope text-sm"
                        >
                          {subject.name}{" "}
                          <span className="text-muted-foreground">
                            · {subject.code}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <Controller
              control={control}
              name="teacherId"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label className="font-manrope text-xs font-normal text-foreground/70">
                    {t("fieldTeacher")}
                  </Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className={`${fieldClass(!!errors.teacherId)} w-full data-[size=default]:h-10 dark:hover:bg-card`}
                    >
                      <SelectValue placeholder={t("pickTeacher")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 rounded-xl">
                      {teachers.map((teacher) => (
                        <SelectItem
                          key={teacher.id}
                          value={teacher.id}
                          className="font-manrope text-sm"
                        >
                          {teacher.name}
                          {teacher.specialization && (
                            <span className="text-muted-foreground">
                              {" "}
                              · {teacher.specialization}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-start"
                className="font-manrope text-xs font-normal text-foreground/70"
              >
                {t("fieldStart")}
              </Label>
              <Input
                id="edit-start"
                type="time"
                aria-invalid={!!errors.startTime}
                className={fieldClass(!!errors.startTime)}
                {...register("startTime")}
              />
              <FieldError message={errors.startTime?.message} />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-end"
                className="font-manrope text-xs font-normal text-foreground/70"
              >
                {t("fieldEnd")}
              </Label>
              <Input
                id="edit-end"
                type="time"
                aria-invalid={!!errors.endTime}
                className={fieldClass(!!errors.endTime)}
                {...register("endTime")}
              />
              <FieldError message={errors.endTime?.message} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label
                htmlFor="edit-room"
                className="font-manrope text-xs font-normal text-foreground/70"
              >
                {t("fieldRoom")}
              </Label>
              <Input
                id="edit-room"
                placeholder={t("roomPlaceholder")}
                className={fieldClass(false)}
                {...register("room")}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-1 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={`h-11 flex-1 text-sm ${OUTLINE_PILL_CLASS}`}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={`h-11 flex-1 gap-2 text-sm ${PRIMARY_PILL_CLASS}`}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              {isPending ? t("saving") : t("saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface SwapConfirmDialogProps {
  pair: [TimetableListItem, TimetableListItem] | null;
  lookup: Lookup;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SwapConfirmDialog = ({
  pair,
  lookup,
  isPending,
  onConfirm,
  onCancel,
}: SwapConfirmDialogProps) => {
  const t = useTranslations("timetable");

  const describe = (entry: TimetableListItem) => (
    <div
      className={`flex-1 rounded-xl border p-3 ${subjectTone(entry.subjectId)}`}
    >
      <p className="font-jakarta text-sm font-bold">
        {lookup.subjects.get(entry.subjectId)?.name ?? t("unknownSubject")}
      </p>
      <p className="font-manrope text-[11px] opacity-80">
        {t(DAY_SHORT_KEYS[entry.dayOfWeek])} · {t("periodShort")}
        {entry.periodNumber} · {entry.startTime}
      </p>
      <p className="truncate font-manrope text-[11px] opacity-80">
        {lookup.teachers.get(entry.teacherId)?.name ?? t("unknownTeacher")}
      </p>
    </div>
  );

  return (
    <AlertDialog open={!!pair} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-jakarta text-lg font-bold text-foreground">
            {t("swapTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription className="font-manrope text-sm text-muted-foreground">
            {t("swapBody")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {pair && (
          <div className="flex items-center gap-2">
            {describe(pair[0])}
            <ArrowLeftRight className="size-5 shrink-0 text-muted-foreground" />
            {describe(pair[1])}
          </div>
        )}
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            className={`m-0 h-11 flex-1 text-sm ${OUTLINE_PILL_CLASS}`}
          >
            {t("cancel")}
          </AlertDialogCancel>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`h-11 flex-1 gap-2 text-sm ${PRIMARY_PILL_CLASS}`}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowLeftRight className="size-4" />
            )}
            {isPending ? t("swapping") : t("confirmSwap")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { TONE_CLASSES };
