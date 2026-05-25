"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  User,
  MapPin,
  GraduationCap,
  Users,
  FileText,
  Check,
  X,
  Clock,
  ChevronDown,
  AlertCircle,
  Loader2,
  Calendar,
  Phone,
  Mail,
  School,
  BookOpen,
  Timer,
  Ban,
  DoorOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useGetAdmissionApplication,
  useApproveAdmissionApplication,
  useRejectAdmissionApplication,
  useWaitlistAdmissionApplication,
  useGetAdmissionClasses,
} from "@/hooks/useAdmission";
import { AdmissionClass, AdmissionStatus } from "@/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const STATUS_CONFIG: Record<
  AdmissionStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Pending",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10 border-yellow-400/20",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  APPROVED: {
    label: "Approved",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
    icon: <Check className="h-3.5 w-3.5" />,
  },
  REJECTED: {
    label: "Rejected",
    color: "text-red-400",
    bg: "bg-red-400/10 border-red-400/20",
    icon: <X className="h-3.5 w-3.5" />,
  },
  WAITLISTED: {
    label: "Waitlisted",
    color: "text-indigo-400",
    bg: "bg-indigo-400/10 border-indigo-400/20",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  SLOT_OFFERED: {
    label: "Slot Offered",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10 border-cyan-400/20",
    icon: <Timer className="h-3.5 w-3.5" />,
  },
  OFFER_EXPIRED: {
    label: "Offer Expired",
    color: "text-orange-400",
    bg: "bg-orange-400/10 border-orange-400/20",
    icon: <Timer className="h-3.5 w-3.5" />,
  },
  OFFER_DECLINED: {
    label: "Offer Declined",
    color: "text-rose-400",
    bg: "bg-rose-400/10 border-rose-400/20",
    icon: <Ban className="h-3.5 w-3.5" />,
  },
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/5">
      <span className="text-indigo-400">{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="font-manrope text-[11px] text-white/30">{label}</p>
      <p className="font-jakarta text-sm font-medium text-white">
        {value || <span className="text-white/20 italic">Not provided</span>}
      </p>
    </div>
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
    <p className="mb-4 font-manrope text-[10px] font-semibold uppercase tracking-widest text-white/30">
      {title}
    </p>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </div>
);

type ActionType = "approve" | "reject" | "waitlist" | null;

const ClassDropdown = ({
  classes,
  selectedId,
  onSelect,
  isLoading,
  borderClass,
}: {
  classes: AdmissionClass[];
  selectedId: string;
  onSelect: (id: string) => void;
  isLoading: boolean;
  borderClass: string;
}) => {
  const [open, setOpen] = useState(false);
  const selected = classes.find((c) => c.id === selectedId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex h-11 w-full items-center justify-between rounded-xl border bg-white/5 px-4 font-manrope text-sm text-white focus:outline-none ${borderClass}`}
      >
        {isLoading ? (
          <span className="flex items-center gap-2 text-white/40">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading classes...
          </span>
        ) : selected ? (
          <span className="flex items-center gap-2">
            <GraduationCap className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-medium">
              Class {selected.name}
              {selected.section ? ` - ${selected.section}` : ""}
            </span>
            <span className="ml-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] text-white/40">
              {selected.capacity} seats
            </span>
          </span>
        ) : (
          <span className="text-white/20">Select a section</span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-white/30 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-12 z-30 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0d1424] shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
            {classes.length === 0 ? (
              <div className="px-4 py-3 font-manrope text-sm text-white/30">
                No sections found for this class
              </div>
            ) : (
              classes.map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => {
                    onSelect(cls.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-3 font-manrope text-sm transition-colors duration-150 ${
                    cls.id === selectedId
                      ? "bg-indigo-500/15 text-indigo-300"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                    <span className="font-medium">
                      Class {cls.name}
                      {cls.section ? ` - Section ${cls.section}` : ""}
                    </span>
                    {cls.roomNumber && (
                      <span className="flex items-center gap-1 text-[11px] text-white/30">
                        <DoorOpen className="h-3 w-3" />
                        {cls.roomNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5">
                    <Users className="h-3 w-3 text-white/30" />
                    <span
                      className={`text-[11px] ${cls.remaining === 0 ? "text-red-400" : "text-white/50"}`}
                    >
                      {cls.remaining === 0 ? "Full" : `${cls.remaining} left`}
                    </span>
                  </div>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ActionModal = ({
  type,
  appliedForClass,
  onClose,
  onConfirm,
  isPending,
}: {
  type: ActionType;
  appliedForClass: string;
  onClose: () => void;
  onConfirm: (reason?: string, classId?: string) => void;
  isPending: boolean;
}) => {
  const [reason, setReason] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [error, setError] = useState("");

  const { data: admissionClasses = [], isLoading: isClassesLoading } =
    useGetAdmissionClasses(type === "approve" ? appliedForClass : "");

  if (!type) return null;

  const config = {
    approve: {
      title: "Approve Application",
      subtitle: "Select a section to enroll the student.",
      color: "indigo",
      confirmLabel: "Approve & Enroll",
    },
    reject: {
      title: "Reject Application",
      subtitle: "Provide a reason for rejection.",
      color: "red",
      confirmLabel: "Reject Application",
    },
    waitlist: {
      title: "Waitlist Application",
      subtitle: "Provide a reason for waitlisting.",
      color: "yellow",
      confirmLabel: "Move to Waitlist",
    },
  }[type];

  const colorMap: Record<string, string> = {
    indigo: "border-indigo-500/50 focus:border-indigo-500",
    red: "border-red-500/50 focus:border-red-500",
    yellow: "border-yellow-500/50 focus:border-yellow-500",
  };

  const btnMap: Record<string, string> = {
    indigo: "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20",
    red: "bg-red-600 hover:bg-red-500 shadow-red-500/20",
    yellow: "bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/20",
  };

  const handleConfirm = () => {
    if (type === "approve" && !selectedClassId) {
      setError("Please select a section");
      return;
    }
    if (
      (type === "reject" || type === "waitlist") &&
      reason.trim().length < 10
    ) {
      setError("Reason must be at least 10 characters");
      return;
    }
    setError("");
    onConfirm(reason || undefined, selectedClassId || undefined);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1120] p-6 shadow-2xl"
      >
        <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-linear-to-r from-transparent via-white/15 to-transparent" />
        <h3 className="font-jakarta text-lg font-bold text-white">
          {config.title}
        </h3>
        <p className="mt-1 font-manrope text-sm text-white/40">
          {config.subtitle}
        </p>
        <div className="mt-5 space-y-3">
          {type === "approve" && (
            <div>
              <label className="mb-1.5 block font-manrope text-xs text-white/40">
                Select Section
              </label>
              <ClassDropdown
                classes={admissionClasses}
                selectedId={selectedClassId}
                onSelect={(id) => {
                  setSelectedClassId(id);
                  setError("");
                }}
                isLoading={isClassesLoading}
                borderClass={colorMap[config.color]}
              />
            </div>
          )}
          {(type === "reject" || type === "waitlist") && (
            <div>
              <label className="mb-1.5 block font-manrope text-xs text-white/40">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError("");
                }}
                placeholder="Enter reason (min 10 characters)"
                rows={3}
                className={`w-full resize-none rounded-xl border bg-white/5 px-4 py-3 font-manrope text-sm text-white placeholder:text-white/20 focus:outline-none ${colorMap[config.color]}`}
              />
            </div>
          )}
          {error && (
            <p className="flex items-center gap-1.5 font-manrope text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}
        </div>
        <div className="mt-5 flex gap-3">
          <Button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 font-jakarta text-sm font-bold text-white/60 hover:bg-white/8 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || (type === "approve" && isClassesLoading)}
            className={`h-11 flex-1 rounded-xl border-0 font-jakarta text-sm font-bold text-white shadow-lg transition-all ${btnMap[config.color]}`}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              config.confirmLabel
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AdmissionApplicationDetailPage = () => {
  const params = useParams();
  const applicationId = params?.id as string;
  const [activeModal, setActiveModal] = useState<ActionType>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const {
    data: application,
    isLoading,
    isError,
  } = useGetAdmissionApplication(applicationId);

  const { mutate: approve, isPending: isApproving } =
    useApproveAdmissionApplication();
  const { mutate: reject, isPending: isRejecting } =
    useRejectAdmissionApplication();
  const { mutate: waitlist, isPending: isWaitlisting } =
    useWaitlistAdmissionApplication();

  const isActionPending = isApproving || isRejecting || isWaitlisting;

  const handleConfirm = (reason?: string, classId?: string) => {
    if (!applicationId) return;
    if (activeModal === "approve" && classId) {
      approve(
        { applicationId, classId },
        { onSuccess: () => setActiveModal(null) },
      );
    } else if (activeModal === "reject" && reason) {
      reject(
        { applicationId, rejectionReason: reason },
        { onSuccess: () => setActiveModal(null) },
      );
    } else if (activeModal === "waitlist" && reason) {
      waitlist(
        { applicationId, waitlistReason: reason },
        { onSuccess: () => setActiveModal(null) },
      );
    }
  };

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

  const status = STATUS_CONFIG[application.status as AdmissionStatus];
  const isPending = application.status === "PENDING";
  const isWaitlisted = application.status === "WAITLISTED";
  const showActions = isPending || isWaitlisted;

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-3 py-6 sm:px-6 sm:py-10">
      <div
        className="pointer-events-none fixed inset-0 select-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, #1e3a5f18 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, #6366f10a 0%, transparent 50%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-2xl space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-start justify-between gap-4"
        >
          <div>
            <h1 className="font-jakarta text-xl sm:text-2xl font-extrabold text-white">
              Admission Application
            </h1>
            <p className="mt-0.5 font-manrope text-xs text-white/30">
              ID: {application.id}
            </p>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${status.bg}`}
          >
            <span className={status.color}>{status.icon}</span>
            <span
              className={`font-manrope text-xs font-semibold ${status.color}`}
            >
              {status.label}
            </span>
          </div>
        </motion.div>

        {(application.photoUrl || application.guardianPhotoUrl) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="flex gap-4"
          >
            {application.photoUrl && (
              <div className="flex flex-col items-center gap-1.5">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10">
                  <Image
                    src={application.photoUrl}
                    alt="Student"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="font-manrope text-[10px] text-white/30">
                  Student
                </span>
              </div>
            )}
            {application.guardianPhotoUrl && (
              <div className="flex flex-col items-center gap-1.5">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10">
                  <Image
                    src={application.guardianPhotoUrl}
                    alt="Guardian"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="font-manrope text-[10px] text-white/30">
                  Guardian
                </span>
              </div>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Section title="Student Information">
            <InfoRow
              icon={<User className="h-3.5 w-3.5" />}
              label="Full Name"
              value={`${application.firstName} ${application.lastName}`}
            />
            <InfoRow
              icon={<User className="h-3.5 w-3.5" />}
              label="Gender"
              value={application.gender}
            />
            <InfoRow
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Date of Birth"
              value={formatDate(application.dateOfBirth)}
            />
            <InfoRow
              icon={<GraduationCap className="h-3.5 w-3.5" />}
              label="Applied For Class"
              value={application.appliedForClass}
            />
          </Section>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Section title="Address">
            <div className="sm:col-span-2">
              <InfoRow
                icon={<MapPin className="h-3.5 w-3.5" />}
                label="Address"
                value={application.address}
              />
            </div>
            <InfoRow
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="City"
              value={application.city}
            />
            <InfoRow
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="State"
              value={application.state}
            />
            <InfoRow
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Pincode"
              value={application.pincode}
            />
          </Section>
        </motion.div>

        {(application.previousSchool || application.previousClass) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Section title="Previous Academic Details">
              <InfoRow
                icon={<School className="h-3.5 w-3.5" />}
                label="Previous School"
                value={application.previousSchool}
              />
              <InfoRow
                icon={<BookOpen className="h-3.5 w-3.5" />}
                label="Previous Class"
                value={application.previousClass}
              />
            </Section>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <Section title="Guardian Information">
            <InfoRow
              icon={<Users className="h-3.5 w-3.5" />}
              label="Guardian Name"
              value={`${application.guardianFirstName} ${application.guardianLastName}`}
            />
            <InfoRow
              icon={<Users className="h-3.5 w-3.5" />}
              label="Relation"
              value={application.guardianRelation}
            />
            <InfoRow
              icon={<Phone className="h-3.5 w-3.5" />}
              label="Phone"
              value={application.guardianPhone}
            />
            <InfoRow
              icon={<Mail className="h-3.5 w-3.5" />}
              label="Email"
              value={application.guardianEmail}
            />
          </Section>
        </motion.div>

        {application.documents && application.documents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="rounded-2xl border border-white/8 bg-white/3 p-5"
          >
            <p className="mb-4 font-manrope text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Documents
            </p>
            <div className="space-y-2">
              {application.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.secureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 p-3 transition-colors hover:border-indigo-500/30 hover:bg-indigo-500/5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/5">
                    <FileText className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-jakarta text-sm font-medium text-white truncate">
                      {doc.title}
                    </p>
                    <p className="font-manrope text-[11px] text-white/30">
                      {doc.documentType.replace(/_/g, " ")} ·{" "}
                      {doc.format?.toUpperCase()}
                      {doc.sizeBytes
                        ? ` · ${(doc.sizeBytes / 1024).toFixed(1)} KB`
                        : ""}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {application.waitlistPosition && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5"
          >
            <p className="mb-2 font-manrope text-[10px] font-semibold uppercase tracking-widest text-indigo-400/60">
              Waitlist Position
            </p>
            <p className="font-jakarta text-2xl font-extrabold text-indigo-400">
              #{application.waitlistPosition}
            </p>
          </motion.div>
        )}

        {application.slotOfferedAt && application.slotExpiresAt && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5"
          >
            <p className="mb-3 font-manrope text-[10px] font-semibold uppercase tracking-widest text-cyan-400/60">
              Slot Offer Details
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow
                icon={<Timer className="h-3.5 w-3.5" />}
                label="Offered On"
                value={formatDate(application.slotOfferedAt)}
              />
              <InfoRow
                icon={<Timer className="h-3.5 w-3.5" />}
                label="Offer Expires On"
                value={formatDate(application.slotExpiresAt)}
              />
            </div>
          </motion.div>
        )}

        {(application.rejectionReason ||
          (application.waitlistReason &&
            application.waitlistReason !== "CLASS_FULL")) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.32 }}
            className={`rounded-2xl border p-5 ${
              application.status === "REJECTED"
                ? "border-red-500/20 bg-red-500/5"
                : "border-yellow-500/20 bg-yellow-500/5"
            }`}
          >
            <p
              className={`mb-2 font-manrope text-[10px] font-semibold uppercase tracking-widest ${
                application.status === "REJECTED"
                  ? "text-red-400/60"
                  : "text-yellow-400/60"
              }`}
            >
              {application.status === "REJECTED"
                ? "Rejection Reason"
                : "Waitlist Reason"}
            </p>
            <p className="font-manrope text-sm text-white/70">
              {application.rejectionReason ?? application.waitlistReason}
            </p>
          </motion.div>
        )}

        {application.histories && application.histories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="rounded-2xl border border-white/8 bg-white/3"
          >
            <button
              type="button"
              onClick={() => setHistoryOpen((p) => !p)}
              className="flex w-full items-center justify-between px-5 py-4"
            >
              <p className="font-manrope text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Status History ({application.histories.length})
              </p>
              <ChevronDown
                className={`h-4 w-4 text-white/30 transition-transform duration-200 ${historyOpen ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {historyOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 px-5 pb-5">
                    {application.histories.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-manrope text-xs text-white/40">
                            {h.previousStatus}
                          </span>
                          <ChevronDown className="h-3 w-3 -rotate-90 text-white/20" />
                          <span className="font-manrope text-xs font-semibold text-white">
                            {h.status}
                          </span>
                        </div>
                        <span className="font-manrope text-[11px] text-white/30">
                          {formatDate(h.changedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="space-y-3"
          >
            {isWaitlisted && (
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
                <p className="font-manrope text-xs text-indigo-400/70">
                  This application is waitlisted. You can approve it by
                  assigning a section directly, or reject it to remove it from
                  the waitlist and notify the guardian.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => setActiveModal("approve")}
                disabled={isActionPending}
                className="h-11 flex-1 rounded-xl border-0 bg-emerald-600 font-jakarta text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500"
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
              {isPending && (
                <Button
                  type="button"
                  onClick={() => setActiveModal("waitlist")}
                  disabled={isActionPending}
                  className="h-11 flex-1 rounded-xl border border-yellow-500/30 bg-yellow-500/10 font-jakarta text-sm font-bold text-yellow-400 hover:bg-yellow-500/20"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Waitlist
                </Button>
              )}
              <Button
                type="button"
                onClick={() => setActiveModal("reject")}
                disabled={isActionPending}
                className="h-11 flex-1 rounded-xl border border-red-500/30 bg-red-500/10 font-jakarta text-sm font-bold text-red-400 hover:bg-red-500/20"
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {activeModal && (
          <ActionModal
            type={activeModal}
            appliedForClass={application.appliedForClass}
            onClose={() => setActiveModal(null)}
            onConfirm={handleConfirm}
            isPending={isActionPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdmissionApplicationDetailPage;
