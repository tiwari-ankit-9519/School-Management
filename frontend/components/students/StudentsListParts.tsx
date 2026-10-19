"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  CalendarDays,
  Eye,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useGetAllClasses } from "@/hooks/useClass";
import { useTranslations } from "@/hooks/useTranslations";
import {
  AcademicYear,
  EnrollmentListItem,
  EnrollmentStatus,
  Gender,
  ParentType,
} from "@/types";

export const STUDENT_DETAIL_PATH = "/admin/students";

const SLATE_TONE =
  "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300";
const SKY_TONE =
  "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";

export const STATUS_CONFIG = {
  [EnrollmentStatus.ACTIVE]: {
    labelKey: "status_ACTIVE",
    dot: "bg-emerald-500",
    className: TONE_CLASSES.emerald,
  },
  [EnrollmentStatus.INACTIVE]: {
    labelKey: "status_INACTIVE",
    dot: "bg-slate-400",
    className: SLATE_TONE,
  },
  [EnrollmentStatus.SUSPENDED]: {
    labelKey: "status_SUSPENDED",
    dot: "bg-amber-500",
    className: TONE_CLASSES.amber,
  },
  [EnrollmentStatus.GRADUATED]: {
    labelKey: "status_GRADUATED",
    dot: "bg-sky-500",
    className: SKY_TONE,
  },
  [EnrollmentStatus.TRANSFERRED]: {
    labelKey: "status_TRANSFERRED",
    dot: "bg-indigo-500",
    className: TONE_CLASSES.indigo,
  },
  [EnrollmentStatus.EXPELLED]: {
    labelKey: "status_EXPELLED",
    dot: "bg-red-500",
    className: TONE_CLASSES.red,
  },
  [EnrollmentStatus.WITHDRAWN]: {
    labelKey: "status_WITHDRAWN",
    dot: "bg-rose-400",
    className: TONE_CLASSES.red,
  },
} as const;

export const STATUS_FILTERS = [
  "ALL",
  ...Object.values(EnrollmentStatus),
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

export interface StudentFilters {
  academicYearId?: string;
  classId?: string;
  gender?: Gender;
}

type Guardian = EnrollmentListItem["student"]["parentLinks"][number];

const getPrimaryGuardian = (links: Guardian[] | undefined): Guardian | null => {
  if (!links || links.length === 0) return null;
  return (
    links.find((l) => l.parentType === ParentType.FATHER) ??
    links.find((l) => l.parentType === ParentType.MOTHER) ??
    links[0]
  );
};

const getAvatarClass = (seed?: string | null) => {
  const hash = Array.from(seed ?? "").reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

const getInitials = (first?: string, last?: string) =>
  `${first?.charAt(0) ?? ""}${last?.charAt(0) ?? ""}`.toUpperCase() || "?";

const getAge = (dob: string, now: number) => {
  const birth = new Date(dob);
  const today = new Date(now);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()))
    age--;
  return age;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const countActiveFilters = (filters: StudentFilters) =>
  Object.values(filters).filter((value) => value !== undefined && value !== "")
    .length;

export const StudentStatusBadge = ({
  status,
}: {
  status: EnrollmentStatus;
}) => {
  const t = useTranslations("studentsList");
  const config =
    STATUS_CONFIG[status] ?? STATUS_CONFIG[EnrollmentStatus.INACTIVE];
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

const StudentAvatar = ({
  item,
  size = "md",
}: {
  item: EnrollmentListItem;
  size?: "md" | "lg";
}) => (
  <Avatar className={size === "lg" ? "h-14 w-14" : "h-10 w-10"}>
    <AvatarFallback
      className={`font-jakarta font-bold ${size === "lg" ? "text-base" : "text-xs"} ${getAvatarClass(item.studentId)}`}
    >
      {getInitials(item.student.firstName, item.student.lastName)}
    </AvatarFallback>
  </Avatar>
);

const StudentActionsMenu = ({ item }: { item: EnrollmentListItem }) => {
  const t = useTranslations("studentsList");
  const guardian = getPrimaryGuardian(item.student.parentLinks);
  const phone =
    guardian?.parent.user.phone ?? guardian?.parent.alternatePhone ?? null;
  const email = guardian?.parent.user.email ?? null;

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
          <Link href={`${STUDENT_DETAIL_PATH}/${item.studentId}`}>
            <Eye className="size-3.5" />
            {t("viewProfile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          disabled={!phone}
          className="cursor-pointer gap-2 rounded-lg font-manrope text-xs"
        >
          <a href={phone ? `tel:${phone}` : undefined}>
            <Phone className="size-3.5" />
            {t("callGuardian")}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          asChild
          disabled={!email}
          className="cursor-pointer gap-2 rounded-lg font-manrope text-xs"
        >
          <a href={email ? `mailto:${email}` : undefined}>
            <Mail className="size-3.5" />
            {t("emailGuardian")}
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface StudentsViewProps {
  items: EnrollmentListItem[];
  now: number;
}

export const StudentsTable = ({ items, now }: StudentsViewProps) => {
  const t = useTranslations("studentsList");
  const router = useRouter();
  const headClass =
    "h-11 px-5 font-manrope text-[11px] font-medium tracking-wider text-muted-foreground uppercase";

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className={headClass}>{t("colStudent")}</TableHead>
              <TableHead className={headClass}>{t("colClass")}</TableHead>
              <TableHead className={headClass}>{t("colGender")}</TableHead>
              <TableHead className={headClass}>{t("colGuardian")}</TableHead>
              <TableHead className={headClass}>{t("colStatus")}</TableHead>
              <TableHead className={`${headClass} text-right`}>
                {t("colAction")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const guardian = getPrimaryGuardian(item.student.parentLinks);
              const phone =
                guardian?.parent.user.phone ?? guardian?.parent.alternatePhone;
              return (
                <TableRow
                  key={item.studentId}
                  onClick={() =>
                    router.push(`${STUDENT_DETAIL_PATH}/${item.studentId}`)
                  }
                  className="group cursor-pointer border-border transition-colors hover:bg-muted/60"
                >
                  <TableCell className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <StudentAvatar item={item} />
                      <div className="min-w-0">
                        <p className="truncate font-jakarta text-sm font-semibold text-foreground">
                          {item.student.firstName} {item.student.lastName}
                        </p>
                        <p className="truncate font-manrope text-[11px] text-muted-foreground">
                          {getAge(item.student.dateOfBirth, now)}{" "}
                          {t("yearsOld")} · {item.student.city}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    <Badge
                      variant="outline"
                      className={`rounded-md font-jakarta text-xs font-semibold ${TONE_CLASSES.indigo}`}
                    >
                      {item.class.name}-{item.class.section}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-3 font-manrope text-sm text-foreground/80">
                    {t(GENDER_LABEL_KEYS[item.student.gender])}
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    {guardian ? (
                      <>
                        <p className="truncate font-manrope text-sm text-foreground/85">
                          {guardian.parent.firstName} {guardian.parent.lastName}
                        </p>
                        {phone && (
                          <p className="mt-0.5 flex items-center gap-1 font-manrope text-[11px] text-muted-foreground">
                            <Phone className="size-3" />
                            {phone}
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="font-manrope text-xs text-muted-foreground italic">
                        {t("noGuardian")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-3">
                    <StudentStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="px-5 py-3 text-right">
                    <StudentActionsMenu item={item} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="md:hidden">
        <StudentsGrid items={items} now={now} />
      </div>
    </>
  );
};

export const StudentsGrid = ({ items, now }: StudentsViewProps) => {
  const t = useTranslations("studentsList");

  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
      {items.map((item, i) => {
        const guardian = getPrimaryGuardian(item.student.parentLinks);
        const phone =
          guardian?.parent.user.phone ?? guardian?.parent.alternatePhone;
        return (
          <motion.div key={item.studentId} {...fadeUp(Math.min(i * 0.03, 0.3))}>
            <Card
              className={`${CARD_CLASS} h-full gap-4 p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-500/40`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <StudentAvatar item={item} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-jakarta text-base font-semibold text-foreground">
                      {item.student.firstName} {item.student.lastName}
                    </p>
                    <p className="font-manrope text-xs text-muted-foreground">
                      {t(GENDER_LABEL_KEYS[item.student.gender])} ·{" "}
                      {getAge(item.student.dateOfBirth, now)} {t("yearsOld")}
                    </p>
                  </div>
                </div>
                <StudentActionsMenu item={item} />
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant="outline"
                  className={`rounded-md font-jakarta text-xs font-semibold ${TONE_CLASSES.indigo}`}
                >
                  {t("classLabel")} {item.class.name}-{item.class.section}
                </Badge>
                <StudentStatusBadge status={item.status} />
              </div>

              <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3 font-manrope text-xs">
                <p className="flex items-center gap-2 text-foreground/85">
                  <Users className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {guardian
                      ? `${guardian.parent.firstName} ${guardian.parent.lastName}`
                      : t("noGuardian")}
                  </span>
                </p>
                <p className="flex items-center gap-2 text-foreground/85">
                  <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                  {phone ?? "—"}
                </p>
                <p className="flex items-center gap-2 text-foreground/85">
                  <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    {item.student.city}, {item.student.state}
                  </span>
                </p>
              </div>

              <div className="mt-auto flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-manrope text-[11px] text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  {t("admittedOn")} {formatDate(item.student.admissionDate)}
                </span>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className={`h-8 gap-1 px-3 text-xs ${OUTLINE_PILL_CLASS}`}
                >
                  <Link href={`${STUDENT_DETAIL_PATH}/${item.studentId}`}>
                    {t("viewProfile")}
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export const StudentsSkeleton = ({ view }: { view: "table" | "grid" }) =>
  view === "grid" ? (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-2xl" />
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

interface StudentFiltersPopoverProps {
  applied: StudentFilters;
  years: AcademicYear[];
  defaultYearId: string;
  onApply: (filters: StudentFilters) => void;
  onClear: () => void;
}

export const StudentFiltersPopover = ({
  applied,
  years,
  defaultYearId,
  onApply,
  onClear,
}: StudentFiltersPopoverProps) => {
  const t = useTranslations("studentsList");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<StudentFilters>(applied);
  const activeCount = countActiveFilters(applied);
  const classYearId = draft.academicYearId ?? defaultYearId;

  const { data: classesData } = useGetAllClasses(
    { academicYearId: classYearId },
    1,
    100,
  );
  const classes = classesData?.data ?? [];

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(applied);
    setOpen(next);
  };

  const selectClass = "w-full data-[size=default]:h-10 dark:hover:bg-card";

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
        className="flex max-h-(--radix-popover-content-available-height) w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl p-0 sm:w-sm"
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
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          <div className="space-y-1.5">
            <Label className="font-manrope text-xs font-normal text-foreground/70">
              {t("filterAcademicYear")}
            </Label>
            <Select
              value={draft.academicYearId ?? ANY}
              onValueChange={(value: string) =>
                setDraft((prev) => ({
                  ...prev,
                  academicYearId: value === ANY ? undefined : value,
                  classId: undefined,
                }))
              }
            >
              <SelectTrigger className={`${fieldClass(false)} ${selectClass}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value={ANY} className="font-manrope text-sm">
                  {t("anyYear")}
                </SelectItem>
                {years.map((year) => (
                  <SelectItem
                    key={year.id}
                    value={year.id}
                    className="font-manrope text-sm"
                  >
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="font-manrope text-xs font-normal text-foreground/70">
              {t("filterClass")}
            </Label>
            <Select
              value={draft.classId ?? ANY}
              onValueChange={(value: string) =>
                setDraft((prev) => ({
                  ...prev,
                  classId: value === ANY ? undefined : value,
                }))
              }
              disabled={!classYearId}
            >
              <SelectTrigger className={`${fieldClass(false)} ${selectClass}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value={ANY} className="font-manrope text-sm">
                  {t("anyClass")}
                </SelectItem>
                {classes.map((cls) => (
                  <SelectItem
                    key={cls.id}
                    value={cls.id}
                    className="font-manrope text-sm"
                  >
                    {t("classLabel")} {cls.name}-{cls.section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <SelectTrigger className={`${fieldClass(false)} ${selectClass}`}>
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
            type="button"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
            className={`h-9 px-5 text-xs ${PRIMARY_PILL_CLASS}`}
          >
            {t("applyFilters")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface StudentFilterChipsProps {
  filters: StudentFilters;
  yearName?: string;
  className?: string;
  onRemove: (key: keyof StudentFilters) => void;
}

export const StudentFilterChips = ({
  filters,
  yearName,
  className,
  onRemove,
}: StudentFilterChipsProps) => {
  const t = useTranslations("studentsList");
  const chips: { key: keyof StudentFilters; label: string }[] = [];
  if (filters.academicYearId)
    chips.push({
      key: "academicYearId",
      label: `${t("filterAcademicYear")}: ${yearName ?? "—"}`,
    });
  if (filters.classId)
    chips.push({
      key: "classId",
      label: `${t("filterClass")}: ${className ?? "—"}`,
    });
  if (filters.gender)
    chips.push({
      key: "gender",
      label: `${t("filterGender")}: ${t(GENDER_LABEL_KEYS[filters.gender])}`,
    });
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
