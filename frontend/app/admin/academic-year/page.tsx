"use client";
import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  Plus,
  X,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  ChevronDown,
} from "lucide-react";
import AnimatedInput from "@/components/smoothui/animated-input";
import Image from "next/image";
import {
  useGetAllAcademicYears,
  useCreateAcademicYear,
} from "@/hooks/useAcademicYear";
import { useTranslations } from "@/hooks/useTranslations";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format, parseISO } from "date-fns";

export const academicYearSchema = z
  .object({
    name: z
      .string()
      .min(3, { error: "Name should be of atleast 3 characters" })
      .max(10, { error: "Name should be of max 10 characters" })
      .regex(/^\d{4}-\d{2,4}$/, {
        error: "Name should be in format 2024-25 or 2024-2025",
      })
      .trim(),
    startDate: z.string({ message: "Start date is required" }),
    endDate: z.string({ message: "End date is required" }),
    isCurrent: z.boolean(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    error: "End date must be after start date",
    path: ["endDate"],
  });

type AcademicYearFormValue = z.infer<typeof academicYearSchema>;

const AcademicYearPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlIsCurrent = searchParams.get("isCurrent");
  const urlName = searchParams.get("name") ?? undefined;
  const urlPage = parseInt(searchParams.get("page") ?? "1");

  const isCurrent =
    urlIsCurrent === "true"
      ? true
      : urlIsCurrent === "false"
        ? false
        : undefined;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nameDropdownOpen, setNameDropdownOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const { data: allData } = useGetAllAcademicYears(
    undefined,
    undefined,
    1,
    100,
  );
  const allNames = Array.from(new Set(allData?.data?.map((y) => y.name) ?? []));

  const { data, isLoading } = useGetAllAcademicYears(
    isCurrent,
    urlName,
    urlPage,
    10,
  );

  const { mutate: createAcademicYear, isPending } = useCreateAcademicYear();

  const {
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    reset,
  } = useForm<AcademicYearFormValue>({
    resolver: zodResolver(academicYearSchema),
    defaultValues: {
      name: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
    },
  });

  const t = useTranslations("academicYear");

  const nameValue = useWatch({ control, name: "name" });
  const startDateValue = useWatch({ control, name: "startDate" });
  const endDateValue = useWatch({ control, name: "endDate" });

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    if (!("page" in updates)) params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleIsCurrentChange = (value: boolean | undefined) => {
    updateParams({
      isCurrent: value === undefined ? undefined : String(value),
    });
  };

  const handleNameChange = (name: string | undefined) => {
    updateParams({ name });
    setNameDropdownOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: String(newPage) });
  };

  const onSubmit = (formData: AcademicYearFormValue) => {
    createAcademicYear(formData, {
      onSuccess: () => {
        reset();
        setIsModalOpen(false);
      },
    });
  };

  const handleClose = () => {
    reset();
    setIsModalOpen(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const toDateObj = (str: string): Date | undefined => {
    if (!str) return undefined;
    const d = new Date(str);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const toISODateString = (date: Date): string => {
    return format(date, "yyyy-MM-dd");
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-4 py-10 sm:px-8">
      <div
        className="pointer-events-none fixed inset-0 select-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, #1e3a5f18 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, #6366f10a 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/20">
              <Image
                src="/logo.png"
                alt="EduSphere Logo"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="font-jakarta text-2xl font-extrabold leading-tight text-white">
                {t("pageTitle")}
              </h1>
              <p className="font-manrope text-sm text-white/40">
                {t("pageSubtitle")}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="group flex h-11 items-center gap-2 rounded-xl border-0 bg-indigo-600 px-5 font-jakarta text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/30"
          >
            <Plus className="h-4 w-4" />
            {t("newYearBtn")}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 flex flex-wrap items-center gap-3"
        >
          <div className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/4 p-1 backdrop-blur-sm">
            {[
              { label: t("filterAll"), value: undefined },
              { label: t("filterCurrent"), value: true },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => handleIsCurrentChange(opt.value)}
                className={`rounded-lg px-4 py-1.5 font-manrope text-xs font-medium transition-all duration-200 ${
                  isCurrent === opt.value
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setNameDropdownOpen((v) => !v)}
              className={`flex h-8 items-center gap-2 rounded-xl border px-3 font-manrope text-xs font-medium transition-all duration-200 backdrop-blur-sm ${
                urlName
                  ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                  : "border-white/8 bg-white/4 text-white/40 hover:text-white/70"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              {urlName ?? t("filterByName")}
              {urlName && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNameChange(undefined);
                  }}
                  className="ml-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-500/30 text-indigo-300 hover:bg-indigo-500/50"
                >
                  <X className="h-2.5 w-2.5" />
                </span>
              )}
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${nameDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {nameDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-10 z-30 min-w-45 overflow-hidden rounded-xl border border-white/10 bg-[#0d1525] shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
                >
                  {allNames.length === 0 ? (
                    <div className="px-4 py-3 font-manrope text-xs text-white/30">
                      {t("noNamesAvailable")}
                    </div>
                  ) : (
                    <div className="py-1">
                      {allNames.map((name) => (
                        <button
                          key={name}
                          onClick={() => handleNameChange(name)}
                          className={`flex w-full items-center gap-2 px-4 py-2.5 font-manrope text-xs transition-colors duration-150 ${
                            urlName === name
                              ? "bg-indigo-500/15 text-indigo-300"
                              : "text-white/60 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {urlName === name && (
                            <CheckCircle2 className="h-3 w-3 text-indigo-400" />
                          )}
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {(isCurrent !== undefined || urlName) && (
            <button
              onClick={() => router.push(pathname)}
              className="font-manrope text-xs text-white/30 underline-offset-2 hover:text-white/60 hover:underline transition-colors"
            >
              {t("clearFilters")}
            </button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />

          <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] gap-4 border-b border-white/8 px-6 py-3.5">
            {(
              ["colName", "colStartDate", "colEndDate", "colStatus"] as const
            ).map((h) => (
              <span
                key={h}
                className="font-manrope text-xs font-medium uppercase tracking-widest text-white/30"
              >
                {t(h)}
              </span>
            ))}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
                <span className="font-manrope text-sm text-white/30">
                  {t("loading")}
                </span>
              </div>
            </div>
          ) : !data?.data?.length ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <GraduationCap className="h-6 w-6 text-white/20" />
              </div>
              <div className="text-center">
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
              {data.data.map((year, i) => (
                <motion.div
                  key={year.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr] gap-4 px-6 py-4 transition-colors duration-150 hover:bg-white/3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                      <CalendarIcon className="h-3.5 w-3.5 text-indigo-400" />
                    </div>
                    <span className="font-jakarta text-sm font-bold text-white">
                      {year.name}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-manrope text-sm text-white/50">
                      {formatDate(year.startDate)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-manrope text-sm text-white/50">
                      {formatDate(year.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {year.isCurrent ? (
                      <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-manrope text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        {t("statusCurrent")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-manrope text-xs font-medium text-white/30">
                        <Clock className="h-3 w-3" />
                        {t("statusPrevious")}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/8 px-6 py-4">
              <span className="font-manrope text-xs text-white/30">
                {t("paginationInfo")} {data.page} / {data.totalPages} ·{" "}
                {data.total} {t("total")}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(urlPage - 1)}
                  disabled={urlPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePageChange(urlPage + 1)}
                  disabled={urlPage === data.totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={handleClose}
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#070c18] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_32px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl">
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                  <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
                </div>
                <div className="mb-7 flex items-start justify-between">
                  <div>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/20">
                      <GraduationCap className="h-5 w-5 text-indigo-400" />
                    </div>
                    <h2 className="font-jakarta text-xl font-extrabold text-white">
                      {t("modalTitle")}
                    </h2>
                    <p className="mt-0.5 font-manrope text-sm text-white/40">
                      {t("modalSubtitle")}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <AnimatedInput
                      label={t("fieldName")}
                      icon={
                        <GraduationCap className="h-4 w-4 text-indigo-400" />
                      }
                      value={nameValue}
                      onChange={(val) =>
                        setValue("name", val, { shouldValidate: true })
                      }
                      inputClassName="h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50"
                      labelClassName="text-white/40"
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

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="font-manrope text-xs text-white/40">
                        {t("fieldStartDate")}
                      </label>
                      <Popover
                        open={startDateOpen}
                        onOpenChange={setStartDateOpen}
                      >
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={`flex h-12 w-full items-center gap-3 rounded-xl border px-4 font-manrope text-sm transition-all duration-200 ${
                              startDateOpen
                                ? "border-indigo-500/50 bg-white/5 text-white"
                                : startDateValue
                                  ? "border-white/10 bg-white/5 text-white"
                                  : "border-white/10 bg-white/5 text-white/30"
                            }`}
                          >
                            <CalendarIcon className="h-4 w-4 shrink-0 text-indigo-400" />
                            <span>
                              {startDateValue
                                ? format(
                                    parseISO(startDateValue),
                                    "dd MMM yyyy",
                                  )
                                : t("fieldStartDate")}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 border border-white/10 bg-[#0d1525] shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl rounded-xl"
                          align="start"
                          sideOffset={6}
                        >
                          <Calendar
                            mode="single"
                            selected={toDateObj(startDateValue)}
                            onSelect={(date) => {
                              if (date) {
                                setValue("startDate", toISODateString(date), {
                                  shouldValidate: true,
                                });
                                setStartDateOpen(false);
                              }
                            }}
                            classNames={{
                              months: "flex flex-col",
                              month: "space-y-3 p-3",
                              month_caption:
                                "flex justify-center pt-1 relative items-center px-8",
                              caption_label:
                                "font-jakarta text-sm font-semibold text-white",
                              nav: "flex items-center justify-between absolute inset-x-1 top-1",
                              button_previous:
                                "h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors",
                              button_next:
                                "h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors",
                              month_grid: "w-full border-collapse",
                              weekdays: "flex",
                              weekday:
                                "text-white/30 rounded-md w-8 font-manrope font-medium text-[0.7rem] text-center",
                              week: "flex w-full mt-1",
                              day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                              day_button:
                                "h-8 w-8 p-0 font-manrope text-xs font-normal text-white/60 rounded-lg hover:bg-indigo-500/20 hover:text-white transition-colors aria-selected:opacity-100",
                              selected:
                                "bg-indigo-600 text-white hover:bg-indigo-500 hover:text-white font-semibold rounded-lg [&>button]:bg-indigo-600 [&>button]:text-white [&>button]:hover:bg-indigo-500",
                              today:
                                "[&>button]:border [&>button]:border-indigo-500/40 [&>button]:text-indigo-300",
                              outside: "opacity-50 [&>button]:text-white/20",
                              disabled: "opacity-30 [&>button]:text-white/10",
                              hidden: "invisible",
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.startDate && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="ml-1 font-manrope text-xs text-red-400"
                        >
                          {errors.startDate.message}
                        </motion.p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-manrope text-xs text-white/40">
                        {t("fieldEndDate")}
                      </label>
                      <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={`flex h-12 w-full items-center gap-3 rounded-xl border px-4 font-manrope text-sm transition-all duration-200 ${
                              endDateOpen
                                ? "border-indigo-500/50 bg-white/5 text-white"
                                : endDateValue
                                  ? "border-white/10 bg-white/5 text-white"
                                  : "border-white/10 bg-white/5 text-white/30"
                            }`}
                          >
                            <CalendarIcon className="h-4 w-4 shrink-0 text-indigo-400" />
                            <span>
                              {endDateValue
                                ? format(parseISO(endDateValue), "dd MMM yyyy")
                                : t("fieldEndDate")}
                            </span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 border border-white/10 bg-[#0d1525] shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl rounded-xl"
                          align="start"
                          sideOffset={6}
                        >
                          <Calendar
                            mode="single"
                            selected={toDateObj(endDateValue)}
                            onSelect={(date) => {
                              if (date) {
                                setValue("endDate", toISODateString(date), {
                                  shouldValidate: true,
                                });
                                setEndDateOpen(false);
                              }
                            }}
                            disabled={(date) =>
                              startDateValue
                                ? date <= new Date(startDateValue)
                                : false
                            }
                            classNames={{
                              months: "flex flex-col",
                              month: "space-y-3 p-3",
                              month_caption:
                                "flex justify-center pt-1 relative items-center px-8",
                              caption_label:
                                "font-jakarta text-sm font-semibold text-white",
                              nav: "flex items-center justify-between absolute inset-x-1 top-1",
                              button_previous:
                                "h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors",
                              button_next:
                                "h-7 w-7 flex items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors",
                              month_grid: "w-full border-collapse",
                              weekdays: "flex",
                              weekday:
                                "text-white/30 rounded-md w-8 font-manrope font-medium text-[0.7rem] text-center",
                              week: "flex w-full mt-1",
                              day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                              day_button:
                                "h-8 w-8 p-0 font-manrope text-xs font-normal text-white/60 rounded-lg hover:bg-indigo-500/20 hover:text-white transition-colors aria-selected:opacity-100",
                              selected:
                                "bg-indigo-600 text-white hover:bg-indigo-500 hover:text-white font-semibold rounded-lg [&>button]:bg-indigo-600 [&>button]:text-white [&>button]:hover:bg-indigo-500",
                              today:
                                "[&>button]:border [&>button]:border-indigo-500/40 [&>button]:text-indigo-300",
                              outside: "opacity-50 [&>button]:text-white/20",
                              disabled: "opacity-30 [&>button]:text-white/10",
                              hidden: "invisible",
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.endDate && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="ml-1 font-manrope text-xs text-red-400"
                        >
                          {errors.endDate.message}
                        </motion.p>
                      )}
                    </div>
                  </div>

                  <Controller
                    control={control}
                    name="isCurrent"
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 transition-all duration-200 ${
                          field.value
                            ? "border-indigo-500/30 bg-indigo-500/10"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2
                            className={`h-4 w-4 ${field.value ? "text-indigo-400" : "text-white/20"}`}
                          />
                          <div className="text-left">
                            <p className="font-jakarta text-sm font-semibold text-white">
                              {t("toggleCurrentLabel")}
                            </p>
                            <p className="font-manrope text-xs text-white/30">
                              {t("toggleCurrentSub")}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`relative h-5 w-9 rounded-full border transition-all duration-200 ${
                            field.value
                              ? "border-indigo-500/50 bg-indigo-500/30"
                              : "border-white/20 bg-white/10"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 h-4 w-4 rounded-full transition-all duration-200 ${
                              field.value
                                ? "left-[calc(100%-18px)] bg-indigo-400"
                                : "left-0.5 bg-white/30"
                            }`}
                          />
                        </div>
                      </button>
                    )}
                  />
                  <div className="flex gap-3 pt-1">
                    <Button
                      type="button"
                      onClick={handleClose}
                      className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 font-jakarta text-sm font-bold text-white/60 transition-all duration-200 hover:bg-white/8 hover:text-white"
                    >
                      {t("cancelBtn")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="h-12 flex-1 rounded-xl border-0 bg-indigo-600 font-jakarta text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/30 disabled:opacity-70"
                    >
                      {isPending ? (
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

export default AcademicYearPage;
