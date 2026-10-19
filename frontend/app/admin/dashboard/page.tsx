"use client";
import Link from "next/link";
import { motion } from "motion/react";
import {
  AlertTriangle,
  CalendarOff,
  ClipboardCheck,
  GraduationCap,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AttendanceCard,
  AttentionCard,
  CARD_CLASS,
  DashboardSkeleton,
  FeeGaugeCard,
  LiveClockCard,
  PipelineCard,
  RequestRow,
  RequestsCard,
  StatCard,
  fadeUp,
  formatCompactCurrency,
  formatNumber,
} from "@/components/dashboard/DashboardWidgets";
import { useGetDashboardSummary } from "@/hooks/useDashboard";
import { useTranslations } from "@/hooks/useTranslations";

const LINKS = {
  students: "/admin/students",
  teachers: "/admin/teachers",
  admissions: "/admin/admission-applications",
  fees: "/admin/fee-payments",
} as const;

const DashboardPage = () => {
  const t = useTranslations("dashboard");
  const {
    data: summary,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useGetDashboardSummary();

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !summary) {
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

  const admissionCounts: Record<string, number> =
    summary.admissionApplications.byStatus;
  const studentLeave: Record<string, number> =
    summary.studentLeaveRequests.byStatus;
  const teacherLeave: Record<string, number> =
    summary.teacherLeaveRequests.byStatus;
  const teacherApps: Record<string, number> =
    summary.teacherApplications.byStatus;

  const pendingAdmissions =
    (admissionCounts.PENDING ?? 0) + (admissionCounts.WAITLISTED ?? 0);
  const { collected, expected } = summary.feeRevenue;
  const feeRate =
    expected > 0 ? Math.min(Math.round((collected / expected) * 100), 100) : 0;
  const activeStudents = summary.students.byStatus.ACTIVE;
  const studentActiveRate =
    summary.students.total > 0
      ? Math.round((activeStudents / summary.students.total) * 100)
      : 0;

  const requestRows: RequestRow[] = [
    {
      key: "student-leave",
      title: t("reqStudentLeave"),
      subtitle: t("reqStudentLeaveSub"),
      icon: <Users className="size-4" />,
      tone: "indigo",
      badges: [
        {
          label: t("badgePending"),
          count: studentLeave.PENDING ?? 0,
          tone: "amber",
        },
        {
          label: t("badgeApproved"),
          count: studentLeave.APPROVED ?? 0,
          tone: "emerald",
        },
        {
          label: t("badgeRejected"),
          count: studentLeave.REJECTED ?? 0,
          tone: "red",
        },
      ],
    },
    {
      key: "teacher-leave",
      title: t("reqTeacherLeave"),
      subtitle: t("reqTeacherLeaveSub"),
      icon: <GraduationCap className="size-4" />,
      tone: "emerald",
      badges: [
        {
          label: t("badgePending"),
          count: teacherLeave.PENDING ?? 0,
          tone: "amber",
        },
        {
          label: t("badgeApproved"),
          count: teacherLeave.APPROVED ?? 0,
          tone: "emerald",
        },
        {
          label: t("badgeRejected"),
          count: teacherLeave.REJECTED ?? 0,
          tone: "red",
        },
      ],
    },
    {
      key: "teacher-applications",
      title: t("reqTeacherApps"),
      subtitle: t("reqTeacherAppsSub"),
      icon: <UserPlus className="size-4" />,
      tone: "amber",
      badges: [
        {
          label: t("badgePending"),
          count: teacherApps.PENDING ?? 0,
          tone: "amber",
        },
        {
          label: t("badgeShortlisted"),
          count: teacherApps.SHORTLISTED ?? 0,
          tone: "indigo",
        },
        {
          label: t("badgeSelected"),
          count: teacherApps.SELECTED ?? 0,
          tone: "emerald",
        },
      ],
    },
    {
      key: "staff-on-leave",
      title: t("reqStaffOnLeave"),
      subtitle: t("reqStaffOnLeaveSub"),
      icon: <CalendarOff className="size-4" />,
      tone: "violet",
      badges: [
        {
          label: t("statTeachers"),
          count: summary.teachers.byStatus.ON_LEAVE,
          tone: "violet",
        },
        {
          label: t("statAdmins"),
          count: summary.admins.byStatus.ON_LEAVE,
          tone: "violet",
        },
      ],
    },
  ];

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
            {summary.academicYear
              ? `${t("pageSubtitle")} · ${summary.academicYear.name}`
              : t("pageSubtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            className="h-11 gap-2 rounded-full bg-linear-to-r from-indigo-600 to-indigo-800 px-5 font-manrope text-sm font-semibold text-white shadow-none hover:opacity-90"
          >
            <Link href={LINKS.admissions}>
              <ClipboardCheck className="size-4" />
              {t("reviewAdmissions")}
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-11 gap-2 rounded-full border-border bg-card px-5 font-manrope text-sm font-medium text-foreground shadow-none hover:bg-accent"
          >
            <RefreshCw
              className={`size-4 ${isFetching ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""}`}
            />
            {t("refresh")}
          </Button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          highlighted
          label={t("statStudents")}
          value={formatNumber(summary.students.total)}
          chip={
            <>
              <TrendingUp className="size-3" />
              {studentActiveRate}%
            </>
          }
          footnote={`${formatNumber(activeStudents)} ${t("activeSuffix")}`}
          href={LINKS.students}
          linkLabel={t("openDetails")}
          delay={0.05}
        />
        <StatCard
          label={t("statTeachers")}
          value={formatNumber(summary.teachers.total)}
          chip={formatNumber(summary.teachers.byStatus.ACTIVE)}
          footnote={t("activeSuffix")}
          href={LINKS.teachers}
          linkLabel={t("openDetails")}
          delay={0.1}
        />
        <StatCard
          label={t("statPendingAdmissions")}
          value={formatNumber(pendingAdmissions)}
          chip={formatNumber(admissionCounts.SLOT_OFFERED ?? 0)}
          footnote={t("attentionSlots")}
          href={LINKS.admissions}
          linkLabel={t("openDetails")}
          delay={0.15}
        />
        <StatCard
          label={t("statFeeCollected")}
          value={formatCompactCurrency(collected)}
          chip={`${feeRate}%`}
          footnote={t("ofExpected")}
          href={LINKS.fees}
          linkLabel={t("openDetails")}
          delay={0.2}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <AttendanceCard
          students={summary.todayAttendance.students}
          teachers={summary.todayAttendance.teachers}
          className="lg:col-span-2"
          delay={0.25}
        />
        <AttentionCard
          pending={admissionCounts.PENDING ?? 0}
          waitlisted={admissionCounts.WAITLISTED ?? 0}
          slotOffered={admissionCounts.SLOT_OFFERED ?? 0}
          href={LINKS.admissions}
          delay={0.3}
        />
        <PipelineCard
          counts={admissionCounts}
          total={summary.admissionApplications.total}
          href={LINKS.admissions}
          delay={0.35}
        />
        <RequestsCard
          rows={requestRows}
          className="lg:col-span-2"
          delay={0.4}
        />
        <FeeGaugeCard collected={collected} expected={expected} delay={0.45} />
        <LiveClockCard
          academicYear={summary.academicYear?.name ?? null}
          delay={0.5}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
