"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  CalendarCheck,
  Crown,
  School,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TONE_CLASSES } from "@/components/dashboard/DashboardWidgets";
import { OUTLINE_PILL_CLASS } from "@/components/forms/FormParts";
import { formatEnum } from "@/components/admissions/AdmissionDetailParts";
import { SUBJECT_DETAIL_PATH } from "@/components/subjects/SubjectsParts";
import { CLASS_DETAIL_PATH } from "@/components/classes/ClassesParts";
import { useTranslations } from "@/hooks/useTranslations";
import {
  AttendanceStatus,
  ClassTeacher,
  TeacherAttendance,
  TeacherSubject,
} from "@/types";

const SLATE_TONE =
  "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300";

const ATTENDANCE_CONFIG = {
  [AttendanceStatus.PRESENT]: {
    tone: TONE_CLASSES.emerald,
    bar: "bg-emerald-500",
  },
  [AttendanceStatus.LATE]: { tone: TONE_CLASSES.amber, bar: "bg-amber-500" },
  [AttendanceStatus.ABSENT]: { tone: TONE_CLASSES.red, bar: "bg-red-500" },
  [AttendanceStatus.EXCUSED]: {
    tone: TONE_CLASSES.violet,
    bar: "bg-violet-500",
  },
  [AttendanceStatus.HOLIDAY]: { tone: SLATE_TONE, bar: "bg-slate-400" },
} as const;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const formatTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const TabEmpty = ({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) => (
  <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
      {icon}
    </span>
    <div>
      <p className="font-jakarta text-sm font-semibold text-foreground">
        {title}
      </p>
      <p className="mt-1 font-manrope text-xs text-muted-foreground">
        {subtitle}
      </p>
    </div>
  </div>
);

export const TeacherSubjectsTab = ({
  subjects,
}: {
  subjects: TeacherSubject[];
}) => {
  const t = useTranslations("teacherDetail");

  if (subjects.length === 0) {
    return (
      <TabEmpty
        icon={<BookOpen className="size-5" />}
        title={t("noSubjectsTitle")}
        subtitle={t("noSubjectsSub")}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">
      {subjects.map((ts) => (
        <div
          key={ts.id}
          className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3.5"
        >
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${TONE_CLASSES.indigo}`}
          >
            <BookOpen className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate font-jakarta text-sm font-semibold text-foreground">
              {ts.subject?.name ?? t("subjectFallback")}
              {ts.isPrimary && (
                <Crown
                  className="size-3.5 shrink-0 text-amber-500"
                  aria-label={t("primaryBadge")}
                />
              )}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              #{ts.subject?.code ?? "—"}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="icon"
            aria-label={t("openSubject")}
            className={`h-8 w-8 shrink-0 ${OUTLINE_PILL_CLASS}`}
          >
            <Link href={`${SUBJECT_DETAIL_PATH}/${ts.subjectId}`}>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
};

export const TeacherClassesTab = ({
  classTeachers,
}: {
  classTeachers: ClassTeacher[];
}) => {
  const t = useTranslations("teacherDetail");

  if (classTeachers.length === 0) {
    return (
      <TabEmpty
        icon={<School className="size-5" />}
        title={t("noClassesTitle")}
        subtitle={t("noClassesSub")}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5">
      {classTeachers.map((ct) => (
        <div
          key={ct.id}
          className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3.5"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-indigo-700 font-jakarta text-base font-bold text-white">
            {ct.class ? ct.class.name : <School className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate font-jakarta text-sm font-semibold text-foreground">
              {ct.class
                ? `${t("classLabel")} ${ct.class.name}-${ct.class.section}`
                : t("classFallback")}
              {ct.isPrimary && (
                <Crown
                  className="size-3.5 shrink-0 text-amber-500"
                  aria-label={t("primaryBadge")}
                />
              )}
            </p>
            <p className="font-manrope text-[11px] text-muted-foreground">
              {t("assignedOn")} {formatDate(ct.createdAt)}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className={`h-8 gap-1 px-3 text-xs ${OUTLINE_PILL_CLASS}`}
          >
            <Link href={`${CLASS_DETAIL_PATH}/${ct.classId}`}>
              {t("openClass")}
              <ArrowUpRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
};

export const TeacherAttendanceTab = ({
  attendances,
}: {
  attendances: TeacherAttendance[];
}) => {
  const t = useTranslations("teacherDetail");

  if (attendances.length === 0) {
    return (
      <TabEmpty
        icon={<CalendarCheck className="size-5" />}
        title={t("noAttendanceTitle")}
        subtitle={t("noAttendanceSub")}
      />
    );
  }

  const counts = Object.values(AttendanceStatus).map((status) => ({
    status,
    count: attendances.filter((a) => a.status === status).length,
  }));
  const working = attendances.filter(
    (a) => a.status !== AttendanceStatus.HOLIDAY,
  ).length;
  const present = attendances.filter(
    (a) =>
      a.status === AttendanceStatus.PRESENT ||
      a.status === AttendanceStatus.LATE,
  ).length;
  const rate = working > 0 ? Math.round((present / working) * 100) : 0;
  const recent = [...attendances]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr] md:items-center">
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <p className="font-manrope text-[11px] tracking-wider text-muted-foreground uppercase">
            {t("attendanceRate")}
          </p>
          <p className="mt-1.5 font-jakarta text-3xl font-bold text-foreground">
            {rate}%
          </p>
          <Progress
            value={rate}
            className="mt-2 h-1.5 bg-muted *:bg-emerald-500"
          />
          <p className="mt-2 font-manrope text-[11px] text-muted-foreground">
            {attendances.length} {t("daysRecorded")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {counts.map(({ status, count }) => (
            <Badge
              key={status}
              variant="outline"
              className={`gap-1.5 rounded-full px-3 py-1 font-manrope text-xs font-medium ${ATTENDANCE_CONFIG[status].tone}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${ATTENDANCE_CONFIG[status].bar}`}
              />
              {formatEnum(status)}
              <span className="font-semibold">{count}</span>
            </Badge>
          ))}
        </div>
      </div>
      <div className="divide-y divide-border rounded-xl border border-border">
        {recent.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between gap-3 px-3.5 py-2.5"
          >
            <div>
              <p className="font-jakarta text-sm font-medium text-foreground">
                {formatDate(entry.date)}
              </p>
              <p className="font-manrope text-[11px] text-muted-foreground">
                {t("checkIn")} {formatTime(entry.checkIn)} · {t("checkOut")}{" "}
                {formatTime(entry.checkOut)}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`rounded-full font-manrope text-[11px] font-medium ${ATTENDANCE_CONFIG[entry.status].tone}`}
            >
              {formatEnum(entry.status)}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TeacherDetailSkeleton = () => (
  <div className="space-y-5">
    <Skeleton className="h-8 w-36 rounded-full" />
    <Skeleton className="h-52 rounded-2xl" />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  </div>
);
