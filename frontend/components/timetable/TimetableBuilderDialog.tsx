"use client";
import { useMemo } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  CalendarPlus,
  Copy,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { TONE_CLASSES } from "@/components/dashboard/DashboardWidgets";
import {
  FieldError,
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import {
  DAY_LABEL_KEYS,
  SubjectOption,
  TeacherOption,
  addMinutes,
  suggestTimes,
} from "@/components/timetable/TimetableParts";
import { useCreateTimeTable } from "@/hooks/useTimeTable";
import { useTranslations } from "@/hooks/useTranslations";
import { createTimetableSchema } from "@/validations/validations";
import { DayOfWeek, TimetableListItem } from "@/types";

const builderSchema = z
  .object({
    entries: createTimetableSchema.min(1, { error: "Add at least one period" }),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    data.entries.forEach((entry, index) => {
      if (!entry.subjectId) {
        ctx.addIssue({
          code: "custom",
          message: "Pick a subject",
          path: ["entries", index, "subjectId"],
        });
      }
      if (!entry.teacherId) {
        ctx.addIssue({
          code: "custom",
          message: "Pick a teacher",
          path: ["entries", index, "teacherId"],
        });
      }
      if (entry.endTime <= entry.startTime) {
        ctx.addIssue({
          code: "custom",
          message: "End time must be after start time",
          path: ["entries", index, "endTime"],
        });
      }
      const key = `${entry.dayOfWeek}-${entry.periodNumber}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: "This day and period is already in the list",
          path: ["entries", index, "periodNumber"],
        });
      }
      seen.add(key);
    });
  });

type BuilderInput = z.input<typeof builderSchema>;
type BuilderOutput = z.output<typeof builderSchema>;

const ALL_DAYS = Object.values(DayOfWeek);

interface TimetableBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  classLabel: string;
  existing: TimetableListItem[];
  subjects: SubjectOption[];
  teachers: TeacherOption[];
  initialSlot: { day: DayOfWeek; period: number } | null;
}

export const TimetableBuilderDialog = ({
  open,
  onOpenChange,
  classId,
  classLabel,
  existing,
  subjects,
  teachers,
  initialSlot,
}: TimetableBuilderDialogProps) => {
  const t = useTranslations("timetable");
  const { mutate: createTimetable, isPending } = useCreateTimeTable();

  const makeRow = (
    day: DayOfWeek,
    period: number,
    times?: { startTime: string; endTime: string },
  ) => ({
    classId,
    dayOfWeek: day,
    periodNumber: period,
    ...(times ?? suggestTimes(period, existing)),
    subjectId: "",
    teacherId: "",
    room: "",
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BuilderInput, unknown, BuilderOutput>({
    resolver: zodResolver(builderSchema),
    defaultValues: {
      entries: [
        makeRow(initialSlot?.day ?? DayOfWeek.MONDAY, initialSlot?.period ?? 1),
      ],
    },
  });

  const { fields, append, insert, remove } = useFieldArray({
    control,
    name: "entries",
  });
  const watched = useWatch({ control, name: "entries" });

  const existingSlots = useMemo(
    () => new Set(existing.map((e) => `${e.dayOfWeek}-${e.periodNumber}`)),
    [existing],
  );
  const conflicts = useMemo(
    () =>
      new Set(
        (watched ?? [])
          .map((row, index) =>
            existingSlots.has(`${row.dayOfWeek}-${Number(row.periodNumber)}`)
              ? index
              : -1,
          )
          .filter((index) => index >= 0),
      ),
    [watched, existingSlots],
  );

  const nextRowAfter = (row: BuilderInput["entries"][number]) => {
    const period = Number(row.periodNumber) + 1;
    const fromExisting = existing.find((e) => e.periodNumber === period);
    const startTime = fromExisting
      ? fromExisting.startTime
      : addMinutes(row.endTime, 5);
    const endTime = fromExisting
      ? fromExisting.endTime
      : addMinutes(startTime, 40);
    return { day: row.dayOfWeek, period, times: { startTime, endTime } };
  };

  const addRow = () => {
    const last = watched?.[watched.length - 1];
    if (!last) {
      append(makeRow(DayOfWeek.MONDAY, 1));
      return;
    }
    const next = nextRowAfter(last);
    append(makeRow(next.day as DayOfWeek, next.period, next.times));
  };

  const duplicateRow = (index: number) => {
    const row = watched?.[index];
    if (!row) return;
    const next = nextRowAfter(row);
    insert(index + 1, { ...row, periodNumber: next.period, ...next.times });
  };

  const onSubmit = (values: BuilderOutput) => {
    createTimetable(
      {
        data: values.entries.map((entry) => ({
          ...entry,
          classId,
          room: entry.room?.trim() || undefined,
        })),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const rootError = errors.entries?.root?.message ?? errors.entries?.message;
  const labelClass = "font-manrope text-xs font-normal text-foreground/70";
  const selectTrigger = (invalid: boolean) =>
    `${fieldClass(invalid)} w-full data-[size=default]:h-10 dark:hover:bg-card`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 sm:max-w-3xl">
        <DialogHeader className="flex-row items-start gap-4 space-y-0 p-6 pb-4 text-left">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${TONE_CLASSES.indigo}`}
          >
            <CalendarPlus className="size-5" />
          </span>
          <div className="space-y-1">
            <DialogTitle className="font-jakarta text-lg font-bold text-foreground">
              {t("builderTitle")}
            </DialogTitle>
            <DialogDescription className="font-manrope text-sm text-muted-foreground">
              {t("builderSub")} {classLabel}
            </DialogDescription>
          </div>
        </DialogHeader>
        <Separator />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
          noValidate
        >
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-6">
            {fields.map((field, index) => {
              const rowErrors = errors.entries?.[index];
              const hasConflict = conflicts.has(index);
              return (
                <div
                  key={field.id}
                  className={`space-y-3 rounded-xl border p-4 ${hasConflict ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-muted/30"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-full border-border bg-background font-manrope text-[11px] text-foreground/80"
                    >
                      {t("rowLabel")} {index + 1}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => duplicateRow(index)}
                        aria-label={t("duplicateRow")}
                        className="h-8 w-8 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent"
                      >
                        <Copy className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        aria-label={t("removeRow")}
                        className="h-8 w-8 rounded-full text-muted-foreground hover:bg-red-500/10 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Controller
                      control={control}
                      name={`entries.${index}.dayOfWeek`}
                      render={({ field: dayField }) => (
                        <div className="space-y-1.5">
                          <Label className={labelClass}>{t("fieldDay")}</Label>
                          <Select
                            value={dayField.value}
                            onValueChange={(value: string) =>
                              dayField.onChange(
                                ALL_DAYS.find((d) => d === value) ??
                                  DayOfWeek.MONDAY,
                              )
                            }
                          >
                            <SelectTrigger className={selectTrigger(false)}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {ALL_DAYS.map((day) => (
                                <SelectItem
                                  key={day}
                                  value={day}
                                  className="font-manrope text-sm"
                                >
                                  {t(DAY_LABEL_KEYS[day])}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    />
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`period-${field.id}`}
                        className={labelClass}
                      >
                        {t("fieldPeriod")}
                      </Label>
                      <Input
                        id={`period-${field.id}`}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={10}
                        aria-invalid={!!rowErrors?.periodNumber}
                        className={fieldClass(!!rowErrors?.periodNumber)}
                        {...register(`entries.${index}.periodNumber`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={`start-${field.id}`}
                        className={labelClass}
                      >
                        {t("fieldStart")}
                      </Label>
                      <Input
                        id={`start-${field.id}`}
                        type="time"
                        aria-invalid={!!rowErrors?.startTime}
                        className={fieldClass(!!rowErrors?.startTime)}
                        {...register(`entries.${index}.startTime`)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`end-${field.id}`} className={labelClass}>
                        {t("fieldEnd")}
                      </Label>
                      <Input
                        id={`end-${field.id}`}
                        type="time"
                        aria-invalid={!!rowErrors?.endTime}
                        className={fieldClass(!!rowErrors?.endTime)}
                        {...register(`entries.${index}.endTime`)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Controller
                      control={control}
                      name={`entries.${index}.subjectId`}
                      render={({ field: subjectField }) => (
                        <div className="space-y-1.5">
                          <Label className={labelClass}>
                            {t("fieldSubject")}
                          </Label>
                          <Select
                            value={subjectField.value || undefined}
                            onValueChange={subjectField.onChange}
                          >
                            <SelectTrigger
                              className={selectTrigger(!!rowErrors?.subjectId)}
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
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    />
                    <Controller
                      control={control}
                      name={`entries.${index}.teacherId`}
                      render={({ field: teacherField }) => (
                        <div className="space-y-1.5">
                          <Label className={labelClass}>
                            {t("fieldTeacher")}
                          </Label>
                          <Select
                            value={teacherField.value || undefined}
                            onValueChange={teacherField.onChange}
                          >
                            <SelectTrigger
                              className={selectTrigger(!!rowErrors?.teacherId)}
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
                        htmlFor={`room-${field.id}`}
                        className={labelClass}
                      >
                        {t("fieldRoom")}
                      </Label>
                      <Input
                        id={`room-${field.id}`}
                        placeholder={t("roomPlaceholder")}
                        className={fieldClass(false)}
                        {...register(`entries.${index}.room`)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <FieldError
                      message={
                        rowErrors?.periodNumber?.message ??
                        rowErrors?.endTime?.message ??
                        rowErrors?.startTime?.message ??
                        rowErrors?.subjectId?.message ??
                        rowErrors?.teacherId?.message
                      }
                    />
                    {hasConflict && (
                      <p className="flex items-center gap-1.5 font-manrope text-xs text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="size-3.5 shrink-0" />
                        {t("slotTaken")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              onClick={addRow}
              className={`h-11 w-full gap-2 border-dashed text-sm ${OUTLINE_PILL_CLASS}`}
            >
              <Plus className="size-4" />
              {t("addRow")}
            </Button>
            <FieldError message={rootError} />
          </div>

          <Separator />
          <DialogFooter className="flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-6">
            <p className="font-manrope text-xs text-muted-foreground">
              {fields.length} {t("periodsToCreate")}
              {conflicts.size > 0 && (
                <span className="ml-2 font-medium text-amber-700 dark:text-amber-300">
                  · {conflicts.size} {t("conflicts")}
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className={`h-11 px-5 text-sm ${OUTLINE_PILL_CLASS}`}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isPending || conflicts.size > 0}
                className={`h-11 gap-2 px-5 text-sm ${PRIMARY_PILL_CLASS}`}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CalendarPlus className="size-4" />
                )}
                {isPending ? t("creating") : t("createPeriods")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
