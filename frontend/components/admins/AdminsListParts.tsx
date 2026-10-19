"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  CalendarDays,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Admin, Gender } from "@/types";

export const ADMIN_DETAIL_PATH = "/admin/moderators";
export const NO_DEPARTMENT = "__NONE__";

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

const REVIEW_BUTTON_CLASS =
  "h-8 gap-1 rounded-full border-border bg-transparent px-3 font-manrope text-xs font-medium text-foreground/80 shadow-none transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground dark:border-border dark:bg-transparent dark:hover:border-primary dark:hover:bg-primary dark:hover:text-primary-foreground dark:group-hover:border-primary dark:group-hover:bg-primary dark:group-hover:text-primary-foreground";

export interface AdminFilters {
  name?: string;
  designation?: string;
  gender?: Gender;
}

const RELATIVE_FORMAT = new Intl.RelativeTimeFormat("en-IN", {
  numeric: "auto",
});
const DAY_MS = 86_400_000;

export const departmentKey = (department: string | null) =>
  department?.trim() ? department.trim().toLowerCase() : NO_DEPARTMENT;

export const toTitleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatRelative = (iso: string, now: number) => {
  const diffDays = Math.round((new Date(iso).getTime() - now) / DAY_MS);
  if (Math.abs(diffDays) >= 365)
    return RELATIVE_FORMAT.format(Math.round(diffDays / 365), "year");
  if (Math.abs(diffDays) >= 30)
    return RELATIVE_FORMAT.format(Math.round(diffDays / 30), "month");
  return RELATIVE_FORMAT.format(diffDays, "day");
};

const getAvatarClass = (seed?: string | null) => {
  const hash = Array.from(seed ?? "").reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

export const countActiveFilters = (filters: AdminFilters) =>
  Object.values(filters).filter((value) => value !== undefined && value !== "")
    .length;

export const matchesAdminFilters = (
  admin: Admin,
  filters: AdminFilters,
  department: string,
) => {
  const includes = (source: string | null, query?: string) =>
    !query || (source ?? "").toLowerCase().includes(query.toLowerCase());
  return (
    includes(`${admin.firstName} ${admin.lastName}`, filters.name) &&
    includes(admin.designation, filters.designation) &&
    (!filters.gender || admin.gender === filters.gender) &&
    (department === "ALL" || departmentKey(admin.department) === department)
  );
};

const AdminAvatar = ({
  admin,
  size = "md",
}: {
  admin: Admin;
  size?: "md" | "lg";
}) => (
  <Avatar className={size === "lg" ? "h-14 w-14" : "h-10 w-10"}>
    {admin.photoUrl && (
      <AvatarImage
        src={admin.photoUrl}
        alt={`${admin.firstName} ${admin.lastName}`}
        className="object-cover"
      />
    )}
    <AvatarFallback
      className={`font-jakarta font-bold ${size === "lg" ? "text-base" : "text-xs"} ${getAvatarClass(admin.id)}`}
    >
      {`${admin.firstName.charAt(0)}${admin.lastName.charAt(0)}`.toUpperCase()}
    </AvatarFallback>
  </Avatar>
);

interface AdminsViewProps {
  admins: Admin[];
  now: number;
}

export const AdminsGrid = ({ admins, now }: AdminsViewProps) => {
  const t = useTranslations("adminsList");

  return (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
      {admins.map((admin, i) => (
        <motion.div key={admin.id} {...fadeUp(Math.min(i * 0.03, 0.3))}>
          <Card
            className={`${CARD_CLASS} h-full gap-4 p-5 transition-all hover:-translate-y-0.5 hover:border-indigo-500/40`}
          >
            <div className="flex items-center gap-3">
              <AdminAvatar admin={admin} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-jakarta text-base font-semibold text-foreground">
                  {admin.firstName} {admin.lastName}
                </p>
                <p className="font-manrope text-xs text-muted-foreground">
                  {t(GENDER_LABEL_KEYS[admin.gender])}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant="outline"
                className={`gap-1 rounded-md font-manrope text-[11px] font-medium ${TONE_CLASSES.indigo}`}
              >
                <Briefcase className="size-3" />
                {admin.designation ?? t("noDesignation")}
              </Badge>
              <Badge
                variant="outline"
                className="gap-1 rounded-md border-border bg-muted font-manrope text-[11px] font-medium text-foreground/80"
              >
                <Building2 className="size-3" />
                {admin.department
                  ? toTitleCase(admin.department)
                  : t("noDepartment")}
              </Badge>
            </div>
            <div className="mt-auto flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-manrope text-[11px] text-muted-foreground">
                <CalendarDays className="size-3.5" />
                {t("joined")} {formatRelative(admin.joiningDate, now)}
              </span>
              <Button
                asChild
                size="sm"
                variant="outline"
                className={`h-8 gap-1 px-3 text-xs ${OUTLINE_PILL_CLASS}`}
              >
                <Link href={`${ADMIN_DETAIL_PATH}/${admin.id}`}>
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

export const AdminsTable = ({ admins, now }: AdminsViewProps) => {
  const t = useTranslations("adminsList");
  const router = useRouter();
  const headClass =
    "h-11 px-5 font-manrope text-[11px] font-medium tracking-wider text-muted-foreground uppercase";

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className={headClass}>{t("colAdmin")}</TableHead>
              <TableHead className={headClass}>{t("colDesignation")}</TableHead>
              <TableHead className={headClass}>{t("colDepartment")}</TableHead>
              <TableHead className={headClass}>{t("colGender")}</TableHead>
              <TableHead className={headClass}>{t("colJoined")}</TableHead>
              <TableHead className={`${headClass} text-right`}>
                {t("colAction")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow
                key={admin.id}
                onClick={() => router.push(`${ADMIN_DETAIL_PATH}/${admin.id}`)}
                className="group cursor-pointer border-border transition-colors hover:bg-muted/60"
              >
                <TableCell className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <AdminAvatar admin={admin} />
                    <p className="truncate font-jakarta text-sm font-semibold text-foreground">
                      {admin.firstName} {admin.lastName}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-3">
                  {admin.designation ? (
                    <Badge
                      variant="outline"
                      className={`rounded-md font-manrope text-[11px] font-medium ${TONE_CLASSES.indigo}`}
                    >
                      {admin.designation}
                    </Badge>
                  ) : (
                    <span className="font-manrope text-xs text-muted-foreground italic">
                      {t("noDesignation")}
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-5 py-3 font-manrope text-sm text-foreground/85">
                  {admin.department ? toTitleCase(admin.department) : "—"}
                </TableCell>
                <TableCell className="px-5 py-3 font-manrope text-sm text-foreground/80">
                  {t(GENDER_LABEL_KEYS[admin.gender])}
                </TableCell>
                <TableCell className="px-5 py-3">
                  <p className="font-manrope text-sm text-foreground/85">
                    {formatDate(admin.joiningDate)}
                  </p>
                  <p className="mt-0.5 font-manrope text-[11px] text-muted-foreground">
                    {formatRelative(admin.joiningDate, now)}
                  </p>
                </TableCell>
                <TableCell className="px-5 py-3 text-right">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                    className={REVIEW_BUTTON_CLASS}
                  >
                    <Link href={`${ADMIN_DETAIL_PATH}/${admin.id}`}>
                      {t("viewProfile")}
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="md:hidden">
        <AdminsGrid admins={admins} now={now} />
      </div>
    </>
  );
};

export const AdminsSkeleton = ({ view }: { view: "table" | "grid" }) =>
  view === "grid" ? (
    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-2xl" />
      ))}
    </div>
  ) : (
    <div className="space-y-1 p-4 sm:p-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );

interface AdminFiltersPopoverProps {
  applied: AdminFilters;
  onApply: (filters: AdminFilters) => void;
  onClear: () => void;
}

export const AdminFiltersPopover = ({
  applied,
  onApply,
  onClear,
}: AdminFiltersPopoverProps) => {
  const t = useTranslations("adminsList");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AdminFilters>(applied);
  const activeCount = countActiveFilters(applied);

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(applied);
    setOpen(next);
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
        className="flex max-h-(--radix-popover-content-available-height) w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl p-0 sm:w-sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onApply({
              name: draft.name?.trim() || undefined,
              designation: draft.designation?.trim() || undefined,
              gender: draft.gender,
            });
            setOpen(false);
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
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="admin-filter-name"
                className="font-manrope text-xs font-normal text-foreground/70"
              >
                {t("filterName")}
              </Label>
              <Input
                id="admin-filter-name"
                value={draft.name ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, name: e.target.value }))
                }
                className={fieldClass(false)}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="admin-filter-designation"
                className="font-manrope text-xs font-normal text-foreground/70"
              >
                {t("filterDesignation")}
              </Label>
              <Input
                id="admin-filter-designation"
                value={draft.designation ?? ""}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, designation: e.target.value }))
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

interface AdminFilterChipsProps {
  filters: AdminFilters;
  onRemove: (key: keyof AdminFilters) => void;
}

export const AdminFilterChips = ({
  filters,
  onRemove,
}: AdminFilterChipsProps) => {
  const t = useTranslations("adminsList");
  const chips: { key: keyof AdminFilters; label: string }[] = [];
  if (filters.name)
    chips.push({ key: "name", label: `${t("filterName")}: ${filters.name}` });
  if (filters.designation)
    chips.push({
      key: "designation",
      label: `${t("filterDesignation")}: ${filters.designation}`,
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
