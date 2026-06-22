"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  GraduationCap,
  SlidersHorizontal,
  X,
  ArrowRight,
  Loader2,
  User,
  Search,
  MapPin,
  BookOpen,
  Users,
  Plus,
  Briefcase,
  Activity,
} from "lucide-react";
import Pagination from "@/components/smoothui/pagination";
import { useGetAllTeachers } from "@/hooks/useTeacher";
import { useTranslations } from "@/hooks/useTranslations";
import { TeacherListItem, Gender, EmploymentStatus } from "@/types";

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const GenderBadge = ({ gender }: { gender: Gender }) => (
  <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-manrope text-[11px] text-white/40">
    {gender.charAt(0) + gender.slice(1).toLowerCase()}
  </span>
);

const StatusBadge = ({ status }: { status: EmploymentStatus }) => {
  const isActive = status === EmploymentStatus.ACTIVE;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-manrope text-[11px] ${
        isActive
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-amber-500/20 bg-amber-500/10 text-amber-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-amber-400"}`}
      />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};

const TeacherAvatar = ({
  size = "sm",
}: {
  teacher: TeacherListItem;
  size?: "sm" | "md";
}) => {
  const dim = size === "md" ? "h-10 w-10" : "h-8 w-8";
  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10`}
    >
      <User className="h-3.5 w-3.5 text-indigo-400" />
    </div>
  );
};

const TeachersListPage = () => {
  const t = useTranslations("teachersList");
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [nameInput, setNameInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [qualificationInput, setQualificationInput] = useState("");
  const [experienceInput, setExperienceInput] = useState("");
  const [genderInput, setGenderInput] = useState("");
  const [statusInput, setStatusInput] = useState("");

  const [appliedFilters, setAppliedFilters] = useState<{
    name?: string;
    city?: string;
    state?: string;
    qualification?: string;
    experience?: number;
    gender?: string;
    status?: string;
  }>({});

  const { data, isLoading } = useGetAllTeachers(
    appliedFilters.status ?? "ALL",
    appliedFilters.gender ?? "",
    appliedFilters.city ?? "",
    appliedFilters.state ?? "",
    appliedFilters.qualification ?? "",
    appliedFilters.experience,
    page,
    10,
  );

  const filteredData = data
    ? {
        ...data,
        data: data.data.filter((teacher) => {
          const fullName =
            `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
          if (
            appliedFilters.name &&
            !fullName.includes(appliedFilters.name.toLowerCase())
          )
            return false;
          return true;
        }),
      }
    : data;

  const activeFilterCount = Object.values(appliedFilters).filter(
    (v) => v !== undefined && v !== "",
  ).length;

  const applyFilters = () => {
    const parsedExp = parseInt(experienceInput, 10);
    setAppliedFilters({
      name: nameInput || undefined,
      city: cityInput || undefined,
      state: stateInput || undefined,
      qualification: qualificationInput || undefined,
      experience: experienceInput && !isNaN(parsedExp) ? parsedExp : undefined,
      gender: genderInput || undefined,
      status: statusInput || undefined,
    });
    setPage(1);
    setIsFiltersOpen(false);
  };

  const clearFilters = () => {
    setNameInput("");
    setCityInput("");
    setStateInput("");
    setQualificationInput("");
    setExperienceInput("");
    setGenderInput("");
    setStatusInput("");
    setAppliedFilters({});
    setPage(1);
  };

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
                <Image
                  src="/logo.png"
                  alt="EduSphere"
                  width={22}
                  height={22}
                  className="object-contain"
                />
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

            <button
              onClick={() => router.push("/admin/teachers/create")}
              className="flex h-9 sm:h-10 shrink-0 items-center gap-2 rounded-xl border-0 bg-indigo-600 px-3 sm:px-4 font-jakarta text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("addTeacher")}</span>
              <span className="sm:hidden">{t("addTeacherShort")}</span>
            </button>
          </div>

          {/* Filter toggle row */}
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

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {appliedFilters.name && (
                  <span className="flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-manrope text-[11px] text-indigo-300">
                    {t("filterName")}: {appliedFilters.name}
                    <button
                      onClick={() => {
                        setNameInput("");
                        setAppliedFilters((p) => ({ ...p, name: undefined }));
                      }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
                {appliedFilters.city && (
                  <span className="flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-manrope text-[11px] text-indigo-300">
                    {t("filterCity")}: {appliedFilters.city}
                    <button
                      onClick={() => {
                        setCityInput("");
                        setAppliedFilters((p) => ({ ...p, city: undefined }));
                      }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
                {appliedFilters.state && (
                  <span className="flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-manrope text-[11px] text-indigo-300">
                    {t("filterState")}: {appliedFilters.state}
                    <button
                      onClick={() => {
                        setStateInput("");
                        setAppliedFilters((p) => ({ ...p, state: undefined }));
                      }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
                {appliedFilters.qualification && (
                  <span className="flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-manrope text-[11px] text-indigo-300">
                    {t("filterQualification")}: {appliedFilters.qualification}
                    <button
                      onClick={() => {
                        setQualificationInput("");
                        setAppliedFilters((p) => ({
                          ...p,
                          qualification: undefined,
                        }));
                      }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
                {appliedFilters.experience !== undefined && (
                  <span className="flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-manrope text-[11px] text-indigo-300">
                    {t("filterExperience")}: {appliedFilters.experience}y
                    <button
                      onClick={() => {
                        setExperienceInput("");
                        setAppliedFilters((p) => ({
                          ...p,
                          experience: undefined,
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
                        setPage(1);
                      }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                )}
                {appliedFilters.status && (
                  <span className="flex items-center gap-1 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-manrope text-[11px] text-indigo-300">
                    {appliedFilters.status.charAt(0) +
                      appliedFilters.status.slice(1).toLowerCase()}
                    <button
                      onClick={() => {
                        setStatusInput("");
                        setAppliedFilters((p) => ({
                          ...p,
                          status: undefined,
                        }));
                        setPage(1);
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

        {/* ── Filter Panel ── */}
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
                  {/* Name */}
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400/60">
                      <Search className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder={t("filterName")}
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                      className="h-9 sm:h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 font-manrope text-xs sm:text-sm text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                    />
                  </div>

                  {/* City */}
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400/60">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder={t("filterCity")}
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                      className="h-9 sm:h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 font-manrope text-xs sm:text-sm text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                    />
                  </div>

                  {/* State */}
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400/60">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder={t("filterState")}
                      value={stateInput}
                      onChange={(e) => setStateInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                      className="h-9 sm:h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 font-manrope text-xs sm:text-sm text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                    />
                  </div>

                  {/* Qualification */}
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400/60">
                      <BookOpen className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder={t("filterQualification")}
                      value={qualificationInput}
                      onChange={(e) => setQualificationInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                      className="h-9 sm:h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 font-manrope text-xs sm:text-sm text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                    />
                  </div>

                  {/* Experience */}
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400/60">
                      <Briefcase className="h-3.5 w-3.5" />
                    </div>
                    <input
                      type="number"
                      min={0}
                      placeholder={t("filterExperience")}
                      value={experienceInput}
                      onChange={(e) => setExperienceInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                      className="h-9 sm:h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 font-manrope text-xs sm:text-sm text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                    />
                  </div>

                  {/* Gender */}
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400/60">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <select
                      value={genderInput}
                      onChange={(e) => setGenderInput(e.target.value)}
                      className="h-9 sm:h-10 w-full appearance-none rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 font-manrope text-xs sm:text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                    >
                      <option value="" className="bg-[#070c18]">
                        {t("filterGender")}
                      </option>
                      <option value={Gender.MALE} className="bg-[#070c18]">
                        {t("genderMale")}
                      </option>
                      <option value={Gender.FEMALE} className="bg-[#070c18]">
                        {t("genderFemale")}
                      </option>
                      <option value={Gender.OTHER} className="bg-[#070c18]">
                        {t("genderOther")}
                      </option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400/60">
                      <Activity className="h-3.5 w-3.5" />
                    </div>
                    <select
                      value={statusInput}
                      onChange={(e) => setStatusInput(e.target.value)}
                      className="h-9 sm:h-10 w-full appearance-none rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 font-manrope text-xs sm:text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                    >
                      <option value="" className="bg-[#070c18]">
                        {t("filterStatus")}
                      </option>
                      <option
                        value={EmploymentStatus.ACTIVE}
                        className="bg-[#070c18]"
                      >
                        {t("statusActive")}
                      </option>
                      <option
                        value={EmploymentStatus.INACTIVE}
                        className="bg-[#070c18]"
                      >
                        {t("statusInactive")}
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

        {/* ── Table ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />

          {/* Desktop header */}
          <div className="hidden md:grid md:grid-cols-[2.5fr_1fr_1.2fr_1.2fr_1fr_1fr_0.5fr] gap-4 border-b border-white/8 px-6 py-3.5">
            {[
              t("colTeacher"),
              t("colGender"),
              t("colSpecialization"),
              t("colQualification"),
              t("colExperience"),
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

          {/* Loading */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16 sm:py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
                <span className="font-manrope text-sm text-white/30">
                  {t("loading")}
                </span>
              </div>
            </div>
          ) : !filteredData?.data?.length ? (
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
            /* Rows */
            <div className="divide-y divide-white/6">
              {filteredData.data.map((teacher: TeacherListItem, i: number) => (
                <motion.div
                  key={teacher.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  onClick={() => router.push(`/admin/teachers/${teacher.id}`)}
                  className="cursor-pointer transition-colors duration-150 hover:bg-white/3 group"
                >
                  {/* ── Mobile row ── */}
                  <div className="flex md:hidden items-start justify-between gap-3 px-4 py-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <TeacherAvatar teacher={teacher} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="font-jakarta text-sm font-bold text-white truncate">
                          {teacher.firstName} {teacher.lastName}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <GenderBadge gender={teacher.gender} />
                          <StatusBadge status={teacher.employmentStatus} />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {teacher.specialization && (
                            <span className="flex items-center gap-1 font-manrope text-[11px] text-white/40">
                              <BookOpen className="h-3 w-3 shrink-0" />
                              {teacher.specialization}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-manrope text-[11px] text-white/40">
                            <GraduationCap className="h-3 w-3 shrink-0" />
                            {teacher.qualification}
                          </span>
                          <span className="flex items-center gap-1 font-manrope text-[11px] text-white/40">
                            <Briefcase className="h-3 w-3 shrink-0" />
                            {teacher.experience}y exp
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 font-manrope text-[11px] text-white/25">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {teacher.city}, {teacher.state}
                        </div>
                        <p className="mt-1 font-manrope text-[11px] text-white/25">
                          {t("joined")} {formatDate(teacher.joiningDate)}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 mt-1 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                  </div>

                  {/* ── Desktop row ── */}
                  <div className="hidden md:grid md:grid-cols-[2.5fr_1fr_1.2fr_1.2fr_1fr_1fr_0.5fr] gap-4 px-6 py-4 items-center">
                    {/* Teacher name + location */}
                    <div className="flex items-center gap-3 min-w-0">
                      <TeacherAvatar teacher={teacher} />
                      <div className="min-w-0">
                        <p className="font-jakarta text-sm font-bold text-white truncate">
                          {teacher.firstName} {teacher.lastName}
                        </p>
                        <p className="flex items-center gap-1 font-manrope text-[11px] text-white/30 mt-0.5">
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          {teacher.city}, {teacher.state}
                        </p>
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="flex items-center">
                      <GenderBadge gender={teacher.gender} />
                    </div>

                    {/* Specialization */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <BookOpen className="h-3.5 w-3.5 text-white/20 shrink-0" />
                      <span className="font-manrope text-sm text-white/50 truncate">
                        {teacher.specialization ?? (
                          <span className="italic text-white/20">—</span>
                        )}
                      </span>
                    </div>

                    {/* Qualification */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <GraduationCap className="h-3.5 w-3.5 text-white/20 shrink-0" />
                      <span className="font-manrope text-sm text-white/50 truncate">
                        {teacher.qualification}
                      </span>
                    </div>

                    {/* Experience */}
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-white/20 shrink-0" />
                      <span className="font-manrope text-sm text-white/50">
                        {teacher.experience}{" "}
                        {teacher.experience === 1 ? t("year") : t("years")}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <StatusBadge status={teacher.employmentStatus} />
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center justify-end">
                      <ArrowRight className="h-4 w-4 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
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

        {filteredData && filteredData.data.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-4 flex items-center gap-3"
          >
            <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-4 py-2.5">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-manrope text-xs text-white/40">
                <span className="font-semibold text-white">
                  {filteredData.data.length}
                </span>{" "}
                {filteredData.data.length === 1
                  ? t("summaryTeacher")
                  : t("summaryTeachers")}
                {activeFilterCount > 0 ? ` ${t("summaryFiltered")}` : ""}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TeachersListPage;
