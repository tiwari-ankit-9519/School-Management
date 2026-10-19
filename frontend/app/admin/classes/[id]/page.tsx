"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  FileText,
  GraduationCap,
  UserCheck,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CARD_CLASS, fadeUp } from "@/components/dashboard/DashboardWidgets";
import { TAB_TRIGGER_CLASS } from "@/components/forms/FormParts";
import { InfoTile } from "@/components/admissions/AdmissionDetailParts";
import { CLASS_DETAIL_PATH } from "@/components/classes/ClassesParts";
import {
  AssignClassTeacherDialog,
  ClassDetailSkeleton,
  ClassTeacherCard,
  ExamsTab,
  LeavesTab,
  StudentsTab,
  TimetableTab,
  formatDate,
} from "@/components/classes/ClassDetailParts";
import { useGetSingleClass } from "@/hooks/useClass";
import { useTranslations } from "@/hooks/useTranslations";

const ClassDetailPage = () => {
  const t = useTranslations("classDetail");
  const params = useParams<{ id: string }>();
  const classId = params?.id ?? "";
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  const { data: classData, isLoading, isError } = useGetSingleClass(classId);

  const backButton = (
    <Button
      asChild
      variant="ghost"
      className="h-9 gap-1.5 rounded-full px-3 font-manrope text-xs text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent"
    >
      <Link href={CLASS_DETAIL_PATH}>
        <ArrowLeft className="size-4" />
        {t("backToClasses")}
      </Link>
    </Button>
  );

  if (isLoading) return <ClassDetailSkeleton />;

  if (isError || !classData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card
          className={`${CARD_CLASS} w-full max-w-sm items-center gap-4 px-6 py-8 text-center`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertCircle className="size-5" />
          </span>
          <p className="font-jakarta text-base font-semibold text-foreground">
            {t("notFound")}
          </p>
          {backButton}
        </Card>
      </div>
    );
  }

  const enrollments = classData.enrollments ?? [];
  const timetables = classData.timetables ?? [];
  const exams = classData.examSchedules ?? [];
  const leaves = classData.leaveRequest ?? [];
  const classTeachers = classData.classTeachers ?? [];
  const activeStudents = enrollments.filter(
    (e) => e.status === "ACTIVE",
  ).length;
  const fillPercent =
    classData.capacity > 0
      ? Math.min(100, Math.round((activeStudents / classData.capacity) * 100))
      : 0;
  const seatsLeft = Math.max(0, classData.capacity - activeStudents);
  const pendingLeaves = leaves.filter((l) => l.status === "PENDING").length;

  const tabs = [
    {
      value: "students",
      label: t("enrollmentsTitle"),
      icon: GraduationCap,
      count: enrollments.length,
    },
    {
      value: "timetable",
      label: t("timetablesTitle"),
      icon: CalendarDays,
      count: timetables.length,
    },
    {
      value: "exams",
      label: t("examSchedulesTitle"),
      icon: ClipboardList,
      count: exams.length,
    },
    {
      value: "leaves",
      label: t("leaveRequestsTitle"),
      icon: FileText,
      count: leaves.length,
    },
  ];

  return (
    <div className="space-y-5">
      <motion.header
        {...fadeUp(0)}
        className="flex flex-wrap items-center justify-between gap-3 px-1"
      >
        {backButton}
        {classTeachers.length === 0 && (
          <Button
            type="button"
            onClick={() => setIsAssignOpen(true)}
            className="h-11 gap-2 rounded-full bg-linear-to-r from-indigo-600 to-indigo-800 px-5 font-manrope text-sm font-semibold text-white shadow-none hover:opacity-90"
          >
            <UserCheck className="size-4" />
            {t("assignBtn")}
          </Button>
        )}
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
            <span className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 font-jakarta text-3xl font-bold ring-4 ring-white/10">
              {classData.name}
              <span className="absolute -right-2 -bottom-2 flex h-8 min-w-8 items-center justify-center rounded-xl bg-white px-1.5 font-jakarta text-sm font-bold text-indigo-700">
                {classData.section}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-jakarta text-3xl font-bold tracking-tight sm:text-4xl">
                {t("classLabel")} {classData.name} · {t("sectionLabel")}{" "}
                {classData.section}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="gap-1 rounded-full border-white/25 bg-white/15 font-manrope text-[11px] font-medium text-white">
                  <DoorOpen className="size-3" />
                  {classData.roomNumber
                    ? `${t("roomLabel")} ${classData.roomNumber}`
                    : t("noRoom")}
                </Badge>
                {classData.academicYear && (
                  <Badge className="gap-1 rounded-full border-white/25 bg-white/15 font-manrope text-[11px] font-medium text-white">
                    <CalendarClock className="size-3" />
                    {classData.academicYear.name}
                  </Badge>
                )}
              </div>
              <div className="mt-5 max-w-md">
                <div className="mb-1.5 flex justify-between font-manrope text-xs text-white/80">
                  <span>
                    {activeStudents} / {classData.capacity} {t("enrolled")}
                  </span>
                  <span className="font-semibold text-white">
                    {fillPercent}%
                  </span>
                </div>
                <Progress
                  value={fillPercent}
                  className="h-2 bg-white/20 *:bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:w-80">
              {[
                {
                  icon: CalendarDays,
                  value: timetables.length,
                  label: t("statPeriods"),
                },
                {
                  icon: ClipboardList,
                  value: exams.length,
                  label: t("statExams"),
                },
                {
                  icon: FileText,
                  value: pendingLeaves,
                  label: t("statPendingLeaves"),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15"
                >
                  <stat.icon className="size-4 text-white/70" />
                  <p className="mt-2 font-jakarta text-2xl font-bold">
                    {stat.value}
                  </p>
                  <p className="font-manrope text-[10px] leading-tight text-white/70">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div {...fadeUp(0.1)} className="lg:col-span-2">
          <Card className={`${CARD_CLASS} overflow-hidden`}>
            <Tabs defaultValue="students" className="gap-0">
              <div className="px-4 pt-4 pb-3 sm:px-5">
                <TabsList className="flex h-auto w-full justify-start gap-1.5 overflow-x-auto bg-transparent p-0 scrollbar-none">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className={`group ${TAB_TRIGGER_CLASS} px-3.5`}
                    >
                      <tab.icon className="size-3.5" />
                      {tab.label}
                      <span className="rounded-full bg-background px-1.5 py-px text-[10px] text-muted-foreground group-data-[state=active]:bg-primary-foreground/15 group-data-[state=active]:text-primary-foreground/80">
                        {tab.count}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <Separator />
              <TabsContent value="students" className="mt-0">
                <StudentsTab enrollments={enrollments} />
              </TabsContent>
              <TabsContent value="timetable" className="mt-0">
                <TimetableTab timetables={timetables} />
              </TabsContent>
              <TabsContent value="exams" className="mt-0">
                <ExamsTab exams={exams} />
              </TabsContent>
              <TabsContent value="leaves" className="mt-0">
                <LeavesTab leaves={leaves} />
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <motion.div {...fadeUp(0.15)}>
            <ClassTeacherCard
              classId={classId}
              classTeachers={classTeachers}
              onAssign={() => setIsAssignOpen(true)}
            />
          </motion.div>
          <motion.div {...fadeUp(0.2)}>
            <Card className={`${CARD_CLASS} gap-3 p-5`}>
              <h3 className="font-jakarta text-base font-semibold text-foreground">
                {t("quickFactsTitle")}
              </h3>
              <InfoTile
                icon={<Users className="size-3.5" />}
                label={t("labelCapacity")}
                value={String(classData.capacity)}
              />
              <InfoTile
                icon={<GraduationCap className="size-3.5" />}
                label={t("seatsLeft")}
                value={String(seatsLeft)}
              />
              <InfoTile
                icon={<DoorOpen className="size-3.5" />}
                label={t("labelRoom")}
                value={classData.roomNumber}
              />
              <InfoTile
                icon={<CalendarClock className="size-3.5" />}
                label={t("createdOn")}
                value={formatDate(classData.createdAt)}
              />
            </Card>
          </motion.div>
        </div>
      </div>

      <AssignClassTeacherDialog
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        classId={classId}
      />
    </div>
  );
};

export default ClassDetailPage;
