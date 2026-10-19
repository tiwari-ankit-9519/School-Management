"use client";
import { ReactNode, useId, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { motion } from "motion/react";
import {
  AlertCircle,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock,
  GraduationCap,
  History,
  Loader2,
  MinusCircle,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  fadeUp,
} from "@/components/dashboard/DashboardWidgets";
import {
  FieldError,
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import { useCreateAcademicYear } from "@/hooks/useAcademicYear";
import { useTranslations } from "@/hooks/useTranslations";
import {
  AcademicYearFormValues,
  academicYearSchema,
} from "@/validations/validations";
import { AcademicYear } from "@/types";

const DAY_MS = 86_400_000;
const CALENDAR_START = new Date(new Date().getFullYear() - 5, 0);
const CALENDAR_END = new Date(new Date().getFullYear() + 5, 11);

export type YearPhase = "current" | "upcoming" | "completed" | "inactive";

export const getPhase = (year: AcademicYear, now: number): YearPhase => {
  if (year.isCurrent) return "current";
  if (new Date(year.startDate).getTime() > now) return "upcoming";
  if (new Date(year.endDate).getTime() < now) return "completed";
  return "inactive";
};

export const getProgress = (year: AcademicYear, now: number) => {
  const start = new Date(year.startDate).getTime();
  const end = new Date(year.endDate).getTime();
  const totalDays = Math.max(1, Math.round((end - start) / DAY_MS));
  const elapsedDays = Math.min(
    totalDays,
    Math.max(0, Math.round((now - start) / DAY_MS)),
  );
  return {
    totalDays,
    elapsedDays,
    remainingDays: totalDays - elapsedDays,
    percent: Math.round((elapsedDays / totalDays) * 100),
  };
};

const getDurationMonths = (year: AcademicYear) => {
  const start = new Date(year.startDate);
  const end = new Date(year.endDate);
  return Math.max(
    1,
    (end.getFullYear() - start.getFullYear()) * 12 +
      end.getMonth() -
      start.getMonth() +
      1,
  );
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const PHASE_CONFIG = {
  current: {
    labelKey: "statusCurrent",
    icon: CheckCircle2,
    className: TONE_CLASSES.emerald,
    bar: "bg-emerald-500",
  },
  upcoming: {
    labelKey: "statusUpcoming",
    icon: Clock,
    className: TONE_CLASSES.indigo,
    bar: "bg-indigo-500",
  },
  completed: {
    labelKey: "statusCompleted",
    icon: History,
    className:
      "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    bar: "bg-slate-400",
  },
  inactive: {
    labelKey: "statusInactive",
    icon: MinusCircle,
    className: TONE_CLASSES.amber,
    bar: "bg-amber-500",
  },
} as const;

export const PhaseBadge = ({ phase }: { phase: YearPhase }) => {
  const t = useTranslations("academicYear");
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-full px-2.5 py-1 font-manrope text-[11px] font-medium ${config.className}`}
    >
      <Icon className="size-3" />
      {t(config.labelKey)}
    </Badge>
  );
};

interface CurrentYearCardProps {
  year: AcademicYear | undefined;
  now: number;
  onCreate: () => void;
  loading: boolean;
}

export const CurrentYearCard = ({
  year,
  now,
  onCreate,
  loading,
}: CurrentYearCardProps) => {
  const t = useTranslations("academicYear");

  if (loading) {
    return (
      <Card
        className={`${CARD_CLASS} h-full min-h-56 animate-pulse bg-muted lg:col-span-2`}
      />
    );
  }

  if (!year) {
    return (
      <motion.div {...fadeUp(0.05)} className="lg:col-span-2">
        <Card
          className={`${CARD_CLASS} h-full items-center justify-center gap-4 border-dashed px-6 py-10 text-center`}
        >
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${TONE_CLASSES.indigo}`}
          >
            <CalendarRange className="size-6" />
          </span>
          <div>
            <p className="font-jakarta text-lg font-semibold text-foreground">
              {t("noCurrentTitle")}
            </p>
            <p className="mt-1 max-w-sm font-manrope text-sm text-muted-foreground">
              {t("noCurrentSub")}
            </p>
          </div>
          <Button
            type="button"
            onClick={onCreate}
            className={`h-10 gap-2 px-5 text-sm ${PRIMARY_PILL_CLASS}`}
          >
            <Plus className="size-4" />
            {t("setupYear")}
          </Button>
        </Card>
      </motion.div>
    );
  }

  const progress = getProgress(year, now);

  return (
    <motion.div {...fadeUp(0.05)} className="lg:col-span-2">
      <Card className="relative h-full gap-0 overflow-hidden rounded-2xl border-0 bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-800 p-6 text-white shadow-none sm:p-7">
        <svg
          className="pointer-events-none absolute -top-16 -right-16 h-64 w-64"
          viewBox="0 0 200 200"
          fill="none"
          aria-hidden="true"
        >
          {[40, 60, 80, 100].map((r) => (
            <circle
              key={r}
              cx="100"
              cy="100"
              r={r}
              stroke="white"
              strokeOpacity="0.1"
            />
          ))}
        </svg>
        <div className="relative flex h-full flex-col">
          <Badge className="w-fit gap-1.5 rounded-full border-white/25 bg-white/15 font-manrope text-[11px] font-medium text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
            {t("currentSession")}
          </Badge>
          <p className="mt-4 font-jakarta text-5xl font-bold tracking-tight">
            {year.name}
          </p>
          <p className="mt-2 flex items-center gap-1.5 font-manrope text-sm text-white/80">
            <CalendarDays className="size-4" />
            {formatDate(year.startDate)} — {formatDate(year.endDate)}
          </p>
          <div className="mt-auto pt-6">
            <div className="mb-2 flex items-end justify-between font-manrope text-xs text-white/80">
              <span>
                {t("dayLabel")} {progress.elapsedDays} {t("of")}{" "}
                {progress.totalDays}
              </span>
              <span className="font-jakarta text-lg font-bold text-white">
                {progress.percent}%{" "}
                <span className="font-manrope text-xs font-normal text-white/70">
                  {t("complete")}
                </span>
              </span>
            </div>
            <Progress
              value={progress.percent}
              className="h-2 bg-white/20 *:bg-white"
            />
            <p className="mt-2 font-manrope text-xs text-white/70">
              {progress.remainingDays} {t("daysLeft")}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

interface OverviewCardProps {
  total: number;
  upcoming: number;
  completed: number;
}

export const OverviewCard = ({
  total,
  upcoming,
  completed,
}: OverviewCardProps) => {
  const t = useTranslations("academicYear");
  const rows: {
    label: string;
    value: number;
    icon: ReactNode;
    tone: keyof typeof TONE_CLASSES;
  }[] = [
    {
      label: t("statTotal"),
      value: total,
      icon: <GraduationCap className="size-4" />,
      tone: "indigo",
    },
    {
      label: t("statUpcoming"),
      value: upcoming,
      icon: <Clock className="size-4" />,
      tone: "violet",
    },
    {
      label: t("statCompleted"),
      value: completed,
      icon: <History className="size-4" />,
      tone: "emerald",
    },
  ];

  return (
    <motion.div {...fadeUp(0.1)}>
      <Card className={`${CARD_CLASS} h-full gap-4 p-5`}>
        <h3 className="font-jakarta text-base font-semibold text-foreground">
          {t("statsTitle")}
        </h3>
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg border ${TONE_CLASSES[row.tone]}`}
              >
                {row.icon}
              </span>
              <span className="flex-1 font-manrope text-sm text-foreground/80">
                {row.label}
              </span>
              <span className="font-jakarta text-xl font-bold text-foreground">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

interface YearsTableProps {
  years: AcademicYear[];
  now: number;
}

export const YearsTable = ({ years, now }: YearsTableProps) => {
  const t = useTranslations("academicYear");
  const headClass =
    "h-11 px-5 font-manrope text-[11px] font-medium tracking-wider text-muted-foreground uppercase";

  const progressCell = (year: AcademicYear, phase: YearPhase) => {
    const percent =
      phase === "completed"
        ? 100
        : phase === "upcoming"
          ? 0
          : getProgress(year, now).percent;
    return (
      <div className="flex items-center gap-2.5">
        <Progress
          value={percent}
          className={`h-1.5 w-24 bg-muted ${
            phase === "current"
              ? "*:bg-emerald-500"
              : phase === "upcoming"
                ? "*:bg-indigo-500"
                : phase === "completed"
                  ? "*:bg-slate-400"
                  : "*:bg-amber-500"
          }`}
        />
        <span className="font-manrope text-xs text-muted-foreground">
          {percent}%
        </span>
      </div>
    );
  };

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className={headClass}>{t("colName")}</TableHead>
              <TableHead className={headClass}>{t("colStartDate")}</TableHead>
              <TableHead className={headClass}>{t("colEndDate")}</TableHead>
              <TableHead className={headClass}>{t("colProgress")}</TableHead>
              <TableHead className={headClass}>{t("colStatus")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {years.map((year) => {
              const phase = getPhase(year, now);
              return (
                <TableRow
                  key={year.id}
                  className="border-border transition-colors hover:bg-muted/60"
                >
                  <TableCell className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${PHASE_CONFIG[phase].className}`}
                      >
                        <CalendarRange className="size-4" />
                      </span>
                      <div>
                        <p className="font-jakarta text-sm font-semibold text-foreground">
                          {year.name}
                        </p>
                        <p className="font-manrope text-[11px] text-muted-foreground">
                          {getDurationMonths(year)} {t("months")}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-3.5 font-manrope text-sm text-foreground/85">
                    {formatDate(year.startDate)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 font-manrope text-sm text-foreground/85">
                    {formatDate(year.endDate)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5">
                    {progressCell(year, phase)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5">
                    <PhaseBadge phase={phase} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y divide-border md:hidden">
        {years.map((year) => {
          const phase = getPhase(year, now);
          return (
            <div key={year.id} className="flex items-start gap-3 px-4 py-4">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${PHASE_CONFIG[phase].className}`}
              >
                <CalendarRange className="size-4" />
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-jakarta text-sm font-semibold text-foreground">
                    {year.name}
                  </p>
                  <PhaseBadge phase={phase} />
                </div>
                <p className="font-manrope text-xs text-muted-foreground">
                  {formatDate(year.startDate)} — {formatDate(year.endDate)}
                </p>
                {progressCell(year, phase)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

interface YearDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  isDisabled?: (date: Date) => boolean;
  error?: string;
}

const YearDatePicker = ({
  label,
  value,
  onChange,
  placeholder,
  isDisabled,
  error,
}: YearDatePickerProps) => {
  const id = useId();
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="font-manrope text-xs font-normal text-foreground/70"
      >
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-invalid={!!error}
            className={`${fieldClass(!!error)} w-full justify-start gap-2 px-3 font-normal hover:bg-card aria-expanded:border-indigo-500 dark:hover:bg-card ${
              selected ? "text-foreground" : "text-muted-foreground/60"
            }`}
          >
            <CalendarDays className="size-4 text-muted-foreground" />
            {selected ? format(selected, "dd MMM yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto rounded-xl p-0">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected ?? new Date()}
            captionLayout="dropdown"
            startMonth={CALENDAR_START}
            endMonth={CALENDAR_END}
            disabled={isDisabled}
            onSelect={(date) => {
              if (!date) return;
              onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <FieldError message={error} />
    </div>
  );
};

interface CreateYearDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateYearDialog = ({
  open,
  onOpenChange,
}: CreateYearDialogProps) => {
  const t = useTranslations("academicYear");
  const { mutate: createAcademicYear, isPending } = useCreateAcademicYear();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AcademicYearFormValues>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: { name: "", startDate: "", endDate: "", isCurrent: false },
  });

  const startDateValue = useWatch({ control, name: "startDate" });
  const endDateValue = useWatch({ control, name: "endDate" });

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onSubmit = (formData: AcademicYearFormValues) => {
    createAcademicYear(formData, {
      onSuccess: () => handleOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-4 space-y-0 text-left">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${TONE_CLASSES.indigo}`}
          >
            <GraduationCap className="size-5" />
          </span>
          <div className="space-y-1">
            <DialogTitle className="font-jakarta text-lg font-bold text-foreground">
              {t("modalTitle")}
            </DialogTitle>
            <DialogDescription className="font-manrope text-sm text-muted-foreground">
              {t("modalSubtitle")}
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
              htmlFor="academic-year-name"
              className="font-manrope text-xs font-normal text-foreground/70"
            >
              {t("fieldName")}
            </Label>
            <Input
              id="academic-year-name"
              placeholder={t("namePlaceholder")}
              aria-invalid={!!errors.name}
              className={fieldClass(!!errors.name)}
              {...register("name")}
            />
            {errors.name ? (
              <FieldError message={errors.name.message} />
            ) : (
              <p className="flex items-center gap-1 font-manrope text-[11px] text-muted-foreground">
                <AlertCircle className="size-3" />
                {t("nameHint")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <YearDatePicker
              label={t("fieldStartDate")}
              value={startDateValue}
              onChange={(value) =>
                setValue("startDate", value, { shouldValidate: true })
              }
              placeholder={t("pickDate")}
              error={errors.startDate?.message}
            />
            <YearDatePicker
              label={t("fieldEndDate")}
              value={endDateValue}
              onChange={(value) =>
                setValue("endDate", value, { shouldValidate: true })
              }
              placeholder={t("pickDate")}
              isDisabled={(date) =>
                startDateValue ? date <= parseISO(startDateValue) : false
              }
              error={errors.endDate?.message}
            />
          </div>

          <Controller
            control={control}
            name="isCurrent"
            render={({ field }) => (
              <div
                className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
                  field.value
                    ? "border-indigo-500/30 bg-indigo-500/5"
                    : "border-border bg-muted/40"
                }`}
              >
                <div>
                  <Label
                    htmlFor="academic-year-current"
                    className="font-jakarta text-sm font-semibold text-foreground"
                  >
                    {t("toggleCurrentLabel")}
                  </Label>
                  <p className="mt-0.5 font-manrope text-xs text-muted-foreground">
                    {t("toggleCurrentSub")}
                  </p>
                </div>
                <Switch
                  id="academic-year-current"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-indigo-600 dark:data-[state=checked]:bg-indigo-600"
                />
              </div>
            )}
          />

          <DialogFooter className="gap-2 pt-1 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className={`h-11 flex-1 text-sm ${OUTLINE_PILL_CLASS}`}
            >
              {t("cancelBtn")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={`h-11 flex-1 gap-2 text-sm ${PRIMARY_PILL_CLASS}`}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("creating")}
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  {t("createBtn")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
