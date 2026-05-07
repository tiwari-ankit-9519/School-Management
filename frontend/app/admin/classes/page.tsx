"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  BookOpen,
  Users,
  DoorOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  UserCheck,
  X,
  ChevronDown,
  ArrowRight,
  Loader2,
  GraduationCap,
} from "lucide-react";
import { useGetAllClasses } from "@/hooks/useClass";
import { useGetAllAcademicYears } from "@/hooks/useAcademicYear";
import { useTranslations } from "@/hooks/useTranslations";

const ClassesPage = () => {
  const t = useTranslations("classes");
  const router = useRouter();

  const { data: academicYearsData, isLoading: isAcademicYearsLoading } =
    useGetAllAcademicYears();

  const currentYear = academicYearsData?.data?.find((y) => y.isCurrent);

  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<
    string | null
  >(null);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [nameInput, setNameInput] = useState("");
  const [sectionInput, setSectionInput] = useState("");
  const [roomNumberInput, setRoomNumberInput] = useState("");
  const [teacherIdInput, setTeacherIdInput] = useState("");
  const [capacityMinInput, setCapacityMinInput] = useState("");
  const [capacityMaxInput, setCapacityMaxInput] = useState("");

  const [appliedFilters, setAppliedFilters] = useState<{
    name?: string;
    section?: string;
    roomNumber?: string;
    teacherId?: string;
    capacityMin?: number;
    capacityMax?: number;
  }>({});

  const activeYearId =
    selectedAcademicYearId ??
    currentYear?.id ??
    academicYearsData?.data?.[0]?.id ??
    "";

  const { data, isLoading } = useGetAllClasses(
    { academicYearId: activeYearId, ...appliedFilters },
    page,
    10,
  );

  const selectedYearName =
    academicYearsData?.data?.find((y) => y.id === activeYearId)?.name ?? "";

  const applyFilters = () => {
    setAppliedFilters({
      name: nameInput || undefined,
      section: sectionInput || undefined,
      roomNumber: roomNumberInput || undefined,
      teacherId: teacherIdInput || undefined,
      capacityMin: capacityMinInput ? parseInt(capacityMinInput) : undefined,
      capacityMax: capacityMaxInput ? parseInt(capacityMaxInput) : undefined,
    });
    setPage(1);
    setIsFiltersOpen(false);
  };

  const clearFilters = () => {
    setNameInput("");
    setSectionInput("");
    setRoomNumberInput("");
    setTeacherIdInput("");
    setCapacityMinInput("");
    setCapacityMaxInput("");
    setAppliedFilters({});
    setPage(1);
  };

  const activeFilterCount = Object.values(appliedFilters).filter(
    (v) => v !== undefined,
  ).length;

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
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
          className="mb-5 sm:mb-8"
        >
          {/* Title row */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/20">
              <Image
                src="/logo.png"
                alt="EduSphere Logo"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-jakarta text-lg sm:text-2xl font-extrabold leading-tight text-white truncate">
                {t("pageTitle")}
              </h1>
              <p className="font-manrope text-[11px] sm:text-sm text-white/40 mt-0.5 truncate">
                {t("pageSubtitle")}
              </p>
            </div>
          </div>

          {/* Controls row */}
          <div className="mt-3 flex items-center gap-2">
            {/* Year picker */}
            <div className="relative shrink-0">
              <button
                onClick={() => setIsYearDropdownOpen((p) => !p)}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 font-manrope text-xs text-white/70 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:text-white"
              >
                {isAcademicYearsLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-indigo-400 shrink-0" />
                ) : (
                  <GraduationCap className="h-3 w-3 text-indigo-400 shrink-0" />
                )}
                <span className="max-w-20 sm:max-w-30 truncate">
                  {selectedYearName || t("selectYear")}
                </span>
                <ChevronDown
                  className={`h-3 w-3 shrink-0 text-white/30 transition-transform duration-200 ${isYearDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isYearDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-11 z-30 min-w-40 overflow-hidden rounded-xl border border-white/10 bg-[#0d1424] shadow-2xl shadow-black/50 backdrop-blur-xl"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
                    {academicYearsData?.data?.map((year) => (
                      <button
                        key={year.id}
                        onClick={() => {
                          setSelectedAcademicYearId(year.id);
                          setIsYearDropdownOpen(false);
                          setPage(1);
                        }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 font-manrope text-sm transition-colors duration-150 ${
                          year.id === activeYearId
                            ? "bg-indigo-500/15 text-indigo-300"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span>{year.name}</span>
                        {year.isCurrent && (
                          <span className="ml-2 rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-manrope text-[10px] font-medium text-emerald-400">
                            {t("current")}
                          </span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Filters button */}
            <button
              onClick={() => setIsFiltersOpen((p) => !p)}
              className={`relative flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3 font-manrope text-xs backdrop-blur-sm transition-all duration-200 ${
                isFiltersOpen || activeFilterCount > 0
                  ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="h-3 w-3 shrink-0" />
              <span>{t("filters")}</span>
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 font-jakarta text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </motion.div>

        {/* Filter Panel */}
        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mb-4 overflow-hidden"
            >
              <div className="relative rounded-2xl border border-white/10 bg-white/4 p-4 backdrop-blur-xl">
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent rounded-t-2xl" />

                {/* Filter inputs: 1-col on xs, 2-col on sm, 3-col on lg */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      label: t("filterName"),
                      value: nameInput,
                      set: setNameInput,
                      icon: <BookOpen className="h-3.5 w-3.5" />,
                    },
                    {
                      label: t("filterSection"),
                      value: sectionInput,
                      set: setSectionInput,
                      icon: <Search className="h-3.5 w-3.5" />,
                    },
                    {
                      label: t("filterRoom"),
                      value: roomNumberInput,
                      set: setRoomNumberInput,
                      icon: <DoorOpen className="h-3.5 w-3.5" />,
                    },
                    {
                      label: t("filterTeacherId"),
                      value: teacherIdInput,
                      set: setTeacherIdInput,
                      icon: <UserCheck className="h-3.5 w-3.5" />,
                    },
                    {
                      label: t("filterCapMin"),
                      value: capacityMinInput,
                      set: setCapacityMinInput,
                      icon: <Users className="h-3.5 w-3.5" />,
                      type: "number",
                    },
                    {
                      label: t("filterCapMax"),
                      value: capacityMaxInput,
                      set: setCapacityMaxInput,
                      icon: <Users className="h-3.5 w-3.5" />,
                      type: "number",
                    },
                  ].map((field) => (
                    <div key={field.label} className="relative">
                      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400/60">
                        {field.icon}
                      </div>
                      <input
                        type={field.type ?? "text"}
                        placeholder={field.label}
                        value={field.value}
                        onChange={(e) => field.set(e.target.value)}
                        className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 font-manrope text-sm text-white placeholder:text-white/25 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-end gap-2">
                  {activeFilterCount > 0 && (
                    <button
                      onClick={clearFilters}
                      className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 font-manrope text-xs text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
                    >
                      <X className="h-3 w-3" />
                      {t("clearFilters")}
                    </button>
                  )}
                  <button
                    onClick={applyFilters}
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-4 font-jakarta text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:bg-indigo-500"
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
          <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_0.5fr] gap-4 border-b border-white/8 px-6 py-3.5">
            {[
              "colName",
              "colSection",
              "colRoom",
              "colCapacity",
              "colTeacher",
              "colAction",
            ].map((h) => (
              <span
                key={h}
                className="font-manrope text-[10px] font-medium uppercase tracking-widest text-white/30"
              >
                {t(h as Parameters<typeof t>[0])}
              </span>
            ))}
          </div>

          {/* States */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
                <span className="font-manrope text-sm text-white/30">
                  {t("loading")}
                </span>
              </div>
            </div>
          ) : !activeYearId ? (
            <EmptyState
              icon={<GraduationCap className="h-5 w-5 text-white/20" />}
              title={t("noYearTitle")}
              subtitle={t("noYearSubtitle")}
            />
          ) : !data?.data?.length ? (
            <EmptyState
              icon={<BookOpen className="h-5 w-5 text-white/20" />}
              title={t("emptyTitle")}
              subtitle={t("emptySubtitle")}
            />
          ) : (
            <div className="divide-y divide-white/6">
              {data.data.map((cls, i) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  onClick={() => router.push(`/admin/classes/${cls.id}`)}
                  className="cursor-pointer transition-colors duration-150 hover:bg-white/3 group"
                >
                  {/* ── Mobile card (< md) ── */}
                  <div className="flex md:hidden items-center gap-3 px-4 py-3.5">
                    {/* Icon */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Row 1: name + arrow */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-jakarta text-sm font-bold text-white truncate">
                          {cls.name}
                        </p>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                      </div>

                      {/* Row 2: meta chips */}
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        {cls.section && (
                          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-manrope text-[10px] text-white/50 leading-none">
                            {cls.section}
                          </span>
                        )}
                        {cls.roomNumber && (
                          <span className="flex items-center gap-1 font-manrope text-[10px] text-white/40 leading-none">
                            <DoorOpen className="h-2.5 w-2.5 shrink-0" />
                            {cls.roomNumber}
                          </span>
                        )}
                        {cls.capacity && (
                          <span className="flex items-center gap-1 font-manrope text-[10px] text-white/40 leading-none">
                            <Users className="h-2.5 w-2.5 shrink-0" />
                            {cls.capacity}
                          </span>
                        )}
                        {/* Teacher badge inline with chips */}
                        {cls.classTeacher?.length > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-manrope text-[10px] font-medium text-emerald-400 leading-none">
                            <UserCheck className="h-2.5 w-2.5 shrink-0" />
                            {t("assigned")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-manrope text-[10px] font-medium text-white/30 leading-none">
                            <UserCheck className="h-2.5 w-2.5 shrink-0" />
                            {t("unassigned")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Desktop row (≥ md) ── */}
                  <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_0.5fr] gap-4 px-6 py-4 items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                        <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                      </div>
                      <span className="font-jakarta text-sm font-bold text-white truncate">
                        {cls.name}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-manrope text-xs text-white/60">
                        {cls.section ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <DoorOpen className="h-3.5 w-3.5 text-white/20 shrink-0" />
                      <span className="font-manrope text-sm text-white/50 truncate">
                        {cls.roomNumber ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-white/20 shrink-0" />
                      <span className="font-manrope text-sm text-white/50">
                        {cls.capacity ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      {cls.classTeacher?.length > 0 ? (
                        <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-manrope text-xs font-medium text-emerald-400">
                          <UserCheck className="h-3 w-3 shrink-0" />
                          {t("assigned")}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-manrope text-xs font-medium text-white/30">
                          <UserCheck className="h-3 w-3 shrink-0" />
                          {t("unassigned")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-end">
                      <ArrowRight className="h-4 w-4 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/8 px-4 py-3 sm:px-6 sm:py-4">
              <span className="font-manrope text-[11px] sm:text-xs text-white/30">
                {`${t("page")} ${data.page} ${t("of")} ${data.totalPages} · ${data.total} ${t("total")}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(data.totalPages, p + 1))
                  }
                  disabled={page === data.totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const EmptyState = ({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) => (
  <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
      {icon}
    </div>
    <div>
      <p className="font-jakarta text-sm font-semibold text-white/40">
        {title}
      </p>
      <p className="mt-0.5 font-manrope text-xs text-white/20">{subtitle}</p>
    </div>
  </div>
);

export default ClassesPage;
