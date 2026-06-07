"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  Users,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  ArrowRight,
  Loader2,
  User,
  Search,
  GraduationCap,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Star,
} from "lucide-react";
import { useGetAllTeacherApplications } from "@/hooks/useTeacher";
import { useTranslations } from "@/hooks/useTranslations";
import { ApplicationStatus, Gender, TeacherApplicationListItem } from "@/types";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_TABS: { value: string; label: string; icon: React.ReactNode }[] = [
  {
    value: "ALL",
    label: "All",
    icon: <Users className="h-3.5 w-3.5" />,
  },
  {
    value: ApplicationStatus.PENDING,
    label: "Pending",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  {
    value: ApplicationStatus.SHORTLISTED,
    label: "Shortlisted",
    icon: <Star className="h-3.5 w-3.5" />,
  },
  {
    value: ApplicationStatus.SELECTED,
    label: "Selected",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
  },
  {
    value: ApplicationStatus.REJECTED,
    label: "Rejected",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
];

const STATUS_STYLES: Record<
  string,
  { border: string; bg: string; text: string; dot: string }
> = {
  PENDING: {
    border: "border-amber-500/20",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  SHORTLISTED: {
    border: "border-indigo-500/20",
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    dot: "bg-indigo-400",
  },
  SELECTED: {
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  REJECTED: {
    border: "border-red-500/20",
    bg: "bg-red-500/10",
    text: "text-red-400",
    dot: "bg-red-400",
  },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: ApplicationStatus }) => {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-manrope text-xs font-medium ${s.border} ${s.bg} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};

// ─── Gender Badge ─────────────────────────────────────────────────────────────
const GenderBadge = ({ gender }: { gender: Gender }) => (
  <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-manrope text-[11px] text-white/40">
    {gender.charAt(0) + gender.slice(1).toLowerCase()}
  </span>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
const TeacherApplicationsPage = () => {
  const t = useTranslations("teacherApplications");
  const router = useRouter();

  const [activeStatus, setActiveStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filter inputs (staging)
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [qualificationInput, setQualificationInput] = useState("");
  const [specializationInput, setSpecializationInput] = useState("");
  const [genderInput, setGenderInput] = useState("");

  // Applied filters (committed)
  const [appliedFilters, setAppliedFilters] = useState<{
    name?: string;
    email?: string;
    qualification?: string;
    specialization?: string;
    gender?: string;
  }>({});

  const { data, isLoading } = useGetAllTeacherApplications(
    page,
    10,
    activeStatus,
  );

  // Client-side filter on top of status filter from API
  const filteredData = data
    ? {
        ...data,
        data: data.data.filter((app) => {
          const fullName = `${app.firstName} ${app.lastName}`.toLowerCase();
          if (
            appliedFilters.name &&
            !fullName.includes(appliedFilters.name.toLowerCase())
          )
            return false;
          if (
            appliedFilters.email &&
            !app.email
              .toLowerCase()
              .includes(appliedFilters.email.toLowerCase())
          )
            return false;
          if (
            appliedFilters.qualification &&
            !app.qualification
              .toLowerCase()
              .includes(appliedFilters.qualification.toLowerCase())
          )
            return false;
          if (
            appliedFilters.specialization &&
            !app.specialization
              ?.toLowerCase()
              .includes(appliedFilters.specialization.toLowerCase())
          )
            return false;
          if (appliedFilters.gender && app.gender !== appliedFilters.gender)
            return false;
          return true;
        }),
      }
    : data;

  const activeFilterCount = Object.values(appliedFilters).filter(
    (v) => v !== undefined && v !== "",
  ).length;

  const applyFilters = () => {
    setAppliedFilters({
      name: nameInput || undefined,
      email: emailInput || undefined,
      qualification: qualificationInput || undefined,
      specialization: specializationInput || undefined,
      gender: genderInput || undefined,
    });
    setPage(1);
    setIsFiltersOpen(false);
  };

  const clearFilters = () => {
    setNameInput("");
    setEmailInput("");
    setQualificationInput("");
    setSpecializationInput("");
    setGenderInput("");
    setAppliedFilters({});
    setPage(1);
  };

  const handleStatusChange = (status: string) => {
    setActiveStatus(status);
    setPage(1);
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

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

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 sm:mb-10"
        >
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
                <h1 className="font-jakarta text-xl sm:text-2xl font-extrabold leading-tight text-white">
                  {t("pageTitle")}
                </h1>
                <p className="font-manrope text-xs sm:text-sm text-white/40 mt-0.5">
                  {t("pageSubtitle")}
                </p>
              </div>
            </div>
          </div>

          {/* Status tabs + filter button */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {/* Scrollable status tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleStatusChange(tab.value)}
                  className={`flex h-8 sm:h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 sm:px-3.5 font-manrope text-xs sm:text-sm font-medium transition-all duration-200 ${
                    activeStatus === tab.value
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "border border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <span
                    className={
                      activeStatus === tab.value
                        ? "text-white"
                        : "text-white/30"
                    }
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter toggle */}
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
          </div>
        </motion.div>

        {/* Filter panel */}
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
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent rounded-t-2xl" />
                <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {[
                    {
                      label: t("filterName"),
                      value: nameInput,
                      set: setNameInput,
                      icon: <User className="h-3.5 w-3.5" />,
                    },
                    {
                      label: t("filterEmail"),
                      value: emailInput,
                      set: setEmailInput,
                      icon: <Search className="h-3.5 w-3.5" />,
                    },
                    {
                      label: t("filterQualification"),
                      value: qualificationInput,
                      set: setQualificationInput,
                      icon: <GraduationCap className="h-3.5 w-3.5" />,
                    },
                    {
                      label: t("filterSpecialization"),
                      value: specializationInput,
                      set: setSpecializationInput,
                      icon: <Briefcase className="h-3.5 w-3.5" />,
                    },
                  ].map((field) => (
                    <div key={field.label} className="relative">
                      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400/60">
                        {field.icon}
                      </div>
                      <input
                        type="text"
                        placeholder={field.label}
                        value={field.value}
                        onChange={(e) => field.set(e.target.value)}
                        className="h-9 sm:h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 font-manrope text-xs sm:text-sm text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                      />
                    </div>
                  ))}

                  {/* Gender select */}
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
                        Male
                      </option>
                      <option value={Gender.FEMALE} className="bg-[#070c18]">
                        Female
                      </option>
                      <option value={Gender.OTHER} className="bg-[#070c18]">
                        Other
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

        {/* Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />

          {/* Desktop header */}
          <div className="hidden md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_0.5fr] gap-4 border-b border-white/8 px-6 py-3.5">
            {[
              t("colName"),
              t("colEmail"),
              t("colGender"),
              t("colQualification"),
              t("colSpecialization"),
              t("colStatus"),
              t("colAction"),
            ].map((h) => (
              <span
                key={h}
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
          ) : !filteredData?.data?.length ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 sm:py-20 px-4 text-center">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white/20" />
              </div>
              <div>
                <p className="font-jakarta text-sm font-semibold text-white/40">
                  {t("emptyTitle")}
                </p>
                <p className="mt-0.5 font-manrope text-xs text-white/20">
                  {t("emptySubtitle")}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/6">
              {filteredData.data.map(
                (app: TeacherApplicationListItem, i: number) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                    onClick={() =>
                      router.push(`/admin/teacher-applications/${app.id}`)
                    }
                    className="cursor-pointer transition-colors duration-150 hover:bg-white/3 group"
                  >
                    {/* Mobile row */}
                    <div className="flex md:hidden items-start justify-between gap-3 px-4 py-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 mt-0.5">
                          <User className="h-3.5 w-3.5 text-indigo-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-jakarta text-sm font-bold text-white truncate">
                            {app.firstName} {app.lastName}
                          </p>
                          <p className="font-manrope text-xs text-white/40 truncate mt-0.5">
                            {app.email}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <StatusBadge status={app.status} />
                            <GenderBadge gender={app.gender} />
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                            {app.qualification && (
                              <span className="flex items-center gap-1 font-manrope text-[11px] text-white/40">
                                <GraduationCap className="h-3 w-3 shrink-0" />
                                {app.qualification}
                              </span>
                            )}
                            {app.specialization && (
                              <span className="flex items-center gap-1 font-manrope text-[11px] text-white/40">
                                <Briefcase className="h-3 w-3 shrink-0" />
                                {app.specialization}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 font-manrope text-[11px] text-white/25">
                            {t("applied")} {formatDate(app.appliedAt)}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 mt-1 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                    </div>

                    {/* Desktop row */}
                    <div className="hidden md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_0.5fr] gap-4 px-6 py-4 items-center">
                      {/* Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                          <User className="h-3.5 w-3.5 text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-jakarta text-sm font-bold text-white truncate">
                            {app.firstName} {app.lastName}
                          </p>
                          <p className="font-manrope text-[11px] text-white/30 truncate mt-0.5">
                            {t("applied")} {formatDate(app.appliedAt)}
                          </p>
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex items-center min-w-0">
                        <span className="font-manrope text-sm text-white/50 truncate">
                          {app.email}
                        </span>
                      </div>

                      {/* Gender */}
                      <div className="flex items-center">
                        <GenderBadge gender={app.gender} />
                      </div>

                      {/* Qualification */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <GraduationCap className="h-3.5 w-3.5 text-white/20 shrink-0" />
                        <span className="font-manrope text-sm text-white/50 truncate">
                          {app.qualification}
                        </span>
                      </div>

                      {/* Specialization */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Briefcase className="h-3.5 w-3.5 text-white/20 shrink-0" />
                        <span className="font-manrope text-sm text-white/50 truncate">
                          {app.specialization ?? "—"}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="flex items-center">
                        <StatusBadge status={app.status} />
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center justify-end">
                        <ArrowRight className="h-4 w-4 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                      </div>
                    </div>
                  </motion.div>
                ),
              )}
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/8 px-4 sm:px-6 py-3 sm:py-4">
              <span className="font-manrope text-xs text-white/30">
                {`${t("page")} ${data.page} ${t("of")} ${data.totalPages} · ${data.total} ${t("total")}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70 disabled:opacity-30"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(data.totalPages, p + 1))
                  }
                  disabled={page === data.totalPages}
                  className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70 disabled:opacity-30"
                >
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherApplicationsPage;
