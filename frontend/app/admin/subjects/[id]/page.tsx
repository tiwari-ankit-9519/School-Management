"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Hash,
  Info,
  Layers,
  ToggleLeft,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CARD_CLASS,
  TONE_CLASSES,
  fadeUp,
} from "@/components/dashboard/DashboardWidgets";
import {
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
} from "@/components/forms/FormParts";
import {
  InfoTile,
  formatDate,
} from "@/components/admissions/AdmissionDetailParts";
import {
  SUBJECT_DETAIL_PATH,
  getMonogram,
} from "@/components/subjects/SubjectsParts";
import {
  AssignTeacherDialog,
  AssignedTeacherRow,
  SubjectDetailSkeleton,
  UnassignTeacherDialog,
} from "@/components/subjects/SubjectDetailParts";
import {
  useAssignTeacherToSubject,
  useGetSingleSubject,
  useUnassignTeacherFromSubject,
} from "@/hooks/useSubject";
import { useTranslations } from "@/hooks/useTranslations";

const SubjectDetailPage = () => {
  const t = useTranslations("subjectDetail");
  const params = useParams<{ id: string }>();
  const subjectId = params?.id ?? "";
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isUnassignOpen, setIsUnassignOpen] = useState(false);

  const { data: subject, isLoading, isError } = useGetSingleSubject(subjectId);
  const { mutate: assignTeacher, isPending: isAssigning } =
    useAssignTeacherToSubject();
  const { mutate: unassignTeacher, isPending: isUnassigning } =
    useUnassignTeacherFromSubject();

  const backButton = (
    <Button
      asChild
      variant="ghost"
      className="h-9 gap-1.5 rounded-full px-3 font-manrope text-xs text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent"
    >
      <Link href={SUBJECT_DETAIL_PATH}>
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
    </Button>
  );

  if (isLoading) return <SubjectDetailSkeleton />;

  if (isError || !subject) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card
          className={`${CARD_CLASS} w-full max-w-sm items-center gap-4 px-6 py-8 text-center`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertCircle className="size-5" />
          </span>
          <div>
            <p className="font-jakarta text-base font-semibold text-foreground">
              {t("notFoundTitle")}
            </p>
            <p className="mt-1 font-manrope text-sm text-muted-foreground">
              {t("notFoundSub")}
            </p>
          </div>
          {backButton}
        </Card>
      </div>
    );
  }

  const teacherSubjects = subject.teacherSubjects ?? [];
  const hasTeacher = teacherSubjects.length > 0;
  const primary =
    teacherSubjects.find((ts) => ts.isPrimary) ?? teacherSubjects[0];
  const primaryName = primary?.teacher
    ? `${primary.teacher.firstName} ${primary.teacher.lastName}`
    : "";
  const periodCount = subject.timetables?.length ?? 0;

  const handleAssign = (teacherId: string) => {
    assignTeacher(
      { subjectId, data: { teacherId } },
      { onSuccess: () => setIsAssignOpen(false) },
    );
  };

  const handleUnassign = () => {
    unassignTeacher(subjectId, { onSuccess: () => setIsUnassignOpen(false) });
  };

  const actionButton = hasTeacher ? (
    <Button
      type="button"
      variant="outline"
      onClick={() => setIsUnassignOpen(true)}
      className="h-11 gap-2 rounded-full border-red-500/20 bg-red-500/10 px-5 font-manrope text-sm font-semibold text-red-700 shadow-none hover:bg-red-500/15 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
    >
      <UserX className="size-4" />
      {t("unassignBtn")}
    </Button>
  ) : (
    <Button
      type="button"
      onClick={() => setIsAssignOpen(true)}
      className="h-11 gap-2 rounded-full bg-linear-to-r from-indigo-600 to-indigo-800 px-5 font-manrope text-sm font-semibold text-white shadow-none hover:opacity-90"
    >
      <UserCheck className="size-4" />
      {t("assignBtn")}
    </Button>
  );

  return (
    <div className="space-y-5">
      <motion.header
        {...fadeUp(0)}
        className="flex flex-wrap items-center justify-between gap-3 px-1"
      >
        {backButton}
        {actionButton}
      </motion.header>

      <motion.div {...fadeUp(0.05)}>
        <Card className="relative gap-0 overflow-hidden rounded-2xl border-0 bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-800 p-6 text-white shadow-none sm:p-7">
          <svg
            className="pointer-events-none absolute -top-16 -right-16 h-64 w-64"
            viewBox="0 0 200 200"
            fill="none"
            aria-hidden="true"
          >
            {[40, 60, 80, 100].map((r) => (
              <circle
                key={r}
                cx="100"
                cy="100"
                r={r}
                stroke="white"
                strokeOpacity="0.1"
              />
            ))}
          </svg>
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 font-jakarta text-2xl font-bold ring-4 ring-white/10">
              {getMonogram(subject.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5">
                <Badge className="gap-1 rounded-full border-white/25 bg-white/15 font-mono text-[11px] font-medium text-white">
                  <Hash className="size-3" />
                  {subject.code}
                </Badge>
                <Badge className="rounded-full border-white/25 bg-white/15 font-manrope text-[11px] font-medium text-white">
                  {subject.isElective ? t("typeElective") : t("typeCore")}
                </Badge>
                <Badge className="gap-1.5 rounded-full border-white/25 bg-white/15 font-manrope text-[11px] font-medium text-white">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${subject.isActive ? "bg-emerald-300" : "bg-amber-300"}`}
                  />
                  {subject.isActive ? t("active") : t("inactive")}
                </Badge>
              </div>
              <h1 className="mt-3 font-jakarta text-3xl font-bold tracking-tight sm:text-4xl">
                {subject.name}
              </h1>
              <p className="mt-1.5 line-clamp-2 max-w-2xl font-manrope text-sm text-white/80">
                {subject.description || t("pageSubtitle")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:w-64">
              {[
                {
                  icon: Users,
                  value: teacherSubjects.length,
                  label: t("statTeachers"),
                },
                {
                  icon: CalendarClock,
                  value: periodCount,
                  label: t("statPeriods"),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15"
                >
                  <stat.icon className="size-4 text-white/70" />
                  <p className="mt-2 font-jakarta text-2xl font-bold">
                    {stat.value}
                  </p>
                  <p className="font-manrope text-[11px] text-white/70">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <motion.div {...fadeUp(0.1)}>
            <Card className={`${CARD_CLASS} p-5`}>
              <div className="mb-4 flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${TONE_CLASSES.indigo}`}
                >
                  <BookOpen className="size-4" />
                </span>
                <div>
                  <h3 className="font-jakarta text-base font-semibold text-foreground">
                    {t("aboutTitle")}
                  </h3>
                  <p className="font-manrope text-xs text-muted-foreground">
                    {t("aboutSub")}
                  </p>
                </div>
              </div>
              <p className="mb-4 rounded-xl border border-border bg-muted/40 p-4 font-manrope text-sm leading-relaxed text-foreground/85">
                {subject.description || (
                  <span className="text-muted-foreground italic">
                    {t("noDescription")}
                  </span>
                )}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoTile
                  icon={<Hash className="size-3.5" />}
                  label={t("infoCode")}
                  value={subject.code}
                />
                <InfoTile
                  icon={<Layers className="size-3.5" />}
                  label={t("infoType")}
                  value={subject.isElective ? t("typeElective") : t("typeCore")}
                />
                <InfoTile
                  icon={<CheckCircle2 className="size-3.5" />}
                  label={t("infoStatus")}
                  value={subject.isActive ? t("active") : t("inactive")}
                />
                <InfoTile
                  icon={<ToggleLeft className="size-3.5" />}
                  label={t("infoElective")}
                  value={subject.isElective ? t("yes") : t("no")}
                />
              </div>
            </Card>
          </motion.div>

          <motion.div {...fadeUp(0.15)}>
            <Card className={`${CARD_CLASS} p-5`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${TONE_CLASSES.emerald}`}
                  >
                    <Users className="size-4" />
                  </span>
                  <div>
                    <h3 className="font-jakarta text-base font-semibold text-foreground">
                      {t("assignedTeacherTitle")}
                    </h3>
                    <p className="font-manrope text-xs text-muted-foreground">
                      {t("teachersAssignedSub")}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full border-border bg-muted font-manrope text-[11px] text-foreground/70"
                >
                  {teacherSubjects.length}
                </Badge>
              </div>
              {hasTeacher ? (
                <div className="divide-y divide-border">
                  {teacherSubjects.map((ts) => (
                    <AssignedTeacherRow key={ts.id} teacherSubject={ts} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border px-4 py-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted">
                    <UserX className="size-5 text-muted-foreground" />
                  </span>
                  <div>
                    <p className="font-jakarta text-sm font-semibold text-foreground">
                      {t("noTeacherTitle")}
                    </p>
                    <p className="mt-1 font-manrope text-xs text-muted-foreground">
                      {t("noTeacherSubtitle")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setIsAssignOpen(true)}
                    className={`h-9 gap-2 px-4 text-xs ${PRIMARY_PILL_CLASS}`}
                  >
                    <UserCheck className="size-3.5" />
                    {t("assignBtn")}
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <motion.div {...fadeUp(0.1)}>
            <Card className={`${CARD_CLASS} gap-4 p-5`}>
              <div>
                <h3 className="font-jakarta text-base font-semibold text-foreground">
                  {t("actionsTitle")}
                </h3>
                <p className="mt-1 font-manrope text-xs leading-relaxed text-muted-foreground">
                  {hasTeacher
                    ? t("actionsAssignedSub").replace("{teacher}", primaryName)
                    : t("actionsEmptySub")}
                </p>
              </div>
              <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-3">
                <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="font-manrope text-xs leading-relaxed text-muted-foreground">
                  {t("actionsHint")}
                </p>
              </div>
              {hasTeacher ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUnassignOpen(true)}
                  className="h-11 w-full gap-2 rounded-full border-red-500/20 bg-red-500/10 font-manrope text-sm font-semibold text-red-700 shadow-none hover:bg-red-500/15 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
                >
                  <UserX className="size-4" />
                  {t("unassignBtn")}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => setIsAssignOpen(true)}
                  className={`h-11 w-full gap-2 text-sm ${PRIMARY_PILL_CLASS}`}
                >
                  <UserCheck className="size-4" />
                  {t("assignBtn")}
                </Button>
              )}
            </Card>
          </motion.div>

          <motion.div {...fadeUp(0.15)}>
            <Card className={`${CARD_CLASS} gap-3 p-5`}>
              <h3 className="font-jakarta text-base font-semibold text-foreground">
                {t("recordTitle")}
              </h3>
              <InfoTile
                icon={<CalendarDays className="size-3.5" />}
                label={t("createdOn")}
                value={formatDate(subject.createdAt)}
              />
              <InfoTile
                icon={<CalendarClock className="size-3.5" />}
                label={t("updatedOn")}
                value={formatDate(subject.updatedAt)}
              />
              <Separator />
              <Button
                asChild
                variant="outline"
                className={`h-10 w-full text-xs ${OUTLINE_PILL_CLASS}`}
              >
                <Link href={SUBJECT_DETAIL_PATH}>{t("viewAllSubjects")}</Link>
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>

      <AssignTeacherDialog
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        subjectName={subject.name}
        onAssign={handleAssign}
        isAssigning={isAssigning}
      />
      <UnassignTeacherDialog
        open={isUnassignOpen}
        onOpenChange={setIsUnassignOpen}
        teacherName={primaryName}
        onConfirm={handleUnassign}
        isUnassigning={isUnassigning}
      />
    </div>
  );
};

export default SubjectDetailPage;
