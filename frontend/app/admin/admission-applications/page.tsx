"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Users,
  GraduationCap,
  CalendarDays,
} from "lucide-react";
import { useGetAllAdmissionApplications } from "@/hooks/useAdmission";
import { useTranslations } from "@/hooks/useTranslations";

const STATUS_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "ALL", labelKey: "filterAll" },
  { value: "PENDING", labelKey: "filterPending" },
  { value: "APPROVED", labelKey: "filterApproved" },
  { value: "REJECTED", labelKey: "filterRejected" },
  { value: "WAITLISTED", labelKey: "filterWaitlisted" },
];

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<
    string,
    { icon: React.ReactNode; className: string; labelKey: string }
  > = {
    PENDING: {
      icon: <Clock className="h-3 w-3" />,
      className: "border-amber-500/20 bg-amber-500/10 text-amber-400",
      labelKey: "statusPending",
    },
    APPROVED: {
      icon: <CheckCircle2 className="h-3 w-3" />,
      className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
      labelKey: "statusApproved",
    },
    REJECTED: {
      icon: <XCircle className="h-3 w-3" />,
      className: "border-red-500/20 bg-red-500/10 text-red-400",
      labelKey: "statusRejected",
    },
    WAITLISTED: {
      icon: <AlertCircle className="h-3 w-3" />,
      className: "border-indigo-500/20 bg-indigo-500/10 text-indigo-400",
      labelKey: "statusWaitlisted",
    },
  };
  const config = map[status] ?? map.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-manrope text-xs font-medium ${config.className}`}
    >
      {config.icon}
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};

const AdmissionsListPage = () => {
  const t = useTranslations("admissionsList");
  const router = useRouter();
  const [status, setStatus] = useState("ALL");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetAllAdmissionApplications(page, 10, status);

  const selectedStatusLabel =
    STATUS_OPTIONS.find((s) => s.value === status)?.labelKey ?? "filterAll";

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-3 py-6 sm:px-8 sm:py-10">
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
          className="mb-6 sm:mb-10"
        >
          <div className="flex items-start justify-between gap-4">
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

            <div className="relative shrink-0">
              <button
                onClick={() => setIsStatusDropdownOpen((p) => !p)}
                className="flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-xl border border-white/10 bg-white/5 px-3 sm:px-4 font-manrope text-xs sm:text-sm text-white/70 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:text-white"
              >
                <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-400 shrink-0" />
                <span className="max-w-20 sm:max-w-none truncate">
                  {t(selectedStatusLabel as Parameters<typeof t>[0])}
                </span>
                <ChevronDown
                  className={`h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-white/30 transition-transform duration-200 ${isStatusDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              <AnimatePresence>
                {isStatusDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 z-30 min-w-37.5 overflow-hidden rounded-xl border border-white/10 bg-[#0d1424] shadow-2xl shadow-black/50 backdrop-blur-xl"
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setStatus(opt.value);
                          setPage(1);
                          setIsStatusDropdownOpen(false);
                        }}
                        className={`flex w-full items-center px-4 py-2.5 font-manrope text-sm transition-colors duration-150 ${
                          status === opt.value
                            ? "bg-indigo-500/15 text-indigo-300"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {t(opt.labelKey as Parameters<typeof t>[0])}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />

          <div className="hidden md:grid md:grid-cols-[2fr_1.2fr_1fr_1fr_0.5fr] gap-4 border-b border-white/8 px-6 py-3.5">
            {[
              "colApplicant",
              "colGuardian",
              "colClass",
              "colStatus",
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
          ) : !data?.data?.length ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 sm:py-20 px-4 text-center">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white/20" />
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
              {data.data.map((app, i) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  onClick={() =>
                    router.push(`/admin/admission-applications/${app.id}`)
                  }
                  className="cursor-pointer transition-colors duration-150 hover:bg-white/3 group"
                >
                  <div className="flex md:hidden items-start justify-between gap-3 px-4 py-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 mt-0.5">
                        <FileText className="h-3.5 w-3.5 text-indigo-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-jakarta text-sm font-bold text-white truncate">
                          {app.firstName} {app.lastName}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1 font-manrope text-[11px] text-white/40">
                            <Users className="h-3 w-3 shrink-0" />
                            {app.guardianFirstName} {app.guardianLastName}
                          </span>
                          <span className="flex items-center gap-1 font-manrope text-[11px] text-white/40">
                            <GraduationCap className="h-3 w-3 shrink-0" />
                            {t("classLabel")} {app.appliedForClass}
                          </span>
                          <span className="flex items-center gap-1 font-manrope text-[11px] text-white/40">
                            <CalendarDays className="h-3 w-3 shrink-0" />
                            {formatDate(app.appliedAt)}
                          </span>
                        </div>
                        <div className="mt-2">
                          <StatusBadge status={app.status} />
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 mt-1 text-white/20 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                  </div>

                  <div className="hidden md:grid md:grid-cols-[2fr_1.2fr_1fr_1fr_0.5fr] gap-4 px-6 py-4 items-center">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                        <FileText className="h-3.5 w-3.5 text-indigo-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-jakarta text-sm font-bold text-white truncate">
                          {app.firstName} {app.lastName}
                        </p>
                        <p className="font-manrope text-xs text-white/30 truncate">
                          {formatDate(app.appliedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Users className="h-3.5 w-3.5 text-white/20 shrink-0" />
                      <span className="font-manrope text-sm text-white/50 truncate">
                        {app.guardianFirstName} {app.guardianLastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-white/20 shrink-0" />
                      <span className="font-manrope text-sm text-white/50">
                        {t("classLabel")} {app.appliedForClass}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <StatusBadge status={app.status} />
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
    </div>
  );
};

export default AdmissionsListPage;
