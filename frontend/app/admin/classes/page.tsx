"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Plus,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedInput from "@/components/smoothui/animated-input";
import { useGetAllClasses, useCreateClass } from "@/hooks/useClass";
import { useGetAllAcademicYears } from "@/hooks/useAcademicYear";
import { useTranslations } from "@/hooks/useTranslations";
import { CreateClassInput } from "@/types";

const createClassSchema = z.object({
  name: z
    .string({ error: "Class name is required" })
    .trim()
    .min(1, { error: "Class name is required" })
    .max(50, { error: "Class name must be at most 50 characters" }),
  section: z
    .string({ error: "Section is required" })
    .trim()
    .min(1, { error: "Section is required" })
    .max(10, { error: "Section must be at most 10 characters" }),
  capacity: z
    .string({ error: "Capacity is required" })
    .min(1, { error: "Capacity is required" })
    .regex(/^\d+$/, { error: "Capacity must be a number" }),
  roomNumber: z.string().trim().optional(),
});

type CreateClassFormValues = z.infer<typeof createClassSchema>;

const inputClass =
  "h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50";
const labelClass = "text-white/40";

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  const { mutate: createClass, isPending: isCreating } = useCreateClass();

  const {
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateClassFormValues>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      name: "",
      section: "",
      capacity: "",
      roomNumber: "",
    },
  });

  const nameValue = useWatch({ control, name: "name" });
  const sectionValue = useWatch({ control, name: "section" });
  const capacityValue = useWatch({ control, name: "capacity" });
  const roomNumberValue = useWatch({ control, name: "roomNumber" });

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

  const handleCloseModal = () => {
    reset();
    setIsCreateModalOpen(false);
  };

  const onSubmit = (data: CreateClassFormValues) => {
    createClass(data as CreateClassInput, {
      onSuccess: () => handleCloseModal(),
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-3 py-6 sm:px-8 sm:py-10">
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
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex h-9 sm:h-10 shrink-0 items-center gap-1.5 rounded-xl border-0 bg-indigo-600 px-3 sm:px-4 font-jakarta text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("newClassBtn")}</span>
              <span className="sm:hidden">{t("newClassBtnShort")}</span>
            </Button>
          </div>

          {/* Controls row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setIsYearDropdownOpen((p) => !p)}
                className="flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-xl border border-white/10 bg-white/5 px-3 sm:px-4 font-manrope text-xs sm:text-sm text-white/70 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:text-white"
              >
                {isAcademicYearsLoading ? (
                  <Loader2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 animate-spin text-indigo-400" />
                ) : (
                  <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-400" />
                )}
                <span className="max-w-22.5 sm:max-w-none truncate">
                  {selectedYearName || t("selectYear")}
                </span>
                <ChevronDown
                  className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-white/30 transition-transform duration-200 ${isYearDropdownOpen ? "rotate-180" : ""}`}
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

            <button
              onClick={() => setIsFiltersOpen((p) => !p)}
              className={`relative flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-xl border px-3 sm:px-4 font-manrope text-xs sm:text-sm backdrop-blur-sm transition-all duration-200 ${
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

        {/* Filter Panel */}
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
                <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
                        className="h-9 sm:h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 font-manrope text-xs sm:text-sm text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors"
                      />
                    </div>
                  ))}
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
                className="font-manrope text-xs font-medium uppercase tracking-widest text-white/30"
              >
                {t(h as Parameters<typeof t>[0])}
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
          ) : !activeYearId ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 sm:py-20 px-4 text-center">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-white/20" />
              </div>
              <div>
                <p className="font-jakarta text-sm font-semibold text-white/40">
                  {t("noYearTitle")}
                </p>
                <p className="mt-0.5 font-manrope text-xs text-white/20">
                  {t("noYearSubtitle")}
                </p>
              </div>
            </div>
          ) : !data?.data?.length ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 sm:py-20 px-4 text-center">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white/20" />
              </div>
              <div>
                <p className="font-jakarta text-sm font-semibold text-white/40">
                  {t("emptyTitle")}
                </p>
                <p className="mt-0.5 font-manrope text-xs text-white/20">
                  {t("emptySubtitle")}
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 font-manrope text-xs font-medium text-indigo-400 transition-colors hover:bg-indigo-500/15"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("newClassBtn")}
              </button>
            </div>
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
                  {/* Mobile card */}
                  <div className="flex md:hidden items-start justify-between gap-3 px-4 py-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 mt-0.5">
                        <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-jakarta text-sm font-bold text-white truncate">
                          {cls.name}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {cls.section && (
                            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-manrope text-[11px] text-white/50">
                              {cls.section}
                            </span>
                          )}
                          {cls.roomNumber && (
                            <span className="flex items-center gap-1 font-manrope text-[11px] text-white/40">
                              <DoorOpen className="h-3 w-3 shrink-0" />
                              {cls.roomNumber}
                            </span>
                          )}
                          {cls.capacity && (
                            <span className="flex items-center gap-1 font-manrope text-[11px] text-white/40">
                              <Users className="h-3 w-3 shrink-0" />
                              {cls.capacity}
                            </span>
                          )}
                        </div>
                        <div className="mt-2">
                          {cls.classTeacher?.length > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-manrope text-[11px] font-medium text-emerald-400">
                              <UserCheck className="h-2.5 w-2.5" />
                              {t("assigned")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-manrope text-[11px] font-medium text-white/30">
                              <UserCheck className="h-2.5 w-2.5" />
                              {t("unassigned")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 mt-1 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                  </div>

                  {/* Desktop row */}
                  <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_0.5fr] gap-4 px-6 py-4">
                    <div className="flex items-center gap-3">
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
                    <div className="flex items-center gap-1.5">
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
                          <UserCheck className="h-3 w-3" />
                          {t("assigned")}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-manrope text-xs font-medium text-white/30">
                          <UserCheck className="h-3 w-3" />
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

      {/* Create Class Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            <motion.div
              key="modal"
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

                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/20">
                      <BookOpen className="h-5 w-5 text-indigo-400" />
                    </div>
                    <h2 className="font-jakarta text-xl font-extrabold text-white">
                      {t("modalTitle")}
                    </h2>
                    <p className="mt-0.5 font-manrope text-sm text-white/40">
                      {t("modalSubtitle")}
                    </p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <AnimatedInput
                        label={t("fieldName")}
                        icon={<BookOpen className="h-4 w-4 text-indigo-400" />}
                        value={nameValue}
                        onChange={(v) =>
                          setValue("name", v, { shouldValidate: true })
                        }
                        inputClassName={inputClass}
                        labelClassName={labelClass}
                      />
                      {errors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="ml-1 font-manrope text-xs text-red-400"
                        >
                          {errors.name.message}
                        </motion.p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <AnimatedInput
                        label={t("fieldSection")}
                        icon={<Hash className="h-4 w-4 text-indigo-400" />}
                        value={sectionValue}
                        onChange={(v) =>
                          setValue("section", v, { shouldValidate: true })
                        }
                        inputClassName={inputClass}
                        labelClassName={labelClass}
                      />
                      {errors.section && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="ml-1 font-manrope text-xs text-red-400"
                        >
                          {errors.section.message}
                        </motion.p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <AnimatedInput
                        label={t("fieldCapacity")}
                        icon={<Users className="h-4 w-4 text-indigo-400" />}
                        type="number"
                        value={capacityValue}
                        onChange={(v) =>
                          setValue("capacity", v, { shouldValidate: true })
                        }
                        inputClassName={inputClass}
                        labelClassName={labelClass}
                      />
                      {errors.capacity && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="ml-1 font-manrope text-xs text-red-400"
                        >
                          {errors.capacity.message}
                        </motion.p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <AnimatedInput
                        label={t("fieldRoom")}
                        icon={<DoorOpen className="h-4 w-4 text-indigo-400" />}
                        value={roomNumberValue ?? ""}
                        onChange={(v) =>
                          setValue("roomNumber", v, { shouldValidate: true })
                        }
                        inputClassName={inputClass}
                        labelClassName={labelClass}
                      />
                      {errors.roomNumber && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="ml-1 font-manrope text-xs text-red-400"
                        >
                          {errors.roomNumber.message}
                        </motion.p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Button
                      type="button"
                      onClick={handleCloseModal}
                      className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 font-jakarta text-sm font-bold text-white/60 hover:bg-white/8 hover:text-white transition-all duration-200"
                    >
                      {t("cancelBtn")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isCreating}
                      className="h-12 flex-1 rounded-xl border-0 bg-indigo-600 font-jakarta text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/30 disabled:opacity-70"
                    >
                      {isCreating ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t("creating")}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          {t("createBtn")}
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClassesPage;
