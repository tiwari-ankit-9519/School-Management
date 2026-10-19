"use client";
import { useState } from "react";
import { AlertCircle, Check, Loader2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TONE_CLASSES } from "@/components/dashboard/DashboardWidgets";
import { OUTLINE_PILL_CLASS } from "@/components/forms/FormParts";
import { STATUS_CONFIG } from "@/components/teacher-applications/TeacherApplicationsParts";
import { formatEnum } from "@/components/admissions/AdmissionDetailParts";
import { useTranslations } from "@/hooks/useTranslations";
import { ApplicationStatus, TeacherApplicationHistory } from "@/types";

export type TeacherActionType = "shortlist" | "approve" | "reject";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface TeacherStatusTimelineProps {
  appliedAt: string;
  histories: TeacherApplicationHistory[];
}

export const TeacherStatusTimeline = ({
  appliedAt,
  histories,
}: TeacherStatusTimelineProps) => {
  const t = useTranslations("teacherApplicationDetail");
  const tList = useTranslations("teacherApplications");
  const sorted = [...histories].sort(
    (a, b) => new Date(a.changedAt).getTime() - new Date(b.changedAt).getTime(),
  );

  const statusLabel = (status: ApplicationStatus) =>
    STATUS_CONFIG[status]
      ? tList(STATUS_CONFIG[status].labelKey)
      : formatEnum(status);

  return (
    <ol className="relative space-y-5">
      <span
        aria-hidden="true"
        className="absolute top-2 bottom-2 left-[7px] w-px bg-border"
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
  shortlist: {
    titleKey: "dialogShortlistTitle",
    subKey: "dialogShortlistSub",
    confirmKey: "confirmShortlist",
    icon: ShieldCheck,
    tone: TONE_CLASSES.indigo,
    buttonClass: "bg-indigo-600 text-white hover:bg-indigo-500",
    needsReason: false,
  },
  approve: {
    titleKey: "dialogApproveTitle",
    subKey: "dialogApproveSub",
    confirmKey: "confirmApprove",
    icon: Check,
    tone: TONE_CLASSES.emerald,
    buttonClass: "bg-emerald-600 text-white hover:bg-emerald-500",
    needsReason: false,
  },
  reject: {
    titleKey: "dialogRejectTitle",
    subKey: "dialogRejectSub",
    confirmKey: "confirmReject",
    icon: X,
    tone: TONE_CLASSES.red,
    buttonClass: "bg-red-600 text-white hover:bg-red-500",
    needsReason: true,
  },
} as const;

const MIN_REASON_LENGTH = 10;

interface TeacherActionDialogProps {
  type: TeacherActionType | null;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  isPending: boolean;
}

export const TeacherActionDialog = ({
  type,
  onClose,
  onConfirm,
  isPending,
}: TeacherActionDialogProps) => {
  const t = useTranslations("teacherApplicationDetail");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!type) return null;
  const config = DIALOG_CONFIG[type];
  const Icon = config.icon;
  const reasonLength = reason.trim().length;

  const handleConfirm = () => {
    if (config.needsReason && reasonLength < MIN_REASON_LENGTH) {
      setError(t("errorReasonLength"));
      return;
    }
    setError("");
    onConfirm(config.needsReason ? reason.trim() : undefined);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-4 space-y-0 text-left">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${config.tone}`}
          >
            <Icon className="size-5" />
          </span>
          <div className="space-y-1">
            <DialogTitle className="font-jakarta text-lg font-bold text-foreground">
              {t(config.titleKey)}
            </DialogTitle>
            <DialogDescription className="font-manrope text-sm text-muted-foreground">
              {t(config.subKey)}
            </DialogDescription>
          </div>
        </DialogHeader>

        {config.needsReason && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="teacher-reject-reason"
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
              id="teacher-reject-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              placeholder={t("reasonPlaceholder")}
              rows={4}
              className="resize-none rounded-xl border-input bg-background font-manrope text-sm focus-visible:border-indigo-500 focus-visible:ring-0 dark:bg-background"
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
            className={`h-11 flex-1 text-sm ${OUTLINE_PILL_CLASS}`}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
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
