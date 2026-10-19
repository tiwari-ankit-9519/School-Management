"use client";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  GraduationCap,
  Loader2,
  Search,
  User,
  UserCheck,
  UserX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { TONE_CLASSES } from "@/components/dashboard/DashboardWidgets";
import {
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import { useGetAllTeachers } from "@/hooks/useTeacher";
import { useTranslations } from "@/hooks/useTranslations";
import { TeacherSubject } from "@/types";

const AVATAR_PALETTE = [
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
];

export const getInitials = (first?: string, last?: string) =>
  `${first?.charAt(0) ?? ""}${last?.charAt(0) ?? ""}`.toUpperCase() || "?";

export const getAvatarClass = (seed: string) => {
  const hash = Array.from(seed).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

export const AssignedTeacherRow = ({
  teacherSubject,
}: {
  teacherSubject: TeacherSubject;
}) => {
  const t = useTranslations("subjectDetail");
  const teacher = teacherSubject.teacher;

  return (
    <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
      <Avatar className="h-12 w-12">
        <AvatarFallback
          className={`font-jakarta text-sm font-bold ${getAvatarClass(teacher?.id ?? teacherSubject.id)}`}
        >
          {getInitials(teacher?.firstName, teacher?.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-jakarta text-sm font-semibold text-foreground">
          {teacher?.firstName} {teacher?.lastName}
        </p>
        <p className="truncate font-manrope text-xs text-muted-foreground">
          {teacher?.user?.email ?? "—"}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {teacherSubject.isPrimary && (
            <Badge
              variant="outline"
              className={`gap-1 rounded-full font-manrope text-[10px] font-medium ${TONE_CLASSES.indigo}`}
            >
              <GraduationCap className="size-3" />
              {t("primaryTeacher")}
            </Badge>
          )}
          {teacher?.specialization && (
            <Badge
              variant="outline"
              className="gap-1 rounded-full border-border bg-muted font-manrope text-[10px] font-medium text-foreground/70"
            >
              <Briefcase className="size-3" />
              {teacher.specialization}
            </Badge>
          )}
        </div>
      </div>
      <Badge
        variant="outline"
        className={`hidden gap-1 rounded-full font-manrope text-[11px] font-medium sm:flex ${TONE_CLASSES.emerald}`}
      >
        <UserCheck className="size-3" />
        {t("assigned")}
      </Badge>
    </div>
  );
};

interface AssignTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectName: string;
  onAssign: (teacherId: string) => void;
  isAssigning: boolean;
}

export const AssignTeacherDialog = ({
  open,
  onOpenChange,
  subjectName,
  onAssign,
  isAssigning,
}: AssignTeacherDialogProps) => {
  const t = useTranslations("subjectDetail");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const { data: teachersData, isLoading } = useGetAllTeachers(
    "ALL",
    "",
    "",
    "",
    subjectName,
    undefined,
    1,
    100,
  );

  const teachers = useMemo(() => {
    const list = teachersData?.data ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter(
      (teacher) =>
        teacher.firstName?.toLowerCase().includes(query) ||
        teacher.lastName?.toLowerCase().includes(query) ||
        teacher.user?.email?.toLowerCase().includes(query),
    );
  }, [teachersData, search]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSearch("");
      setSelectedId("");
    }
    onOpenChange(next);
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
              {t("assignModalTitle")}
            </DialogTitle>
            <DialogDescription className="font-manrope text-sm text-muted-foreground">
              {subjectName
                ? t("assignModalSubtitle").replace("{subject}", subjectName)
                : t("assignModalSubtitleFallback")}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchTeacher")}
            aria-label={t("searchTeacher")}
            className={`${fieldClass(false)} pl-9`}
          />
        </div>

        {subjectName && (
          <p
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 font-manrope text-xs ${TONE_CLASSES.indigo}`}
          >
            <GraduationCap className="size-3.5 shrink-0" />
            {t("specializationHint").replace("{subject}", subjectName)}
          </p>
        )}

        <ScrollArea className="h-72 rounded-xl border border-border bg-muted/30">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : teachers.length === 0 ? (
            <div className="flex h-72 flex-col items-center justify-center gap-2 px-4 text-center">
              <User className="size-6 text-muted-foreground/60" />
              <p className="font-manrope text-xs text-muted-foreground">
                {t("noTeachersFound")}
              </p>
            </div>
          ) : (
            <RadioGroup
              value={selectedId}
              onValueChange={setSelectedId}
              className="gap-1 p-2"
            >
              {teachers.map((teacher) => {
                const isSelected = selectedId === teacher.id;
                return (
                  <Label
                    key={teacher.id}
                    htmlFor={`teacher-${teacher.id}`}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 font-normal transition-colors ${
                      isSelected
                        ? "border-indigo-500/40 bg-indigo-500/10"
                        : "border-transparent hover:bg-accent"
                    }`}
                  >
                    <RadioGroupItem
                      id={`teacher-${teacher.id}`}
                      value={teacher.id}
                      className="border-border text-indigo-600 data-[state=checked]:border-indigo-600 dark:text-indigo-400 dark:data-[state=checked]:border-indigo-400"
                    />
                    <Avatar className="h-9 w-9">
                      <AvatarFallback
                        className={`font-jakarta text-[11px] font-bold ${getAvatarClass(teacher.id)}`}
                      >
                        {getInitials(teacher.firstName, teacher.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-jakarta text-sm font-semibold text-foreground">
                        {teacher.firstName} {teacher.lastName}
                      </p>
                      <p className="truncate font-manrope text-[11px] text-muted-foreground">
                        {teacher.user?.email}
                      </p>
                    </div>
                    {teacher.specialization && (
                      <Badge
                        variant="outline"
                        className="hidden shrink-0 rounded-full border-border bg-background font-manrope text-[10px] text-foreground/70 sm:flex"
                      >
                        {teacher.specialization}
                      </Badge>
                    )}
                  </Label>
                );
              })}
            </RadioGroup>
          )}
        </ScrollArea>

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
            disabled={!selectedId || isAssigning}
            onClick={() => onAssign(selectedId)}
            className={`h-11 flex-1 gap-2 text-sm ${PRIMARY_PILL_CLASS}`}
          >
            {isAssigning ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("assigning")}
              </>
            ) : (
              <>
                <UserCheck className="size-4" />
                {t("confirmAssignBtn")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface UnassignTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherName: string;
  onConfirm: () => void;
  isUnassigning: boolean;
}

export const UnassignTeacherDialog = ({
  open,
  onOpenChange,
  teacherName,
  onConfirm,
  isUnassigning,
}: UnassignTeacherDialogProps) => {
  const t = useTranslations("subjectDetail");
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-border bg-card sm:max-w-sm">
        <AlertDialogHeader className="items-center text-center">
          <span
            className={`mb-2 flex h-12 w-12 items-center justify-center rounded-2xl border ${TONE_CLASSES.red}`}
          >
            <AlertTriangle className="size-5" />
          </span>
          <AlertDialogTitle className="font-jakarta text-lg font-bold text-foreground">
            {t("unassignModalTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription className="font-manrope text-sm text-muted-foreground">
            {t("unassignModalBody").replace("{teacher}", teacherName)}
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
            disabled={isUnassigning}
            onClick={onConfirm}
            className="h-11 flex-1 gap-2 rounded-full bg-red-600 font-manrope text-sm font-semibold text-white shadow-none hover:bg-red-500"
          >
            {isUnassigning ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("unassigning")}
              </>
            ) : (
              <>
                <UserX className="size-4" />
                {t("confirmUnassignBtn")}
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const SubjectDetailSkeleton = () => (
  <div className="space-y-5">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-36 rounded-full" />
      <Skeleton className="h-11 w-40 rounded-full" />
    </div>
    <Skeleton className="h-44 rounded-2xl" />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  </div>
);
