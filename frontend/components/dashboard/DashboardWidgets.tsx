"use client";
import {
  CSSProperties,
  ReactNode,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Hourglass,
  Send,
  XCircle,
} from "lucide-react";
import { Pie, PieChart } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useTranslations } from "@/hooks/useTranslations";

export const EASE = [0.16, 1, 0.3, 1] as const;

export const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: EASE },
});

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN").format(value);

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const CARD_CLASS =
  "gap-0 rounded-2xl border-border bg-card py-0 text-foreground shadow-none";

const PILL_BUTTON_CLASS =
  "h-8 gap-1 rounded-full border-border bg-transparent px-3 font-manrope text-xs font-medium text-foreground/80 shadow-none hover:bg-accent hover:text-foreground";

const STRIPED_STYLE: CSSProperties = {
  backgroundImage:
    "repeating-linear-gradient(-45deg, color-mix(in oklab, var(--foreground) 22%, transparent) 0 2px, transparent 2px 7px)",
};

export const TONE_CLASSES = {
  amber:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  emerald:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  red: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
  indigo:
    "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  violet:
    "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
} as const;

export type Tone = keyof typeof TONE_CLASSES;

interface CardShellProps {
  title: string;
  action?: ReactNode;
  className?: string;
  delay: number;
  children: ReactNode;
}

const CardShell = ({
  title,
  action,
  className,
  delay,
  children,
}: CardShellProps) => (
  <motion.div {...fadeUp(delay)} className={className}>
    <Card className={`${CARD_CLASS} h-full p-5`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-jakarta text-base font-semibold text-foreground">
          {title}
        </h2>
        {action}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </Card>
  </motion.div>
);

interface StatCardProps {
  label: string;
  value: string;
  chip: ReactNode;
  footnote: string;
  href: string;
  linkLabel: string;
  highlighted?: boolean;
  delay: number;
}

export const StatCard = ({
  label,
  value,
  chip,
  footnote,
  href,
  linkLabel,
  highlighted = false,
  delay,
}: StatCardProps) => (
  <motion.div {...fadeUp(delay)}>
    <Card
      className={`${CARD_CLASS} h-full gap-4 p-5 ${
        highlighted
          ? "border-0 bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-800 text-white"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-jakarta text-[15px] font-semibold">{label}</p>
        <Button
          asChild
          size="icon"
          variant="outline"
          className={`h-9 w-9 shrink-0 rounded-full shadow-none ${
            highlighted
              ? "border-0 bg-white text-indigo-700 hover:bg-white/90 hover:text-indigo-800"
              : "border-border bg-transparent text-foreground hover:bg-accent"
          }`}
        >
          <Link href={href} aria-label={linkLabel}>
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>
      <p className="font-jakarta text-4xl font-bold tracking-tight">{value}</p>
      <div
        className={`flex min-w-0 items-center gap-2 font-manrope text-xs ${
          highlighted ? "text-white/80" : "text-muted-foreground"
        }`}
      >
        <Badge
          variant="outline"
          className={`h-5 shrink-0 gap-1 rounded-md px-1.5 text-[10px] ${
            highlighted
              ? "border-white/30 bg-white/10 text-white"
              : TONE_CLASSES.indigo
          }`}
        >
          {chip}
        </Badge>
        <span className="truncate">{footnote}</span>
      </div>
    </Card>
  </motion.div>
);

const ATTENDANCE_LABEL_KEYS = {
  PRESENT: "attPresent",
  LATE: "attLate",
  ABSENT: "attAbsent",
  EXCUSED: "attExcused",
  HOLIDAY: "attHoliday",
} as const;

const BAR_SHADES = [
  "bg-indigo-500 dark:bg-indigo-400/80",
  "bg-indigo-400 dark:bg-indigo-300/70",
  "bg-indigo-300 dark:bg-indigo-200/60",
];
const PEAK_SHADE = "bg-indigo-700 dark:bg-indigo-500";

interface AttendanceCardProps {
  students: Record<string, number>;
  teachers: Record<string, number>;
  className?: string;
  delay: number;
}

export const AttendanceCard = ({
  students,
  teachers,
  className,
  delay,
}: AttendanceCardProps) => {
  const t = useTranslations("dashboard");
  const [tab, setTab] = useState<"students" | "teachers">("students");
  const counts = tab === "students" ? students : teachers;
  const entries = Object.entries(counts);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const max = Math.max(0, ...entries.map(([, value]) => value));
  const peakStatus = entries.find(
    ([, value]) => value === max && value > 0,
  )?.[0];

  const labelFor = (status: string) =>
    status in ATTENDANCE_LABEL_KEYS
      ? t(ATTENDANCE_LABEL_KEYS[status as keyof typeof ATTENDANCE_LABEL_KEYS])
      : status;

  return (
    <CardShell
      title={t("attendanceTitle")}
      className={className}
      delay={delay}
      action={
        <Tabs
          value={tab}
          onValueChange={(value: string) =>
            setTab(value === "teachers" ? "teachers" : "students")
          }
        >
          <TabsList className="h-auto gap-1 rounded-full bg-muted p-1">
            {(["students", "teachers"] as const).map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="h-7 rounded-full border-0 px-3 font-manrope text-xs text-muted-foreground shadow-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
              >
                {key === "students" ? t("statStudents") : t("statTeachers")}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      }
    >
      <p className="-mt-2 mb-4 font-manrope text-xs text-muted-foreground">
        {total > 0
          ? `${formatNumber(total)} ${t("markedToday")}`
          : t("noAttendance")}
      </p>
      <div className="mt-auto flex items-end justify-between gap-2 sm:gap-4">
        {entries.map(([status, value], i) => {
          const isEmpty = total === 0 || value === 0;
          const height = isEmpty ? 26 : 30 + (value / max) * 70;
          const isPeak = status === peakStatus;
          return (
            <div
              key={status}
              className="flex flex-1 flex-col items-center gap-2.5"
            >
              <div className="flex h-44 w-full items-end justify-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`relative w-full max-w-14 rounded-full transition-all duration-500 ${
                        isEmpty
                          ? "border border-border"
                          : isPeak
                            ? PEAK_SHADE
                            : BAR_SHADES[i % BAR_SHADES.length]
                      }`}
                      style={{
                        height: `${height}%`,
                        ...(isEmpty ? STRIPED_STYLE : {}),
                      }}
                    >
                      {isPeak && total > 0 && (
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md border border-border bg-card px-1.5 py-0.5 font-manrope text-[10px] font-semibold text-foreground shadow-sm">
                          {Math.round((value / total) * 100)}%
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {labelFor(status)}: {formatNumber(value)}
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-manrope text-[11px] text-muted-foreground">
                {labelFor(status)}
              </span>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
};

interface AttentionCardProps {
  pending: number;
  waitlisted: number;
  slotOffered: number;
  href: string;
  className?: string;
  delay: number;
}

export const AttentionCard = ({
  pending,
  waitlisted,
  slotOffered,
  href,
  className,
  delay,
}: AttentionCardProps) => {
  const t = useTranslations("dashboard");
  return (
    <CardShell title={t("attentionTitle")} className={className} delay={delay}>
      <p className="font-jakarta text-2xl leading-tight font-semibold text-indigo-700 dark:text-indigo-300">
        {formatNumber(pending)} {t("attentionPending")}
      </p>
      <p className="mt-2 font-manrope text-xs text-muted-foreground">
        {formatNumber(waitlisted)} {t("attentionWaitlisted")}
      </p>
      <p className="mt-0.5 font-manrope text-xs text-muted-foreground">
        {formatNumber(slotOffered)} {t("attentionSlots")}
      </p>
      <Button
        asChild
        className="mt-auto h-11 w-full gap-2 rounded-full bg-linear-to-r from-indigo-600 to-indigo-800 font-manrope text-sm font-semibold text-white shadow-none hover:opacity-90"
      >
        <Link href={href}>
          <ClipboardCheck className="size-4" />
          {t("reviewNow")}
        </Link>
      </Button>
    </CardShell>
  );
};

const PIPELINE_ROWS = [
  { status: "PENDING", labelKey: "pipePending", icon: Clock, tone: "amber" },
  {
    status: "WAITLISTED",
    labelKey: "pipeWaitlisted",
    icon: Hourglass,
    tone: "violet",
  },
  {
    status: "SLOT_OFFERED",
    labelKey: "pipeSlotOffered",
    icon: Send,
    tone: "indigo",
  },
  {
    status: "APPROVED",
    labelKey: "pipeApproved",
    icon: CheckCircle2,
    tone: "emerald",
  },
  { status: "REJECTED", labelKey: "pipeRejected", icon: XCircle, tone: "red" },
] as const;

interface PipelineCardProps {
  counts: Record<string, number>;
  total: number;
  href: string;
  className?: string;
  delay: number;
}

export const PipelineCard = ({
  counts,
  total,
  href,
  className,
  delay,
}: PipelineCardProps) => {
  const t = useTranslations("dashboard");
  return (
    <CardShell
      title={t("pipelineTitle")}
      className={className}
      delay={delay}
      action={
        <Button
          asChild
          variant="outline"
          size="sm"
          className={PILL_BUTTON_CLASS}
        >
          <Link href={href}>
            {t("viewAll")}
            <ArrowUpRight className="size-3.5" />
          </Link>
        </Button>
      }
    >
      <div className="space-y-3.5">
        {PIPELINE_ROWS.map((row) => {
          const count = counts[row.status] ?? 0;
          const Icon = row.icon;
          return (
            <div key={row.status} className="flex items-center gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${TONE_CLASSES[row.tone]}`}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-jakarta text-sm font-medium text-foreground">
                  {t(row.labelKey)}
                </p>
                <p className="font-manrope text-[11px] text-muted-foreground">
                  {formatNumber(count)} {t("applications")}
                </p>
              </div>
              <span className="font-manrope text-xs font-medium text-muted-foreground">
                {total > 0 ? `${Math.round((count / total) * 100)}%` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
};

export interface RequestRow {
  key: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  tone: Tone;
  badges: { label: string; count: number; tone: Tone }[];
}

interface RequestsCardProps {
  rows: RequestRow[];
  className?: string;
  delay: number;
}

export const RequestsCard = ({ rows, className, delay }: RequestsCardProps) => {
  const t = useTranslations("dashboard");
  return (
    <CardShell title={t("requestsTitle")} className={className} delay={delay}>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex flex-col gap-2.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${TONE_CLASSES[row.tone]}`}
              >
                {row.icon}
              </span>
              <div className="min-w-0">
                <p className="truncate font-jakarta text-sm font-medium text-foreground">
                  {row.title}
                </p>
                <p className="truncate font-manrope text-[11px] text-muted-foreground">
                  {row.subtitle}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:justify-end">
              {row.badges.map((badge) => (
                <Badge
                  key={badge.label}
                  variant="outline"
                  className={`gap-1 rounded-md px-2 font-manrope text-[11px] font-medium ${
                    badge.count > 0
                      ? TONE_CLASSES[badge.tone]
                      : "border-border bg-transparent text-muted-foreground"
                  }`}
                >
                  {badge.label}
                  <span className="font-semibold">{badge.count}</span>
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CardShell>
  );
};

interface FeeGaugeCardProps {
  collected: number;
  expected: number;
  className?: string;
  delay: number;
}

export const FeeGaugeCard = ({
  collected,
  expected,
  className,
  delay,
}: FeeGaugeCardProps) => {
  const t = useTranslations("dashboard");
  const pending = Math.max(expected - collected, 0);
  const rate =
    expected > 0 ? Math.min(Math.round((collected / expected) * 100), 100) : 0;

  const config = {
    collected: { label: t("feeCollected"), color: "#4f46e5" },
    pending: { label: t("feePending"), color: "#a5b4fc" },
  } satisfies ChartConfig;

  const data =
    collected + pending > 0
      ? [
          {
            key: "collected",
            value: collected,
            fill: "var(--color-collected)",
          },
          { key: "pending", value: pending, fill: "url(#fee-stripes)" },
        ]
      : [{ key: "pending", value: 1, fill: "url(#fee-stripes)" }];

  return (
    <CardShell title={t("chartFeeRevenue")} className={className} delay={delay}>
      <div className="relative">
        <ChartContainer
          config={config}
          className="mx-auto aspect-auto h-36 w-full max-w-64"
        >
          <PieChart>
            <defs>
              <pattern
                id="fee-stripes"
                patternUnits="userSpaceOnUse"
                width="7"
                height="7"
                patternTransform="rotate(45)"
              >
                <rect width="7" height="7" fill="var(--card)" />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="7"
                  stroke="var(--muted-foreground)"
                  strokeWidth="3"
                  strokeOpacity="0.45"
                />
              </pattern>
            </defs>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  nameKey="key"
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {String(name) === "collected"
                          ? t("feeCollected")
                          : t("feePending")}
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatCurrency(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="key"
              startAngle={180}
              endAngle={0}
              cx="50%"
              cy="95%"
              innerRadius={74}
              outerRadius={110}
              cornerRadius={10}
              paddingAngle={2}
              stroke="none"
            />
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
          <p className="font-jakarta text-3xl font-bold text-foreground">
            {rate}%
          </p>
          <p className="font-manrope text-[11px] text-muted-foreground">
            {t("feeCollected")}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-manrope text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
          {t("feeCollected")}
          <span className="font-semibold text-foreground">
            {formatCompactCurrency(collected)}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full border border-border"
            style={STRIPED_STYLE}
          />
          {t("feePending")}
          <span className="font-semibold text-foreground">
            {formatCompactCurrency(pending)}
          </span>
        </span>
      </div>
    </CardShell>
  );
};

const subscribeSeconds = (callback: () => void) => {
  const id = setInterval(callback, 1000);
  return () => clearInterval(id);
};

const getCurrentSecond = () => Math.floor(Date.now() / 1000);
const getServerSecond = (): number | null => null;

interface LiveClockCardProps {
  academicYear: string | null;
  className?: string;
  delay: number;
}

export const LiveClockCard = ({
  academicYear,
  className,
  delay,
}: LiveClockCardProps) => {
  const t = useTranslations("dashboard");
  const second = useSyncExternalStore(
    subscribeSeconds,
    getCurrentSecond,
    getServerSecond,
  );
  const now = second === null ? null : new Date(second * 1000);

  return (
    <motion.div {...fadeUp(delay)} className={className}>
      <Card className="relative h-full gap-0 overflow-hidden rounded-2xl border-0 bg-linear-to-br from-indigo-700 via-indigo-900 to-[#0b0f2e] p-5 text-white shadow-none">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 300 200"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <path
              key={i}
              d={`M-20 ${170 - i * 14} C 70 ${120 - i * 14}, 150 ${210 - i * 14}, 330 ${130 - i * 14}`}
              stroke="white"
              strokeOpacity={0.04 + i * 0.01}
            />
          ))}
        </svg>
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between gap-2">
            <p className="font-jakarta text-base font-semibold">
              {t("clockTitle")}
            </p>
            <Badge className="gap-1 rounded-full border-white/20 bg-white/10 font-manrope text-[10px] font-medium text-white">
              <CalendarDays className="size-3" />
              {academicYear ?? t("noAcademicYear")}
            </Badge>
          </div>
          <p className="mt-auto pt-8 text-center font-jakarta text-4xl font-bold tracking-wider tabular-nums">
            {now
              ? now.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })
              : "--:--:--"}
          </p>
          <p className="mt-2 text-center font-manrope text-xs text-white/70">
            {now
              ? now.toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "\u00a0"}
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

export const DashboardSkeleton = () => (
  <div className="space-y-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-11 w-44 rounded-full" />
        <Skeleton className="h-11 w-28 rounded-full" />
      </div>
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-2xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
      <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
      <Skeleton className="h-72 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  </div>
);
