"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Clock,
  GraduationCap,
  Inbox,
  SlidersHorizontal,
  Star,
  X,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TONE_CLASSES } from "@/components/dashboard/DashboardWidgets";
import {
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import { useTranslations } from "@/hooks/useTranslations";
import { ApplicationStatus, Gender, TeacherApplicationListItem } from "@/types";

export const DETAIL_PATH = "/admin/teacher-applications";

export const STATUS_CONFIG = {
  [ApplicationStatus.PENDING]: {
    labelKey: "statusPending",
    icon: Clock,
    dot: "bg-amber-500",
    className: TONE_CLASSES.amber,
  },
  [ApplicationStatus.SHORTLISTED]: {
    labelKey: "statusShortlisted",
    icon: Star,
    dot: "bg-indigo-500",
    className: TONE_CLASSES.indigo,
  },
  [ApplicationStatus.SELECTED]: {
    labelKey: "statusSelected",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
    className: TONE_CLASSES.emerald,
  },
  [ApplicationStatus.REJECTED]: {
    labelKey: "statusRejected",
    icon: XCircle,
    dot: "bg-red-500",
    className: TONE_CLASSES.red,
  },
} as const;

export const STATUS_FILTERS = [
  "ALL",
  ...Object.values(ApplicationStatus),
] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const GENDER_LABEL_KEYS = {
  [Gender.MALE]: "genderMale",
  [Gender.FEMALE]: "genderFemale",
  [Gender.OTHER]: "genderOther",
} as const;

export interface TeacherFilters {
  name?: string;
  email?: string;
  qualification?: string;
  specialization?: string;
  gender?: Gender;
}

export type TextFilterKey =
  | "name"
  | "email"
  | "qualification"
  | "specialization";

const TEXT_FILTERS: {
  key: TextFilterKey;
  labelKey:
    | "filterName"
    | "filterEmail"
    | "filterQualification"
    | "filterSpecialization";
}[] = [
  { key: "name", labelKey: "filterName" },
  { key: "email", labelKey: "filterEmail" },
  { key: "qualification", labelKey: "filterQualification" },
  { key: "specialization", labelKey: "filterSpecialization" },
];

const ANY_GENDER = "ANY";

const AVATAR_PALETTE = [
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
];

const RELATIVE_FORMAT = new Intl.RelativeTimeFormat("en-IN", {
  numeric: "auto",
});
const DAY_MS = 86_400_000;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatRelative = (iso: string, now: number) => {
  const diffDays = Math.round((new Date(iso).getTime() - now) / DAY_MS);
  if (Math.abs(diffDays) >= 30) {
    return RELATIVE_FORMAT.format(Math.round(diffDays / 30), "month");
  }
  return RELATIVE_FORMAT.format(diffDays, "day");
};

const getAvatarClass = (seed: string) => {
  const hash = Array.from(seed).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

export const countActiveFilters = (filters: TeacherFilters) =>
  Object.values(filters).filter((value) => value !== undefined && value !== "")
    .length;

export const matchesFilters = (
  app: TeacherApplicationListItem,
  filters: TeacherFilters,
) => {
  const includes = (source: string | null | undefined, query?: string) =>
    !query || (source ?? "").toLowerCase().includes(query.toLowerCase());
  return (
    includes(`${app.firstName} ${app.lastName}`, filters.name) &&
    includes(app.email, filters.email) &&
    includes(app.qualification, filters.qualification) &&
    includes(app.specialization, filters.specialization) &&
    (!filters.gender || app.gender === filters.gender)
  );
};

export const StatusBadge = ({ status }: { status: ApplicationStatus }) => {
  const t = useTranslations("teacherApplications");
  const config =
    STATUS_CONFIG[status] ?? STATUS_CONFIG[ApplicationStatus.PENDING];
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

const ApplicantAvatar = ({ app }: { app: TeacherApplicationListItem }) => (
  <Avatar className="h-10 w-10">
    <AvatarFallback
      className={`font-jakarta text-xs font-bold ${getAvatarClass(app.id)}`}
    >
      {`${app.firstName.charAt(0)}${app.lastName.charAt(0)}`.toUpperCase()}
    </AvatarFallback>
  </Avatar>
);

interface FiltersPopoverProps {
  applied: TeacherFilters;
  onApply: (filters: TeacherFilters) => void;
  onClear: () => void;
}

export const FiltersPopover = ({
  applied,
  onApply,
  onClear,
}: FiltersPopoverProps) => {
  const t = useTranslations("teacherApplications");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TeacherFilters>(applied);
  const activeCount = countActiveFilters(applied);

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(applied);
    setOpen(next);
  };

  const handleApply = () => {
    onApply(draft);
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
              {TEXT_FILTERS.map((filter) => (
                <div key={filter.key} className="space-y-1.5">
                  <Label
                    htmlFor={`teacher-filter-${filter.key}`}
                    className="font-manrope text-xs font-normal text-foreground/70"
                  >
                    {t(filter.labelKey)}
                  </Label>
                  <Input
                    id={`teacher-filter-${filter.key}`}
                    value={draft[filter.key] ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [filter.key]: e.target.value || undefined,
                      }))
                    }
                    className={fieldClass(false)}
                  />
                </div>
              ))}
              <div className="space-y-1.5 sm:col-span-2">
                <Label
                  htmlFor="teacher-filter-gender"
                  className="font-manrope text-xs font-normal text-foreground/70"
                >
                  {t("filterGender")}
                </Label>
                <Select
                  value={draft.gender ?? ANY_GENDER}
                  onValueChange={(value: string) => {
                    const gender = Object.values(Gender).find(
                      (g) => g === value,
                    );
                    setDraft((prev) => ({ ...prev, gender }));
                  }}
                >
                  <SelectTrigger
                    id="teacher-filter-gender"
                    className={`${fieldClass(false)} w-full data-[size=default]:h-10 dark:hover:bg-card`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem
                      value={ANY_GENDER}
                      className="font-manrope text-sm"
                    >
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
          </div>
          <Separator />
          <div className="flex shrink-0 items-center justify-between gap-2 bg-popover p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDraft({});
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

interface ActiveFilterChipsProps {
  filters: TeacherFilters;
  onRemove: (key: keyof TeacherFilters) => void;
}

export const ActiveFilterChips = ({
  filters,
  onRemove,
}: ActiveFilterChipsProps) => {
  const t = useTranslations("teacherApplications");
  const chips = [
    ...TEXT_FILTERS.filter((f) => filters[f.key]).map((f) => ({
      key: f.key as keyof TeacherFilters,
      label: `${t(f.labelKey)}: ${filters[f.key]}`,
    })),
    ...(filters.gender
      ? [
          {
            key: "gender" as const,
            label: `${t("filterGender")}: ${t(GENDER_LABEL_KEYS[filters.gender])}`,
          },
        ]
      : []),
  ];
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

export const TeacherEmptyState = ({ onClear }: { onClear?: () => void }) => {
  const t = useTranslations("teacherApplications");
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
        <Inbox className="size-6 text-muted-foreground" />
      </span>
      <div>
        <p className="font-jakarta text-sm font-semibold text-foreground">
          {t("emptyTitle")}
        </p>
        <p className="mt-1 font-manrope text-xs text-muted-foreground">
          {t("emptySubtitle")}
        </p>
      </div>
      {onClear && (
        <Button
          type="button"
          variant="outline"
          onClick={onClear}
          className={`h-8 px-4 text-xs ${OUTLINE_PILL_CLASS}`}
        >
          {t("clearFilters")}
        </Button>
      )}
    </div>
  );
};

const REVIEW_BUTTON_CLASS =
  "h-8 gap-1 rounded-full border-border bg-transparent px-3 font-manrope text-xs font-medium text-foreground/80 shadow-none transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground dark:border-border dark:bg-transparent dark:hover:border-primary dark:hover:bg-primary dark:hover:text-primary-foreground dark:group-hover:border-primary dark:group-hover:bg-primary dark:group-hover:text-primary-foreground";

interface TeacherApplicationsTableProps {
  applications: TeacherApplicationListItem[];
  now: number;
}

export const TeacherApplicationsTable = ({
  applications,
  now,
}: TeacherApplicationsTableProps) => {
  const t = useTranslations("teacherApplications");
  const router = useRouter();
  const headClass =
    "h-11 px-5 font-manrope text-[11px] font-medium tracking-wider text-muted-foreground uppercase";

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className={headClass}>{t("colName")}</TableHead>
              <TableHead className={headClass}>
                {t("colQualification")}
              </TableHead>
              <TableHead className={headClass}>{t("colExperience")}</TableHead>
              <TableHead className={headClass}>{t("colApplied")}</TableHead>
              <TableHead className={headClass}>{t("colStatus")}</TableHead>
              <TableHead className={`${headClass} text-right`}>
                {t("colAction")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow
                key={app.id}
                onClick={() => router.push(`${DETAIL_PATH}/${app.id}`)}
                className="group cursor-pointer border-border transition-colors hover:bg-muted/60"
              >
                <TableCell className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <ApplicantAvatar app={app} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate font-jakarta text-sm font-semibold text-foreground">
                        {app.firstName} {app.lastName}
                        <span className="font-manrope text-[10px] font-normal text-muted-foreground">
                          {t(GENDER_LABEL_KEYS[app.gender])}
                        </span>
                      </p>
                      <p className="max-w-56 truncate font-manrope text-[11px] text-muted-foreground">
                        {app.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <p className="flex items-center gap-1.5 font-manrope text-sm text-foreground/85">
                    <GraduationCap className="size-3.5 text-muted-foreground" />
                    {app.qualification}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 font-manrope text-[11px] text-muted-foreground">
                    <Briefcase className="size-3" />
                    {app.specialization ?? "—"}
                  </p>
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <Badge
                    variant="outline"
                    className="rounded-md border-border bg-muted font-manrope text-xs font-medium text-foreground/80"
                  >
                    {app.experience} {t("years")}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <p className="font-manrope text-sm text-foreground/85">
                    {formatDate(app.appliedAt)}
                  </p>
                  <p className="mt-0.5 font-manrope text-[11px] text-muted-foreground">
                    {formatRelative(app.appliedAt, now)}
                  </p>
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <StatusBadge status={app.status} />
                </TableCell>
                <TableCell className="px-5 py-3.5 text-right">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className={REVIEW_BUTTON_CLASS}
                  >
                    <Link href={`${DETAIL_PATH}/${app.id}`}>
                      {t("review")}
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y divide-border md:hidden">
        {applications.map((app) => (
          <Link
            key={app.id}
            href={`${DETAIL_PATH}/${app.id}`}
            className="flex items-start gap-3 px-4 py-4 transition-colors active:bg-muted"
          >
            <ApplicantAvatar app={app} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate font-jakarta text-sm font-semibold text-foreground">
                  {app.firstName} {app.lastName}
                </p>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
              </div>
              <p className="mt-0.5 truncate font-manrope text-xs text-muted-foreground">
                {app.email}
              </p>
              <p className="mt-1 truncate font-manrope text-xs text-foreground/70">
                {app.qualification} · {app.experience} {t("years")}
                {app.specialization ? ` · ${app.specialization}` : ""}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <StatusBadge status={app.status} />
                <span className="font-manrope text-[11px] text-muted-foreground">
                  {formatRelative(app.appliedAt, now)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
};
