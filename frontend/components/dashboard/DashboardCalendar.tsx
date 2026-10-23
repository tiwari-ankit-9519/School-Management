"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  PartyPopper,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CARD_CLASS, fadeUp } from "@/components/dashboard/DashboardWidgets";
import { DashboardCard } from "@/components/dashboard/DashboardCharts";
import { useGetDashboardCalendar } from "@/hooks/useDashboard";
import { useTranslations } from "@/hooks/useTranslations";
import { DashboardEvent, ExamType } from "@/types";

const DAY_MS = 86_400_000;
const WEEKDAY_KEYS = [
  "daySun",
  "dayMon",
  "dayTue",
  "dayWed",
  "dayThu",
  "dayFri",
  "daySat",
] as const;

const EXAM_TYPE_KEYS = {
  [ExamType.UNIT_TEST]: "examUnitTest",
  [ExamType.MID_TERM]: "examMidTerm",
  [ExamType.FINAL]: "examFinal",
  [ExamType.PRACTICAL]: "examPractical",
  [ExamType.ASSIGNMENT]: "examAssignment",
  [ExamType.PROJECT]: "examProject",
  [ExamType.QUIZ]: "examQuiz",
} as const satisfies Record<ExamType, string>;

const EVENT_STYLE = {
  EXAM: {
    border: "border-t-sky-400",
    dot: "bg-sky-500",
    icon: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  HOLIDAY: {
    border: "border-t-amber-400",
    dot: "bg-amber-500",
    icon: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
} as const;

const toDate = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);
const toYmd = (date: Date) => date.toISOString().slice(0, 10);
const monthOf = (ymd: string) => ymd.slice(0, 7);

const shiftMonth = (month: string, delta: number) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

const monthTitle = (month: string) =>
  toDate(`${month}-01`).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const formatDay = (ymd: string) =>
  toDate(ymd).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });

const buildGrid = (month: string) => {
  const first = toDate(`${month}-01`);
  const start = new Date(first.getTime() - first.getUTCDay() * DAY_MS);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start.getTime() + index * DAY_MS);
    return {
      ymd: toYmd(date),
      day: date.getUTCDate(),
      inMonth: monthOf(toYmd(date)) === month,
    };
  });
};

const eventLabel = (
  event: DashboardEvent,
  t: ReturnType<typeof useTranslations<"adminDashboard">>,
) =>
  event.type === "HOLIDAY"
    ? t("holiday")
    : [
        event.examType ? t(EXAM_TYPE_KEYS[event.examType]) : null,
        event.className ? `${t("classShort")} ${event.className}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

const eventTime = (
  event: DashboardEvent,
  t: ReturnType<typeof useTranslations<"adminDashboard">>,
) =>
  event.startTime && event.endTime
    ? `${event.startTime} – ${event.endTime}`
    : t("allDay");

interface CalendarAgendaCardProps {
  today: string;
  delay: number;
  className?: string;
}

export const CalendarAgendaCard = ({
  today,
  delay,
  className,
}: CalendarAgendaCardProps) => {
  const t = useTranslations("adminDashboard");
  const [month, setMonth] = useState(monthOf(today));
  const [selected, setSelected] = useState(today);
  const { data, isFetching } = useGetDashboardCalendar(month);

  const grid = useMemo(() => buildGrid(month), [month]);
  const events = useMemo(() => data?.events ?? [], [data]);
  const eventsByDay = useMemo(() => {
    const map = new Map<string, DashboardEvent[]>();
    events.forEach((event) =>
      map.set(event.date, [...(map.get(event.date) ?? []), event]),
    );
    return map;
  }, [events]);

  const agenda = eventsByDay.get(selected) ?? [];

  const goToMonth = (delta: number) => {
    const next = shiftMonth(month, delta);
    setMonth(next);
    setSelected(monthOf(today) === next ? today : `${next}-01`);
  };

  return (
    <motion.div {...fadeUp(delay)} className={className}>
      <Card className={`${CARD_CLASS} h-full p-5`}>
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => goToMonth(-1)}
            aria-label={t("prevMonth")}
            className="h-8 w-8 rounded-lg border-border shadow-none"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <p className="flex items-center gap-2 font-jakarta text-base font-semibold text-foreground">
            {monthTitle(month)}
            {isFetching && (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
            )}
          </p>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => goToMonth(1)}
            aria-label={t("nextMonth")}
            className="h-8 w-8 rounded-lg border-border shadow-none"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-y-1 text-center">
          {WEEKDAY_KEYS.map((key) => (
            <span
              key={key}
              className="pb-2 font-manrope text-[11px] text-muted-foreground"
            >
              {t(key)}
            </span>
          ))}
          {grid.map((cell) => {
            const dayEvents = eventsByDay.get(cell.ymd) ?? [];
            const isToday = cell.ymd === today;
            const isSelected = cell.ymd === selected;
            const types = Array.from(
              new Set(dayEvents.map((event) => event.type)),
            );
            return (
              <button
                key={cell.ymd}
                type="button"
                onClick={() => {
                  setSelected(cell.ymd);
                  if (!cell.inMonth) setMonth(monthOf(cell.ymd));
                }}
                aria-label={`${formatDay(cell.ymd)}${dayEvents.length ? `, ${dayEvents.length} ${t("events")}` : ""}`}
                aria-pressed={isSelected}
                className={`relative mx-auto flex h-9 w-9 flex-col items-center justify-center rounded-lg font-manrope text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  isSelected
                    ? "bg-sky-500 font-semibold text-white"
                    : isToday
                      ? "bg-sky-500/15 font-semibold text-sky-700 dark:text-sky-300"
                      : cell.inMonth
                        ? "text-foreground hover:bg-accent"
                        : "text-muted-foreground/50 hover:bg-accent"
                }`}
              >
                {String(cell.day).padStart(2, "0")}
                {types.length > 0 && (
                  <span className="absolute bottom-1 flex gap-0.5">
                    {types.map((type) => (
                      <span
                        key={type}
                        className={`h-1 w-1 rounded-full ${isSelected ? "bg-white" : EVENT_STYLE[type].dot}`}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex items-center justify-center gap-4 font-manrope text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
            {t("exam")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {t("holiday")}
          </span>
        </div>

        <Separator className="my-4" />

        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-jakarta text-base font-semibold text-foreground">
            {t("agenda")}
          </h3>
          <span className="font-manrope text-xs text-muted-foreground">
            {formatDay(selected)}
          </span>
        </div>

        {agenda.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center">
            <CalendarDays className="size-5 text-muted-foreground" />
            <p className="font-manrope text-xs text-muted-foreground">
              {t("noEventsDay")}
            </p>
          </div>
        ) : (
          <div className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
            {agenda.map((event) => (
              <div
                key={`${event.type}-${event.id}`}
                className={`rounded-xl border border-t-[3px] border-border bg-card px-3.5 py-3 ${EVENT_STYLE[event.type].border}`}
              >
                <div className="flex items-center justify-between gap-2 font-manrope text-[11px] text-muted-foreground">
                  <span className="truncate">{eventLabel(event, t)}</span>
                  <span className="shrink-0">{eventTime(event, t)}</span>
                </div>
                <p className="mt-1 font-jakarta text-sm font-semibold text-foreground">
                  {event.title}
                </p>
                {event.subjectName && (
                  <p className="font-manrope text-[11px] text-muted-foreground">
                    {event.subjectName}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
};

const relativeDays = (
  ymd: string,
  today: string,
  t: ReturnType<typeof useTranslations<"adminDashboard">>,
) => {
  const days = Math.round(
    (toDate(ymd).getTime() - toDate(today).getTime()) / DAY_MS,
  );
  if (days <= 0) return t("today");
  if (days === 1) return t("tomorrow");
  return `${t("inPrefix")} ${days} ${t("daysSuffix")}`;
};

interface UpcomingCardProps {
  events: DashboardEvent[];
  today: string;
  delay: number;
  className?: string;
}

export const UpcomingCard = ({
  events,
  today,
  delay,
  className,
}: UpcomingCardProps) => {
  const t = useTranslations("adminDashboard");

  return (
    <DashboardCard
      title={t("upcoming")}
      className={className}
      delay={delay}
      action={
        <span className="rounded-full border border-border bg-muted/50 px-3 py-1 font-manrope text-xs text-muted-foreground">
          {t("next30Days")}
        </span>
      }
    >
      {events.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
          <CalendarDays className="size-5 text-muted-foreground" />
          <p className="font-manrope text-xs text-muted-foreground">
            {t("noUpcoming")}
          </p>
        </div>
      ) : (
        <div className="-mx-1 max-h-96 divide-y divide-border overflow-y-auto px-1">
          {events.map((event) => {
            const Icon = event.type === "HOLIDAY" ? PartyPopper : ClipboardList;
            return (
              <div
                key={`${event.type}-${event.id}`}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${EVENT_STYLE[event.type].icon}`}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-jakarta text-sm font-semibold text-foreground">
                    {event.title}
                  </p>
                  <p className="truncate font-manrope text-[11px] text-muted-foreground">
                    {[eventLabel(event, t), event.subjectName]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-0.5 font-manrope text-[11px] text-muted-foreground">
                    {formatDay(event.date)} · {eventTime(event, t)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 font-manrope text-[10px] font-medium text-muted-foreground">
                  {relativeDays(event.date, today, t)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
};
