"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  FlaskConical,
  Hash,
  ChevronLeft,
  UserCheck,
  UserX,
  Search,
  X,
  Loader2,
  User,
  BookOpen,
  AlertTriangle,
  Check,
  GraduationCap,
  Briefcase,
  ToggleLeft,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetSingleSubject,
  useAssignTeacherToSubject,
  useUnassignTeacherFromSubject,
} from "@/hooks/useSubject";
import { useGetAllTeachers } from "@/hooks/useTeacher";
import { useTranslations } from "@/hooks/useTranslations";

// ─── Skeleton ────────────────────────────────────────────────────────────────
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-white/5 ${className ?? ""}`} />
);

// ─── Info Card ────────────────────────────────────────────────────────────────
const InfoCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
}) => (
  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 p-4 sm:p-5 backdrop-blur-xl">
    <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10">
      <span className="text-indigo-400">{icon}</span>
    </div>
    <p className="font-manrope text-xs text-white/30 uppercase tracking-widest mb-1">
      {label}
    </p>
    <p className="font-jakarta text-sm font-bold text-white truncate">
      {value ?? "—"}
    </p>
  </div>
);

const SubjectDetailPage = () => {
  const t = useTranslations("subjectDetail");
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null,
  );

  const { data: subject, isLoading: isSubjectLoading } =
    useGetSingleSubject(subjectId);

  const { mutate: assignTeacher, isPending: isAssigning } =
    useAssignTeacherToSubject();

  const { mutate: unassignTeacher, isPending: isUnassigning } =
    useUnassignTeacherFromSubject();

  const primaryTeacherSubject =
    subject?.teacherSubjects?.find((ts) => ts.isPrimary) ??
    subject?.teacherSubjects?.[0] ??
    null;
  const assignedTeacher = primaryTeacherSubject?.teacher ?? null;
  const hasTeacher = (subject?.teacherSubjects?.length ?? 0) > 0;

  const { data: teachersData, isLoading: isTeachersLoading } =
    useGetAllTeachers(
      "ALL",
      "",
      "",
      "",
      subject?.name ?? "",
      undefined,
      1,
      100,
    );

  const filteredTeachers = useMemo(() => {
    const list = teachersData?.data ?? [];
    if (!teacherSearch.trim()) return list;
    const q = teacherSearch.toLowerCase();
    return list.filter(
      (teacher) =>
        teacher.firstName?.toLowerCase().includes(q) ||
        teacher.lastName?.toLowerCase().includes(q) ||
        teacher.user?.email?.toLowerCase().includes(q),
    );
  }, [teachersData, teacherSearch]);

  const handleAssign = () => {
    if (!selectedTeacherId) return;
    assignTeacher(
      { subjectId, data: { teacherId: selectedTeacherId } },
      {
        onSuccess: () => {
          setIsAssignModalOpen(false);
          setSelectedTeacherId(null);
          setTeacherSearch("");
        },
      },
    );
  };

  const handleUnassign = () => {
    unassignTeacher(subjectId, {
      onSuccess: () => setIsUnassignModalOpen(false),
    });
  };

  const handleCloseAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedTeacherId(null);
    setTeacherSearch("");
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-3 py-6 sm:px-8 sm:py-10">
      {/* Background */}
      <div
        className="pointer-events-none fixed inset-0 select-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, #1e3a5f18 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, #6366f10a 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 sm:mb-10"
        >
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-1.5 font-manrope text-xs text-white/30 transition-colors hover:text-white/60"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {t("back")}
          </button>

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/20 shrink-0">
                <Image
                  src="/logo.png"
                  alt="EduSphere Logo"
                  width={22}
                  height={22}
                  className="object-contain"
                />
              </div>
              <div>
                {isSubjectLoading ? (
                  <>
                    <Skeleton className="h-7 w-40 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </>
                ) : (
                  <>
                    <h1 className="font-jakarta text-xl sm:text-2xl font-extrabold leading-tight text-white">
                      {subject?.name ?? "—"}
                    </h1>
                    <p className="font-manrope text-xs sm:text-sm text-white/40 mt-0.5">
                      {t("pageSubtitle")}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Assign / Unassign button */}
            {!isSubjectLoading && (
              <div className="flex shrink-0 items-center gap-2">
                {hasTeacher ? (
                  <Button
                    onClick={() => setIsUnassignModalOpen(true)}
                    className="flex h-9 sm:h-10 items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 sm:px-4 font-jakarta text-xs sm:text-sm font-bold text-red-400 shadow-none transition-all duration-200 hover:bg-red-500/20"
                  >
                    <UserX className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t("unassignBtn")}</span>
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="flex h-9 sm:h-10 items-center gap-1.5 rounded-xl border-0 bg-indigo-600 px-3 sm:px-4 font-jakarta text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t("assignBtn")}</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
        >
          {isSubjectLoading ? (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </>
          ) : (
            <>
              <InfoCard
                icon={<FlaskConical className="h-4 w-4" />}
                label={t("infoName")}
                value={subject?.name}
              />
              <InfoCard
                icon={<Hash className="h-4 w-4" />}
                label={t("infoCode")}
                value={subject?.code}
              />
              <InfoCard
                icon={<BookOpen className="h-4 w-4" />}
                label={t("infoStatus")}
                value={subject?.isActive ? t("active") : t("inactive")}
              />
              <InfoCard
                icon={<ToggleLeft className="h-4 w-4" />}
                label={t("infoElective")}
                value={subject?.isElective ? t("yes") : t("no")}
              />
              <InfoCard
                icon={<FileText className="h-4 w-4" />}
                label={t("infoDescription")}
                value={subject?.description}
              />
            </>
          )}
        </motion.div>

        {/* Assigned Teacher Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />

          <div className="border-b border-white/8 px-5 sm:px-6 py-4">
            <h2 className="font-jakarta text-sm font-bold text-white/70">
              {t("assignedTeacherTitle")}
            </h2>
          </div>

          {isSubjectLoading ? (
            <div className="px-5 sm:px-6 py-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ) : hasTeacher ? (
            <div className="divide-y divide-white/6">
              {subject!.teacherSubjects.map((ts) => (
                <div
                  key={ts.id}
                  className="flex items-center gap-4 px-5 sm:px-6 py-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                    <User className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-jakarta text-sm font-bold text-white truncate">
                      {ts.teacher?.firstName} {ts.teacher?.lastName}
                    </p>
                    <p className="font-manrope text-xs text-white/40 truncate mt-0.5">
                      {ts.teacher?.user?.email}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {ts.isPrimary && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-manrope text-[11px] font-medium text-indigo-400">
                          <GraduationCap className="h-2.5 w-2.5" />
                          {t("primaryTeacher")}
                        </span>
                      )}
                      {ts.teacher?.specialization && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-manrope text-[11px] text-white/40">
                          <Briefcase className="h-2.5 w-2.5" />
                          {ts.teacher.specialization}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-manrope text-xs font-medium text-emerald-400 shrink-0">
                    <UserCheck className="h-3 w-3" />
                    {t("assigned")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <UserX className="h-5 w-5 text-white/20" />
              </div>
              <div>
                <p className="font-jakarta text-sm font-semibold text-white/40">
                  {t("noTeacherTitle")}
                </p>
                <p className="mt-0.5 font-manrope text-xs text-white/20">
                  {t("noTeacherSubtitle")}
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 font-manrope text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/15"
              >
                <UserCheck className="h-3.5 w-3.5" />
                {t("assignBtn")}
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Assign Teacher Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <>
            <motion.div
              key="assign-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={handleCloseAssignModal}
            />
            <motion.div
              key="assign-modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#070c18] p-6 sm:p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_32px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                  <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
                </div>

                {/* Modal Header */}
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/20">
                      <UserCheck className="h-5 w-5 text-indigo-400" />
                    </div>
                    <h2 className="font-jakarta text-xl font-extrabold text-white">
                      {t("assignModalTitle")}
                    </h2>
                    <p className="mt-0.5 font-manrope text-sm text-white/40">
                      {subject?.name
                        ? t("assignModalSubtitle").replace(
                            "{subject}",
                            subject.name,
                          )
                        : t("assignModalSubtitleFallback")}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseAssignModal}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-indigo-400/60" />
                  <input
                    type="text"
                    placeholder={t("searchTeacher")}
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 font-manrope text-sm text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                  />
                </div>

                {/* Specialization hint */}
                {subject?.name && (
                  <div className="mb-3 flex items-center gap-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/8 px-3 py-2">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                    <p className="font-manrope text-xs text-indigo-300/70">
                      {t("specializationHint").replace(
                        "{subject}",
                        subject.name,
                      )}
                    </p>
                  </div>
                )}

                {/* Teacher list */}
                <div className="max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-white/3 scrollbar-thin">
                  {isTeachersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                    </div>
                  ) : filteredTeachers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                      <User className="h-6 w-6 text-white/10" />
                      <p className="font-manrope text-xs text-white/30">
                        {t("noTeachersFound")}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/6">
                      {filteredTeachers.map((teacher) => (
                        <button
                          key={teacher.id}
                          onClick={() =>
                            setSelectedTeacherId(
                              selectedTeacherId === teacher.id
                                ? null
                                : teacher.id,
                            )
                          }
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
                            selectedTeacherId === teacher.id
                              ? "bg-indigo-500/15"
                              : "hover:bg-white/4"
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                              selectedTeacherId === teacher.id
                                ? "border-indigo-500/40 bg-indigo-500/20"
                                : "border-white/10 bg-white/5"
                            }`}
                          >
                            {selectedTeacherId === teacher.id ? (
                              <Check className="h-3.5 w-3.5 text-indigo-400" />
                            ) : (
                              <User className="h-3.5 w-3.5 text-white/30" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`font-jakarta text-sm font-bold truncate transition-colors ${
                                selectedTeacherId === teacher.id
                                  ? "text-indigo-300"
                                  : "text-white"
                              }`}
                            >
                              {teacher.firstName} {teacher.lastName}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                              <p className="font-manrope text-xs text-white/30 truncate">
                                {teacher?.user?.email}
                              </p>
                              {teacher.specialization && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/15 bg-indigo-500/8 px-1.5 py-0.5 font-manrope text-[10px] text-indigo-400/80">
                                  <Briefcase className="h-2 w-2" />
                                  {teacher.specialization}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-3">
                  <Button
                    type="button"
                    onClick={handleCloseAssignModal}
                    className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 font-jakarta text-sm font-bold text-white/60 hover:bg-white/8 hover:text-white transition-all duration-200"
                  >
                    {t("cancelBtn")}
                  </Button>
                  <Button
                    type="button"
                    disabled={!selectedTeacherId || isAssigning}
                    onClick={handleAssign}
                    className="h-12 flex-1 rounded-xl border-0 bg-indigo-600 font-jakarta text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500 disabled:opacity-40"
                  >
                    {isAssigning ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("assigning")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        {t("confirmAssignBtn")}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Unassign Confirm Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isUnassignModalOpen && (
          <>
            <motion.div
              key="unassign-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsUnassignModalOpen(false)}
            />
            <motion.div
              key="unassign-modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#070c18] p-6 sm:p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_32px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                  <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-red-500/20 to-transparent" />
                </div>

                <div className="mb-5 flex flex-col items-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <h2 className="font-jakarta text-lg font-extrabold text-white">
                    {t("unassignModalTitle")}
                  </h2>
                  <p className="mt-1.5 font-manrope text-sm text-white/40">
                    {t("unassignModalBody").replace(
                      "{teacher}",
                      assignedTeacher
                        ? `${assignedTeacher.firstName} ${assignedTeacher.lastName}`
                        : "",
                    )}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setIsUnassignModalOpen(false)}
                    className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 font-jakarta text-sm font-bold text-white/60 hover:bg-white/8 hover:text-white transition-all duration-200"
                  >
                    {t("cancelBtn")}
                  </Button>
                  <Button
                    type="button"
                    disabled={isUnassigning}
                    onClick={handleUnassign}
                    className="h-12 flex-1 rounded-xl border border-red-500/30 bg-red-500/10 font-jakarta text-sm font-bold text-red-400 transition-all duration-200 hover:bg-red-500/20 disabled:opacity-40 shadow-none"
                  >
                    {isUnassigning ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("unassigning")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <UserX className="h-4 w-4" />
                        {t("confirmUnassignBtn")}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubjectDetailPage;
