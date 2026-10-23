"use client";
import { Eye, Loader2, TriangleAlert, Wallet } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  formatCurrency,
  formatNumber,
} from "@/components/dashboard/DashboardWidgets";
import {
  CardLink,
  DashboardCard,
} from "@/components/dashboard/DashboardCharts";
import { useDownloadReceipt } from "@/hooks/useFeePayments";
import { useTranslations } from "@/hooks/useTranslations";
import {
  DashboardAdmissionsFunnel,
  DashboardFeeDefaulter,
  DashboardRecentPayment,
  DashboardSeatsByGroup,
  DashboardTeacherAttendance,
} from "@/types";

const DAY_MS = 86_400_000;

const AVATAR_TONES = [
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
];

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const toneOf = (seed: string) =>
  AVATAR_TONES[
    Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0) %
      AVATAR_TONES.length
  ];

const formatShortDate = (ymd: string) =>
  new Date(`${ymd}T00:00:00.000Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

const formatMode = (mode: string) =>
  mode
    .toLowerCase()
    .split("_")
    .map((word) =>
      word === "upi" ? "UPI" : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");

const relativeTime = (iso: string, now: Date) => {
  const minutes = Math.floor(
    (now.getTime() - new Date(iso).getTime()) / 60_000,
  );
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const EmptyState = ({
  icon: Icon,
  text,
}: {
  icon: typeof Wallet;
  text: string;
}) => (
  <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
    <Icon className="size-5 text-muted-foreground" />
    <p className="font-manrope text-xs text-muted-foreground">{text}</p>
  </div>
);

interface FeeDefaultersCardProps {
  rows: DashboardFeeDefaulter[];
  today: string;
  href: string;
  delay: number;
  className?: string;
}

export const FeeDefaultersCard = ({
  rows,
  today,
  href,
  delay,
  className,
}: FeeDefaultersCardProps) => {
  const t = useTranslations("adminDashboard");
  const todayTime = new Date(`${today}T00:00:00.000Z`).getTime();

  return (
    <DashboardCard
      title={t("feeDefaulters")}
      className={className}
      delay={delay}
      action={<CardLink href={href} label={t("viewAll")} />}
    >
      {rows.length === 0 ? (
        <EmptyState icon={Wallet} text={t("noDefaulters")} />
      ) : (
        <div className="divide-y divide-border">
          {rows.map((row) => {
            const days = Math.max(
              0,
              Math.round(
                (todayTime -
                  new Date(`${row.oldestDueDate}T00:00:00.000Z`).getTime()) /
                  DAY_MS,
              ),
            );
            return (
              <div
                key={row.studentId}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback
                    className={`font-jakarta text-[11px] font-bold ${toneOf(row.studentId)}`}
                  >
                    {initialsOf(row.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-jakarta text-sm font-semibold text-foreground">
                    {row.name}
                  </p>
                  <p className="truncate font-manrope text-[11px] text-muted-foreground">
                    {[
                      row.regNumber,
                      row.className
                        ? `${t("classShort")} ${row.className}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-jakarta text-sm font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(row.overdueAmount)}
                  </p>
                  <p className="font-manrope text-[10px] text-muted-foreground">
                    {row.overdueCount}{" "}
                    {row.overdueCount === 1
                      ? t("billSingular")
                      : t("billPlural")}{" "}
                    · {days} {t("daysLate")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
};

interface RecentPaymentsCardProps {
  rows: DashboardRecentPayment[];
  generatedAt: string;
  href: string;
  delay: number;
  className?: string;
}

export const RecentPaymentsCard = ({
  rows,
  generatedAt,
  href,
  delay,
  className,
}: RecentPaymentsCardProps) => {
  const t = useTranslations("adminDashboard");
  const { mutate: viewReceipt, isPending, variables } = useDownloadReceipt();
  const now = new Date(generatedAt);

  return (
    <DashboardCard
      title={t("recentPayments")}
      className={className}
      delay={delay}
      action={<CardLink href={href} label={t("viewAll")} />}
    >
      {rows.length === 0 ? (
        <EmptyState icon={Wallet} text={t("noPayments")} />
      ) : (
        <div className="divide-y divide-border">
          {rows.map((row) => {
            const busy = isPending && variables?.receiptId === row.receiptId;
            return (
              <button
                key={row.receiptId}
                type="button"
                onClick={() =>
                  viewReceipt({
                    receiptId: row.receiptId,
                    receiptNumber: row.receiptNumber,
                    inline: true,
                  })
                }
                className="group flex w-full items-center gap-3 py-2.5 text-left first:pt-0 last:pb-0 focus-visible:outline-none"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback
                    className={`font-jakarta text-[11px] font-bold ${toneOf(row.studentId)}`}
                  >
                    {initialsOf(row.studentName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-jakarta text-sm font-semibold text-foreground group-hover:text-sky-700 dark:group-hover:text-sky-300">
                    {row.studentName}
                  </p>
                  <p className="truncate font-manrope text-[11px] text-muted-foreground">
                    {formatMode(row.paymentMode)} ·{" "}
                    {relativeTime(row.paidAt, now)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <p className="font-jakarta text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(row.amount)}
                  </p>
                  {busy ? (
                    <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <Eye className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
};

interface SeatsCardProps {
  groups: DashboardSeatsByGroup[];
  href: string;
  delay: number;
  className?: string;
}

export const SeatsCard = ({
  groups,
  href,
  delay,
  className,
}: SeatsCardProps) => {
  const t = useTranslations("adminDashboard");
  const totalCapacity = groups.reduce((sum, group) => sum + group.capacity, 0);
  const totalFilled = groups.reduce((sum, group) => sum + group.filled, 0);

  return (
    <DashboardCard
      title={t("seatsByGroup")}
      className={className}
      delay={delay}
      action={<CardLink href={href} label={t("open")} />}
    >
      {groups.length === 0 ? (
        <EmptyState icon={TriangleAlert} text={t("noClasses")} />
      ) : (
        <>
          <p className="-mt-2 mb-3 font-manrope text-xs text-muted-foreground">
            {formatNumber(totalFilled)} / {formatNumber(totalCapacity)}{" "}
            {t("seatsFilled")}
          </p>
          <div className="space-y-3.5">
            {groups.map((group) => {
              const percent =
                group.capacity > 0
                  ? Math.round((group.filled / group.capacity) * 100)
                  : 0;
              const tone =
                percent >= 95
                  ? "[&>*]:bg-red-500"
                  : percent >= 80
                    ? "[&>*]:bg-amber-400"
                    : "[&>*]:bg-sky-400";
              return (
                <div key={group.classGroupId}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 font-manrope text-xs">
                    <span className="font-medium text-foreground">
                      {group.name}
                      <span className="ml-1.5 text-muted-foreground">
                        · {group.classCount}{" "}
                        {group.classCount === 1
                          ? t("classSingular")
                          : t("classPlural")}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      {group.filled}/{group.capacity}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, percent)}
                    className={`h-2 bg-muted ${tone}`}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </DashboardCard>
  );
};

interface TeacherAttendanceCardProps {
  stat: DashboardTeacherAttendance;
  href: string;
  delay: number;
  className?: string;
}

export const TeacherAttendanceCard = ({
  stat,
  href,
  delay,
  className,
}: TeacherAttendanceCardProps) => {
  const t = useTranslations("adminDashboard");
  const segments = [
    {
      key: "present",
      label: t("legendPresent"),
      value: stat.present,
      color: "bg-sky-400",
    },
    {
      key: "late",
      label: t("legendLate"),
      value: stat.late,
      color: "bg-amber-400",
    },
    {
      key: "absent",
      label: t("legendAbsent"),
      value: stat.absent,
      color: "bg-violet-400",
    },
    {
      key: "onLeave",
      label: t("onLeave"),
      value: stat.onLeave,
      color: "bg-rose-400",
    },
    {
      key: "notMarked",
      label: t("notMarkedYet"),
      value: stat.notMarked,
      color: "bg-muted-foreground/30",
    },
  ];
  const total = Math.max(
    1,
    segments.reduce((sum, segment) => sum + segment.value, 0),
  );
  const presentPercent =
    stat.total > 0
      ? Math.round(((stat.present + stat.late) / stat.total) * 100)
      : 0;

  return (
    <DashboardCard
      title={t("teacherAttendance")}
      className={className}
      delay={delay}
      action={<CardLink href={href} label={t("open")} />}
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-jakarta text-3xl font-bold text-foreground">
            {presentPercent}%
          </p>
          <p className="font-manrope text-xs text-muted-foreground">
            {formatNumber(stat.present + stat.late)} /{" "}
            {formatNumber(stat.total)} {t("teachersIn")}
          </p>
        </div>
      </div>
      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {segments
          .filter((segment) => segment.value > 0)
          .map((segment) => (
            <span
              key={segment.key}
              className={`h-full ${segment.color}`}
              style={{ width: `${(segment.value / total) * 100}%` }}
              title={`${segment.label}: ${segment.value}`}
            />
          ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 font-manrope text-xs">
        {segments.map((segment) => (
          <span
            key={segment.key}
            className="flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${segment.color}`} />
              {segment.label}
            </span>
            <span className="font-semibold text-foreground">
              {segment.value}
            </span>
          </span>
        ))}
      </div>
    </DashboardCard>
  );
};

interface AdmissionsFunnelCardProps {
  funnel: DashboardAdmissionsFunnel;
  href: string;
  delay: number;
  className?: string;
}

export const AdmissionsFunnelCard = ({
  funnel,
  href,
  delay,
  className,
}: AdmissionsFunnelCardProps) => {
  const t = useTranslations("adminDashboard");
  const max = Math.max(1, funnel.applied);
  const stages = [
    {
      key: "applied",
      label: t("funnelApplied"),
      value: funnel.applied,
      color: "bg-sky-300 dark:bg-sky-500/70",
    },
    {
      key: "approved",
      label: t("funnelApproved"),
      value: funnel.approved,
      color: "bg-amber-300 dark:bg-amber-500/70",
    },
    {
      key: "enrolled",
      label: t("funnelEnrolled"),
      value: funnel.enrolled,
      color: "bg-violet-300 dark:bg-violet-500/70",
    },
  ];
  const chips = [
    { key: "pending", label: t("funnelPending"), value: funnel.pending },
    {
      key: "waitlisted",
      label: t("funnelWaitlisted"),
      value: funnel.waitlisted,
    },
    {
      key: "slotOffered",
      label: t("funnelSlotOffered"),
      value: funnel.slotOffered,
    },
    { key: "rejected", label: t("funnelRejected"), value: funnel.rejected },
  ];

  return (
    <DashboardCard
      title={t("admissionsFunnel")}
      className={className}
      delay={delay}
      action={<CardLink href={href} label={t("open")} />}
    >
      <p className="-mt-2 mb-4 font-manrope text-xs text-muted-foreground">
        {t("since")} {formatShortDate(funnel.since)}
      </p>
      <div className="space-y-2.5">
        {stages.map((stage) => (
          <div key={stage.key} className="flex items-center gap-3">
            <span className="w-20 shrink-0 font-manrope text-xs text-muted-foreground">
              {stage.label}
            </span>
            <div className="h-7 flex-1 overflow-hidden rounded-lg bg-muted/60">
              <div
                className={`flex h-full items-center rounded-lg px-2.5 transition-all duration-500 ${stage.color}`}
                style={{
                  width: `${Math.max(stage.value > 0 ? 12 : 0, (stage.value / max) * 100)}%`,
                }}
              >
                {stage.value > 0 && (
                  <span className="font-jakarta text-xs font-bold text-foreground">
                    {stage.value}
                  </span>
                )}
              </div>
            </div>
            {stage.value === 0 && (
              <span className="font-jakarta text-xs font-bold text-muted-foreground">
                0
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip.key}
            className="rounded-full border border-border bg-muted/40 px-2.5 py-1 font-manrope text-[11px] text-muted-foreground"
          >
            {chip.label}{" "}
            <span className="font-semibold text-foreground">{chip.value}</span>
          </span>
        ))}
      </div>
    </DashboardCard>
  );
};
