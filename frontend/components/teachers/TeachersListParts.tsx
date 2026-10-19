"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Briefcase,
  CalendarDays,
  Eye,
  GraduationCap,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import { useTranslations } from "@/hooks/useTranslations";
import { EmploymentStatus, Gender, TeacherListItem } from "@/types";

export const TEACHER_DETAIL_PATH = "/admin/teachers";

const SLATE_TONE =
  "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300";

export const STATUS_CONFIG = {
  [EmploymentStatus.ACTIVE]: {
    labelKey: "statusActive",
    dot: "bg-emerald-500",
    className: TONE_CLASSES.emerald,
  },
  [EmploymentStatus.ON_LEAVE]: {
    labelKey: "statusOnLeave",
    dot: "bg-violet-500",
    className: TONE_CLASSES.violet,
  },
  [EmploymentStatus.INACTIVE]: {
    labelKey: "statusInactive",
    dot: "bg-slate-400",
    className: SLATE_TONE,
  },
  [EmploymentStatus.SUSPENDED]: {
    labelKey: "statusSuspended",
    dot: "bg-amber-500",
    className: TONE_CLASSES.amber,
  },
  [EmploymentStatus.TERMINATED]: {
    labelKey: "statusTerminated",
    dot: "bg-red-500",
    className: TONE_CLASSES.red,
  },
} as const;

export const STATUS_FILTERS = [
  "ALL",
  EmploymentStatus.ACTIVE,
  EmploymentStatus.ON_LEAVE,
  EmploymentStatus.INACTIVE,
  EmploymentStatus.SUSPENDED,
  EmploymentStatus.TERMINATED,
] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

const GENDER_LABEL_KEYS = {
  [Gender.MALE]: "genderMale",
  [Gender.FEMALE]: "genderFemale",
  [Gender.OTHER]: "genderOther",
} as const;

const ANY = "ANY";

const AVATAR_PALETTE = [
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
];

export interface TeacherFilters {
  name?: string;
  city?: string;
  state?: string;
  qualification?: string;
  experience?: number;
  gender?: Gender;
}

type TextKey = "name" | "city" | "state" | "qualification";

const TEXT_FIELDS: {
  key: TextKey;
  labelKey: "filterName" | "filterCity" | "filterState" | "filterQualification";
}[] = [
  { key: "name", labelKey: "filterName" },
  { key: "city", labelKey: "filterCity" },
  { key: "state", labelKey: "filterState" },
  { key: "qualification", labelKey: "filterQualification" },
];

const getAvatarClass = (seed?: string | null) => {
  const hash = Array.from(seed ?? "").reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

const getInitials = (first?: string, last?: string) =>
  `${first?.charAt(0) ?? ""}${last?.charAt(0) ?? ""}`.toUpperCase() || "?";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const countActiveFilters = (filters: TeacherFilters) =>
  Object.values(filters).filter((value) => value !== undefined && value !== "")
    .length;

export const TeacherStatusBadge = ({
  status,
}: {
  status: EmploymentStatus;
}) => {
  const t = useTranslations("teachersList");
  const config =
    STATUS_CONFIG[status] ?? STATUS_CONFIG[EmploymentStatus.INACTIVE];
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-full px-2.5 py-0.5 font-manrope text-[11px] font-medium ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {t(config.labelKey)}
    </Badge>
  );
};

const TeacherAvatar = ({
  teacher,
  size = "md",
}: {
  teacher: TeacherListItem;
  size?: "md" | "lg";
}) => (
  <Avatar className={size === "lg" ? "h-14 w-14" : "h-10 w-10"}>
    <AvatarFallback
      className={`font-jakarta font-bold ${size === "lg" ? "text-base" : "text-xs"} ${getAvatarClass(teacher.id)}`}
    >
      {getInitials(teacher.firstName, teacher.lastName)}
    </AvatarFallback>
  </Avatar>
);

const TeacherActionsMenu = ({ teacher }: { teacher: TeacherListItem }) => {
  const t = useTranslations("teachersList");
  const email = teacher.user?.email ?? null;
  const phone = teacher.user?.phone ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(e) => e.stopPropagation()}
          aria-label={t("actions")}
          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 rounded-xl p-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem
          asChild
          className="cursor-pointer gap-2 rounded-lg font-manrope text-xs"
        >
          <Link href={`${TEACHER_DETAIL_PATH}/${teacher.id}`}>
            <Eye className="size-3.5" />
            {t("viewProfile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          disabled={!email}
          className="cursor-pointer gap-2 rounded-lg font-manrope text-xs"
        >
          <a href={email ? `mailto:${email}` : undefined}>
            <Mail className="size-3.5" />
            {t("emailTeacher")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          disabled={!phone}
          className="cursor-pointer gap-2 rounded-lg font-manrope text-xs"
        >
          <a href={phone ? `tel:${phone}` : undefined}>
            <Phone className="size-3.5" />
            {t("callTeacher")}
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface TeachersViewProps {
  teachers: TeacherListItem[];
}

export const TeachersGrid = ({ teachers }: TeachersViewProps) => {
  const t = useTranslations("teachersList");

  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
      {teachers.map((teacher, i) => (
        <motion.div key={teacher.id} {...fadeUp(Math.min(i * 0.03, 0.3))}>
          <Card
            className={`${CARD_CLASS} h-full gap-4 p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-500/40`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <TeacherAvatar teacher={teacher} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-jakarta text-base font-semibold text-foreground">
                    {teacher.firstName} {teacher.lastName}
                  </p>
                  <p className="truncate font-manrope text-xs text-muted-foreground">
                    {t(GENDER_LABEL_KEYS[teacher.gender])} ·{" "}
                    {teacher.user?.email ?? "—"}
                  </p>
                </div>
              </div>
              <TeacherActionsMenu teacher={teacher} />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <TeacherStatusBadge status={teacher.employmentStatus} />
              <Badge
                variant="outline"
                className={`rounded-md font-manrope text-[11px] font-medium ${TONE_CLASSES.indigo}`}
              >
                {teacher.specialization ?? t("noSpecialization")}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <GraduationCap className="size-4 text-muted-foreground" />
                <p className="mt-1.5 truncate font-jakarta text-sm font-semibold text-foreground">
                  {teacher.qualification}
                </p>
                <p className="font-manrope text-[10px] text-muted-foreground">
                  {t("colQualification")}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <Briefcase className="size-4 text-muted-foreground" />
                <p className="mt-1.5 font-jakarta text-sm font-semibold text-foreground">
                  {teacher.experience}{" "}
                  {teacher.experience === 1 ? t("year") : t("years")}
                </p>
                <p className="font-manrope text-[10px] text-muted-foreground">
                  {t("colExperience")}
                </p>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 font-manrope text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {teacher.city}, {teacher.state}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {t("joined")} {formatDate(teacher.joiningDate)}
                </span>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className={`h-9 w-full gap-1 text-xs ${OUTLINE_PILL_CLASS}`}
              >
                <Link href={`${TEACHER_DETAIL_PATH}/${teacher.id}`}>
                  {t("viewProfile")}
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export const TeachersTable = ({ teachers }: TeachersViewProps) => {
  const t = useTranslations("teachersList");
  const router = useRouter();
  const headClass =
    "h-11 px-5 font-manrope text-[11px] font-medium tracking-wider text-muted-foreground uppercase";

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className={headClass}>{t("colTeacher")}</TableHead>
              <TableHead className={headClass}>{t("colGender")}</TableHead>
              <TableHead className={headClass}>
                {t("colSpecialization")}
              </TableHead>
              <TableHead className={headClass}>
                {t("colQualification")}
              </TableHead>
              <TableHead className={headClass}>{t("colExperience")}</TableHead>
              <TableHead className={headClass}>{t("colStatus")}</TableHead>
              <TableHead className={`${headClass} text-right`}>
                {t("colAction")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map((teacher) => (
              <TableRow
                key={teacher.id}
                onClick={() =>
                  router.push(`${TEACHER_DETAIL_PATH}/${teacher.id}`)
                }
                className="group cursor-pointer border-border transition-colors hover:bg-muted/60"
              >
                <TableCell className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <TeacherAvatar teacher={teacher} />
                    <div className="min-w-0">
                      <p className="truncate font-jakarta text-sm font-semibold text-foreground">
                        {teacher.firstName} {teacher.lastName}
                      </p>
                      <p className="flex items-center gap-1 truncate font-manrope text-[11px] text-muted-foreground">
                        <MapPin className="size-3" />
                        {teacher.city}, {teacher.state}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-3 font-manrope text-sm text-foreground/80">
                  {t(GENDER_LABEL_KEYS[teacher.gender])}
                </TableCell>
                <TableCell className="px-5 py-3">
                  {teacher.specialization ? (
                    <Badge
                      variant="outline"
                      className={`rounded-md font-manrope text-[11px] font-medium ${TONE_CLASSES.indigo}`}
                    >
                      {teacher.specialization}
                    </Badge>
                  ) : (
                    <span className="font-manrope text-xs text-muted-foreground italic">
                      {t("noSpecialization")}
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-5 py-3 font-manrope text-sm text-foreground/85">
                  {teacher.qualification}
                </TableCell>
                <TableCell className="px-5 py-3">
                  <Badge
                    variant="outline"
                    className="rounded-md border-border bg-muted font-manrope text-xs font-medium text-foreground/80"
                  >
                    {teacher.experience}{" "}
                    {teacher.experience === 1 ? t("year") : t("years")}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-3">
                  <TeacherStatusBadge status={teacher.employmentStatus} />
                </TableCell>
                <TableCell className="px-5 py-3 text-right">
                  <TeacherActionsMenu teacher={teacher} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="md:hidden">
        <TeachersGrid teachers={teachers} />
      </div>
    </>
  );
};

export const TeachersSkeleton = ({ view }: { view: "table" | "grid" }) =>
  view === "grid" ? (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-72 rounded-2xl" />
      ))}
    </div>
  ) : (
    <div className="space-y-1 p-4 sm:p-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="hidden h-6 w-20 rounded-full md:block" />
        </div>
      ))}
    </div>
  );

interface TeacherFiltersPopoverProps {
  applied: TeacherFilters;
  onApply: (filters: TeacherFilters) => void;
  onClear: () => void;
}

export const TeacherFiltersPopover = ({
  applied,
  onApply,
  onClear,
}: TeacherFiltersPopoverProps) => {
  const t = useTranslations("teachersList");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<
    Record<TextKey | "experience", string> & { gender?: Gender }
  >({
    name: "",
    city: "",
    state: "",
    qualification: "",
    experience: "",
  });
  const activeCount = countActiveFilters(applied);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft({
        name: applied.name ?? "",
        city: applied.city ?? "",
        state: applied.state ?? "",
        qualification: applied.qualification ?? "",
        experience:
          applied.experience !== undefined ? String(applied.experience) : "",
        gender: applied.gender,
      });
    }
    setOpen(next);
  };

  const handleApply = () => {
    const experience =
      draft.experience.trim() === "" ? undefined : Number(draft.experience);
    onApply({
      name: draft.name.trim() || undefined,
      city: draft.city.trim() || undefined,
      state: draft.state.trim() || undefined,
      qualification: draft.qualification.trim() || undefined,
      experience:
        experience !== undefined && !Number.isNaN(experience)
          ? experience
          : undefined,
      gender: draft.gender,
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
              {TEXT_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label
                    htmlFor={`teacher-list-${field.key}`}
                    className="font-manrope text-xs font-normal text-foreground/70"
                  >
                    {t(field.labelKey)}
                  </Label>
                  <Input
                    id={`teacher-list-${field.key}`}
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
              <div className="space-y-1.5">
                <Label
                  htmlFor="teacher-list-experience"
                  className="font-manrope text-xs font-normal text-foreground/70"
                >
                  {t("filterExperience")}
                </Label>
                <Input
                  id="teacher-list-experience"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={draft.experience}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      experience: e.target.value,
                    }))
                  }
                  className={fieldClass(false)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-manrope text-xs font-normal text-foreground/70">
                  {t("filterGender")}
                </Label>
                <Select
                  value={draft.gender ?? ANY}
                  onValueChange={(value: string) =>
                    setDraft((prev) => ({
                      ...prev,
                      gender: Object.values(Gender).find((g) => g === value),
                    }))
                  }
                >
                  <SelectTrigger
                    className={`${fieldClass(false)} w-full data-[size=default]:h-10 dark:hover:bg-card`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value={ANY} className="font-manrope text-sm">
                      {t("anyGender")}
                    </SelectItem>
                    {Object.values(Gender).map((gender) => (
                      <SelectItem
                        key={gender}
                        value={gender}
                        className="font-manrope text-sm"
                      >
                        {t(GENDER_LABEL_KEYS[gender])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="mt-3 font-manrope text-[11px] text-muted-foreground">
              {t("namePageHint")}
            </p>
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

interface TeacherFilterChipsProps {
  filters: TeacherFilters;
  onRemove: (key: keyof TeacherFilters) => void;
}

export const TeacherFilterChips = ({
  filters,
  onRemove,
}: TeacherFilterChipsProps) => {
  const t = useTranslations("teachersList");
  const chips: { key: keyof TeacherFilters; label: string }[] = [
    ...TEXT_FIELDS.filter((f) => filters[f.key]).map((f) => ({
      key: f.key,
      label: `${t(f.labelKey)}: ${filters[f.key]}`,
    })),
  ];
  if (filters.experience !== undefined) {
    chips.push({
      key: "experience",
      label: `${t("filterExperience")}: ${filters.experience} ${t("years")}`,
    });
  }
  if (filters.gender) {
    chips.push({
      key: "gender",
      label: `${t("filterGender")}: ${t(GENDER_LABEL_KEYS[filters.gender])}`,
    });
  }
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="outline"
          className={`gap-1 rounded-full py-0.5 pr-1 pl-2.5 font-manrope text-[11px] font-medium ${TONE_CLASSES.indigo}`}
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            aria-label={`${t("clearFilters")}: ${chip.label}`}
            className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-indigo-500/20"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
};
