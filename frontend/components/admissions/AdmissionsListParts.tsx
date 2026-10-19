"use client";
import { KeyboardEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Hourglass,
  Inbox,
  Phone,
  Send,
  TimerOff,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  CARD_CLASS,
  TONE_CLASSES,
  Tone,
  fadeUp,
} from "@/components/dashboard/DashboardWidgets";
import { useTranslations } from "@/hooks/useTranslations";
import { AdmissionApplicationListItem, AdmissionStatus } from "@/types";

export const DETAIL_PATH = "/admin/admission-applications";

const EXTRA_TONES = {
  slate:
    "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  orange:
    "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
} as const;

export const STATUS_CONFIG = {
  [AdmissionStatus.PENDING]: {
    labelKey: "statusPending",
    icon: Clock,
    dot: "bg-amber-500",
    className: TONE_CLASSES.amber,
  },
  [AdmissionStatus.WAITLISTED]: {
    labelKey: "statusWaitlisted",
    icon: Hourglass,
    dot: "bg-violet-500",
    className: TONE_CLASSES.violet,
  },
  [AdmissionStatus.SLOT_OFFERED]: {
    labelKey: "statusSlotOffered",
    icon: Send,
    dot: "bg-indigo-500",
    className: TONE_CLASSES.indigo,
  },
  [AdmissionStatus.APPROVED]: {
    labelKey: "statusApproved",
    icon: CheckCircle2,
    dot: "bg-emerald-500",
    className: TONE_CLASSES.emerald,
  },
  [AdmissionStatus.REJECTED]: {
    labelKey: "statusRejected",
    icon: XCircle,
    dot: "bg-red-500",
    className: TONE_CLASSES.red,
  },
  [AdmissionStatus.OFFER_EXPIRED]: {
    labelKey: "statusOfferExpired",
    icon: TimerOff,
    dot: "bg-slate-500",
    className: EXTRA_TONES.slate,
  },
  [AdmissionStatus.OFFER_DECLINED]: {
    labelKey: "statusOfferDeclined",
    icon: Ban,
    dot: "bg-orange-500",
    className: EXTRA_TONES.orange,
  },
} as const;

export const STATUS_FILTERS = [
  "ALL",
  ...Object.values(AdmissionStatus),
] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

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

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatRelative = (dateStr: string, now: number) => {
  const diffDays = Math.round((new Date(dateStr).getTime() - now) / DAY_MS);
  if (Math.abs(diffDays) >= 30) {
    return RELATIVE_FORMAT.format(Math.round(diffDays / 30), "month");
  }
  return RELATIVE_FORMAT.format(diffDays, "day");
};

const getInitials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

const getAvatarClass = (seed: string) => {
  const hash = Array.from(seed).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

const getPageItems = (
  current: number,
  total: number,
): (number | "ellipsis")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1, total, current - 1, current, current + 1]
    .filter((p, i, arr) => p >= 1 && p <= total && arr.indexOf(p) === i)
    .sort((a, b) => a - b);
  return pages.flatMap((p, i) =>
    i > 0 && p - pages[i - 1] > 1 ? ["ellipsis" as const, p] : [p],
  );
};

interface StatFilterCardProps {
  label: string;
  value: string;
  footnote: string;
  icon: ReactNode;
  tone: Tone;
  highlighted?: boolean;
  active?: boolean;
  onSelect?: () => void;
  loading: boolean;
  delay: number;
}

export const StatFilterCard = ({
  label,
  value,
  footnote,
  icon,
  tone,
  highlighted = false,
  active = false,
  onSelect,
  loading,
  delay,
}: StatFilterCardProps) => {
  const interactive = !!onSelect;
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (onSelect && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <motion.div {...fadeUp(delay)}>
      <Card
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-pressed={interactive ? active : undefined}
        onClick={onSelect}
        onKeyDown={handleKeyDown}
        className={`${CARD_CLASS} h-full gap-4 p-5 transition-all ${
          interactive
            ? "cursor-pointer hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            : ""
        } ${
          highlighted
            ? "border-0 bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-800 text-white"
            : ""
        } ${active && !highlighted ? "ring-2 ring-indigo-500/60" : ""} ${
          active && highlighted
            ? "ring-2 ring-indigo-300/60 ring-offset-2 ring-offset-background"
            : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-jakarta text-[15px] font-semibold">{label}</p>
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
              highlighted
                ? "border-0 bg-white text-indigo-700"
                : TONE_CLASSES[tone]
            }`}
          >
            {icon}
          </span>
        </div>
        {loading ? (
          <Skeleton
            className={`h-10 w-20 ${highlighted ? "bg-white/20" : ""}`}
          />
        ) : (
          <p className="font-jakarta text-4xl font-bold tracking-tight">
            {value}
          </p>
        )}
        <p
          className={`truncate font-manrope text-xs ${
            highlighted ? "text-white/80" : "text-muted-foreground"
          }`}
        >
          {footnote}
        </p>
      </Card>
    </motion.div>
  );
};

export const StatusBadge = ({ status }: { status: AdmissionStatus }) => {
  const t = useTranslations("admissionsList");
  const config =
    STATUS_CONFIG[status] ?? STATUS_CONFIG[AdmissionStatus.PENDING];
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

const ApplicantAvatar = ({ app }: { app: AdmissionApplicationListItem }) => (
  <Avatar className="h-10 w-10">
    <AvatarFallback
      className={`font-jakarta text-xs font-bold ${getAvatarClass(app.id)}`}
    >
      {getInitials(app.firstName, app.lastName)}
    </AvatarFallback>
  </Avatar>
);

const HEADER_KEYS = [
  "colApplicant",
  "colGuardian",
  "colClass",
  "colApplied",
  "colStatus",
] as const;

interface ApplicationsTableProps {
  applications: AdmissionApplicationListItem[];
  now: number;
}

export const ApplicationsTable = ({
  applications,
  now,
}: ApplicationsTableProps) => {
  const t = useTranslations("admissionsList");
  const router = useRouter();

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              {HEADER_KEYS.map((key) => (
                <TableHead
                  key={key}
                  className="h-11 px-5 font-manrope text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
                >
                  {t(key)}
                </TableHead>
              ))}
              <TableHead className="h-11 px-5 text-right font-manrope text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
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
                      <p className="truncate font-jakarta text-sm font-semibold text-foreground">
                        {app.firstName} {app.lastName}
                      </p>
                      <p className="font-manrope text-[11px] text-muted-foreground capitalize">
                        {app.gender.toLowerCase()}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <p className="truncate font-manrope text-sm text-foreground/85">
                    {app.guardianFirstName} {app.guardianLastName}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 font-manrope text-[11px] text-muted-foreground">
                    <Phone className="size-3" />
                    {app.guardianPhone}
                  </p>
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <Badge
                    variant="outline"
                    className="rounded-md border-border bg-muted font-manrope text-xs font-medium text-foreground/80"
                  >
                    {t("classLabel")} {app.appliedForClass}
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
                    className="h-8 gap-1 rounded-full border-border bg-transparent px-3 font-manrope text-xs font-medium text-foreground/80 shadow-none transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground dark:border-border dark:bg-transparent dark:hover:border-primary dark:hover:bg-primary dark:hover:text-primary-foreground dark:group-hover:border-primary dark:group-hover:bg-primary dark:group-hover:text-primary-foreground"
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
                {app.guardianFirstName} {app.guardianLastName} ·{" "}
                {t("classLabel")} {app.appliedForClass}
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

export const TableSkeleton = () => (
  <div className="space-y-1 p-4 sm:p-5">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-2.5">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="hidden h-6 w-24 rounded-full md:block" />
      </div>
    ))}
  </div>
);

export const EmptyState = ({ onClear }: { onClear?: () => void }) => {
  const t = useTranslations("admissionsList");
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
          variant="outline"
          onClick={onClear}
          className="h-8 rounded-full border-border bg-transparent px-4 font-manrope text-xs text-foreground/80 shadow-none hover:bg-accent hover:text-foreground"
        >
          {t("clearFilter")}
        </Button>
      )}
    </div>
  );
};

interface ApplicationsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

export const ApplicationsPagination = ({
  page,
  totalPages,
  total,
  onChange,
}: ApplicationsPaginationProps) => {
  const t = useTranslations("admissionsList");
  const navClass =
    "h-8 w-8 rounded-full border-0 text-muted-foreground hover:bg-accent hover:text-foreground";

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-4 py-3.5 sm:flex-row sm:px-5">
      <span className="font-manrope text-xs text-muted-foreground">
        {`${t("page")} ${page} ${t("of")} ${totalPages} · ${total.toLocaleString("en-IN")} ${t("total")}`}
      </span>
      <Pagination className="mx-0 w-auto">
        <PaginationContent className="gap-1">
          <PaginationItem>
            <PaginationLink
              href="#"
              aria-label={t("previous")}
              aria-disabled={page === 1}
              onClick={(e) => {
                e.preventDefault();
                if (page > 1) onChange(page - 1);
              }}
              className={`${navClass} ${page === 1 ? "pointer-events-none opacity-30" : ""}`}
            >
              <ChevronLeft className="size-4" />
            </PaginationLink>
          </PaginationItem>
          {getPageItems(page, totalPages).map((item, i) =>
            item === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis className="h-8 w-8 text-muted-foreground" />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink
                  href="#"
                  isActive={item === page}
                  onClick={(e) => {
                    e.preventDefault();
                    onChange(item);
                  }}
                  className={`h-8 w-8 rounded-full border-0 font-manrope text-xs shadow-none ${
                    item === page
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                      : "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationLink
              href="#"
              aria-label={t("next")}
              aria-disabled={page === totalPages}
              onClick={(e) => {
                e.preventDefault();
                if (page < totalPages) onChange(page + 1);
              }}
              className={`${navClass} ${page === totalPages ? "pointer-events-none opacity-30" : ""}`}
            >
              <ChevronRight className="size-4" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
