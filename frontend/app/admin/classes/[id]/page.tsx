"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  Users,
  BookOpen,
  DoorOpen,
  UserCheck,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Crown,
  User,
  Search,
  ChevronDown,
  GraduationCap,
  Calendar,
  ClipboardList,
  FileText,
  UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetSingleClass,
  useAssignClassTeacher,
  useUnAssignClassTeacher,
} from "@/hooks/useClass";
import { useGetAllTeachers } from "@/hooks/useTeacher";
import { useTranslations } from "@/hooks/useTranslations";
import {
  assignClassTeacherSchema,
  AssignClassTeacherFormValues,
} from "@/validations/validations";
import { TeacherListItem } from "@/types";

const InfoCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3.5">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/5">
      <span className="text-indigo-400">{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="font-manrope text-[11px] text-white/30">{label}</p>
      <p className="font-jakarta text-sm font-semibold text-white">
        {value ?? <span className="italic text-white/20">Not set</span>}
      </p>
    </div>
  </div>
);

const SectionHeader = ({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
}) => (
  <div className="flex items-center gap-3 border-b border-white/8 px-6 py-4">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/5">
      <span className="text-indigo-400">{icon}</span>
    </div>
    <div>
      <p className="font-jakarta text-sm font-bold text-white">{title}</p>
      <p className="font-manrope text-xs text-white/30 mt-0.5">
        {count} records
      </p>
    </div>
  </div>
);

const EmptyState = ({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) => (
  <div className="flex flex-col items-center justify-center gap-3 py-10">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
      {icon}
    </div>
    <div className="text-center">
      <p className="font-jakarta text-sm font-semibold text-white/40">
        {title}
      </p>
      <p className="mt-0.5 font-manrope text-xs text-white/20">{subtitle}</p>
    </div>
  </div>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.5)]">
    <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
    {children}
  </div>
);

const AssignTeacherModal = ({
  classId,
  onClose,
  t,
}: {
  classId: string;
  onClose: () => void;
  t: ReturnType<typeof useTranslations<"classDetail">>;
}) => {
  const { mutate: assignTeacher, isPending } = useAssignClassTeacher();
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] =
    useState<TeacherListItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const filtered = teachers.filter((teacher) => {
    const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
    const qual = teacher.qualification.toLowerCase();
    const city = teacher.city.toLowerCase();
    const q = search.toLowerCase();
    return fullName.includes(q) || qual.includes(q) || city.includes(q);
  });

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AssignClassTeacherFormValues>({
    resolver: zodResolver(assignClassTeacherSchema),
    defaultValues: { teacherId: "", classId },
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (teacher: TeacherListItem) => {
    setSelectedTeacher(teacher);
    setValue("teacherId", teacher.id, { shouldValidate: true });
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = () => {
    setSelectedTeacher(null);
    setValue("teacherId", "", { shouldValidate: false });
    setSearch("");
  };

  const onSubmit = (data: AssignClassTeacherFormValues) => {
    assignTeacher(data, { onSuccess: onClose });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#070c18] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_32px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
        </div>

        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/20">
              <UserCheck className="h-5 w-5 text-indigo-400" />
            </div>
            <h2 className="font-jakarta text-xl font-extrabold text-white">
              {t("modalTitle")}
            </h2>
            <p className="mt-0.5 font-manrope text-sm text-white/40">
              {t("modalSubtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <p className="font-manrope text-xs text-white/40">
              {t("teacherSearchLabel")}
            </p>
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  if (teachers.length > 0) setIsOpen((v) => !v);
                }}
                className={`flex h-12 w-full items-center gap-3 rounded-xl border px-4 text-left transition-colors ${
                  selectedTeacher
                    ? "border-indigo-500/40 bg-indigo-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                } ${teachers.length === 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                {selectedTeacher ? (
                  <UserCheck className="h-4 w-4 shrink-0 text-indigo-400" />
                ) : (
                  <User className="h-4 w-4 shrink-0 text-white/30" />
                )}
                <span
                  className={`flex-1 font-manrope text-sm ${selectedTeacher ? "text-white" : "text-white/30"}`}
                >
                  {selectedTeacher
                    ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}`
                    : isLoading
                      ? t("loadingTeachers")
                      : teachers.length === 0
                        ? t("noTeachersAvailable")
                        : t("selectTeacherPlaceholder")}
                </span>
                <div className="flex items-center gap-1.5">
                  {selectedTeacher && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                      }}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-white/30 hover:text-white/60"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white/30" />
                  ) : (
                    <ChevronDown
                      className={`h-4 w-4 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-[calc(100%+6px)] z-30 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0d1525] shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
                  >
                    <div className="border-b border-white/8 p-2">
                      <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/5 px-3 py-2">
                        <Search className="h-3.5 w-3.5 shrink-0 text-white/30" />
                        <input
                          autoFocus
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder={t("filterPlaceholder")}
                          className="flex-1 bg-transparent font-manrope text-xs text-white placeholder:text-white/20 focus:outline-none"
                        />
                        {search && (
                          <button type="button" onClick={() => setSearch("")}>
                            <X className="h-3 w-3 text-white/30 hover:text-white/60" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto py-1">
                      {filtered.length === 0 ? (
                        <div className="px-4 py-3 font-manrope text-xs text-white/30">
                          {t("noTeachersFound")}
                        </div>
                      ) : (
                        filtered.map((teacher) => (
                          <button
                            key={teacher.id}
                            type="button"
                            onClick={() => handleSelect(teacher)}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 transition-colors ${
                              selectedTeacher?.id === teacher.id
                                ? "bg-indigo-500/15 text-indigo-300"
                                : "hover:bg-white/5"
                            }`}
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/5">
                              <User className="h-3.5 w-3.5 text-white/40" />
                            </div>
                            <div className="min-w-0 text-left">
                              <p className="font-jakarta text-sm font-semibold text-white truncate">
                                {teacher.firstName} {teacher.lastName}
                              </p>
                              <p className="font-manrope text-[11px] text-white/30 truncate">
                                {teacher.qualification} · {teacher.city}
                              </p>
                            </div>
                            {selectedTeacher?.id === teacher.id && (
                              <UserCheck className="ml-auto h-3.5 w-3.5 shrink-0 text-indigo-400" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {errors.teacherId && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="ml-1 flex items-center gap-1 font-manrope text-xs text-red-400"
              >
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errors.teacherId.message}
              </motion.p>
            )}
          </div>

          {selectedTeacher && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/8 px-4 py-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/15">
                <User className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p className="font-jakarta text-sm font-semibold text-white">
                  {selectedTeacher.firstName} {selectedTeacher.lastName}
                </p>
                <p className="font-manrope text-[11px] text-white/40">
                  {selectedTeacher.qualification} ·{" "}
                  {selectedTeacher.employmentStatus}
                </p>
              </div>
            </motion.div>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              onClick={onClose}
              className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 font-jakarta text-sm font-bold text-white/60 transition-all duration-200 hover:bg-white/8 hover:text-white"
            >
              {t("cancelBtn")}
            </Button>
            <Button
              type="submit"
              disabled={isPending || !selectedTeacher}
              className="h-12 flex-1 rounded-xl border-0 bg-indigo-600 font-jakarta text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/30 disabled:opacity-70"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("assigningBtn")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  {t("assignConfirmBtn")}
                </span>
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const ClassDetailPage = () => {
  const params = useParams();
  const classId = params?.id as string;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations("classDetail");

  const { data: classData, isLoading, isError } = useGetSingleClass(classId);
  const { mutate: unassignTeacher, isPending: isUnassigning } =
    useUnAssignClassTeacher();

  const hasTeacher =
    classData?.classTeachers && classData.classTeachers.length > 0;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const handleUnassign = (teacherId: string) => {
    unassignTeacher({ teacherId, classId });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050810]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
          <span className="font-manrope text-sm text-white/30">
            {t("loading")}
          </span>
        </div>
      </div>
    );
  }

  if (isError || !classData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#050810]">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="font-jakarta text-white">{t("notFound")}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-4 py-10 sm:px-8">
      <div
        className="pointer-events-none fixed inset-0 select-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, #1e3a5f18 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, #6366f10a 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-4"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/20">
            <Image
              src="/logo.png"
              alt="EduSphere"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="font-jakarta text-2xl font-extrabold leading-tight text-white">
              Class {classData.name} — {classData.section}
            </h1>
            <p className="font-manrope text-sm text-white/40">
              {t("pageSubtitle")}: {classData.id}
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.06 }}
        >
          <p className="mb-3 font-manrope text-[10px] font-semibold uppercase tracking-widest text-white/30">
            {t("sectionTitle")}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoCard
              icon={<BookOpen className="h-3.5 w-3.5" />}
              label={t("labelClass")}
              value={classData.name}
            />
            <InfoCard
              icon={<BookOpen className="h-3.5 w-3.5" />}
              label={t("labelSection")}
              value={classData.section}
            />
            <InfoCard
              icon={<Users className="h-3.5 w-3.5" />}
              label={t("labelCapacity")}
              value={classData.capacity}
            />
            <InfoCard
              icon={<DoorOpen className="h-3.5 w-3.5" />}
              label={t("labelRoom")}
              value={classData.roomNumber}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/5">
                  <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                </div>
                <div>
                  <p className="font-jakarta text-sm font-bold text-white">
                    {t("teachersTitle")}
                  </p>
                  <p className="font-manrope text-xs text-white/30 mt-0.5">
                    {classData.classTeachers?.length ?? 0}{" "}
                    {t("teachersAssigned")}
                  </p>
                </div>
              </div>
              {!hasTeacher && (
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="flex h-9 items-center gap-2 rounded-xl border-0 bg-indigo-600 px-4 font-jakarta text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("assignBtn")}
                </Button>
              )}
            </div>

            {!hasTeacher ? (
              <EmptyState
                icon={<UserCheck className="h-5 w-5 text-white/20" />}
                title={t("noTeachersTitle")}
                subtitle={t("noTeachersSub")}
              />
            ) : (
              <div className="divide-y divide-white/6">
                {(classData.classTeachers ?? []).map((ct, i) => (
                  <motion.div
                    key={ct.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-white/3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                        <User className="h-4 w-4 text-white/40" />
                      </div>
                      <div>
                        <p className="font-jakarta text-sm font-semibold text-white">
                          {ct.teacher
                            ? `${ct.teacher.firstName} ${ct.teacher.lastName}`
                            : ct.teacherId}
                        </p>
                        <p className="font-manrope text-xs text-white/30">
                          {ct.teacher?.employmentStatus ?? t("labelTeacher")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {ct.isPrimary && (
                        <span className="flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 font-manrope text-xs font-medium text-yellow-400">
                          <Crown className="h-3 w-3" />
                          {t("primaryBadge")}
                        </span>
                      )}
                      <Button
                        onClick={() => handleUnassign(ct.teacherId)}
                        disabled={isUnassigning}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 font-jakarta text-xs font-bold text-red-400 transition-all duration-200 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
                      >
                        {isUnassigning ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <UserMinus className="h-3.5 w-3.5" />
                        )}
                        {t("unassignBtn")}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14 }}
        >
          <Card>
            <SectionHeader
              icon={<GraduationCap className="h-3.5 w-3.5" />}
              title={t("enrollmentsTitle")}
              count={classData.enrollments?.length ?? 0}
            />
            {!classData.enrollments || classData.enrollments.length === 0 ? (
              <EmptyState
                icon={<GraduationCap className="h-5 w-5 text-white/20" />}
                title={t("noEnrollmentsTitle")}
                subtitle={t("noEnrollmentsSub")}
              />
            ) : (
              <div className="divide-y divide-white/6">
                {classData.enrollments.map((enrollment, i) => (
                  <motion.div
                    key={enrollment.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-6 py-4 transition-colors hover:bg-white/3"
                  >
                    <div>
                      <p className="font-manrope text-[11px] text-white/30">
                        Reg Number
                      </p>
                      <p className="font-jakarta text-sm font-semibold text-white truncate">
                        {enrollment.student?.user?.regNumber}
                      </p>
                    </div>
                    <div>
                      <p className="font-manrope text-[11px] text-white/30">
                        Student Name
                      </p>
                      <p className="font-jakarta text-sm font-semibold text-white truncate">
                        {enrollment.student?.firstName}{" "}
                        {enrollment.student?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="font-manrope text-[11px] text-white/30">
                        Roll No
                      </p>
                      <p className="font-jakarta text-sm text-white/60">
                        {enrollment.rollNumber ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="font-manrope text-[11px] text-white/30">
                        Enrollment Status
                      </p>
                      <span
                        className={`self-center rounded-full border px-2.5 py-1 font-manrope text-xs font-medium ${
                          enrollment.status === "ACTIVE"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            : "border-white/10 bg-white/5 text-white/40"
                        }`}
                      >
                        {enrollment.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
        >
          <Card>
            <SectionHeader
              icon={<Calendar className="h-3.5 w-3.5" />}
              title={t("timetablesTitle")}
              count={classData.timetables?.length ?? 0}
            />
            {!classData.timetables || classData.timetables.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-5 w-5 text-white/20" />}
                title={t("noTimetableTitle")}
                subtitle={t("noTimetableSub")}
              />
            ) : (
              <div className="divide-y divide-white/6">
                {classData.timetables.map((tt, i) => (
                  <motion.div
                    key={tt.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-6 py-4 transition-colors hover:bg-white/3"
                  >
                    <div>
                      <p className="font-manrope text-[11px] text-white/30">
                        Day
                      </p>
                      <p className="font-jakarta text-sm font-semibold text-white">
                        {tt.dayOfWeek}
                      </p>
                    </div>
                    <div>
                      <p className="font-manrope text-[11px] text-white/30">
                        Time
                      </p>
                      <p className="font-jakarta text-sm text-white/60">
                        {tt.startTime} – {tt.endTime}
                      </p>
                    </div>
                    <div>
                      <p className="font-manrope text-[11px] text-white/30">
                        Period
                      </p>
                      <p className="font-jakarta text-sm text-white/60">
                        #{tt.periodNumber}
                      </p>
                    </div>
                    <span
                      className={`self-center rounded-full border px-2.5 py-1 font-manrope text-xs font-medium ${
                        tt.isActive
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : "border-white/10 bg-white/5 text-white/40"
                      }`}
                    >
                      {tt.isActive ? "Active" : "Inactive"}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22 }}
        >
          <Card>
            <SectionHeader
              icon={<ClipboardList className="h-3.5 w-3.5" />}
              title={t("examSchedulesTitle")}
              count={classData.examSchedules?.length ?? 0}
            />
            {!classData.examSchedules ||
            classData.examSchedules.length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="h-5 w-5 text-white/20" />}
                title={t("noExamsTitle")}
                subtitle={t("noExamsSub")}
              />
            ) : (
              <div className="divide-y divide-white/6">
                {classData.examSchedules.map((exam, i) => (
                  <motion.div
                    key={exam.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="grid grid-cols-[1fr_1fr_1fr] gap-4 px-6 py-4 transition-colors hover:bg-white/3"
                  >
                    <div>
                      <p className="font-manrope text-[11px] text-white/30">
                        Title
                      </p>
                      <p className="font-jakarta text-sm font-semibold text-white truncate">
                        {exam.title}
                      </p>
                    </div>
                    <div>
                      <p className="font-manrope text-[11px] text-white/30">
                        Type
                      </p>
                      <p className="font-jakarta text-sm text-white/60">
                        {exam.examType}
                      </p>
                    </div>
                    <div>
                      <p className="font-manrope text-[11px] text-white/30">
                        Date
                      </p>
                      <p className="font-jakarta text-sm text-white/60">
                        {formatDate(exam.date)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.26 }}
        >
          <Card>
            <SectionHeader
              icon={<FileText className="h-3.5 w-3.5" />}
              title={t("leaveRequestsTitle")}
              count={classData.leaveRequest?.length ?? 0}
            />
            {!classData.leaveRequest || classData.leaveRequest.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-5 w-5 text-white/20" />}
                title={t("noLeaveTitle")}
                subtitle={t("noLeaveSub")}
              />
            ) : (
              <div className="divide-y divide-white/6">
                {classData.leaveRequest.map((leave, i) => (
                  <motion.div
                    key={leave.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="grid grid-cols-[1fr_1fr_auto] gap-4 px-6 py-4 transition-colors hover:bg-white/3"
                  >
                    <div>
                      <p className="font-manrope text-[11px] text-white/30">
                        Duration
                      </p>
                      <p className="font-jakarta text-sm font-semibold text-white">
                        {formatDate(leave.fromDate)} –{" "}
                        {formatDate(leave.toDate)}
                      </p>
                    </div>
                    <div>
                      <p className="font-manrope text-[11px] text-white/30">
                        Reason
                      </p>
                      <p className="font-jakarta text-sm text-white/60 truncate">
                        {leave.reason}
                      </p>
                    </div>
                    <span
                      className={`self-center rounded-full border px-2.5 py-1 font-manrope text-xs font-medium ${
                        leave.status === "APPROVED"
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                          : leave.status === "REJECTED"
                            ? "border-red-500/20 bg-red-500/10 text-red-400"
                            : leave.status === "PENDING"
                              ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                              : "border-white/10 bg-white/5 text-white/40"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <AssignTeacherModal
            classId={classId}
            onClose={() => setIsModalOpen(false)}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassDetailPage;
