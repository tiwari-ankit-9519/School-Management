"use client";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  Clock,
  Crown,
  FileText,
  GraduationCap,
  Loader2,
  Search,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CARD_CLASS,
  TONE_CLASSES,
} from "@/components/dashboard/DashboardWidgets";
import {
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import { formatEnum } from "@/components/admissions/AdmissionDetailParts";
import {
  useAssignClassTeacher,
  useUnAssignClassTeacher,
} from "@/hooks/useClass";
import { useGetAllTeachers } from "@/hooks/useTeacher";
import { useTranslations } from "@/hooks/useTranslations";
import {
  ClassTeacher,
  DayOfWeek,
  Enrollment,
  ExamSchedule,
  LeaveRequest,
  TeacherListItem,
  Timetable,
} from "@/types";

const SLATE_TONE =
  "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300";

const AVATAR_PALETTE = [
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
];

const DAY_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

const DAY_LABEL_KEYS = {
  [DayOfWeek.MONDAY]: "dayMonday",
  [DayOfWeek.TUESDAY]: "dayTuesday",
  [DayOfWeek.WEDNESDAY]: "dayWednesday",
  [DayOfWeek.THURSDAY]: "dayThursday",
  [DayOfWeek.FRIDAY]: "dayFriday",
  [DayOfWeek.SATURDAY]: "daySaturday",
  [DayOfWeek.SUNDAY]: "daySunday",
} as const;

const LEAVE_TONES: Record<string, string> = {
  APPROVED: TONE_CLASSES.emerald,
  REJECTED: TONE_CLASSES.red,
  PENDING: TONE_CLASSES.amber,
  CANCELLED: SLATE_TONE,
};

export const getInitials = (first?: string, last?: string) =>
  `${first?.charAt(0) ?? ""}${last?.charAt(0) ?? ""}`.toUpperCase() || "?";

const getAvatarClass = (seed?: string | null) => {
  const value = seed ?? "";
  const hash = Array.from(value).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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

export const StudentsTab = ({ enrollments }: { enrollments: Enrollment[] }) => {
  const t = useTranslations("classDetail");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return enrollments;
    return enrollments.filter((e) => {
      const name =
        `${e.student?.firstName ?? ""} ${e.student?.lastName ?? ""}`.toLowerCase();
      const reg = e.student?.user?.regNumber?.toLowerCase() ?? "";
      return name.includes(query) || reg.includes(query);
    });
  }, [enrollments, search]);

  if (enrollments.length === 0) {
    return (
      <TabEmpty
        icon={<GraduationCap className="size-5" />}
        title={t("noEnrollmentsTitle")}
        subtitle={t("noEnrollmentsSub")}
      />
    );
  }

  const headClass =
    "h-10 px-5 font-manrope text-[11px] font-medium tracking-wider text-muted-foreground uppercase";

  return (
    <div>
      <div className="px-4 pt-4 pb-3 sm:px-5">
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchStudents")}
            aria-label={t("searchStudents")}
            className={`${fieldClass(false)} rounded-full pl-9`}
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="px-5 pb-8 text-center font-manrope text-sm text-muted-foreground">
          {t("noStudentMatches")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className={headClass}>{t("colStudent")}</TableHead>
              <TableHead className={headClass}>{t("colRegNumber")}</TableHead>
              <TableHead className={headClass}>{t("colRollNo")}</TableHead>
              <TableHead className={headClass}>{t("colStatus")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((enrollment) => (
              <TableRow
                key={enrollment.id}
                className="border-border hover:bg-muted/60"
              >
                <TableCell className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback
                        className={`font-jakarta text-[11px] font-bold ${getAvatarClass(
                          enrollment.studentId ??
                            enrollment.student?.id ??
                            enrollment.id,
                        )}`}
                      >
                        {getInitials(
                          enrollment.student?.firstName,
                          enrollment.student?.lastName,
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-jakarta text-sm font-semibold text-foreground">
                      {enrollment.student?.firstName}{" "}
                      {enrollment.student?.lastName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-3 font-mono text-sm text-foreground/80">
                  {enrollment.student?.user?.regNumber ?? "—"}
                </TableCell>
                <TableCell className="px-5 py-3 font-manrope text-sm text-foreground/80">
                  {enrollment.rollNumber ?? "—"}
                </TableCell>
                <TableCell className="px-5 py-3">
                  <Badge
                    variant="outline"
                    className={`rounded-full font-manrope text-[11px] font-medium ${
                      enrollment.status === "ACTIVE"
                        ? TONE_CLASSES.emerald
                        : SLATE_TONE
                    }`}
                  >
                    {formatEnum(enrollment.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export const TimetableTab = ({ timetables }: { timetables: Timetable[] }) => {
  const t = useTranslations("classDetail");

  if (timetables.length === 0) {
    return (
      <TabEmpty
        icon={<CalendarDays className="size-5" />}
        title={t("noTimetableTitle")}
        subtitle={t("noTimetableSub")}
      />
    );
  }

  const byDay = DAY_ORDER.map((day) => ({
    day,
    periods: timetables
      .filter((tt) => tt.dayOfWeek === day)
      .sort((a, b) => a.periodNumber - b.periodNumber),
  }));

  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
      {byDay.map(({ day, periods }) => (
        <div
          key={day}
          className="rounded-xl border border-border bg-muted/30 p-3"
        >
          <div className="mb-2.5 flex items-center justify-between">
            <p className="font-jakarta text-sm font-semibold text-foreground">
              {t(DAY_LABEL_KEYS[day])}
            </p>
            <Badge
              variant="outline"
              className="rounded-full border-border bg-background font-manrope text-[10px] text-muted-foreground"
            >
              {periods.length}
            </Badge>
          </div>
          {periods.length === 0 ? (
            <p className="py-4 text-center font-manrope text-xs text-muted-foreground">
              {t("noPeriodsDay")}
            </p>
          ) : (
            <div className="space-y-2">
              {periods.map((tt) => (
                <div
                  key={tt.id}
                  className={`flex items-center gap-3 rounded-lg border bg-card p-2.5 ${
                    tt.isActive
                      ? "border-border"
                      : "border-dashed border-border opacity-60"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-jakarta text-xs font-bold ${TONE_CLASSES.indigo}`}
                  >
                    {t("periodShort")}
                    {tt.periodNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-jakarta text-xs font-semibold text-foreground">
                      {tt.subject?.name ?? "—"}
                    </p>
                    <p className="truncate font-manrope text-[11px] text-muted-foreground">
                      {tt.startTime}–{tt.endTime}
                      {tt.teacher
                        ? ` · ${tt.teacher.firstName} ${tt.teacher.lastName}`
                        : ""}
                      {tt.room ? ` · ${tt.room}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const ExamsTab = ({ exams }: { exams: ExamSchedule[] }) => {
  const t = useTranslations("classDetail");

  if (exams.length === 0) {
    return (
      <TabEmpty
        icon={<ClipboardList className="size-5" />}
        title={t("noExamsTitle")}
        subtitle={t("noExamsSub")}
      />
    );
  }

  const sorted = [...exams].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return (
    <div className="divide-y divide-border">
      {sorted.map((exam) => {
        const date = new Date(exam.date);
        return (
          <div
            key={exam.id}
            className="flex items-center gap-4 px-4 py-3.5 sm:px-5"
          >
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-muted/50">
              <span className="font-jakarta text-base leading-none font-bold text-foreground">
                {date.getDate()}
              </span>
              <span className="font-manrope text-[10px] text-muted-foreground uppercase">
                {date.toLocaleDateString("en-IN", { month: "short" })}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-jakarta text-sm font-semibold text-foreground">
                {exam.title}
              </p>
              <p className="flex items-center gap-1.5 font-manrope text-[11px] text-muted-foreground">
                <Clock className="size-3" />
                {exam.startTime}–{exam.endTime}
                {exam.subject ? ` · ${exam.subject.name}` : ""}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`shrink-0 rounded-full font-manrope text-[11px] font-medium ${TONE_CLASSES.violet}`}
            >
              {formatEnum(exam.examType)}
            </Badge>
          </div>
        );
      })}
    </div>
  );
};

export const LeavesTab = ({ leaves }: { leaves: LeaveRequest[] }) => {
  const t = useTranslations("classDetail");

  if (leaves.length === 0) {
    return (
      <TabEmpty
        icon={<FileText className="size-5" />}
        title={t("noLeaveTitle")}
        subtitle={t("noLeaveSub")}
      />
    );
  }

  return (
    <div className="divide-y divide-border">
      {leaves.map((leave) => (
        <div
          key={leave.id}
          className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
        >
          <div className="min-w-0 flex-1">
            <p className="font-jakarta text-sm font-semibold text-foreground">
              {formatDate(leave.fromDate)} – {formatDate(leave.toDate)}
            </p>
            <p className="line-clamp-1 font-manrope text-xs text-muted-foreground">
              {leave.reason}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`w-fit shrink-0 rounded-full font-manrope text-[11px] font-medium ${LEAVE_TONES[leave.status] ?? SLATE_TONE}`}
          >
            {formatEnum(leave.status)}
          </Badge>
        </div>
      ))}
    </div>
  );
};

interface ClassTeacherCardProps {
  classId: string;
  classTeachers: ClassTeacher[];
  onAssign: () => void;
}

export const ClassTeacherCard = ({
  classId,
  classTeachers,
  onAssign,
}: ClassTeacherCardProps) => {
  const t = useTranslations("classDetail");
  const { mutate: unassignTeacher, isPending } = useUnAssignClassTeacher();
  const [pending, setPending] = useState<ClassTeacher | null>(null);
  const pendingName = pending?.teacher
    ? `${pending.teacher.firstName} ${pending.teacher.lastName}`
    : "";

  const confirmUnassign = () => {
    if (!pending) return;
    unassignTeacher(
      { teacherId: pending.teacherId, classId },
      { onSuccess: () => setPending(null) },
    );
  };

  return (
    <Card className={`${CARD_CLASS} gap-4 p-5`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-jakarta text-base font-semibold text-foreground">
            {t("teachersTitle")}
          </h3>
          <p className="font-manrope text-xs text-muted-foreground">
            {classTeachers.length} {t("teachersAssigned")}
          </p>
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${TONE_CLASSES.emerald}`}
        >
          <UserCheck className="size-4" />
        </span>
      </div>

      {classTeachers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-4 py-6 text-center">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full border ${TONE_CLASSES.amber}`}
          >
            <AlertTriangle className="size-4" />
          </span>
          <div>
            <p className="font-jakarta text-sm font-semibold text-foreground">
              {t("noTeachersTitle")}
            </p>
            <p className="mt-0.5 font-manrope text-xs text-muted-foreground">
              {t("noTeachersSub")}
            </p>
          </div>
          <Button
            type="button"
            onClick={onAssign}
            className={`h-9 gap-2 px-4 text-xs ${PRIMARY_PILL_CLASS}`}
          >
            <UserCheck className="size-3.5" />
            {t("assignBtn")}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {classTeachers.map((ct) => (
            <div
              key={ct.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3"
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-emerald-500/15 font-jakarta text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  {getInitials(ct.teacher?.firstName, ct.teacher?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-jakarta text-sm font-semibold text-foreground">
                  {ct.teacher
                    ? `${ct.teacher.firstName} ${ct.teacher.lastName}`
                    : ct.teacherId}
                  {ct.isPrimary && (
                    <Crown
                      className="size-3.5 shrink-0 text-amber-500"
                      aria-label={t("primaryBadge")}
                    />
                  )}
                </p>
                <p className="font-manrope text-[11px] text-muted-foreground">
                  {ct.teacher?.employmentStatus
                    ? formatEnum(ct.teacher.employmentStatus)
                    : t("labelTeacher")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setPending(ct)}
                aria-label={t("unassignBtn")}
                className={`h-8 w-8 shrink-0 ${OUTLINE_PILL_CLASS} hover:text-red-600 dark:hover:text-red-400`}
              >
                <UserMinus className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent className="rounded-2xl border-border bg-card sm:max-w-sm">
          <AlertDialogHeader className="items-center text-center">
            <span
              className={`mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border ${TONE_CLASSES.red}`}
            >
              <UserMinus className="size-5" />
            </span>
            <AlertDialogTitle className="font-jakarta text-lg font-bold text-foreground">
              {t("unassignTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-manrope text-sm text-muted-foreground">
              {t("unassignBody").replace("{teacher}", pendingName)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel
              className={`m-0 h-11 flex-1 text-sm ${OUTLINE_PILL_CLASS}`}
            >
              {t("cancelBtn")}
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={isPending}
              onClick={confirmUnassign}
              className="h-11 flex-1 gap-2 rounded-full bg-red-600 font-manrope text-sm font-semibold text-white shadow-none hover:bg-red-500"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserMinus className="size-4" />
              )}
              {isPending ? t("unassigning") : t("unassignBtn")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

interface AssignClassTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
}

export const AssignClassTeacherDialog = ({
  open,
  onOpenChange,
  classId,
}: AssignClassTeacherDialogProps) => {
  const t = useTranslations("classDetail");
  const { mutate: assignTeacher, isPending } = useAssignClassTeacher();
  const [selected, setSelected] = useState<TeacherListItem | null>(null);

  const { data: teachersData, isLoading } = useGetAllTeachers(
    "ACTIVE",
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    1,
    50,
  );
  const teachers = teachersData?.data ?? [];

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelected(null);
    onOpenChange(next);
  };

  const handleAssign = () => {
    if (!selected) return;
    assignTeacher(
      { teacherId: selected.id, classId },
      { onSuccess: () => handleOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl border-border bg-card sm:max-w-lg">
        <DialogHeader className="flex-row items-start gap-4 space-y-0 text-left">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${TONE_CLASSES.indigo}`}
          >
            <UserCheck className="size-5" />
          </span>
          <div className="space-y-1">
            <DialogTitle className="font-jakarta text-lg font-bold text-foreground">
              {t("modalTitle")}
            </DialogTitle>
            <DialogDescription className="font-manrope text-sm text-muted-foreground">
              {t("modalSubtitle")}
            </DialogDescription>
          </div>
        </DialogHeader>

        <Command className="rounded-xl border border-border bg-muted/30">
          <CommandInput
            placeholder={t("filterPlaceholder")}
            className="font-manrope text-sm"
          />
          <CommandList className="max-h-64">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : (
              <>
                <CommandEmpty className="py-8 text-center font-manrope text-xs text-muted-foreground">
                  {teachers.length === 0
                    ? t("noTeachersAvailable")
                    : t("noTeachersFound")}
                </CommandEmpty>
                <CommandGroup>
                  {teachers.map((teacher) => {
                    const isSelected = selected?.id === teacher.id;
                    return (
                      <CommandItem
                        key={teacher.id}
                        value={`${teacher.firstName} ${teacher.lastName} ${teacher.qualification} ${teacher.city} ${teacher.id}`}
                        onSelect={() => setSelected(teacher)}
                        className={`gap-3 rounded-lg px-2.5 py-2 ${isSelected ? "bg-indigo-500/10 data-[selected=true]:bg-indigo-500/15" : ""}`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback
                            className={`font-jakarta text-[10px] font-bold ${getAvatarClass(teacher.id)}`}
                          >
                            {getInitials(teacher.firstName, teacher.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-jakarta text-sm font-semibold text-foreground">
                            {teacher.firstName} {teacher.lastName}
                          </p>
                          <p className="truncate font-manrope text-[11px] text-muted-foreground">
                            {teacher.qualification} · {teacher.city}
                          </p>
                        </div>
                        {isSelected && (
                          <UserCheck className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>

        {selected && (
          <div
            className={`flex items-center gap-3 rounded-xl border p-3 ${TONE_CLASSES.indigo}`}
          >
            <Users className="size-4 shrink-0" />
            <p className="font-manrope text-xs">
              <span className="font-semibold">
                {selected.firstName} {selected.lastName}
              </span>{" "}
              · {selected.qualification} ·{" "}
              {formatEnum(selected.employmentStatus)}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className={`h-11 flex-1 text-sm ${OUTLINE_PILL_CLASS}`}
          >
            {t("cancelBtn")}
          </Button>
          <Button
            type="button"
            disabled={!selected || isPending}
            onClick={handleAssign}
            className={`h-11 flex-1 gap-2 text-sm ${PRIMARY_PILL_CLASS}`}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserCheck className="size-4" />
            )}
            {isPending ? t("assigningBtn") : t("assignConfirmBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const ClassDetailSkeleton = () => (
  <div className="space-y-5">
    <Skeleton className="h-8 w-36 rounded-full" />
    <Skeleton className="h-48 rounded-2xl" />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Skeleton className="h-96 rounded-2xl lg:col-span-2" />
      <div className="space-y-4">
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  </div>
);
