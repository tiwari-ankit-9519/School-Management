"use client";
import { use, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  GraduationCap,
  Users,
  BookOpen,
  Award,
  Upload,
  Send,
  ChevronDown,
  FileText,
  RotateCcw,
} from "lucide-react";
import {
  useUserApplicationStatus,
  useResubmitApplication,
} from "@/hooks/useSchoolApplication";
import { ResubmitSchoolApplication, SchoolApplication } from "@/types";
import { toast } from "sonner";

type StatusValue = "PENDING" | "APPROVED" | "REJECTED" | "MORE_INFO_REQUIRED";

type StatusConfigValue = {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  glow: string;
  desc: string;
  steps: string[];
};

const PLATFORM_FEATURES: { icon: React.ElementType; label: string }[] = [
  { icon: GraduationCap, label: "Student Management" },
  { icon: Users, label: "Staff Portal" },
  { icon: BookOpen, label: "Academic Tools" },
  { icon: Award, label: "Performance Analytics" },
];

const STATUS_STEP_INDEX: { [K in StatusValue]: number } = {
  PENDING: 1,
  MORE_INFO_REQUIRED: 1,
  APPROVED: 3,
  REJECTED: 2,
};

const STEPS = ["Submitted", "Under Review", "Decision", "Onboarded"];

const STATUS_CONFIG: { [K in StatusValue]: StatusConfigValue } = {
  PENDING: {
    label: "Under Review",
    icon: Clock,
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    glow: "shadow-amber-500/10",
    desc: "Your application has been received and is currently being reviewed by our team. This process typically takes 2–5 business days.",
    steps: STEPS,
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/10",
    desc: "Congratulations! Your school has been approved on EduSphere. Your portal will be set up within 48 hours and login credentials will be sent to your admin email.",
    steps: STEPS,
  },
  REJECTED: {
    label: "Not Approved",
    icon: XCircle,
    color: "text-red-300",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    glow: "shadow-red-500/10",
    desc: "Unfortunately your application was not approved at this time. Please review the reason below and contact our support team for more information.",
    steps: STEPS,
  },
  MORE_INFO_REQUIRED: {
    label: "More Info Required",
    icon: AlertCircle,
    color: "text-indigo-300",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    glow: "shadow-indigo-500/10",
    desc: "Our team needs additional information before proceeding with your application. Please fill in the required fields below and resubmit.",
    steps: STEPS,
  },
};

const RESUBMIT_TEXT_KEYS: Array<
  keyof Omit<ResubmitSchoolApplication, "moreInfoFields" | "documents">
> = [
  "schoolName",
  "address",
  "city",
  "state",
  "country",
  "pincode",
  "phone",
  "website",
  "affiliationNumber",
  "adminPhone",
];

function RejectionReasonPanel({ reason }: { reason: string }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="mt-4 bg-red-500/5 border border-red-500/20 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
            <FileText className="h-3 w-3 text-red-400" />
          </div>
          <span className="text-red-300/80 text-xs font-jakarta font-semibold tracking-wide uppercase">
            Rejection Reason
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-red-400/50 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="rejection-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-4 pb-4">
              <div className="bg-red-500/8 border border-red-500/15 rounded-xl p-3.5">
                <p className="text-red-200/70 text-xs font-manrope leading-relaxed whitespace-pre-wrap">
                  {reason}
                </p>
              </div>
              <p className="text-white/20 text-[10px] font-manrope mt-2.5 leading-relaxed">
                If you believe this decision was made in error, please contact{" "}
                <span className="text-indigo-400/60">support@edusphere.in</span>
                .
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MoreInfoForm({
  applicationId,
  application,
}: {
  applicationId: string;
  application: SchoolApplication;
}) {
  const { moreInfoFields, notes } = application;

  const textFields = moreInfoFields.filter((f) =>
    RESUBMIT_TEXT_KEYS.includes(
      f as keyof Omit<
        ResubmitSchoolApplication,
        "moreInfoFields" | "documents"
      >,
    ),
  );
  const needsDocuments = moreInfoFields.includes("documents");
  const otherFields = moreInfoFields.filter(
    (f) =>
      !RESUBMIT_TEXT_KEYS.includes(
        f as keyof Omit<
          ResubmitSchoolApplication,
          "moreInfoFields" | "documents"
        >,
      ) && f !== "documents",
  );

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(
    Object.fromEntries(
      textFields.map((f) => {
        const existing = application[f as keyof SchoolApplication];
        return [f, typeof existing === "string" ? existing : ""];
      }),
    ),
  );
  const [files, setFiles] = useState<File[]>([]);
  const [expanded, setExpanded] = useState(true);

  const { mutate: resubmit, isPending } = useResubmitApplication(applicationId);

  const formatFieldLabel = (field: string) =>
    field
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^./, (s) => s.toUpperCase())
      .trim();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const unfilled = textFields.filter((f) => !fieldValues[f]?.trim());
    if (unfilled.length > 0) {
      toast.error(
        `Please fill in: ${unfilled.map(formatFieldLabel).join(", ")}`,
      );
      return;
    }
    if ((needsDocuments || otherFields.length > 0) && files.length === 0) {
      toast.error("Please upload at least one supporting document.");
      return;
    }

    const payload: ResubmitSchoolApplication = {
      ...(Object.fromEntries(
        textFields.map((f) => [f, fieldValues[f]]),
      ) as Omit<ResubmitSchoolApplication, "moreInfoFields" | "documents">),
      moreInfoFields,
      ...(files.length > 0 ? { documents: files } : {}),
    };

    resubmit(payload);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="mt-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
            <RotateCcw className="h-3 w-3 text-indigo-400" />
          </div>
          <span className="text-indigo-300/80 text-xs font-jakarta font-semibold tracking-wide uppercase">
            Provide Required Information
          </span>
          <span className="text-indigo-400/40 text-[10px] font-manrope bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5">
            {moreInfoFields.length} field
            {moreInfoFields.length !== 1 ? "s" : ""}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-indigo-400/50 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="more-info-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-4 pb-4 space-y-3">
              {notes && (
                <div className="bg-indigo-500/8 border border-indigo-500/15 rounded-xl p-3">
                  <p className="text-indigo-300/50 text-[10px] font-manrope uppercase tracking-wide mb-1">
                    Notes from reviewer
                  </p>
                  <p className="text-indigo-200/60 text-xs font-manrope leading-relaxed">
                    {notes}
                  </p>
                </div>
              )}

              {textFields.map((field) => (
                <div key={field} className="space-y-1.5">
                  <label className="block text-white/40 text-[10px] font-manrope uppercase tracking-wide">
                    {formatFieldLabel(field)}{" "}
                    <span className="text-indigo-400/60">*</span>
                  </label>
                  <input
                    type="text"
                    value={fieldValues[field] ?? ""}
                    onChange={(e) =>
                      setFieldValues((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                    placeholder={`Enter ${formatFieldLabel(field).toLowerCase()}…`}
                    className="w-full bg-white/4 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-xs font-manrope placeholder-white/20 focus:outline-none focus:border-indigo-500/40 focus:bg-white/6 transition-all duration-200"
                  />
                </div>
              ))}

              {otherFields.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 space-y-1.5">
                  <p className="text-amber-300/50 text-[10px] font-manrope uppercase tracking-wide mb-1">
                    Additional items requested
                  </p>
                  {otherFields.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-amber-400/40 shrink-0" />
                      <p className="text-amber-200/50 text-xs font-manrope">
                        {formatFieldLabel(f)}
                      </p>
                    </div>
                  ))}
                  <p className="text-white/20 text-[10px] font-manrope mt-1 leading-relaxed">
                    Please upload supporting documents for the items above.
                  </p>
                </div>
              )}

              {(needsDocuments || otherFields.length > 0) && (
                <div className="space-y-1.5">
                  <label className="block text-white/40 text-[10px] font-manrope uppercase tracking-wide">
                    Supporting Documents{" "}
                    <span className="text-indigo-400/60">*</span>
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-20 border border-dashed border-white/15 rounded-xl cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all duration-200 group">
                    <div className="flex flex-col items-center gap-1 pointer-events-none">
                      <Upload className="h-4 w-4 text-white/25 group-hover:text-indigo-400/60 transition-colors" />
                      <span className="text-white/25 text-[10px] font-manrope group-hover:text-white/40 transition-colors">
                        Click to upload files
                      </span>
                    </div>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  {files.length > 0 && (
                    <div className="space-y-1.5 mt-1">
                      {files.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-white/3 border border-white/8 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-3 w-3 text-indigo-400/60 shrink-0" />
                            <span className="text-white/50 text-[11px] font-manrope truncate">
                              {file.name}
                            </span>
                            <span className="text-white/20 text-[10px] font-manrope shrink-0">
                              {(file.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                          <button
                            onClick={() => removeFile(i)}
                            className="text-white/20 hover:text-red-400/60 transition-colors ml-2 shrink-0"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 hover:border-indigo-500/50 rounded-xl px-4 py-2.5 text-indigo-300 text-xs font-jakarta font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <svg
                      className="animate-spin h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Resubmitting…
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Resubmit Application
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ApplicationStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, isError } = useUserApplicationStatus(id);
  const application = data as unknown as SchoolApplication | undefined;
  const status = application?.status as StatusValue | undefined;
  const statusCfg = status ? STATUS_CONFIG[status] : null;

  return (
    <div className="relative min-h-screen w-full bg-[#050810] overflow-x-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 20%, #1e3a5f18 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, #6366f10d 0%, transparent 50%)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.018]">
          <svg
            viewBox="0 0 800 600"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern
                id="smallgrid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
              <pattern
                id="grid"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <rect width="100" height="100" fill="url(#smallgrid)" />
                <path
                  d="M 100 0 L 0 0 0 100"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="absolute top-1/4 left-1/4 w-64 h-60 rounded-full bg-indigo-500/4 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-sky-500/4 blur-3xl" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-150 h-120 opacity-[0.025]"
            style={{
              background:
                "conic-gradient(from 0deg, #6366f1, #0ea5e9, #6366f1)",
              borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
              filter: "blur(60px)",
            }}
          />
        </div>
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.015]"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <g stroke="white" strokeWidth="0.5" fill="none">
            <path d="M 100 400 Q 300 200 500 400 T 900 400" />
            <path d="M 0 300 Q 200 100 400 300 T 800 300 T 1200 300" />
            <path d="M 0 500 Q 200 300 400 500 T 800 500 T 1200 500" />
          </g>
        </svg>
        <div className="absolute top-1/2 right-8 -translate-y-1/2 hidden xl:flex flex-col gap-2 opacity-20">
          {PLATFORM_FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-sm"
              >
                <Icon className="h-3 w-3 text-indigo-300 shrink-0" />
                <span className="text-white/60 text-[10px] font-manrope">
                  {f.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-3 py-6 sm:px-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg lg:max-w-4xl"
        >
          <div className="relative bg-white/4 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-7 backdrop-blur-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_32px_80px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden pointer-events-none">
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/5 to-transparent" />
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <Image
                  src="/logo.png"
                  alt="EduSphere Logo"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-white text-sm font-bold font-jakarta tracking-tight block leading-none">
                  EduSphere
                </span>
                <span className="text-white/30 text-xs font-manrope">
                  School Management SaaS
                </span>
              </div>
            </div>

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <svg
                    className="animate-spin h-6 w-6 text-indigo-400"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-white/50 text-sm font-jakarta font-semibold mb-1">
                    Fetching Status
                  </p>
                  <p className="text-white/25 text-xs font-manrope">
                    Please wait a moment...
                  </p>
                </div>
              </div>
            )}

            {isError && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-400" />
                </div>
                <div className="text-center">
                  <p className="text-white/60 text-sm font-jakarta font-semibold mb-1">
                    Application Not Found
                  </p>
                  <p className="text-white/25 text-xs font-manrope leading-relaxed max-w-xs">
                    We couldn&apos;t find an application with this ID. Please
                    check your link or contact support.
                  </p>
                </div>
              </div>
            )}

            {!isLoading && statusCfg && status && application && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="mb-5">
                  <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-400/20 rounded-full px-3 py-1 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-indigo-300 text-xs font-manrope">
                      Application Status
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold font-jakarta text-white leading-tight mb-1">
                    Track Your Application
                  </h1>
                  <p className="text-xs text-white/30 font-manrope">
                    ID:{" "}
                    <span className="text-white/45 font-mono break-all">
                      {id}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div
                    className={`${statusCfg.bg} border ${statusCfg.border} rounded-2xl p-5 shadow-lg ${statusCfg.glow} flex flex-col items-center justify-center text-center gap-3`}
                  >
                    <div
                      className={`w-16 h-16 rounded-2xl ${statusCfg.bg} border ${statusCfg.border} flex items-center justify-center`}
                    >
                      <statusCfg.icon
                        className={`h-8 w-8 ${statusCfg.color}`}
                      />
                    </div>
                    <div>
                      <p
                        className={`text-base font-jakarta font-extrabold ${statusCfg.color} mb-1`}
                      >
                        {statusCfg.label}
                      </p>
                      <p className="text-white/40 text-xs font-manrope leading-relaxed max-w-xs mx-auto">
                        {statusCfg.desc}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/2 border border-white/6 rounded-2xl p-4">
                    <p className="text-white/30 text-[10px] font-manrope uppercase tracking-wide mb-3">
                      Application Progress
                    </p>
                    <div className="space-y-2.5">
                      {statusCfg.steps.map((step, i) => {
                        const isLast = i === statusCfg.steps.length - 1;
                        const currentStepIndex = STATUS_STEP_INDEX[status];
                        const isDone = i <= currentStepIndex;
                        const isCurrent = i === currentStepIndex;
                        return (
                          <div key={step} className="flex items-center gap-3">
                            <div className="flex flex-col items-center shrink-0">
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-300 ${
                                  isCurrent
                                    ? `${statusCfg.bg} ${statusCfg.border}`
                                    : isDone
                                      ? "bg-indigo-500 border-indigo-400"
                                      : "bg-white/5 border-white/10"
                                }`}
                              >
                                {isDone && !isCurrent ? (
                                  <CheckCircle2 className="h-3 w-3 text-white" />
                                ) : isCurrent ? (
                                  <statusCfg.icon
                                    className={`h-2.5 w-2.5 ${statusCfg.color}`}
                                  />
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                )}
                              </div>
                              {!isLast && (
                                <div
                                  className={`w-px h-4 mt-0.5 ${
                                    isDone && !isCurrent
                                      ? "bg-indigo-500/40"
                                      : "bg-white/8"
                                  }`}
                                />
                              )}
                            </div>
                            <p
                              className={`text-xs font-manrope ${
                                isLast ? "pb-0" : "pb-4"
                              } ${
                                isCurrent
                                  ? `${statusCfg.color} font-semibold`
                                  : isDone
                                    ? "text-white/60"
                                    : "text-white/20"
                              }`}
                            >
                              {step}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {status === "REJECTED" && application.rejectionReason && (
                  <RejectionReasonPanel reason={application.rejectionReason} />
                )}

                {status === "MORE_INFO_REQUIRED" &&
                  application.moreInfoFields?.length > 0 && (
                    <MoreInfoForm
                      applicationId={id}
                      application={application}
                    />
                  )}

                <div className="mt-4 bg-white/2 border border-white/6 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs font-jakarta font-semibold mb-0.5">
                      Need Help?
                    </p>
                    <p className="text-white/25 text-xs font-manrope leading-relaxed">
                      If you have questions about your application, reach out to
                      our support team at{" "}
                      <span className="text-indigo-400/70">
                        support@edusphere.in
                      </span>
                      . Please keep your application ID handy.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/6">
                  <p className="text-white/15 text-[10px] font-manrope text-center">
                    Status refreshes automatically every 5 minutes
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
