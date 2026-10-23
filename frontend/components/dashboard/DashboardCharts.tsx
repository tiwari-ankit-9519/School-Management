"use client";
import { ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, CalendarOff, Minus } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  CARD_CLASS,
  fadeUp,
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
} from "@/components/dashboard/DashboardWidgets";
import { useTranslations } from "@/hooks/useTranslations";
import {
  DashboardAttendanceToday,
  DashboardMonthlyFee,
  DashboardWeeklyDay,
} from "@/types";

export const DASHBOARD_COLORS = {
  sky: "#7dd3fc",
  yellow: "#fcd34d",
  lavender: "#c4b5fd",
  amber: "#f59e0b",
  slate: "#cbd5e1",
} as const;

interface DashboardCardProps {
  title: string;
  action?: ReactNode;
  className?: string;
  delay: number;
  children: ReactNode;
}

export const DashboardCard = ({
  title,
  action,
  className,
  delay,
  children,
}: DashboardCardProps) => (
  <motion.div {...fadeUp(delay)} className={className}>
    <Card className={`${CARD_CLASS} h-full p-5`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-jakarta text-base font-semibold text-foreground">
          {title}
        </h3>
        {action}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </Card>
  </motion.div>
);

export const CardLink = ({ href, label }: { href: string; label: string }) => (
  <Button
    asChild
    variant="outline"
    size="sm"
    className="h-8 gap-1 rounded-full border-border bg-muted/50 px-3 font-manrope text-xs font-medium text-muted-foreground shadow-none hover:bg-accent hover:text-foreground"
  >
    <Link href={href}>
      {label}
      <ArrowUpRight className="size-3.5" />
    </Link>
  </Button>
);

interface TrendChipProps {
  change: number | null;
  unit: "%" | "pts";
}

const TrendChip = ({ change, unit }: TrendChipProps) => {
  if (change === null) return null;
  const isUp = change > 0;
  const isFlat = change === 0;
  const Icon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
  const tone = isFlat
    ? "bg-muted text-muted-foreground"
    : isUp
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "bg-red-500/10 text-red-700 dark:text-red-300";
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-manrope text-[10px] font-semibold ${tone}`}
    >
      <Icon className="size-3" />
      {Math.abs(change)}
      {unit === "%" ? "%" : " pts"}
    </span>
  );
};

interface StatTileProps {
  label: string;
  value: string;
  change: number | null;
  unit?: "%" | "pts";
  hint: string;
  href: string;
  delay: number;
}

export const StatTile = ({
  label,
  value,
  change,
  unit = "%",
  hint,
  href,
  delay,
}: StatTileProps) => (
  <motion.div {...fadeUp(delay)}>
    <Link href={href} className="group block h-full focus-visible:outline-none">
      <Card
        className={`${CARD_CLASS} h-full gap-2 p-4 transition-colors group-hover:border-sky-400/50 group-focus-visible:ring-2 group-focus-visible:ring-sky-500`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-manrope text-xs text-muted-foreground">
            {label}
          </p>
          <TrendChip change={change} unit={unit} />
        </div>
        <p className="font-jakarta text-2xl font-bold tracking-tight text-foreground sm:text-[28px]">
          {value}
        </p>
        <p className="truncate font-manrope text-[11px] text-muted-foreground">
          {hint}
        </p>
      </Card>
    </Link>
  </motion.div>
);

interface AttendanceDonutCardProps {
  stat: DashboardAttendanceToday;
  href: string;
  delay: number;
  className?: string;
}

export const AttendanceDonutCard = ({
  stat,
  href,
  delay,
  className,
}: AttendanceDonutCardProps) => {
  const t = useTranslations("adminDashboard");
  const attended = stat.present + stat.late;
  const missed = stat.absent + stat.excused;
  const hasData = stat.marked > 0;

  const config = {
    attended: { label: t("legendPresent"), color: DASHBOARD_COLORS.lavender },
    missed: { label: t("legendAbsent"), color: DASHBOARD_COLORS.yellow },
  } satisfies ChartConfig;

  const data = hasData
    ? [
        { key: "attended", value: attended, fill: "var(--color-attended)" },
        { key: "missed", value: missed, fill: "var(--color-missed)" },
      ]
    : [{ key: "empty", value: 1, fill: "var(--muted)" }];

  return (
    <DashboardCard
      title={t("attendanceToday")}
      className={className}
      delay={delay}
      action={<CardLink href={href} label={t("open")} />}
    >
      {stat.isHoliday ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300">
            <CalendarOff className="size-5" />
          </span>
          <p className="font-jakarta text-sm font-semibold text-foreground">
            {t("holidayToday")}
          </p>
          <p className="font-manrope text-xs text-muted-foreground">
            {stat.holidayName}
          </p>
        </div>
      ) : (
        <>
          <div className="relative mx-auto w-full max-w-56">
            <ChartContainer config={config} className="aspect-square w-full">
              <PieChart>
                {hasData && (
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        hideLabel
                        nameKey="key"
                        formatter={(value, name) => (
                          <div className="flex w-full items-center justify-between gap-4">
                            <span className="text-muted-foreground">
                              {String(name) === "attended"
                                ? t("legendPresent")
                                : t("legendAbsent")}
                            </span>
                            <span className="font-semibold text-foreground">
                              {formatNumber(Number(value))}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                )}
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="key"
                  innerRadius="62%"
                  outerRadius="92%"
                  startAngle={90}
                  endAngle={-270}
                  stroke="var(--card)"
                  strokeWidth={3}
                />
              </PieChart>
            </ChartContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="font-jakarta text-3xl font-bold text-foreground">
                {stat.percent !== null ? `${stat.percent}%` : "—"}
              </p>
              <p className="font-manrope text-[11px] text-muted-foreground">
                {hasData ? t("present") : t("notMarkedYet")}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-5 font-manrope text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: DASHBOARD_COLORS.lavender }}
              />
              {t("legendPresent")}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: DASHBOARD_COLORS.yellow }}
              />
              {t("legendAbsent")}
            </span>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-2 pt-4 font-manrope text-[11px]">
            <div className="rounded-xl border border-border bg-muted/40 px-3 py-2">
              <p className="text-muted-foreground">{t("marked")}</p>
              <p className="font-jakarta text-sm font-semibold text-foreground">
                {formatNumber(stat.marked)} / {formatNumber(stat.enrolled)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 px-3 py-2">
              <p className="text-muted-foreground">{t("late")}</p>
              <p className="font-jakarta text-sm font-semibold text-foreground">
                {formatNumber(stat.late)}
              </p>
            </div>
          </div>
        </>
      )}
    </DashboardCard>
  );
};

interface WeeklyAttendanceCardProps {
  days: DashboardWeeklyDay[];
  delay: number;
  className?: string;
}

export const WeeklyAttendanceCard = ({
  days,
  delay,
  className,
}: WeeklyAttendanceCardProps) => {
  const t = useTranslations("adminDashboard");

  const config = {
    present: { label: t("legendPresent"), color: DASHBOARD_COLORS.sky },
    late: { label: t("legendLate"), color: DASHBOARD_COLORS.yellow },
    absent: { label: t("legendAbsent"), color: DASHBOARD_COLORS.lavender },
  } satisfies ChartConfig;

  const data = days.map((day) => {
    const empty = day.isHoliday || day.isFuture || day.marked === 0;
    return {
      label: day.label,
      note: day.isHoliday
        ? (day.holidayName ?? t("holiday"))
        : day.isFuture
          ? t("upcomingDay")
          : day.marked === 0
            ? t("notMarkedYet")
            : null,
      present: empty ? 0 : day.presentPercent,
      late: empty ? 0 : day.latePercent,
      absent: empty ? 0 : day.absentPercent,
    };
  });

  return (
    <DashboardCard
      title={t("weeklyAttendance")}
      className={className}
      delay={delay}
      action={
        <span className="rounded-full border border-border bg-muted/50 px-3 py-1 font-manrope text-xs text-muted-foreground">
          {t("thisWeek")}
        </span>
      }
    >
      <ChartContainer config={config} className="aspect-auto h-60 w-full">
        <BarChart
          data={data}
          barGap={4}
          barCategoryGap="22%"
          margin={{ left: -12, right: 4, top: 8 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value: number) => `${value}%`}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            content={
              <ChartTooltipContent
                labelFormatter={(label, payload) => {
                  const note = payload?.[0]?.payload?.note as
                    | string
                    | null
                    | undefined;
                  return note ? `${label} · ${note}` : String(label);
                }}
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {config[name as keyof typeof config]?.label ??
                        String(name)}
                    </span>
                    <span className="font-semibold text-foreground">
                      {Number(value)}%
                    </span>
                  </div>
                )}
              />
            }
          />
          <Bar
            dataKey="present"
            fill="var(--color-present)"
            radius={[6, 6, 0, 0]}
            maxBarSize={18}
          />
          <Bar
            dataKey="late"
            fill="var(--color-late)"
            radius={[6, 6, 0, 0]}
            maxBarSize={18}
          />
          <Bar
            dataKey="absent"
            fill="var(--color-absent)"
            radius={[6, 6, 0, 0]}
            maxBarSize={18}
          />
        </BarChart>
      </ChartContainer>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-5 font-manrope text-xs text-muted-foreground">
        {(["present", "late", "absent"] as const).map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: config[key].color }}
            />
            {config[key].label}
          </span>
        ))}
      </div>
    </DashboardCard>
  );
};

interface FeeTrendCardProps {
  points: DashboardMonthlyFee[];
  currentMonth: string;
  href: string;
  delay: number;
  className?: string;
}

export const FeeTrendCard = ({
  points,
  currentMonth,
  href,
  delay,
  className,
}: FeeTrendCardProps) => {
  const t = useTranslations("adminDashboard");

  const config = {
    collected: { label: t("collected"), color: DASHBOARD_COLORS.amber },
    billed: { label: t("billed"), color: DASHBOARD_COLORS.sky },
  } satisfies ChartConfig;

  const data = points.map((point) => ({
    month: point.month,
    short: point.label.split(" ")[0],
    full: point.label,
    collected: point.collected,
    billed: point.billed,
  }));
  const currentShort = data.find(
    (point) => point.month === currentMonth,
  )?.short;
  const totalCollected = points.reduce(
    (sum, point) => sum + point.collected,
    0,
  );

  return (
    <DashboardCard
      title={t("feeCollection")}
      className={className}
      delay={delay}
      action={
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-border bg-muted/50 px-3 py-1 font-manrope text-xs text-muted-foreground sm:inline">
            {t("thisSession")} · {formatCompactCurrency(totalCollected)}
          </span>
          <CardLink href={href} label={t("open")} />
        </div>
      }
    >
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <AreaChart data={data} margin={{ left: -4, right: 8, top: 12 }}>
          <defs>
            <linearGradient id="fee-collected-fill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-collected)"
                stopOpacity={0.35}
              />
              <stop
                offset="100%"
                stopColor="var(--color-collected)"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="short"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => formatCompactCurrency(value)}
          />
          {currentShort && (
            <ReferenceLine
              x={currentShort}
              stroke={DASHBOARD_COLORS.sky}
              strokeWidth={6}
              strokeOpacity={0.35}
            />
          )}
          <ChartTooltip
            cursor={{
              stroke: DASHBOARD_COLORS.sky,
              strokeWidth: 2,
              strokeDasharray: "4 4",
            }}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) =>
                  String(payload?.[0]?.payload?.full ?? "")
                }
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span className="text-muted-foreground">
                      {config[name as keyof typeof config]?.label ??
                        String(name)}
                    </span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(Number(value))}
                    </span>
                  </div>
                )}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="billed"
            stroke="var(--color-billed)"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="transparent"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="collected"
            stroke="var(--color-collected)"
            strokeWidth={3}
            fill="url(#fee-collected-fill)"
            dot={false}
            activeDot={{
              r: 5,
              fill: "var(--color-collected)",
              stroke: "var(--card)",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ChartContainer>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-5 font-manrope text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className="h-0.5 w-4 rounded-full"
            style={{ backgroundColor: DASHBOARD_COLORS.amber }}
          />
          {t("collected")}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="h-0 w-4 border-t-2 border-dashed"
            style={{ borderColor: DASHBOARD_COLORS.sky }}
          />
          {t("billed")}
        </span>
      </div>
    </DashboardCard>
  );
};
