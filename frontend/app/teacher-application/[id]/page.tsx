"use client";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  Check,
  X,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Calendar,
  GraduationCap,
  Briefcase,
  Hash,
} from "lucide-react";
import { useGetSingleTeacherApplication } from "@/hooks/useTeacher";
import { ApplicationStatus } from "@/types";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// ─────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    label: string;
    description: string;
    color: string;
    ringColor: string;
    bg: string;
    glowColor: string;
    icon: React.ReactNode;
  }
> = {
  PENDING: {
    label: "Under Review",
    description:
      "Your application has been received and is currently being reviewed by our team. We'll notify you once a decision has been made.",
    color: "text-yellow-400",
    ringColor: "ring-yellow-400/30",
    bg: "bg-yellow-400/10 border-yellow-400/20",
    glowColor: "rgba(250,204,21,0.08)",
    icon: <Clock className="h-7 w-7" />,
  },
  SHORTLISTED: {
    label: "Shortlisted",
    description:
      "Congratulations! Your application has been shortlisted by our team. It is now pending final approval from the admin.",
    color: "text-indigo-400",
    ringColor: "ring-indigo-400/30",
    bg: "bg-indigo-400/10 border-indigo-400/20",
    glowColor: "rgba(99,102,241,0.1)",
    icon: <ShieldCheck className="h-7 w-7" />,
  },
  SELECTED: {
    label: "Selected",
    description:
      "Congratulations! Your application has been approved. You will be contacted shortly with further onboarding instructions.",
    color: "text-emerald-400",
    ringColor: "ring-emerald-400/30",
    bg: "bg-emerald-400/10 border-emerald-400/20",
    glowColor: "rgba(52,211,153,0.08)",
    icon: <Check className="h-7 w-7" />,
  },
  REJECTED: {
    label: "Not Selected",
    description:
      "Unfortunately, we are unable to move forward with your application at this time. Please review the reason below.",
    color: "text-red-400",
    ringColor: "ring-red-400/30",
    bg: "bg-red-400/10 border-red-400/20",
    glowColor: "rgba(248,113,113,0.07)",
    icon: <X className="h-7 w-7" />,
  },
};

// ─────────────────────────────────────────────
// INFO CHIP
// ─────────────────────────────────────────────

const InfoChip = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
    <span className="text-indigo-400 shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="font-manrope text-[10px] text-white/30">{label}</p>
      <p className="font-jakarta text-sm font-semibold text-white truncate">
        {value !== null && value !== undefined && value !== "" ? (
          String(value)
        ) : (
          <span className="italic text-white/20">—</span>
        )}
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

const TeacherApplicationStatusPage = () => {
  const params = useParams();
  const applicationId = params?.id as string;

  const {
    data: application,
    isLoading,
    isError,
  } = useGetSingleTeacherApplication(applicationId);

  // ── Loading ──────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050810]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#050810]">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="font-jakarta text-white">Application not found</p>
      </div>
    );
  }

  const status = STATUS_CONFIG[application.status as ApplicationStatus];

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-3 pt-20 pb-10 sm:px-6 sm:pt-24">
      {/* Background glow */}
      <div
        className="pointer-events-none fixed inset-0 select-none"
        style={{
          background: `radial-gradient(ellipse at 50% 20%, ${status.glowColor} 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, #1e3a5f10 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-md space-y-5">
        {/* ── Brand header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="font-manrope text-xs text-white/30">
            EduSphere · Teacher Application
          </p>
        </motion.div>

        {/* ── Status hero card ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 p-8 text-center backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />

          {/* Status icon ring */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mb-5"
          >
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border ring-4 ${status.bg} ${status.ringColor} ${status.color}`}
            >
              {status.icon}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <h1 className="font-jakarta text-2xl font-extrabold text-white">
              {status.label}
            </h1>
            <p className="mt-2 font-manrope text-sm leading-relaxed text-white/50">
              {status.description}
            </p>
          </motion.div>
        </motion.div>

        {/* ── Key details grid ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <InfoChip
            icon={<Hash className="h-4 w-4" />}
            label="Application ID"
            value={application.id.slice(0, 18) + "…"}
          />
          <InfoChip
            icon={<Calendar className="h-4 w-4" />}
            label="Applied On"
            value={formatDate(application.appliedAt)}
          />
          <InfoChip
            icon={<GraduationCap className="h-4 w-4" />}
            label="Qualification"
            value={application.qualification}
          />
          <InfoChip
            icon={<Briefcase className="h-4 w-4" />}
            label="Experience"
            value={
              application.experience !== null &&
              application.experience !== undefined
                ? `${application.experience} ${application.experience === 1 ? "year" : "years"}`
                : null
            }
          />
        </motion.div>

        {/* ── Rejection reason ── */}
        {application.status === ApplicationStatus.REJECTED &&
          application.rejectionReason && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.28 }}
              className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5"
            >
              <p className="mb-2 font-manrope text-[10px] font-semibold uppercase tracking-widest text-red-400/60">
                Reason
              </p>
              <p className="font-manrope text-sm leading-relaxed text-white/70">
                {application.rejectionReason}
              </p>
            </motion.div>
          )}

        {/* ── Timeline / history ── */}
        {application.histories && application.histories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.32 }}
            className="rounded-2xl border border-white/8 bg-white/3 p-5"
          >
            <p className="mb-4 font-manrope text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Timeline
            </p>
            <div className="relative space-y-4 pl-4">
              {/* Vertical line */}
              <div className="absolute left-0 top-1 h-full w-px bg-white/8" />

              {/* Applied entry (always first) */}
              <div className="relative flex items-start gap-3">
                <div className="absolute -left-3.25 mt-0.5 h-2.5 w-2.5 rounded-full border border-white/20 bg-white/10" />
                <div>
                  <p className="font-jakarta text-xs font-semibold text-white">
                    Application Submitted
                  </p>
                  <p className="font-manrope text-[11px] text-white/30">
                    {formatDate(application.appliedAt)}
                  </p>
                </div>
              </div>

              {application.histories.map((h) => {
                const cfg = STATUS_CONFIG[h.status as ApplicationStatus];
                return (
                  <div key={h.id} className="relative flex items-start gap-3">
                    <div
                      className={`absolute -left-3.25 mt-0.5 h-2.5 w-2.5 rounded-full border ${cfg?.bg ?? "border-white/20 bg-white/10"}`}
                    />
                    <div>
                      <p
                        className={`font-jakarta text-xs font-semibold ${cfg?.color ?? "text-white"}`}
                      >
                        {cfg?.label ?? h.status}
                      </p>
                      <p className="font-manrope text-[11px] text-white/30">
                        {formatDate(h.changedAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="text-center font-manrope text-[11px] text-white/20"
        >
          For queries, contact the school administration office.
        </motion.p>
      </div>
    </div>
  );
};

export default TeacherApplicationStatusPage;
