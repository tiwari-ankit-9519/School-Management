"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  SlidersHorizontal,
  X,
  ArrowRight,
  Loader2,
  User,
  Users,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
} from "lucide-react";
import Pagination from "@/components/smoothui/pagination";
import { useGetAllStudents } from "@/hooks/useStudent";
import { useGetAllClasses } from "@/hooks/useClass";
import { useGetAllAcademicYears } from "@/hooks/useAcademicYear";
import { useTranslations } from "@/hooks/useTranslations";
import { EnrollmentStatus, Gender, ParentType } from "@/types";

const STATUS_STYLES: Record<EnrollmentStatus, string> = {
  ACTIVE: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  INACTIVE: "border-white/10 bg-white/5 text-white/40",
  SUSPENDED: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  GRADUATED: "border-sky-500/20 bg-sky-500/10 text-sky-400",
  TRANSFERRED: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
  EXPELLED: "border-red-500/20 bg-red-500/10 text-red-400",
  WITHDRAWN: "border-red-500/20 bg-red-500/10 text-red-400",
};

// const StatusBadge = ({
//   status,
//   t,
// }: {
//   status: EnrollmentStatus;
//   t: (key: string) => string;
// }) => (
//   <span
//     className={`inline-flex items-center rounded-md border px-2 py-0.5 font-manrope text-[11px] ${STATUS_STYLES[status]}`}
//   >
//     {t(`status_${status}`)}
//   </span>
// );

const GenderBadge = ({ gender }: { gender: Gender }) => (
  <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-manrope text-[11px] text-white/40">
    {gender.charAt(0) + gender.slice(1).toLowerCase()}
  </span>
);

const StudentAvatar = () => (
  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
    <User className="h-3.5 w-3.5 text-indigo-400" />
  </div>
);

function getPrimaryGuardian(
  parentLinks: {
    parentType: ParentType;
    parent: {
      firstName: string;
      lastName: string;
      alternatePhone: string | null;
      user: { email: string | null; phone: string | null };
    };
  }[],
) {
  if (!parentLinks || parentLinks.length === 0) return null;
  return (
    parentLinks.find((l) => l.parentType === "FATHER") ??
    parentLinks.find((l) => l.parentType === "MOTHER") ??
    parentLinks[0]
  );
}

const AllStudentsPage = () => {
  const t = useTranslations("studentsList");
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [classIdInput, setClassIdInput] = useState("");
  const [academicYearIdInput, setAcademicYearIdInput] = useState("");
  const [statusInput, setStatusInput] = useState<EnrollmentStatus | "">("");
  const [genderInput, setGenderInput] = useState<Gender | "">("");

  const [appliedFilters, setAppliedFilters] = useState<{
    classId?: string;
    academicYearId?: string;
    status?: EnrollmentStatus;
    gender?: Gender;
  }>({});

  const { data, isLoading } = useGetAllStudents(appliedFilters, page, 10);

  const { data: academicYearsData } = useGetAllAcademicYears(
    undefined,
    undefined,
    1,
    100,
  );

  const effectiveAcademicYearId = useMemo(() => {
    if (academicYearIdInput) return academicYearIdInput;
    const current = academicYearsData?.data.find((y) => y.isCurrent);
    return current?.id ?? "";
  }, [academicYearIdInput, academicYearsData]);

  const { data: classesData } = useGetAllClasses(
    { academicYearId: effectiveAcademicYearId },
    1,
    100,
  );

  const activeFilterCount = Object.values(appliedFilters).filter(
    (v) => v !== undefined && v !== "",
  ).length;

  const applyFilters = () => {
    setAppliedFilters({
      classId: classIdInput || undefined,
      academicYearId: academicYearIdInput || undefined,
      status: (statusInput as EnrollmentStatus) || undefined,
      gender: (genderInput as Gender) || undefined,
    });
    setPage(1);
    setIsFiltersOpen(false);
  };

  const clearFilters = () => {
    setClassIdInput("");
    setAcademicYearIdInput("");
    setStatusInput("");
    setGenderInput("");
    setAppliedFilters({});
    setPage(1);
  };

  const StatusBadge = ({
    status,
    label,
  }: {
    status: EnrollmentStatus;
    label: string;
  }) => (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 font-manrope text-[11px] ${STATUS_STYLES[status]}`}
    >
      {label}
    </span>
  );

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-3 pb-6 sm:px-8 pt-10 sm:pt-8 sm:pb-10">
      <div
        className="pointer-events-none fixed inset-0 select-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, #1e3a5f18 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, #6366f10a 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/20">
                <GraduationCap className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="font-jakarta text-xl sm:text-2xl font-extrabold leading-tight text-white">
                  {t("pageTitle")}
                </h1>
                <p className="font-manrope text-xs sm:text-sm text-white/40 mt-0.5">
                  {t("pageSubtitle")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsFiltersOpen((p) => !p)}
              className={`relative flex h-8 sm:h-9 items-center gap-1.5 rounded-xl border px-3 font-manrope text-xs sm:text-sm backdrop-blur-sm transition-all duration-200 ${
                isFiltersOpen || activeFilterCount > 0
                  ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>{t("filters")}</span>
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 font-jakarta text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {appliedFilters.classId && (
                  <span className="flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-manrope text-[11px] text-indigo-300">
                    {t("filterClass")}:{" "}
                    {classesData?.data.find(
                      (c) => c.id === appliedFilters.classId,
                    )?.name ?? appliedFilters.classId}
                    <button
                      onClick={() => {
                        setClassIdInput("");
                        setAppliedFilters((p) => ({
                          ...p,
                          classId: undefined,
                        }));
                      }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
                {appliedFilters.academicYearId && (
                  <span className="flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-manrope text-[11px] text-indigo-300">
                    {t("filterAcademicYear")}:{" "}
                    {academicYearsData?.data.find(
                      (y) => y.id === appliedFilters.academicYearId,
                    )?.name ?? appliedFilters.academicYearId}
                    <button
                      onClick={() => {
                        setAcademicYearIdInput("");
                        setAppliedFilters((p) => ({
                          ...p,
                          academicYearId: undefined,
                        }));
                      }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
                {appliedFilters.status && (
                  <span className="flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-manrope text-[11px] text-indigo-300">
                    {t(`status_${appliedFilters.status}`)}
                    <button
                      onClick={() => {
                        setStatusInput("");
                        setAppliedFilters((p) => ({
                          ...p,
                          status: undefined,
                        }));
                      }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
                {appliedFilters.gender && (
                  <span className="flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-manrope text-[11px] text-indigo-300">
                    {appliedFilters.gender.charAt(0) +
                      appliedFilters.gender.slice(1).toLowerCase()}
                    <button
                      onClick={() => {
                        setGenderInput("");
                        setAppliedFilters((p) => ({
                          ...p,
                          gender: undefined,
                        }));
                      }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mb-4 sm:mb-6 overflow-hidden"
            >
              <div className="relative rounded-2xl border border-white/10 bg-white/4 p-4 sm:p-5 backdrop-blur-xl">
                <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-linear-to-r from-transparent via-white/15 to-transparent" />

                <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
                  <div className="relative">
                    <select
                      value={academicYearIdInput}
                      onChange={(e) => {
                        setAcademicYearIdInput(e.target.value);
                        setClassIdInput("");
                      }}
                      className="h-9 sm:h-10 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 font-manrope text-xs sm:text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                    >
                      <option value="" className="bg-[#070c18]">
                        {t("filterAcademicYear")}
                      </option>
                      {academicYearsData?.data.map((y) => (
                        <option
                          key={y.id}
                          value={y.id}
                          className="bg-[#070c18]"
                        >
                          {y.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <select
                      value={classIdInput}
                      onChange={(e) => setClassIdInput(e.target.value)}
                      disabled={!effectiveAcademicYearId}
                      className="h-9 sm:h-10 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 font-manrope text-xs sm:text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors disabled:opacity-40"
                    >
                      <option value="" className="bg-[#070c18]">
                        {t("filterClass")}
                      </option>
                      {classesData?.data.map((c) => (
                        <option
                          key={c.id}
                          value={c.id}
                          className="bg-[#070c18]"
                        >
                          {c.name} - {c.section}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <select
                      value={statusInput}
                      onChange={(e) =>
                        setStatusInput(e.target.value as EnrollmentStatus | "")
                      }
                      className="h-9 sm:h-10 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 font-manrope text-xs sm:text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                    >
                      <option value="" className="bg-[#070c18]">
                        {t("filterStatus")}
                      </option>
                      {(
                        [
                          "ACTIVE",
                          "INACTIVE",
                          "SUSPENDED",
                          "GRADUATED",
                          "TRANSFERRED",
                          "EXPELLED",
                          "WITHDRAWN",
                        ] as EnrollmentStatus[]
                      ).map((s) => (
                        <option key={s} value={s} className="bg-[#070c18]">
                          {t(`status_${s}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <select
                      value={genderInput}
                      onChange={(e) =>
                        setGenderInput(e.target.value as Gender | "")
                      }
                      className="h-9 sm:h-10 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 font-manrope text-xs sm:text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                    >
                      <option value="" className="bg-[#070c18]">
                        {t("filterGender")}
                      </option>
                      <option value="MALE" className="bg-[#070c18]">
                        {t("genderMale")}
                      </option>
                      <option value="FEMALE" className="bg-[#070c18]">
                        {t("genderFemale")}
                      </option>
                      <option value="OTHER" className="bg-[#070c18]">
                        {t("genderOther")}
                      </option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 sm:mt-4 flex items-center justify-end gap-2">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="flex h-8 sm:h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 font-manrope text-xs text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
                    >
                      <X className="h-3 w-3" />
                      {t("clearFilters")}
                    </button>
                  )}
                  <button
                    onClick={applyFilters}
                    className="flex h-8 sm:h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 font-jakarta text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-500"
                  >
                    {t("applyFilters")}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />

          <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1.5fr_1fr_0.5fr] gap-4 border-b border-white/8 px-6 py-3.5">
            {[
              t("colStudent"),
              t("colClass"),
              t("colGender"),
              t("colGuardian"),
              t("colStatus"),
              "",
            ].map((h, i) => (
              <span
                key={i}
                className="font-manrope text-xs font-medium uppercase tracking-widest text-white/30"
              >
                {h}
              </span>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 sm:py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
                <span className="font-manrope text-sm text-white/30">
                  {t("loading")}
                </span>
              </div>
            </div>
          ) : !data?.data?.length ? (
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-16 text-center sm:py-20">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white/20" />
              </div>
              <div>
                <p className="font-jakarta text-sm font-semibold text-white/40">
                  {t("emptyTitle")}
                </p>
                <p className="mt-0.5 font-manrope text-xs text-white/20">
                  {activeFilterCount > 0
                    ? t("emptyFiltered")
                    : t("emptySubtitle")}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/6">
              {data.data.map((enrollment, i) => {
                const guardian = getPrimaryGuardian(
                  enrollment.student.parentLinks,
                );
                return (
                  <motion.div
                    key={enrollment.studentId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                    onClick={() =>
                      router.push(`/admin/students/${enrollment.studentId}`)
                    }
                    className="cursor-pointer transition-colors duration-150 hover:bg-white/3 group"
                  >
                    <div className="flex md:hidden items-start justify-between gap-3 px-4 py-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <StudentAvatar />
                        <div className="min-w-0 flex-1">
                          <p className="font-jakarta text-sm font-bold text-white truncate">
                            {enrollment.student.firstName}{" "}
                            {enrollment.student.lastName}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <GenderBadge gender={enrollment.student.gender} />
                            <StatusBadge
                              status={enrollment.status}
                              label={t(
                                `status_${enrollment.status}` as Parameters<
                                  typeof t
                                >[0],
                              )}
                            />
                          </div>
                          <p className="mt-1.5 font-manrope text-[11px] text-white/40">
                            {enrollment.class.name}-{enrollment.class.section}
                          </p>
                          {guardian && (
                            <p className="mt-1 font-manrope text-[11px] text-white/25">
                              {guardian.parent.firstName}{" "}
                              {guardian.parent.lastName} ·{" "}
                              {guardian.parent.user.phone ??
                                guardian.parent.alternatePhone ??
                                "—"}
                            </p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 mt-1 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                    </div>

                    <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1.5fr_1fr_0.5fr] gap-4 px-6 py-4 items-center">
                      <div className="flex items-center gap-3 min-w-0">
                        <StudentAvatar />
                        <div className="min-w-0">
                          <p className="font-jakarta text-sm font-bold text-white truncate">
                            {enrollment.student.firstName}{" "}
                            {enrollment.student.lastName}
                          </p>
                          <p className="font-manrope text-[11px] text-white/25 truncate">
                            {enrollment.student.city},{" "}
                            {enrollment.student.state}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-manrope text-sm text-white/50">
                          {enrollment.class.name}-{enrollment.class.section}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <GenderBadge gender={enrollment.student.gender} />
                      </div>

                      <div className="min-w-0">
                        {guardian ? (
                          <>
                            <p className="font-manrope text-xs text-white/60 truncate">
                              {guardian.parent.firstName}{" "}
                              {guardian.parent.lastName}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2 text-white/25">
                              {guardian.parent.user.phone && (
                                <span className="flex items-center gap-1 font-manrope text-[11px]">
                                  <Phone className="h-2.5 w-2.5" />
                                  {guardian.parent.user.phone}
                                </span>
                              )}
                              {guardian.parent.user.email && (
                                <span className="flex items-center gap-1 font-manrope text-[11px]">
                                  <Mail className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="italic text-white/20 font-manrope text-xs">
                            —
                          </span>
                        )}
                      </div>

                      <div className="flex items-center">
                        <StatusBadge
                          status={enrollment.status}
                          label={t(
                            `status_${enrollment.status}` as Parameters<
                              typeof t
                            >[0],
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-end">
                        <ArrowRight className="h-4 w-4 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex flex-col items-center gap-3 border-t border-white/8 px-4 sm:px-6 py-4 sm:flex-row sm:justify-between">
              <span className="font-manrope text-xs text-white/30">
                {t("page")} {data.page} {t("of")} {data.totalPages} ·{" "}
                {data.total} {t("total")}
              </span>
              <Pagination
                page={page}
                totalPages={data.totalPages}
                onPageChange={(p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          )}
        </motion.div>

        {data && data.data.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-4 flex items-center gap-3"
          >
            <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-4 py-2.5">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-manrope text-xs text-white/40">
                <span className="font-semibold text-white">
                  {data.data.length}
                </span>{" "}
                {data.data.length === 1
                  ? t("summaryStudent")
                  : t("summaryStudents")}
                {activeFilterCount > 0 ? ` ${t("summaryFiltered")}` : ""}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AllStudentsPage;
