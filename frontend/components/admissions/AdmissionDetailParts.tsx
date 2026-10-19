"use client";
import { ReactNode, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  DoorOpen,
  ExternalLink,
  FileImage,
  FileText,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CARD_CLASS,
  TONE_CLASSES,
  Tone,
  fadeUp,
} from "@/components/dashboard/DashboardWidgets";
import { STATUS_CONFIG } from "@/components/admissions/AdmissionsListParts";
import { useGetAdmissionClasses } from "@/hooks/useAdmission";
import { useTranslations } from "@/hooks/useTranslations";
import {
  AdmissionApplicationHistory,
  AdmissionStatus,
  Document as ApplicationDocument,
} from "@/types";

export type ActionType = "approve" | "reject" | "waitlist";

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatEnum = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return null;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

interface SectionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  tone?: Tone;
  delay: number;
  children: ReactNode;
}

export const SectionCard = ({
  title,
  description,
  icon,
  tone = "indigo",
  delay,
  children,
}: SectionCardProps) => (
  <motion.div {...fadeUp(delay)}>
    <Card className={`${CARD_CLASS} p-5`}>
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${TONE_CLASSES[tone]}`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="font-jakarta text-base font-semibold text-foreground">
            {title}
          </h3>
          <p className="font-manrope text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </Card>
  </motion.div>
);

interface InfoTileProps {
  icon: ReactNode;
  label: string;
  value: string | null | undefined;
  className?: string;
}

export const InfoTile = ({ icon, label, value, className }: InfoTileProps) => {
  const t = useTranslations("admissionDetail");
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3.5 ${className ?? ""}`}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background text-indigo-600 ring-1 ring-border dark:text-indigo-400">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-manrope text-[11px] text-muted-foreground">
          {label}
        </p>
        {value ? (
          <p className="mt-0.5 font-jakarta text-sm font-medium wrap-break-word text-foreground">
            {value}
          </p>
        ) : (
          <p className="mt-0.5 font-manrope text-sm text-muted-foreground/70 italic">
            {t("notProvided")}
          </p>
        )}
      </div>
    </div>
  );
};

export const DocumentTile = ({ doc }: { doc: ApplicationDocument }) => {
  const t = useTranslations("admissionDetail");
  const isImage = doc.resourceType === "image";
  const Icon = isImage ? FileImage : FileText;
  const meta = [doc.format?.toUpperCase(), formatFileSize(doc.sizeBytes)]
    .filter(Boolean)
    .join(" · ");

  return (
    <a
      href={doc.secureUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${t("openDocument")}: ${doc.title}`}
      className="group flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3.5 transition-all hover:-translate-y-0.5 hover:border-indigo-500/40 hover:bg-indigo-500/5"
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
          isImage ? TONE_CLASSES.emerald : TONE_CLASSES.indigo
        }`}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-jakarta text-sm font-medium text-foreground">
          {doc.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className="rounded-md border-border bg-background px-1.5 font-manrope text-[10px] text-muted-foreground"
          >
            {formatEnum(doc.documentType)}
          </Badge>
          {meta && (
            <span className="font-manrope text-[11px] text-muted-foreground">
              {meta}
            </span>
          )}
        </div>
      </div>
      <ExternalLink className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
    </a>
  );
};

interface StatusTimelineProps {
  appliedAt: string;
  histories: AdmissionApplicationHistory[];
}

export const StatusTimeline = ({
  appliedAt,
  histories,
}: StatusTimelineProps) => {
  const t = useTranslations("admissionDetail");
  const tList = useTranslations("admissionsList");
  const sorted = [...histories].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
  );

  const statusLabel = (status: AdmissionStatus) =>
    STATUS_CONFIG[status]
      ? tList(STATUS_CONFIG[status].labelKey)
      : formatEnum(status);

  return (
    <ol className="relative space-y-5">
      <span
        aria-hidden="true"
        className="absolute top-2 bottom-2 left-1.75 w-px bg-border"
      />
      <li className="relative flex gap-3">
        <span className="relative z-10 mt-1 h-3.75 w-3.75 shrink-0 rounded-full border-[3px] border-card bg-indigo-500 ring-1 ring-border" />
        <div className="min-w-0">
          <p className="font-jakarta text-sm font-medium text-foreground">
            {t("timelineSubmitted")}
          </p>
          <p className="font-manrope text-[11px] text-muted-foreground">
            {formatDateTime(appliedAt)}
          </p>
        </div>
      </li>
      {sorted.map((entry) => (
        <li key={entry.id} className="relative flex gap-3">
          <span
            className={`relative z-10 mt-1 h-3.75 w-3.75 shrink-0 rounded-full border-[3px] border-card ring-1 ring-border ${
              STATUS_CONFIG[entry.status]?.dot ?? "bg-muted-foreground"
            }`}
          />
          <div className="min-w-0">
            <p className="font-jakarta text-sm font-medium text-foreground">
              {statusLabel(entry.status)}
            </p>
            <p className="font-manrope text-[11px] text-muted-foreground">
              {t("timelineFrom")} {statusLabel(entry.previousStatus)} ·{" "}
              {formatDateTime(entry.changedAt)}
            </p>
            {entry.rejectionReason && (
              <p className="mt-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 font-manrope text-xs text-foreground/80">
                {entry.rejectionReason}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
};

const DIALOG_CONFIG = {
  approve: {
    titleKey: "dialogApproveTitle",
    subKey: "dialogApproveSub",
    confirmKey: "confirmApprove",
    buttonClass: "bg-emerald-600 text-white hover:bg-emerald-500",
  },
  reject: {
    titleKey: "dialogRejectTitle",
    subKey: "dialogRejectSub",
    confirmKey: "confirmReject",
    buttonClass: "bg-red-600 text-white hover:bg-red-500",
  },
  waitlist: {
    titleKey: "dialogWaitlistTitle",
    subKey: "dialogWaitlistSub",
    confirmKey: "confirmWaitlist",
    buttonClass: "bg-amber-500 text-amber-950 hover:bg-amber-400",
  },
} as const;

const MIN_REASON_LENGTH = 10;

interface ActionDialogProps {
  type: ActionType | null;
  appliedForClass: string;
  onClose: () => void;
  onConfirm: (reason?: string, classId?: string) => void;
  isPending: boolean;
}

export const ActionDialog = ({
  type,
  appliedForClass,
  onClose,
  onConfirm,
  isPending,
}: ActionDialogProps) => {
  const t = useTranslations("admissionDetail");
  const [reason, setReason] = useState("");
  const [classId, setClassId] = useState("");
  const [error, setError] = useState("");

  const { data: classes = [], isLoading: isClassesLoading } =
    useGetAdmissionClasses(type === "approve" ? appliedForClass : "");

  if (!type) return null;
  const config = DIALOG_CONFIG[type];
  const reasonLength = reason.trim().length;

  const handleConfirm = () => {
    if (type === "approve" && !classId) {
      setError(t("errorSelectSection"));
      return;
    }
    if (type !== "approve" && reasonLength < MIN_REASON_LENGTH) {
      setError(t("errorReasonLength"));
      return;
    }
    setError("");
    onConfirm(
      type === "approve" ? undefined : reason.trim(),
      classId || undefined,
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-jakarta text-lg font-bold text-foreground">
            {t(config.titleKey)}
          </DialogTitle>
          <DialogDescription className="font-manrope text-sm text-muted-foreground">
            {t(config.subKey)}
          </DialogDescription>
        </DialogHeader>

        {type === "approve" ? (
          <div className="space-y-1.5">
            <Label
              htmlFor="admission-section"
              className="font-manrope text-xs text-foreground/70"
            >
              {t("selectSection")}
            </Label>
            <Select
              value={classId}
              onValueChange={(value: string) => {
                setClassId(value);
                setError("");
              }}
              disabled={isClassesLoading || classes.length === 0}
            >
              <SelectTrigger
                id="admission-section"
                className="h-11 w-full rounded-xl border-input bg-background font-manrope text-sm data-[size=default]:h-11"
              >
                <SelectValue
                  placeholder={
                    isClassesLoading
                      ? t("loadingSections")
                      : classes.length === 0
                        ? t("noSections")
                        : t("sectionPlaceholder")
                  }
                />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {classes.map((cls) => (
                  <SelectItem
                    key={cls.id}
                    value={cls.id}
                    className="py-2.5 font-manrope text-sm"
                  >
                    <span className="flex w-full items-center gap-2">
                      <span className="font-medium">
                        {t("classLabel")} {cls.name}
                        {cls.section
                          ? ` · ${t("sectionLabel")} ${cls.section}`
                          : ""}
                      </span>
                      {cls.roomNumber && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <DoorOpen className="size-3" />
                          {cls.roomNumber}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={`ml-auto rounded-md px-1.5 text-[10px] ${
                          cls.remaining === 0
                            ? TONE_CLASSES.red
                            : TONE_CLASSES.emerald
                        }`}
                      >
                        {cls.remaining === 0
                          ? t("classFull")
                          : `${cls.remaining} ${t("seatsLeft")}`}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="admission-reason"
                className="font-manrope text-xs text-foreground/70"
              >
                {t("reasonLabel")}
              </Label>
              <span
                className={`font-manrope text-[11px] ${
                  reasonLength >= MIN_REASON_LENGTH
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                }`}
              >
                {reasonLength}/{MIN_REASON_LENGTH}
              </span>
            </div>
            <Textarea
              id="admission-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              placeholder={t("reasonPlaceholder")}
              rows={4}
              className="resize-none rounded-xl border-input bg-background font-manrope text-sm focus-visible:border-indigo-500 focus-visible:ring-0"
            />
          </div>
        )}

        {error && (
          <p className="flex items-center gap-1.5 font-manrope text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="size-3.5 shrink-0" />
            {error}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 flex-1 rounded-full border-border bg-transparent font-manrope text-sm shadow-none hover:bg-accent"
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || (type === "approve" && isClassesLoading)}
            className={`h-11 flex-1 gap-2 rounded-full font-manrope text-sm font-semibold shadow-none ${config.buttonClass}`}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("processing")}
              </>
            ) : (
              t(config.confirmKey)
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const DetailSkeleton = () => (
  <div className="space-y-5">
    <div className="space-y-3">
      <Skeleton className="h-8 w-40 rounded-full" />
      <Skeleton className="h-10 w-80" />
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </div>
  </div>
);
