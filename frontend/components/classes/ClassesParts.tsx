"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  DoorOpen,
  Info,
  Loader2,
  Plus,
  SlidersHorizontal,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useCreateClass } from "@/hooks/useClass";
import { useTranslations } from "@/hooks/useTranslations";
import { ClassFormValues, classSchema } from "@/validations/validations";
import { Class } from "@/types";

export const CLASS_DETAIL_PATH = "/admin/classes";

export interface ClassFilters {
  name?: string;
  section?: string;
  roomNumber?: string;
  capacityMin?: number;
  capacityMax?: number;
}

type FilterKey = keyof ClassFilters;

const FILTER_FIELDS: {
  key: FilterKey;
  labelKey:
    | "filterName"
    | "filterSection"
    | "filterRoom"
    | "filterCapMin"
    | "filterCapMax";
  numeric?: boolean;
}[] = [
  { key: "name", labelKey: "filterName" },
  { key: "section", labelKey: "filterSection" },
  { key: "roomNumber", labelKey: "filterRoom" },
  { key: "capacityMin", labelKey: "filterCapMin", numeric: true },
  { key: "capacityMax", labelKey: "filterCapMax", numeric: true },
];

export const countActiveFilters = (filters: ClassFilters) =>
  Object.values(filters).filter((value) => value !== undefined && value !== "")
    .length;

const getFillTone = (percent: number) =>
  percent >= 90
    ? { bar: "[&>*]:bg-red-500", text: "text-red-600 dark:text-red-400" }
    : percent >= 75
      ? {
          bar: "[&>*]:bg-amber-500",
          text: "text-amber-600 dark:text-amber-400",
        }
      : {
          bar: "[&>*]:bg-emerald-500",
          text: "text-emerald-600 dark:text-emerald-400",
        };

const getInitials = (first?: string, last?: string) =>
  `${first?.charAt(0) ?? ""}${last?.charAt(0) ?? ""}`.toUpperCase() || "?";

export const ClassCard = ({ cls, delay }: { cls: Class; delay: number }) => {
  const t = useTranslations("classes");
  const enrolled = cls.enrollments?.length ?? 0;
  const percent =
    cls.capacity > 0
      ? Math.min(100, Math.round((enrolled / cls.capacity) * 100))
      : 0;
  const tone = getFillTone(percent);
  const classTeacher =
    cls.classTeachers?.find((ct) => ct.isPrimary) ?? cls.classTeachers?.[0];
  const teacher = classTeacher?.teacher;

  return (
    <motion.div {...fadeUp(delay)}>
      <Link
        href={`${CLASS_DETAIL_PATH}/${cls.id}`}
        aria-label={`${t("openClass")}: ${t("classLabel")} ${cls.name} ${cls.section}`}
        className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <Card
          className={`${CARD_CLASS} h-full gap-4 p-5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-indigo-500/40 group-hover:shadow-[0_12px_32px_rgba(79,70,229,0.12)]`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-700 font-jakarta text-xl font-bold text-white">
                {cls.name}
                <span className="absolute -right-1.5 -bottom-1.5 flex h-6 min-w-6 items-center justify-center rounded-lg border-2 border-card bg-background px-1 font-jakarta text-[11px] font-bold text-foreground">
                  {cls.section}
                </span>
              </span>
              <div>
                <p className="font-jakarta text-base font-semibold text-foreground">
                  {t("classLabel")} {cls.name}
                </p>
                <p className="font-manrope text-xs text-muted-foreground">
                  {t("sectionLabel")} {cls.section}
                </p>
              </div>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
              <ArrowUpRight className="size-4" />
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              className="gap-1 rounded-md border-border bg-muted font-manrope text-[11px] font-medium text-foreground/80"
            >
              <DoorOpen className="size-3" />
              {cls.roomNumber || t("noRoom")}
            </Badge>
            <Badge
              variant="outline"
              className="gap-1 rounded-md border-border bg-muted font-manrope text-[11px] font-medium text-foreground/80"
            >
              <Users className="size-3" />
              {cls.capacity} {t("seats")}
            </Badge>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between font-manrope text-xs">
              <span className="text-muted-foreground">
                {enrolled} / {cls.capacity} {t("enrolled")}
              </span>
              <span className={`font-semibold ${tone.text}`}>{percent}%</span>
            </div>
            <Progress
              value={percent}
              className={`h-1.5 bg-muted ${tone.bar}`}
            />
          </div>

          <Separator className="mt-auto" />

          {teacher ? (
            <div className="flex items-center gap-2.5">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-emerald-500/15 font-jakarta text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  {getInitials(teacher.firstName, teacher.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-manrope text-[10px] text-muted-foreground">
                  {t("classTeacher")}
                </p>
                <p className="truncate font-jakarta text-xs font-semibold text-foreground">
                  {teacher.firstName} {teacher.lastName}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-manrope text-xs text-amber-700 dark:text-amber-300">
              <AlertTriangle className="size-3.5" />
              {t("noClassTeacher")}
            </div>
          )}
        </Card>
      </Link>
    </motion.div>
  );
};

export const ClassesGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton key={i} className="h-60 rounded-2xl" />
    ))}
  </div>
);

interface ClassFiltersPopoverProps {
  applied: ClassFilters;
  onApply: (filters: ClassFilters) => void;
  onClear: () => void;
}

export const ClassFiltersPopover = ({
  applied,
  onApply,
  onClear,
}: ClassFiltersPopoverProps) => {
  const t = useTranslations("classes");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<FilterKey, string>>({
    name: "",
    section: "",
    roomNumber: "",
    capacityMin: "",
    capacityMax: "",
  });
  const activeCount = countActiveFilters(applied);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft({
        name: applied.name ?? "",
        section: applied.section ?? "",
        roomNumber: applied.roomNumber ?? "",
        capacityMin:
          applied.capacityMin !== undefined ? String(applied.capacityMin) : "",
        capacityMax:
          applied.capacityMax !== undefined ? String(applied.capacityMax) : "",
      });
    }
    setOpen(next);
  };

  const handleApply = () => {
    const toNumber = (value: string) =>
      value.trim() === "" ? undefined : Number(value);
    onApply({
      name: draft.name.trim() || undefined,
      section: draft.section.trim() || undefined,
      roomNumber: draft.roomNumber.trim() || undefined,
      capacityMin: toNumber(draft.capacityMin),
      capacityMax: toNumber(draft.capacityMax),
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={`h-9 gap-2 px-4 text-xs font-medium ${OUTLINE_PILL_CLASS} ${
            activeCount > 0
              ? "border-indigo-500/40 text-indigo-700 dark:border-indigo-500/40 dark:text-indigo-300"
              : ""
          }`}
        >
          <SlidersHorizontal className="size-3.5" />
          {t("filters")}
          {activeCount > 0 && (
            <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-indigo-600 px-1 font-jakarta text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        className="flex max-h-(--radix-popover-content-available-height) w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl p-0 sm:w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleApply();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="shrink-0 px-4 pt-4 pb-3">
            <p className="font-jakarta text-sm font-semibold text-foreground">
              {t("filtersTitle")}
            </p>
            <p className="mt-0.5 font-manrope text-xs text-muted-foreground">
              {t("filtersSub")}
            </p>
          </div>
          <Separator />
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FILTER_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className={`space-y-1.5 ${field.key === "name" ? "sm:col-span-2" : ""}`}
                >
                  <Label
                    htmlFor={`class-filter-${field.key}`}
                    className="font-manrope text-xs font-normal text-foreground/70"
                  >
                    {t(field.labelKey)}
                  </Label>
                  <Input
                    id={`class-filter-${field.key}`}
                    type={field.numeric ? "number" : "text"}
                    inputMode={field.numeric ? "numeric" : undefined}
                    min={field.numeric ? 0 : undefined}
                    value={draft[field.key]}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    className={fieldClass(false)}
                  />
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div className="flex shrink-0 items-center justify-between gap-2 bg-popover p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className={`h-9 px-4 text-xs ${OUTLINE_PILL_CLASS}`}
            >
              {t("clearFilters")}
            </Button>
            <Button
              type="submit"
              className={`h-9 px-5 text-xs ${PRIMARY_PILL_CLASS}`}
            >
              {t("applyFilters")}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};

interface ClassFilterChipsProps {
  filters: ClassFilters;
  onRemove: (key: FilterKey) => void;
}

export const ClassFilterChips = ({
  filters,
  onRemove,
}: ClassFilterChipsProps) => {
  const t = useTranslations("classes");
  const chips = FILTER_FIELDS.filter(
    (field) => filters[field.key] !== undefined && filters[field.key] !== "",
  );
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((field) => (
        <Badge
          key={field.key}
          variant="outline"
          className={`gap-1 rounded-full py-0.5 pr-1 pl-2.5 font-manrope text-[11px] font-medium ${TONE_CLASSES.indigo}`}
        >
          {t(field.labelKey)}: {filters[field.key]}
          <button
            type="button"
            onClick={() => onRemove(field.key)}
            aria-label={`${t("clearFilters")}: ${t(field.labelKey)}`}
            className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-indigo-500/20"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
};

interface CreateClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  yearName: string;
}

export const CreateClassDialog = ({
  open,
  onOpenChange,
  yearName,
}: CreateClassDialogProps) => {
  const t = useTranslations("classes");
  const { mutate: createClass, isPending } = useCreateClass();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: "", section: "", capacity: 40, roomNumber: "" },
  });

  const nameValue = useWatch({ control, name: "name" });
  const sectionValue = useWatch({ control, name: "section" });

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onSubmit = (formData: ClassFormValues) => {
    createClass(
      { ...formData, section: formData.section.toUpperCase() },
      { onSuccess: () => handleOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-4 space-y-0 text-left">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${TONE_CLASSES.indigo}`}
          >
            <BookOpen className="size-5" />
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

        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-3">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-indigo-700 font-jakarta text-lg font-bold text-white">
            {nameValue || "?"}
            <span className="absolute -right-1.5 -bottom-1.5 flex h-5 min-w-5 items-center justify-center rounded-md border-2 border-card bg-background px-1 font-jakarta text-[10px] font-bold text-foreground">
              {(sectionValue || "?").toUpperCase()}
            </span>
          </span>
          <div className="min-w-0">
            <p className="font-manrope text-[10px] tracking-wider text-muted-foreground uppercase">
              {t("previewLabel")}
            </p>
            <p className="font-jakarta text-sm font-semibold text-foreground">
              {t("classLabel")} {nameValue || "—"} · {t("sectionLabel")}{" "}
              {(sectionValue || "—").toUpperCase()}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="class-name"
                className="font-manrope text-xs font-normal text-foreground/70"
              >
                {t("fieldName")}
              </Label>
              <Input
                id="class-name"
                placeholder="10"
                aria-invalid={!!errors.name}
                className={fieldClass(!!errors.name)}
                {...register("name")}
              />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="class-section"
                className="font-manrope text-xs font-normal text-foreground/70"
              >
                {t("fieldSection")}
              </Label>
              <Input
                id="class-section"
                placeholder="A"
                aria-invalid={!!errors.section}
                className={`${fieldClass(!!errors.section)} uppercase`}
                {...register("section")}
              />
              <FieldError message={errors.section?.message} />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="class-capacity"
                className="font-manrope text-xs font-normal text-foreground/70"
              >
                {t("fieldCapacity")}
              </Label>
              <Input
                id="class-capacity"
                type="number"
                inputMode="numeric"
                min={10}
                max={50}
                aria-invalid={!!errors.capacity}
                className={fieldClass(!!errors.capacity)}
                {...register("capacity", { valueAsNumber: true })}
              />
              <FieldError message={errors.capacity?.message} />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="class-room"
                className="font-manrope text-xs font-normal text-foreground/70"
              >
                {t("fieldRoom")}
              </Label>
              <Input
                id="class-room"
                placeholder="101"
                aria-invalid={!!errors.roomNumber}
                className={fieldClass(!!errors.roomNumber)}
                {...register("roomNumber")}
              />
              <FieldError message={errors.roomNumber?.message} />
            </div>
          </div>

          <p
            className={`flex items-start gap-2 rounded-xl border px-3 py-2 font-manrope text-xs ${TONE_CLASSES.indigo}`}
          >
            <Info className="mt-0.5 size-3.5 shrink-0" />
            {yearName
              ? t("createYearNote").replace("{year}", yearName)
              : t("createYearNoteFallback")}
          </p>

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

export const TeacherIcon = UserCheck;
