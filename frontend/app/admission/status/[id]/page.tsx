"use client";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ListOrdered,
  Gift,
  AlertTriangle,
  ArrowLeft,
  GraduationCap,
  CalendarClock,
} from "lucide-react";
import Image from "next/image";
import { useGetAdmissionApplicationStatusForStudent } from "@/hooks/useAdmission";
import { useTranslations } from "@/hooks/useTranslations";

const statusConfig = {
  PENDING: {
    icon: Clock,
    border: "border-amber-500/20",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
  },
  WAITLISTED: {
    icon: ListOrdered,
    border: "border-amber-500/20",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
  },
  APPROVED: {
    icon: CheckCircle2,
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
  },
  REJECTED: {
    icon: XCircle,
    border: "border-red-500/20",
    bg: "bg-red-500/10",
    text: "text-red-400",
  },
  SLOT_OFFERED: {
    icon: Gift,
    border: "border-indigo-500/20",
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
  },
  OFFER_EXPIRED: {
    icon: AlertTriangle,
    border: "border-orange-500/20",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
  },
  OFFER_DECLINED: {
    icon: XCircle,
    border: "border-white/10",
    bg: "bg-white/5",
    text: "text-white/40",
  },
} as const;

const AdmissionApplicationStatusPage = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const applicationId = params.id;

  const t = useTranslations("admissionStatus");

  const { data, isLoading, isError } =
    useGetAdmissionApplicationStatusForStudent(applicationId);

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusLabels = {
    PENDING: t("statusPending"),
    WAITLISTED: t("statusWaitlisted"),
    APPROVED: t("statusApproved"),
    REJECTED: t("statusRejected"),
    SLOT_OFFERED: t("statusSlotOffered"),
    OFFER_EXPIRED: t("statusOfferExpired"),
    OFFER_DECLINED: t("statusOfferDeclined"),
  } as const;

  const config = data
    ? statusConfig[data.status as keyof typeof statusConfig]
    : undefined;
  const StatusIcon = config?.icon ?? Clock;
  const statusLabel = data
    ? statusLabels[data.status as keyof typeof statusLabels]
    : "";

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-4 py-10 sm:px-8">
      <div
        className="pointer-events-none fixed inset-0 select-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, #1e3a5f18 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, #6366f10a 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto top-20 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 flex items-center gap-4"
        >
          <button
            onClick={() => router.back()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
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
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
              <span className="font-manrope text-sm text-white/30">
                {t("loading")}
              </span>
            </div>
          </div>
        ) : isError || !data ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/4 py-24 backdrop-blur-xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
              <XCircle className="h-6 w-6 text-red-400" />
            </div>
            <div className="text-center">
              <p className="font-jakarta text-sm font-semibold text-white/40">
                {t("errorTitle")}
              </p>
              <p className="mt-0.5 font-manrope text-xs text-white/20">
                {t("errorSubtitle")}
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />

            <div className="flex items-center gap-4 border-b border-white/8 px-6 py-6">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${config?.border} ${config?.bg}`}
              >
                <StatusIcon className={`h-6 w-6 ${config?.text}`} />
              </div>
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-manrope text-xs font-medium ${config?.border} ${config?.bg} ${config?.text}`}
                >
                  {statusLabel}
                </span>
                <p className="mt-1.5 font-manrope text-xs text-white/30">
                  {t("lastUpdated")} {formatDateTime(data.updatedAt)}
                </p>
              </div>
            </div>

            <div className="space-y-4 px-6 py-6">
              {data.status === "REJECTED" && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="font-manrope text-xs font-medium uppercase tracking-widest text-red-400/70">
                    {t("rejectionReasonLabel")}
                  </p>
                  <p className="mt-1.5 font-manrope text-sm text-white/60">
                    {data.rejectionReason || t("noReasonProvided")}
                  </p>
                </div>
              )}

              {data.status === "WAITLISTED" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="font-manrope text-xs font-medium uppercase tracking-widest text-amber-400/70">
                      {t("waitlistPositionLabel")}
                    </p>
                    <p className="mt-1.5 font-jakarta text-lg font-bold text-white">
                      {data.waitlistPosition ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                    <p className="font-manrope text-xs font-medium uppercase tracking-widest text-amber-400/70">
                      {t("waitlistReasonLabel")}
                    </p>
                    <p className="mt-1.5 font-manrope text-sm text-white/60">
                      {data.waitlistReason || t("noReasonProvided")}
                    </p>
                  </div>
                </div>
              )}

              {data.status === "SLOT_OFFERED" && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
                      <p className="font-manrope text-xs font-medium uppercase tracking-widest text-indigo-400/70">
                        {t("slotOfferedClassLabel")}
                      </p>
                    </div>
                    <p className="mt-1.5 font-jakarta text-lg font-bold text-white">
                      {data.slotOfferedClass || "-"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-3.5 w-3.5 text-white/30" />
                        <p className="font-manrope text-xs font-medium uppercase tracking-widest text-white/30">
                          {t("slotOfferedAtLabel")}
                        </p>
                      </div>
                      <p className="mt-1.5 font-manrope text-sm text-white/60">
                        {formatDateTime(data.slotOfferedAt)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-3.5 w-3.5 text-white/30" />
                        <p className="font-manrope text-xs font-medium uppercase tracking-widest text-white/30">
                          {t("slotExpiresAtLabel")}
                        </p>
                      </div>
                      <p className="mt-1.5 font-manrope text-sm text-white/60">
                        {formatDateTime(data.slotExpiresAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {data.status === "PENDING" && (
                <p className="font-manrope text-sm text-white/40">
                  {t("pendingMessage")}
                </p>
              )}

              {data.status === "APPROVED" && (
                <p className="font-manrope text-sm text-white/40">
                  {t("approvedMessage")}
                </p>
              )}

              {data.status === "OFFER_EXPIRED" && (
                <p className="font-manrope text-sm text-white/40">
                  {t("offerExpiredMessage")}
                </p>
              )}

              {data.status === "OFFER_DECLINED" && (
                <p className="font-manrope text-sm text-white/40">
                  {t("offerDeclinedMessage")}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdmissionApplicationStatusPage;
