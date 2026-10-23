"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CalendarCheck2,
  CalendarClock,
  CalendarHeart,
  CalendarX2,
  Lock,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CARD_CLASS,
  TONE_CLASSES,
  fadeUp,
} from "@/components/dashboard/DashboardWidgets";
import { PRIMARY_PILL_CLASS, fieldClass } from "@/components/forms/FormParts";
import {
  DeleteHolidayDialog,
  HolidayConflictDialog,
  HolidayFormDialog,
  HolidayRow,
  HolidaysSkeleton,
  PendingConflict,
  daysBetween,
  formatHolidayDate,
  holidayYmd,
} from "@/components/holidays/HolidayParts";
import { useGetHolidays } from "@/hooks/useHoliday";
import { usePermissions } from "@/hooks/usePermissions";
import { useTranslations } from "@/hooks/useTranslations";
import { Holiday } from "@/types";

const ALL = "ALL";
const MAX_HOLIDAYS_PER_YEAR = 100;
const DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const MONTHS = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: new Date(Date.UTC(2000, index, 1)).toLocaleDateString("en-IN", {
    month: "long",
    timeZone: "UTC",
  }),
}));

const HolidaysPage = () => {
  const t = useTranslations("holidays");
  const { can, isLoading: permissionsLoading } = usePermissions();
  const [today] = useState(() => DATE_FORMAT.format(new Date()));
  const currentYear = Number(today.slice(0, 4));

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<string>(ALL);
  const [formState, setFormState] = useState<{
    open: boolean;
    holiday: Holiday | null;
  }>({ open: false, holiday: null });
  const [pendingConflict, setPendingConflict] =
    useState<PendingConflict | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);

  const canRead = can("HOLIDAY", "canRead");
  const canCreate = can("HOLIDAY", "canCreate");
  const canEdit = can("HOLIDAY", "canUpdate");
  const canDelete = can("HOLIDAY", "canDelete");

  const { data, isLoading } = useGetHolidays(
    { year, page: 1, limit: MAX_HOLIDAYS_PER_YEAR },
    canRead,
  );
  const holidays = useMemo(() => data?.data ?? [], [data]);

  const visible = useMemo(
    () =>
      month === ALL
        ? holidays
        : holidays.filter(
            (holiday) =>
              Number(holidayYmd(holiday).slice(5, 7)) === Number(month),
          ),
    [holidays, month],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Holiday[]>();
    visible.forEach((holiday) => {
      const key = holidayYmd(holiday).slice(0, 7);
      map.set(key, [...(map.get(key) ?? []), holiday]);
    });
    return Array.from(map.entries());
  }, [visible]);

  const upcoming = holidays.filter((holiday) => holidayYmd(holiday) >= today);
  const nextHoliday = upcoming[0];
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  if (permissionsLoading) return <HolidaysSkeleton />;

  if (!canRead) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card
          className={`${CARD_CLASS} w-full max-w-sm items-center gap-3 px-6 py-8 text-center`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Lock className="size-5" />
          </span>
          <p className="font-jakarta text-base font-semibold text-foreground">
            {t("noAccessTitle")}
          </p>
          <p className="font-manrope text-sm text-muted-foreground">
            {t("noAccessSub")}
          </p>
        </Card>
      </div>
    );
  }

  if (isLoading) return <HolidaysSkeleton />;

  const stats = [
    {
      key: "total",
      label: t("statTotal"),
      value: String(holidays.length),
      icon: CalendarHeart,
      tone: TONE_CLASSES.amber,
    },
    {
      key: "upcoming",
      label: t("statUpcoming"),
      value: String(upcoming.length),
      icon: CalendarClock,
      tone: TONE_CLASSES.indigo,
    },
    {
      key: "past",
      label: t("statPast"),
      value: String(holidays.length - upcoming.length),
      icon: CalendarX2,
      tone: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300",
    },
    {
      key: "next",
      label: t("statNext"),
      value: nextHoliday ? nextHoliday.name : "—",
      sub: nextHoliday
        ? daysBetween(today, holidayYmd(nextHoliday)) === 0
          ? t("today")
          : `${formatHolidayDate(holidayYmd(nextHoliday), { day: "numeric", month: "short" })} · ${t("inPrefix")} ${daysBetween(today, holidayYmd(nextHoliday))} ${t("daysSuffix")}`
        : t("noneUpcoming"),
      icon: CalendarCheck2,
      tone: TONE_CLASSES.emerald,
    },
  ];

  const selectTrigger = `${fieldClass(false)} h-9 rounded-full text-xs data-[size=default]:h-9 dark:hover:bg-card`;

  return (
    <div className="space-y-5">
      <motion.header
        {...fadeUp(0)}
        className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="font-jakarta text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("pageTitle")}
          </h1>
          <p className="mt-1.5 font-manrope text-sm text-muted-foreground">
            {t("pageSubtitle")}
          </p>
        </div>
        {canCreate && (
          <Button
            type="button"
            onClick={() => setFormState({ open: true, holiday: null })}
            className={`h-11 gap-2 self-start px-5 text-sm sm:self-auto ${PRIMARY_PILL_CLASS}`}
          >
            <Plus className="size-4" />
            {t("addHoliday")}
          </Button>
        )}
      </motion.header>

      <motion.div
        {...fadeUp(0.05)}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <Card key={stat.key} className={`${CARD_CLASS} gap-1.5 p-4`}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-manrope text-xs text-muted-foreground">
                {stat.label}
              </p>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg border ${stat.tone}`}
              >
                <stat.icon className="size-4" />
              </span>
            </div>
            <p
              className="truncate font-jakarta text-xl font-bold text-foreground sm:text-2xl"
              title={stat.value}
            >
              {stat.value}
            </p>
            {"sub" in stat && stat.sub && (
              <p className="truncate font-manrope text-[11px] text-muted-foreground">
                {stat.sub}
              </p>
            )}
          </Card>
        ))}
      </motion.div>

      <motion.div {...fadeUp(0.1)}>
        <Card className={`${CARD_CLASS} gap-0 overflow-hidden`}>
          <div className="flex flex-col gap-3 px-4 pt-4 pb-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="font-manrope text-xs text-muted-foreground">
              {visible.length}{" "}
              {visible.length === 1 ? t("holidaySingular") : t("holidayPlural")}
            </p>
            <div className="flex gap-2">
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger
                  className={`${selectTrigger} w-40`}
                  aria-label={t("filterMonth")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-xl">
                  <SelectItem value={ALL} className="font-manrope text-sm">
                    {t("allMonths")}
                  </SelectItem>
                  {MONTHS.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      className="font-manrope text-sm"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={String(year)}
                onValueChange={(value: string) => setYear(Number(value))}
              >
                <SelectTrigger
                  className={`${selectTrigger} w-28`}
                  aria-label={t("filterYear")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {yearOptions.map((option) => (
                    <SelectItem
                      key={option}
                      value={String(option)}
                      className="font-manrope text-sm"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />

          {grouped.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
                <CalendarHeart className="size-6 text-muted-foreground" />
              </span>
              <div>
                <p className="font-jakarta text-sm font-semibold text-foreground">
                  {t("emptyTitle")}
                </p>
                <p className="mt-1 font-manrope text-xs text-muted-foreground">
                  {canCreate ? t("emptySubCreate") : t("emptySubRead")}
                </p>
              </div>
              {canCreate && (
                <Button
                  type="button"
                  onClick={() => setFormState({ open: true, holiday: null })}
                  className={`h-9 gap-1.5 px-4 text-xs ${PRIMARY_PILL_CLASS}`}
                >
                  <Plus className="size-3.5" />
                  {t("addHoliday")}
                </Button>
              )}
            </div>
          ) : (
            grouped.map(([monthKey, items]) => (
              <section key={monthKey}>
                <div className="bg-muted/40 px-4 py-2 sm:px-5">
                  <p className="font-manrope text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {formatHolidayDate(`${monthKey}-01`, {
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    · {items.length}
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {items.map((holiday) => (
                    <HolidayRow
                      key={holiday.id}
                      holiday={holiday}
                      today={today}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onEdit={(target) =>
                        setFormState({ open: true, holiday: target })
                      }
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </Card>
      </motion.div>

      <HolidayFormDialog
        key={
          formState.holiday?.id ??
          (formState.open ? "holiday-new" : "holiday-closed")
        }
        open={formState.open}
        holiday={formState.holiday}
        onOpenChange={(open) =>
          !open && setFormState({ open: false, holiday: null })
        }
        onConflict={setPendingConflict}
      />

      <HolidayConflictDialog
        pending={pendingConflict}
        onOpenChange={(open) => !open && setPendingConflict(null)}
      />

      <DeleteHolidayDialog
        holiday={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </div>
  );
};

export default HolidaysPage;
