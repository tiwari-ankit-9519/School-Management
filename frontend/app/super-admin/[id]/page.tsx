"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  useViewApplication,
  useApproveApplication,
  useRejectApplication,
  useMoreInfoRequired,
} from "@/hooks/useSchoolApplication";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  User,
  GraduationCap,
  Hash,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Info,
  Clock,
  ArrowLeft,
  X,
  Loader2,
} from "lucide-react";
import { ApplicationDocument } from "@/types";

type ModalType = "approve" | "reject" | "moreInfo" | null;

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  APPROVED: {
    label: "Approved",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  REJECTED: {
    label: "Rejected",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  MORE_INFO_REQUIRED: {
    label: "More Info Required",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/20",
    icon: <Info className="h-3.5 w-3.5" />,
  },
};

const MORE_INFO_FIELD_OPTIONS = [
  { label: "Website", value: "website" },
  { label: "Affiliation Number", value: "affiliationNumber" },
  { label: "Phone", value: "phone" },
  { label: "Address", value: "address" },
  { label: "Pincode", value: "pincode" },
  { label: "Admin Phone", value: "adminPhone" },
  { label: "Documents", value: "documents" },
  { label: "School Name", value: "schoolName" },
  { label: "City", value: "city" },
  { label: "State", value: "state" },
  { label: "Country", value: "country" },
];

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-white/30">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-white/30 text-[10px] font-manrope uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p className="text-white/80 text-sm font-manrope truncate">
          {value ?? <span className="text-white/20 italic">Not provided</span>}
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white/3 border border-white/8 rounded-2xl p-6"
    >
      <h2 className="text-white/60 text-xs font-manrope uppercase tracking-widest mb-5 flex items-center gap-2">
        <div className="w-1 h-3 rounded-full bg-indigo-400/60" />
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

function DocumentCard({ doc }: { doc: ApplicationDocument }) {
  const formatBytes = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatted = new Date(doc.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="group flex items-center gap-3 p-3.5 rounded-xl bg-white/3 border border-white/8 hover:bg-white/5 hover:border-white/12 transition-all duration-200">
      <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center shrink-0">
        <FileText className="h-4 w-4 text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/80 text-xs font-manrope font-medium truncate">
          {doc.title}
        </p>
        <p className="text-white/30 text-[10px] font-manrope mt-0.5">
          {doc.documentType.replace(/_/g, " ")} · {formatBytes(doc.sizeBytes)} ·{" "}
          {formatted}
        </p>
      </div>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={doc.secureUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-indigo-500/15 hover:border-indigo-400/20 transition-all"
          title="Preview"
        >
          <Eye className="h-3.5 w-3.5 text-white/50" />
        </a>
        <a
          href={doc.secureUrl}
          download={doc.originalFileName}
          className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-indigo-500/15 hover:border-indigo-400/20 transition-all"
          title="Download"
        >
          <Download className="h-3.5 w-3.5 text-white/50" />
        </a>
      </div>
    </div>
  );
}

function ApproveModal({
  open,
  onClose,
  onConfirm,
  isPending,
  schoolName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  schoolName: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent className="bg-[#0c1220] border border-white/10 rounded-2xl shadow-2xl max-w-md">
        <AlertDialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>
          <AlertDialogTitle className="text-white font-jakarta font-bold text-lg">
            Approve Application
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/40 font-manrope text-sm leading-relaxed">
            You are about to approve the application for{" "}
            <span className="text-white/70 font-medium">{schoolName}</span>.
            This will create the school account and send login credentials to
            the admin. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 mt-2">
          <AlertDialogCancel
            onClick={onClose}
            className="bg-white/5 border-white/10 text-white/60 hover:bg-white/8 hover:text-white font-manrope text-sm rounded-xl"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-manrope text-sm rounded-xl border-0 min-w-24"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Approve"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RejectModal({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#0c1220] border border-white/10 rounded-2xl shadow-2xl max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-400/20 flex items-center justify-center mb-3">
            <XCircle className="h-6 w-6 text-red-400" />
          </div>
          <DialogTitle className="text-white font-jakarta font-bold text-lg">
            Reject Application
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-white/40 font-manrope text-sm">
            Please provide a reason for rejection. This will be sent to the
            applicant via email.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows={4}
            className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm font-manrope placeholder:text-white/20 focus:outline-none focus:border-red-400/40 focus:bg-white/6 resize-none transition-all"
          />
          <p className="text-white/20 text-xs font-manrope text-right">
            {reason.length} characters
          </p>
        </div>
        <DialogFooter className="gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/8 hover:text-white font-manrope text-sm transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending || !reason.trim()}
            className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-manrope text-sm transition-all min-w-24 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Reject"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MoreInfoModal({
  open,
  onClose,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (fields: string[], notes: string) => void;
  isPending: boolean;
}) {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const toggleField = (value: string) => {
    setSelectedFields((prev) =>
      prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value],
    );
  };

  const handleConfirm = () => {
    if (!selectedFields.length || !notes.trim()) return;
    onConfirm(selectedFields, notes.trim());
  };

  const canSubmit = selectedFields.length > 0 && notes.trim();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#0c1220] border border-white/10 rounded-2xl shadow-2xl max-w-lg">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-400/20 flex items-center justify-center mb-3">
            <Info className="h-6 w-6 text-sky-400" />
          </div>
          <DialogTitle className="text-white font-jakarta font-bold text-lg">
            Request More Information
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <p className="text-white/40 font-manrope text-xs uppercase tracking-wider mb-2.5">
              Select Fields Required
            </p>
            <div className="grid grid-cols-2 gap-2">
              {MORE_INFO_FIELD_OPTIONS.map((opt) => {
                const selected = selectedFields.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleField(opt.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-manrope transition-all duration-200 text-left ${
                      selected
                        ? "bg-sky-500/15 border-sky-400/30 text-sky-300"
                        : "bg-white/3 border-white/8 text-white/50 hover:bg-white/6 hover:text-white/70"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-all ${
                        selected
                          ? "bg-sky-500 border-sky-400"
                          : "border-white/20"
                      }`}
                    >
                      {selected && <X className="h-2.5 w-2.5 text-white" />}
                    </div>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-white/40 font-manrope text-xs uppercase tracking-wider mb-2.5">
              Notes to Applicant
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain what additional information is needed and why..."
              rows={3}
              className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm font-manrope placeholder:text-white/20 focus:outline-none focus:border-sky-400/40 focus:bg-white/6 resize-none transition-all"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/8 hover:text-white font-manrope text-sm transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending || !canSubmit}
            className="px-6 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-manrope text-sm transition-all min-w-32 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Send Request"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#050810] px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded-xl" />
        <div className="h-24 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-white/5 rounded-2xl" />
          <div className="h-64 bg-white/5 rounded-2xl" />
        </div>
        <div className="h-48 bg-white/5 rounded-2xl" />
      </div>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [modal, setModal] = useState<ModalType>(null);

  const { data: application, isLoading, isError } = useViewApplication(id);
  const { mutate: approve, isPending: isApproving } = useApproveApplication(id);
  const { mutate: reject, isPending: isRejecting } = useRejectApplication(id);
  const { mutate: requestMoreInfo, isPending: isRequestingInfo } =
    useMoreInfoRequired(id);

  const closeModal = () => setModal(null);

  const handleApprove = () => {
    approve(undefined, { onSuccess: closeModal });
  };

  const handleReject = (reason: string) => {
    reject(reason, { onSuccess: closeModal });
  };

  const handleMoreInfo = (fields: string[], notes: string) => {
    requestMoreInfo(
      { moreInfoFields: fields, notes },
      { onSuccess: closeModal },
    );
  };

  if (isLoading) return <PageSkeleton />;

  if (isError || !application) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/8 border border-red-400/15 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-7 w-7 text-red-400/50" />
          </div>
          <p className="text-white/50 font-jakarta font-semibold text-sm mb-1">
            Application not found
          </p>
          <p className="text-white/25 font-manrope text-xs mb-6">
            This application may have been deleted or does not exist.
          </p>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-manrope text-sm transition-colors mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[application.status];
  const isPending = application.status === "PENDING";

  const formatted = (date: string | null) =>
    date
      ? new Date(date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <div className="min-h-screen bg-[#050810] px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between mb-6 flex-wrap gap-3"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 font-manrope text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Applications
          </button>
          {isPending && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModal("moreInfo")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-400/20 text-sky-400 hover:bg-sky-500/15 font-manrope text-xs font-medium transition-all"
              >
                <Info className="h-3.5 w-3.5" />
                Request Info
              </button>
              <button
                onClick={() => setModal("reject")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-400/20 text-red-400 hover:bg-red-500/15 font-manrope text-xs font-medium transition-all"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
              <button
                onClick={() => setModal("approve")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 hover:bg-emerald-500/15 font-manrope text-xs font-medium transition-all"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve
              </button>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-4 relative overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-white text-xl font-bold font-jakarta leading-tight mb-1">
                  {application.schoolName}
                </h1>
                <p className="text-white/40 text-xs font-manrope">
                  {application.boardType} · Est. {application.establishedYear}
                </p>
                <p className="text-white/25 text-[10px] font-manrope mt-1">
                  ID: {application.id}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-manrope font-medium border shrink-0 ${status.color} ${status.bg} ${status.border}`}
            >
              {status.icon}
              {status.label}
            </span>
          </div>

          <Separator className="bg-white/6 my-5" />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Applied",
                value: new Date(application.appliedAt).toLocaleDateString(
                  "en-IN",
                  { day: "numeric", month: "short", year: "numeric" },
                ),
              },
              {
                label: "Reviewed",
                value: application.reviewedAt
                  ? new Date(application.reviewedAt).toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short", year: "numeric" },
                    )
                  : "—",
              },
              {
                label: "Documents",
                value: `${application.documents?.length ?? 0} file${(application.documents?.length ?? 0) !== 1 ? "s" : ""}`,
              },
              {
                label: "Last Updated",
                value: new Date(application.updatedAt).toLocaleDateString(
                  "en-IN",
                  { day: "numeric", month: "short", year: "numeric" },
                ),
              },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-white/25 text-[10px] font-manrope uppercase tracking-wider mb-0.5">
                  {stat.label}
                </p>
                <p className="text-white/70 text-sm font-manrope font-medium">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <AnimatePresence>
          {application.status === "REJECTED" && application.rejectionReason && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/5 border border-red-400/15 rounded-2xl p-4 mb-4 flex items-start gap-3"
            >
              <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 text-xs font-manrope font-medium mb-1">
                  Rejection Reason
                </p>
                <p className="text-red-300/70 text-sm font-manrope">
                  {application.rejectionReason}
                </p>
              </div>
            </motion.div>
          )}

          {application.status === "MORE_INFO_REQUIRED" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-sky-500/5 border border-sky-400/15 rounded-2xl p-4 mb-4"
            >
              <div className="flex items-start gap-3 mb-3">
                <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sky-400 text-xs font-manrope font-medium mb-1">
                    Additional Information Requested
                  </p>
                  {application.notes && (
                    <p className="text-sky-300/70 text-sm font-manrope">
                      {application.notes}
                    </p>
                  )}
                </div>
              </div>
              {application.moreInfoFields.length > 0 && (
                <div className="flex flex-wrap gap-2 ml-7">
                  {application.moreInfoFields.map((field) => (
                    <span
                      key={field}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-400/15 text-sky-300/80 text-xs font-manrope"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Section title="School Information" delay={0.1}>
            <div className="space-y-4">
              <InfoRow
                icon={<MapPin className="h-3.5 w-3.5" />}
                label="Address"
                value={`${application.address}, ${application.city}, ${application.state}, ${application.country} - ${application.pincode}`}
              />
              <InfoRow
                icon={<Phone className="h-3.5 w-3.5" />}
                label="Phone"
                value={application.phone}
              />
              <InfoRow
                icon={<Mail className="h-3.5 w-3.5" />}
                label="Email"
                value={application.email}
              />
              <InfoRow
                icon={<Globe className="h-3.5 w-3.5" />}
                label="Website"
                value={application.website}
              />
              <InfoRow
                icon={<Hash className="h-3.5 w-3.5" />}
                label="Affiliation Number"
                value={application.affiliationNumber}
              />
              <InfoRow
                icon={<GraduationCap className="h-3.5 w-3.5" />}
                label="Board Type"
                value={application.boardType}
              />
            </div>
          </Section>

          <Section title="Admin Information" delay={0.15}>
            <div className="space-y-4">
              <InfoRow
                icon={<User className="h-3.5 w-3.5" />}
                label="Full Name"
                value={`${application.adminFirstName} ${application.adminLastName}`}
              />
              <InfoRow
                icon={<Mail className="h-3.5 w-3.5" />}
                label="Email"
                value={application.adminEmail}
              />
              <InfoRow
                icon={<Phone className="h-3.5 w-3.5" />}
                label="Phone"
                value={application.adminPhone}
              />
              <InfoRow
                icon={<User className="h-3.5 w-3.5" />}
                label="Gender"
                value={application.adminGender}
              />
              {application.reviewedAt && (
                <InfoRow
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  label="Reviewed At"
                  value={formatted(application.reviewedAt)}
                />
              )}
            </div>
          </Section>
        </div>

        {(application.documents?.length ?? 0) > 0 && (
          <Section
            title={`Documents (${application.documents?.length})`}
            delay={0.2}
          >
            <div className="space-y-2">
              {application.documents?.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          </Section>
        )}
      </div>

      <ApproveModal
        open={modal === "approve"}
        onClose={closeModal}
        onConfirm={handleApprove}
        isPending={isApproving}
        schoolName={application.schoolName}
      />

      <RejectModal
        open={modal === "reject"}
        onClose={closeModal}
        onConfirm={handleReject}
        isPending={isRejecting}
      />

      <MoreInfoModal
        open={modal === "moreInfo"}
        onClose={closeModal}
        onConfirm={handleMoreInfo}
        isPending={isRequestingInfo}
      />
    </div>
  );
}
