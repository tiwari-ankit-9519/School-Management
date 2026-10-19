"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Briefcase,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  Copy,
  FileText,
  GraduationCap,
  Hash,
  IndianRupee,
  Mail,
  MapPin,
  Phone,
  School,
  Star,
  User,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CARD_CLASS, fadeUp } from "@/components/dashboard/DashboardWidgets";
import {
  OUTLINE_PILL_CLASS,
  TAB_TRIGGER_CLASS,
} from "@/components/forms/FormParts";
import {
  InfoTile,
  SectionCard,
  formatDate,
  formatEnum,
} from "@/components/admissions/AdmissionDetailParts";
import {
  ExamsTab,
  LeavesTab,
  TimetableTab,
} from "@/components/classes/ClassDetailParts";
import {
  TEACHER_DETAIL_PATH,
  TeacherStatusBadge,
} from "@/components/teachers/TeachersListParts";
import {
  TeacherAttendanceTab,
  TeacherClassesTab,
  TeacherDetailSkeleton,
  TeacherSubjectsTab,
} from "@/components/teachers/TeacherDetailParts";
import { useGetSingleTeacher } from "@/hooks/useTeacher";
import { useTranslations } from "@/hooks/useTranslations";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const getTenure = (joiningDate: string, now: number) => {
  const start = new Date(joiningDate);
  const end = new Date(now);
  const months = Math.max(
    0,
    (end.getFullYear() - start.getFullYear()) * 12 +
      end.getMonth() -
      start.getMonth(),
  );
  return { years: Math.floor(months / 12), months: months % 12 };
};

const TeacherDetailPage = () => {
  const t = useTranslations("teacherDetail");
  const params = useParams<{ id: string }>();
  const teacherId = params?.id ?? "";
  const [now] = useState(() => Date.now());

  const { data: teacher, isLoading, isError } = useGetSingleTeacher(teacherId);

  const backButton = (
    <Button
      asChild
      variant="ghost"
      className="h-9 gap-1.5 rounded-full px-3 font-manrope text-xs text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent"
    >
      <Link href={TEACHER_DETAIL_PATH}>
        <ArrowLeft className="size-4" />
        {t("backToTeachers")}
      </Link>
    </Button>
  );

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(teacherId);
      toast.success(t("idCopied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  if (isLoading) return <TeacherDetailSkeleton />;

  if (isError || !teacher) {
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

  const fullName = `${teacher.firstName} ${teacher.lastName}`;
  const initials =
    `${teacher.firstName.charAt(0)}${teacher.lastName.charAt(0)}`.toUpperCase();
  const subjects = teacher.subjects ?? [];
  const timetables = teacher.timetables ?? [];
  const classTeachers = teacher.classTeachers ?? [];
  const attendances = teacher.attendances ?? [];
  const leaves = teacher.leaveRequests ?? [];
  const exams = teacher.examSchedules ?? [];
  const experienceText = `${teacher.experience} ${teacher.experience === 1 ? t("yearSingular") : t("yearsPlural")}`;
  const tenure = getTenure(teacher.joiningDate, now);
  const tenureText =
    tenure.years > 0
      ? `${tenure.years} ${t("yearsShort")} ${tenure.months} ${t("monthsShort")}`
      : `${tenure.months} ${t("monthsShort")}`;
  const email = teacher.user?.email ?? null;
  const phone = teacher.user?.phone ?? null;

  const stats = [
    { icon: BookOpen, value: subjects.length, label: t("statSubjects") },
    { icon: CalendarDays, value: timetables.length, label: t("statPeriods") },
    { icon: School, value: classTeachers.length, label: t("statClasses") },
    { icon: ClipboardList, value: exams.length, label: t("statExams") },
  ];

  const tabs = [
    {
      value: "subjects",
      label: t("tabSubjects"),
      icon: BookOpen,
      count: subjects.length,
    },
    {
      value: "classes",
      label: t("tabClasses"),
      icon: School,
      count: classTeachers.length,
    },
    {
      value: "timetable",
      label: t("tabTimetable"),
      icon: CalendarDays,
      count: timetables.length,
    },
    {
      value: "exams",
      label: t("tabExams"),
      icon: ClipboardList,
      count: exams.length,
    },
    {
      value: "attendance",
      label: t("tabAttendance"),
      icon: CalendarCheck,
      count: attendances.length,
    },
    {
      value: "leaves",
      label: t("tabLeaves"),
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
        <div className="flex items-center gap-1.5">
          <span className="hidden truncate font-manrope text-xs text-muted-foreground sm:inline">
            {t("teacherId")}: {teacher.id}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={copyId}
            aria-label={t("copyId")}
            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent"
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
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
            <Avatar className="h-20 w-20 rounded-2xl ring-4 ring-white/15">
              <AvatarFallback className="rounded-2xl bg-white/15 font-jakarta text-2xl font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-jakarta text-3xl font-bold tracking-tight">
                  {fullName}
                </h1>
                <Badge className="rounded-full border-white/25 bg-white/15 font-manrope text-[11px] font-medium text-white">
                  {formatEnum(teacher.gender)}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <TeacherStatusBadge status={teacher.employmentStatus} />
                <Badge className="gap-1 rounded-full border-white/25 bg-white/15 font-manrope text-[11px] font-medium text-white">
                  <Star className="size-3" />
                  {teacher.specialization ?? t("notSpecified")}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { icon: GraduationCap, text: teacher.qualification },
                  {
                    icon: Briefcase,
                    text: `${experienceText} ${t("ofExperience")}`,
                  },
                  { icon: MapPin, text: `${teacher.city}, ${teacher.state}` },
                  {
                    icon: CalendarClock,
                    text: `${t("joinedOn")} ${formatDate(teacher.joiningDate)}`,
                  },
                ].map((chip) => (
                  <span
                    key={chip.text}
                    className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 font-manrope text-xs text-white/90"
                  >
                    <chip.icon className="size-3.5" />
                    {chip.text}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-80 lg:grid-cols-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15"
                >
                  <stat.icon className="size-4 text-white/70" />
                  <p className="mt-1.5 font-jakarta text-2xl font-bold">
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
        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            title={t("sectionPersonal")}
            description={t("sectionPersonalSub")}
            icon={<User className="size-4" />}
            delay={0.1}
          >
            <InfoTile
              icon={<User className="size-3.5" />}
              label={t("fullName")}
              value={fullName}
            />
            <InfoTile
              icon={<Users className="size-3.5" />}
              label={t("gender")}
              value={formatEnum(teacher.gender)}
            />
            <InfoTile
              icon={<Calendar className="size-3.5" />}
              label={t("dateOfBirth")}
              value={formatDate(teacher.dateOfBirth)}
            />
            <InfoTile
              icon={<MapPin className="size-3.5" />}
              label={t("address")}
              value={teacher.address}
            />
            <InfoTile
              icon={<MapPin className="size-3.5" />}
              label={t("cityState")}
              value={`${teacher.city}, ${teacher.state}`}
            />
            <InfoTile
              icon={<Hash className="size-3.5" />}
              label={t("pincode")}
              value={teacher.pincode}
            />
          </SectionCard>

          <SectionCard
            title={t("sectionProfessional")}
            description={t("sectionProfessionalSub")}
            icon={<Briefcase className="size-4" />}
            tone="amber"
            delay={0.15}
          >
            <InfoTile
              icon={<GraduationCap className="size-3.5" />}
              label={t("qualification")}
              value={teacher.qualification}
            />
            <InfoTile
              icon={<Briefcase className="size-3.5" />}
              label={t("experience")}
              value={experienceText}
            />
            <InfoTile
              icon={<Star className="size-3.5" />}
              label={t("specialization")}
              value={teacher.specialization}
            />
            <InfoTile
              icon={<CalendarClock className="size-3.5" />}
              label={t("joiningDate")}
              value={formatDate(teacher.joiningDate)}
            />
          </SectionCard>

          <motion.div {...fadeUp(0.2)}>
            <Card className={`${CARD_CLASS} overflow-hidden`}>
              <Tabs defaultValue="subjects" className="gap-0">
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
                <TabsContent value="subjects" className="mt-0">
                  <TeacherSubjectsTab subjects={subjects} />
                </TabsContent>
                <TabsContent value="classes" className="mt-0">
                  <TeacherClassesTab classTeachers={classTeachers} />
                </TabsContent>
                <TabsContent value="timetable" className="mt-0">
                  <TimetableTab timetables={timetables} />
                </TabsContent>
                <TabsContent value="exams" className="mt-0">
                  <ExamsTab exams={exams} />
                </TabsContent>
                <TabsContent value="attendance" className="mt-0">
                  <TeacherAttendanceTab attendances={attendances} />
                </TabsContent>
                <TabsContent value="leaves" className="mt-0">
                  <LeavesTab leaves={leaves} />
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <motion.div {...fadeUp(0.1)}>
            <Card className={`${CARD_CLASS} gap-3 p-5`}>
              <h3 className="font-jakarta text-base font-semibold text-foreground">
                {t("contactTitle")}
              </h3>
              <InfoTile
                icon={<Mail className="size-3.5" />}
                label={t("email")}
                value={email}
              />
              <InfoTile
                icon={<Phone className="size-3.5" />}
                label={t("phone")}
                value={phone}
              />
              <InfoTile
                icon={<Hash className="size-3.5" />}
                label={t("regNumber")}
                value={teacher.user?.regNumber}
              />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  asChild={!!email}
                  variant="outline"
                  disabled={!email}
                  className={`h-10 gap-1.5 text-xs ${OUTLINE_PILL_CLASS}`}
                >
                  {email ? (
                    <a href={`mailto:${email}`}>
                      <Mail className="size-3.5" />
                      {t("emailAction")}
                    </a>
                  ) : (
                    <span>
                      <Mail className="size-3.5" />
                      {t("emailAction")}
                    </span>
                  )}
                </Button>
                <Button
                  asChild={!!phone}
                  variant="outline"
                  disabled={!phone}
                  className={`h-10 gap-1.5 text-xs ${OUTLINE_PILL_CLASS}`}
                >
                  {phone ? (
                    <a href={`tel:${phone}`}>
                      <Phone className="size-3.5" />
                      {t("callAction")}
                    </a>
                  ) : (
                    <span>
                      <Phone className="size-3.5" />
                      {t("callAction")}
                    </span>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div {...fadeUp(0.15)}>
            <Card className={`${CARD_CLASS} gap-3 p-5`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-jakarta text-base font-semibold text-foreground">
                  {t("employmentTitle")}
                </h3>
                <TeacherStatusBadge status={teacher.employmentStatus} />
              </div>
              <InfoTile
                icon={<CalendarClock className="size-3.5" />}
                label={t("joiningDate")}
                value={formatDate(teacher.joiningDate)}
              />
              <InfoTile
                icon={<Briefcase className="size-3.5" />}
                label={t("tenure")}
                value={tenureText}
              />
              <InfoTile
                icon={<IndianRupee className="size-3.5" />}
                label={t("salary")}
                value={
                  teacher.salary !== null
                    ? formatCurrency(teacher.salary)
                    : null
                }
              />
            </Card>
          </motion.div>

          <motion.div {...fadeUp(0.2)}>
            <Card className={`${CARD_CLASS} gap-3 p-5`}>
              <h3 className="font-jakarta text-base font-semibold text-foreground">
                {t("recordTitle")}
              </h3>
              <InfoTile
                icon={<CalendarDays className="size-3.5" />}
                label={t("createdOn")}
                value={formatDate(teacher.createdAt)}
              />
              <InfoTile
                icon={<CalendarClock className="size-3.5" />}
                label={t("updatedOn")}
                value={formatDate(teacher.updatedAt)}
              />
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDetailPage;
