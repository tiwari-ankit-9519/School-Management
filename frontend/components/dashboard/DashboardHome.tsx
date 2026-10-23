"use client";
import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CARD_CLASS,
  formatCompactCurrency,
  formatNumber,
} from "@/components/dashboard/DashboardWidgets";
import {
  BannerChip,
  DashboardBanner,
} from "@/components/dashboard/DashboardBanner";
import {
  AttendanceDonutCard,
  FeeTrendCard,
  StatTile,
  WeeklyAttendanceCard,
} from "@/components/dashboard/DashboardCharts";
import {
  CalendarAgendaCard,
  UpcomingCard,
} from "@/components/dashboard/DashboardCalendar";
import {
  AdmissionsFunnelCard,
  FeeDefaultersCard,
  RecentPaymentsCard,
  SeatsCard,
  TeacherAttendanceCard,
} from "@/components/dashboard/DashboardInsights";
import { useGetDashboardOverview } from "@/hooks/useDashboard";
import {
  isParentProfile,
  isStudentProfile,
  isTeacherProfile,
  useGetMyProfile,
} from "@/hooks/useProfile";
import { useTranslations } from "@/hooks/useTranslations";
import { DashboardOverview, MyProfile } from "@/types";

const buildLinks = (basePath: string) => ({
  students: `${basePath}/students`,
  teachers: `${basePath}/teachers`,
  attendance: `${basePath}/attendance`,
  fees: `${basePath}/fees/collection`,
  admissions: `${basePath}/admission-applications`,
  teacherApplications: `${basePath}/teacher-applications`,
  leaves: `${basePath}/leave-requests`,
  classes: `${basePath}/classes`,
});

type Translate = ReturnType<typeof useTranslations<"adminDashboard">>;

const getFirstName = (profile?: MyProfile) => {
  if (!profile) return "";
  const record = isStudentProfile(profile)
    ? profile.student
    : isTeacherProfile(profile)
      ? profile.teacher
      : isParentProfile(profile)
        ? profile.parent
        : profile.admin;
  return record?.firstName ?? "";
};

const buildHeadline = (overview: DashboardOverview, t: Translate) => {
  const fees = overview.monthlyFees;
  if (fees) {
    const billed = fees.reduce((sum, point) => sum + point.billed, 0);
    const collected = fees.reduce((sum, point) => sum + point.collected, 0);
    if (billed > 0) {
      return `${t("headlineFeePrefix")} ${Math.round((collected / billed) * 100)}% ${t("headlineFeeSuffix")}`;
    }
  }
  const attendance = overview.stats.attendanceToday;
  if (attendance?.isHoliday)
    return `${t("headlineHoliday")} ${attendance.holidayName ?? ""}`.trim();
  if (attendance && attendance.percent !== null) {
    return `${attendance.percent}% ${t("headlineAttendanceSuffix")}`;
  }
  if (overview.stats.students) {
    return `${formatNumber(overview.stats.students.value)} ${t("headlineStudentsSuffix")}`;
  }
  return t("headlineDefault");
};

const DashboardHomeSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
    <div className="space-y-4 xl:col-span-8">
      <Skeleton className="h-44 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
      </div>
    </div>
    <Skeleton className="h-180 rounded-2xl xl:col-span-4" />
    <Skeleton className="h-96 rounded-2xl xl:col-span-4" />
    <Skeleton className="h-96 rounded-2xl xl:col-span-8" />
  </div>
);

interface DashboardHomeProps {
  basePath: string;
}

export const DashboardHome = ({ basePath }: DashboardHomeProps) => {
  const t = useTranslations("adminDashboard");
  const {
    data: overview,
    isLoading,
    isError,
    refetch,
  } = useGetDashboardOverview();
  const { data: profile } = useGetMyProfile();
  const links = useMemo(() => buildLinks(basePath), [basePath]);

  if (isLoading) return <DashboardHomeSkeleton />;

  if (isError || !overview) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card
          className={`${CARD_CLASS} w-full max-w-sm items-center gap-4 px-6 py-8 text-center`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertTriangle className="size-5" />
          </span>
          <p className="font-manrope text-sm text-muted-foreground">
            {t("loadError")}
          </p>
          <Button
            onClick={() => refetch()}
            className="rounded-full bg-primary px-5 font-manrope text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t("retry")}
          </Button>
        </Card>
      </div>
    );
  }

  const { stats, pending } = overview;
  const currentMonth = overview.today.slice(0, 7);

  const chips: BannerChip[] = [
    {
      key: "admissions",
      label: t("chipAdmissions"),
      count: pending.admissions ?? 0,
      href: links.admissions,
    },
    {
      key: "teacherApplications",
      label: t("chipTeacherApplications"),
      count: pending.teacherApplications ?? 0,
      href: links.teacherApplications,
    },
    {
      key: "leaves",
      label: t("chipLeaves"),
      count: (pending.studentLeaves ?? 0) + (pending.teacherLeaves ?? 0),
      href: links.leaves,
    },
  ];

  const tiles = [
    stats.students && {
      key: "students",
      label: t("tileStudents"),
      value: formatNumber(stats.students.value),
      change: stats.students.changePercent,
      unit: "%" as const,
      hint:
        stats.students.previous !== null
          ? `${t("vsLastSession")} ${formatNumber(stats.students.previous)}`
          : t("thisSession"),
      href: links.students,
    },
    stats.teachers && {
      key: "teachers",
      label: t("tileTeachers"),
      value: formatNumber(stats.teachers.value),
      change: stats.teachers.changePercent,
      unit: "%" as const,
      hint:
        stats.teachers.previous !== null && stats.teachers.previous > 0
          ? `${t("vsLastYear")} ${formatNumber(stats.teachers.previous)}`
          : t("activeStaff"),
      href: links.teachers,
    },
    stats.attendanceToday && {
      key: "attendance",
      label: t("tileAttendance"),
      value: stats.attendanceToday.isHoliday
        ? t("holiday")
        : stats.attendanceToday.percent !== null
          ? `${stats.attendanceToday.percent}%`
          : "—",
      change: stats.attendanceToday.isHoliday
        ? null
        : stats.attendanceToday.changePoints,
      unit: "pts" as const,
      hint:
        stats.attendanceToday.weekAveragePercent !== null
          ? `${t("weekAverage")} ${stats.attendanceToday.weekAveragePercent}%`
          : t("notMarkedYet"),
      href: links.attendance,
    },
    stats.feeCollected && {
      key: "fees",
      label: t("tileFeeCollected"),
      value: formatCompactCurrency(stats.feeCollected.value),
      change: stats.feeCollected.changePercent,
      unit: "%" as const,
      hint:
        stats.feeCollected.previous !== null
          ? `${t("vsLastSessionSoFar")} ${formatCompactCurrency(stats.feeCollected.previous)}`
          : t("thisSession"),
      href: links.fees,
    },
  ].filter((tile): tile is NonNullable<typeof tile> => !!tile);

  const tileGrid =
    tiles.length >= 4
      ? "lg:grid-cols-4"
      : tiles.length === 3
        ? "lg:grid-cols-3"
        : tiles.length === 2
          ? "lg:grid-cols-2"
          : "";

  const showAttendanceRow =
    !!stats.attendanceToday || !!overview.weeklyAttendance;
  const insights = [
    overview.feeDefaulters && (
      <FeeDefaultersCard
        key="defaulters"
        rows={overview.feeDefaulters}
        today={overview.today}
        href={links.fees}
        delay={0.5}
      />
    ),
    overview.recentPayments && (
      <RecentPaymentsCard
        key="payments"
        rows={overview.recentPayments}
        generatedAt={overview.generatedAt}
        href={links.fees}
        delay={0.55}
      />
    ),
    overview.seatsByGroup && (
      <SeatsCard
        key="seats"
        groups={overview.seatsByGroup}
        href={links.classes}
        delay={0.6}
      />
    ),
    overview.teacherAttendanceToday && (
      <TeacherAttendanceCard
        key="teachers"
        stat={overview.teacherAttendanceToday}
        href={links.attendance}
        delay={0.65}
      />
    ),
    overview.admissionsFunnel && (
      <AdmissionsFunnelCard
        key="funnel"
        funnel={overview.admissionsFunnel}
        href={links.admissions}
        delay={0.7}
      />
    ),
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="min-w-0 space-y-4 xl:col-span-8">
          <DashboardBanner
            name={getFirstName(profile) || t("there")}
            headline={buildHeadline(overview, t)}
            email={profile?.email ?? null}
            phone={profile?.phone ?? null}
            chips={chips}
            delay={0}
          />

          {tiles.length > 0 && (
            <div className={`grid grid-cols-2 gap-4 ${tileGrid}`}>
              {tiles.map((tile, index) => (
                <StatTile
                  key={tile.key}
                  label={tile.label}
                  value={tile.value}
                  change={tile.change}
                  unit={tile.unit}
                  hint={tile.hint}
                  href={tile.href}
                  delay={0.05 + index * 0.04}
                />
              ))}
            </div>
          )}

          {showAttendanceRow && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {stats.attendanceToday && (
                <AttendanceDonutCard
                  stat={stats.attendanceToday}
                  href={links.attendance}
                  delay={0.25}
                  className={overview.weeklyAttendance ? "" : "lg:col-span-3"}
                />
              )}
              {overview.weeklyAttendance && (
                <WeeklyAttendanceCard
                  days={overview.weeklyAttendance.days}
                  delay={0.3}
                  className={
                    stats.attendanceToday ? "lg:col-span-2" : "lg:col-span-3"
                  }
                />
              )}
            </div>
          )}
        </div>

        <CalendarAgendaCard
          today={overview.today}
          delay={0.15}
          className="min-w-0 xl:col-span-4"
        />

        <UpcomingCard
          events={overview.upcoming}
          today={overview.today}
          delay={0.35}
          className={
            overview.monthlyFees
              ? "min-w-0 xl:col-span-4"
              : "min-w-0 xl:col-span-12"
          }
        />

        {overview.monthlyFees && (
          <FeeTrendCard
            points={overview.monthlyFees}
            currentMonth={currentMonth}
            href={links.fees}
            delay={0.4}
            className="min-w-0 xl:col-span-8"
          />
        )}
      </div>

      {insights.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {insights}
        </div>
      )}

      <p className="px-1 text-right font-manrope text-[11px] text-muted-foreground">
        {t("updatedAt")}{" "}
        {new Date(overview.generatedAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })}
        {overview.academicYear ? ` · ${overview.academicYear.name}` : ""}
      </p>
    </div>
  );
};
