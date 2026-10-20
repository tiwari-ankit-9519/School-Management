"use client";
import { motion } from "motion/react";
import {
  AlertTriangle,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Inbox,
  PartyPopper,
  Users,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CARD_CLASS,
  TONE_CLASSES,
  fadeUp,
} from "@/components/dashboard/DashboardWidgets";
import { formatEnum } from "@/components/admissions/AdmissionDetailParts";
import { useGetMyToday } from "@/hooks/useProfile";
import { useTranslations } from "@/hooks/useTranslations";
import {
  AttendanceStatus,
  DayOfWeek,
  MyTodaySummary,
  TodayExam,
  TodayPeriod,
} from "@/types";

const WEEK_DAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

const TONES = {
  indigo: {
    text: "text-indigo-600 dark:text-indigo-400",
    active: "bg-indigo-500",
    muted: "bg-indigo-500/20",
  },
  violet: {
    text: "text-violet-600 dark:text-violet-400",
    active: "bg-violet-500",
    muted: "bg-violet-500/20",
  },
  amber: {
    text: "text-amber-600 dark:text-amber-400",
    active: "bg-amber-500",
    muted: "bg-amber-500/20",
  },
  emerald: {
    text: "text-emerald-600 dark:text-emerald-400",
    active: "bg-emerald-500",
    muted: "bg-emerald-500/20",
  },
  red: {
    text: "text-red-600 dark:text-red-400",
    active: "bg-red-500",
    muted: "bg-red-500/20",
  },
} as const;

type Tone = keyof typeof TONES;

interface BarDatum {
  value: number;
  active: boolean;
}

interface CardSpec {
  key: string;
  value: string;
  label: string;
  footnote: string;
  icon: React.ReactNode;
  tone: Tone;
  bars: BarDatum[];
  highlighted?: boolean;
}

const ATTENDANCE_TONES: Record<AttendanceStatus, Tone> = {
  [AttendanceStatus.PRESENT]: "emerald",
  [AttendanceStatus.LATE]: "amber",
  [AttendanceStatus.ABSENT]: "red",
  [AttendanceStatus.EXCUSED]: "violet",
  [AttendanceStatus.HOLIDAY]: "indigo",
};

const ATTENDANCE_HEIGHT: Record<AttendanceStatus, number> = {
  [AttendanceStatus.PRESENT]: 1,
  [AttendanceStatus.LATE]: 0.7,
  [AttendanceStatus.EXCUSED]: 0.5,
  [AttendanceStatus.HOLIDAY]: 0.4,
  [AttendanceStatus.ABSENT]: 0.2,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

const formatLongDate = (ymd: string) =>
  new Date(`${ymd}T00:00:00.000Z`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });

const weekBars = (load: number[], dayOfWeek: DayOfWeek): BarDatum[] => {
  const todayIndex = WEEK_DAYS.indexOf(dayOfWeek);
  return load.map((value, index) => ({ value, active: index === todayIndex }));
};

const firstActiveBars = (values: number[]): BarDatum[] =>
  values.map((value, index) => ({ value, active: index === 0 }));

const TodayCard = ({ spec }: { spec: CardSpec }) => {
  const colors = TONES[spec.tone];
  const max = Math.max(1, ...spec.bars.map((bar) => bar.value));

  return (
    <Card
      className={`${CARD_CLASS} h-full gap-0 p-5 transition-all ${
        spec.highlighted
          ? "border-transparent shadow-[0_16px_40px_rgba(0,0,0,0.10)] lg:-translate-y-1 dark:shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
          : ""
      }`}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`truncate font-jakarta text-3xl font-bold tracking-tight ${colors.text}`}
          >
            {spec.value}
          </p>
          <p className="mt-1 font-jakarta text-sm font-semibold text-foreground">
            {spec.label}
          </p>
          <p className="mt-2 flex items-start gap-1.5 font-manrope text-[11px] leading-snug text-muted-foreground">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {spec.icon}
            </span>
            <span className="line-clamp-2 pt-0.5">{spec.footnote}</span>
          </p>
        </div>
        {spec.bars.length > 0 && (
          <div
            className="flex h-16 shrink-0 items-end gap-1"
            aria-hidden="true"
          >
            {spec.bars.map((bar, index) => (
              <span
                key={index}
                className={`w-2.5 rounded-t-sm ${bar.active ? colors.active : colors.muted}`}
                style={{
                  height: `${Math.max(12, Math.round((bar.value / max) * 100))}%`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

const TodayCardsSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <Skeleton key={i} className="h-36 rounded-2xl" />
    ))}
  </div>
);

type Translate = ReturnType<typeof useTranslations<"profileToday">>;

const describePeriod = (
  period: TodayPeriod | null,
  count: number,
  time: string,
  t: Translate,
  withClass: boolean,
) => {
  if (!period) return count > 0 ? t("doneForDay") : t("noClassesToday");
  const prefix = period.startTime <= time ? t("now") : t("next");
  const where = withClass ? ` · ${period.className}` : "";
  const room = period.room ? ` · ${t("room")} ${period.room}` : "";
  return `${prefix}: ${period.subjectName}${where} ${t("at")} ${period.startTime}${room}`;
};

const describeExam = (
  exam: TodayExam | null,
  todayYmd: string,
  t: Translate,
  withChild: boolean,
) => {
  if (!exam) return t("noExams");
  const when =
    exam.date.slice(0, 10) === todayYmd
      ? t("today")
      : formatShortDate(exam.date);
  const who = withChild && exam.childName ? `${exam.childName} · ` : "";
  return `${t("next")}: ${who}${exam.subjectName} · ${when} ${exam.startTime}`;
};

const buildSpecs = (summary: MyTodaySummary, t: Translate): CardSpec[] => {
  const examIcon = <ClipboardList className="size-3" />;

  if (summary.role === "STUDENT") {
    const hasOverdue = summary.fees.overdueCount > 0;
    const status = summary.attendanceToday;
    return [
      {
        key: "classes",
        value: String(summary.periodsToday),
        label: t("classesToday"),
        footnote: summary.className
          ? describePeriod(
              summary.nextPeriod,
              summary.periodsToday,
              summary.time,
              t,
              false,
            )
          : t("noClass"),
        icon: <BookOpen className="size-3" />,
        tone: "indigo",
        bars: weekBars(summary.weekLoad, summary.dayOfWeek),
      },
      {
        key: "exams",
        value: String(summary.exams.count),
        label: t("examsAhead"),
        footnote: describeExam(summary.exams.next, summary.date, t, false),
        icon: examIcon,
        tone: "violet",
        bars: firstActiveBars(summary.exams.byDay),
      },
      hasOverdue
        ? {
            key: "fees",
            value: formatCurrency(summary.fees.dueAmount),
            label: t("feesOverdue"),
            footnote: `${summary.fees.overdueCount} ${t("overduePayments")}`,
            icon: <Wallet className="size-3" />,
            tone: "red",
            bars: [],
            highlighted: true,
          }
        : {
            key: "attendance",
            value: status ? formatEnum(status) : t("notMarked"),
            label: t("attendanceToday"),
            footnote:
              summary.fees.pendingCount > 0
                ? `${summary.fees.pendingCount} ${t("pendingPayments")}`
                : t("recentDays"),
            icon: <CalendarCheck className="size-3" />,
            tone: status ? ATTENDANCE_TONES[status] : "amber",
            bars: summary.recentAttendance.map((entry, index) => ({
              value: ATTENDANCE_HEIGHT[entry],
              active: index === summary.recentAttendance.length - 1,
            })),
            highlighted: true,
          },
    ];
  }

  if (summary.role === "TEACHER") {
    const unmarked = summary.classTeacherOf.filter(
      (cls) => !cls.attendanceMarked,
    );
    const isClassTeacher = summary.classTeacherOf.length > 0;
    return [
      {
        key: "periods",
        value: String(summary.periodsToday),
        label: t("periodsToTeach"),
        footnote: describePeriod(
          summary.nextPeriod,
          summary.periodsToday,
          summary.time,
          t,
          true,
        ),
        icon: <BookOpen className="size-3" />,
        tone: "indigo",
        bars: weekBars(summary.weekLoad, summary.dayOfWeek),
      },
      {
        key: "exams",
        value: String(summary.exams.count),
        label: t("examsConducting"),
        footnote: describeExam(summary.exams.next, summary.date, t, false),
        icon: examIcon,
        tone: "violet",
        bars: firstActiveBars(summary.exams.byDay),
      },
      {
        key: "attendance",
        value: isClassTeacher ? String(unmarked.length) : "—",
        label: isClassTeacher ? t("attendanceToMark") : t("classTeacher"),
        footnote: !isClassTeacher
          ? t("notClassTeacher")
          : unmarked.length > 0
            ? `${t("pendingFor")} ${unmarked.map((cls) => cls.className).join(", ")}`
            : t("allMarked"),
        icon:
          unmarked.length > 0 ? (
            <AlertTriangle className="size-3" />
          ) : (
            <CalendarCheck className="size-3" />
          ),
        tone: unmarked.length > 0 ? "amber" : "emerald",
        bars: summary.classTeacherOf.map((cls) => ({
          value: cls.attendanceMarked ? 1 : 0.35,
          active: !cls.attendanceMarked,
        })),
        highlighted: true,
      },
    ];
  }

  if (summary.role === "PARENT") {
    const hasOverdue = summary.fees.overdueCount > 0;
    const present = summary.children.filter(
      (child) =>
        child.attendanceToday === AttendanceStatus.PRESENT ||
        child.attendanceToday === AttendanceStatus.LATE,
    ).length;
    return [
      {
        key: "classes",
        value: String(summary.periodsToday),
        label: t("childrenClasses"),
        footnote:
          summary.children.length === 0
            ? t("noChildren")
            : summary.children
                .map((child) => `${child.name}: ${child.periodsToday}`)
                .join(" · "),
        icon: <Users className="size-3" />,
        tone: "indigo",
        bars: summary.children.map((child, index) => ({
          value: child.periodsToday,
          active: index === 0,
        })),
      },
      {
        key: "exams",
        value: String(summary.exams.count),
        label: t("examsAhead"),
        footnote: describeExam(summary.exams.next, summary.date, t, true),
        icon: examIcon,
        tone: "violet",
        bars: firstActiveBars(summary.exams.byDay),
      },
      hasOverdue
        ? {
            key: "fees",
            value: formatCurrency(summary.fees.dueAmount),
            label: t("feesOverdue"),
            footnote: `${summary.fees.overdueCount} ${t("overduePayments")}`,
            icon: <Wallet className="size-3" />,
            tone: "red",
            bars: [],
            highlighted: true,
          }
        : {
            key: "present",
            value: `${present}/${summary.children.length}`,
            label: t("childrenPresent"),
            footnote:
              summary.children.length === 0
                ? t("noChildren")
                : summary.children
                    .map(
                      (child) =>
                        `${child.name}: ${child.attendanceToday ? formatEnum(child.attendanceToday) : t("notMarked")}`,
                    )
                    .join(" · "),
            icon: <CalendarCheck className="size-3" />,
            tone:
              present === summary.children.length && present > 0
                ? "emerald"
                : "amber",
            bars: summary.children.map((child) => ({
              value: child.attendanceToday
                ? ATTENDANCE_HEIGHT[child.attendanceToday]
                : 0.15,
              active: child.attendanceToday === AttendanceStatus.PRESENT,
            })),
            highlighted: true,
          },
    ];
  }

  const trendBars = summary.attendanceTrend.map((rate, index) => ({
    value: rate ?? 4,
    active: index === summary.attendanceTrend.length - 1,
  }));
  return [
    {
      key: "attendance",
      value:
        summary.attendance.rate !== null ? `${summary.attendance.rate}%` : "—",
      label: t("studentAttendance"),
      footnote:
        summary.attendance.marked > 0
          ? `${summary.attendance.marked} ${t("markedOf")} ${summary.attendance.enrolled} ${t("enrolled")}`
          : t("noAttendanceYet"),
      icon: <CalendarCheck className="size-3" />,
      tone: "indigo",
      bars: trendBars,
    },
    {
      key: "pending",
      value: String(summary.pending.total),
      label: t("pendingRequests"),
      footnote: `${summary.pending.admissions} ${t("admissions")} · ${summary.pending.teacherApplications} ${t("applications")} · ${summary.pending.leaveRequests} ${t("leave")}`,
      icon: <Inbox className="size-3" />,
      tone: "violet",
      bars: [
        summary.pending.admissions,
        summary.pending.teacherApplications,
        summary.pending.leaveRequests,
      ].map((value, index) => ({ value, active: index === 0 })),
    },
    {
      key: "exams",
      value: String(summary.exams.count),
      label: t("examsToday"),
      footnote:
        summary.exams.count > 0 || summary.exams.next
          ? describeExam(summary.exams.next, summary.date, t, false)
          : t("noExamsToday"),
      icon: examIcon,
      tone: summary.exams.count > 0 ? "amber" : "emerald",
      bars: firstActiveBars(summary.exams.byDay),
      highlighted: true,
    },
  ];
};

export const TodayCards = () => {
  const t = useTranslations("profileToday");
  const { data: summary, isLoading, isError, refetch } = useGetMyToday();

  if (isLoading) return <TodayCardsSkeleton />;

  if (isError || !summary) {
    return (
      <Card
        className={`${CARD_CLASS} flex-row items-center justify-between gap-3 p-4`}
      >
        <p className="font-manrope text-sm text-muted-foreground">
          {t("loadError")}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => refetch()}
          className="h-8 rounded-full px-4 text-xs"
        >
          {t("retry")}
        </Button>
      </Card>
    );
  }

  const specs = buildSpecs(summary, t);

  return (
    <motion.div {...fadeUp(0.1)} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 px-1">
        <p className="font-jakarta text-sm font-semibold text-foreground">
          {t("title")}
        </p>
        <span className="font-manrope text-xs text-muted-foreground">
          {formatLongDate(summary.date)}
        </span>
        {summary.holiday && (
          <Badge
            variant="outline"
            className={`gap-1 rounded-full font-manrope text-[11px] font-medium ${TONE_CLASSES.amber}`}
          >
            <PartyPopper className="size-3" />
            {t("holidayBadge")}: {summary.holiday}
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {specs.map((spec) => (
          <TodayCard key={spec.key} spec={spec} />
        ))}
      </div>
    </motion.div>
  );
};
