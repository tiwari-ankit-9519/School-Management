"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ListOrdered,
  Search,
  SearchX,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CARD_CLASS,
  TONE_CLASSES,
  fadeUp,
} from "@/components/dashboard/DashboardWidgets";
import {
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import { useGetTeacherApplicationStatusForTeacher } from "@/hooks/useTeacher";
import { useTranslations } from "@/hooks/useTranslations";
import { ApplicationStatus } from "@/types";

const STATUS_META = {
  [ApplicationStatus.PENDING]: {
    icon: Clock,
    tone: "amber",
    glow: "from-amber-500/15",
    labelKey: "statusPending",
    headlineKey: "headlinePending",
    messageKey: "pendingMessage",
    nextKeys: ["nextPending1", "nextPending2", "nextPending3"],
  },
  [ApplicationStatus.SHORTLISTED]: {
    icon: ListOrdered,
    tone: "indigo",
    glow: "from-indigo-500/15",
    labelKey: "statusShortlisted",
    headlineKey: "headlineShortlisted",
    messageKey: "shortlistedMessage",
    nextKeys: ["nextShortlisted1", "nextShortlisted2", "nextShortlisted3"],
  },
  [ApplicationStatus.SELECTED]: {
    icon: CheckCircle2,
    tone: "emerald",
    glow: "from-emerald-500/15",
    labelKey: "statusSelected",
    headlineKey: "headlineSelected",
    messageKey: "selectedMessage",
    nextKeys: ["nextSelected1", "nextSelected2", "nextSelected3"],
  },
  [ApplicationStatus.REJECTED]: {
    icon: XCircle,
    tone: "red",
    glow: "from-red-500/15",
    labelKey: "statusRejected",
    headlineKey: "headlineRejected",
    messageKey: "rejectedMessage",
    nextKeys: ["nextRejected1", "nextRejected2", "nextRejected3"],
  },
} as const;

type StepState = "done" | "current" | "upcoming" | "rejected" | "skipped";

interface Step {
  key: string;
  labelKey:
    | "stepSubmitted"
    | "stepReview"
    | "stepShortlisted"
    | "stepDecision"
    | "stepSelected"
    | "stepRejected";
  state: StepState;
}

const buildSteps = (status: ApplicationStatus): Step[] => {
  const isPending = status === ApplicationStatus.PENDING;
  const isShortlisted = status === ApplicationStatus.SHORTLISTED;
  const isSelected = status === ApplicationStatus.SELECTED;
  const isRejected = status === ApplicationStatus.REJECTED;
  return [
    { key: "submitted", labelKey: "stepSubmitted", state: "done" },
    {
      key: "review",
      labelKey: "stepReview",
      state: isPending ? "current" : "done",
    },
    {
      key: "shortlisted",
      labelKey: "stepShortlisted",
      state: isShortlisted
        ? "current"
        : isSelected
          ? "done"
          : isRejected
            ? "skipped"
            : "upcoming",
    },
    {
      key: "decision",
      labelKey: isSelected
        ? "stepSelected"
        : isRejected
          ? "stepRejected"
          : "stepDecision",
      state: isSelected ? "done" : isRejected ? "rejected" : "upcoming",
    },
  ];
};

const STEP_CIRCLE_CLASS: Record<StepState, string> = {
  done: "bg-emerald-500 text-white",
  current: "bg-indigo-600 text-white ring-4 ring-indigo-500/20",
  upcoming: "border border-border bg-muted text-muted-foreground",
  rejected: "bg-red-500 text-white",
  skipped:
    "border border-dashed border-border bg-transparent text-muted-foreground/60",
};

const RELATIVE_FORMAT = new Intl.RelativeTimeFormat("en-IN", {
  numeric: "auto",
});

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatRelative = (iso: string, now: number) => {
  const diffMinutes = Math.round((new Date(iso).getTime() - now) / 60_000);
  if (Math.abs(diffMinutes) < 60)
    return RELATIVE_FORMAT.format(diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24)
    return RELATIVE_FORMAT.format(diffHours, "hour");
  return RELATIVE_FORMAT.format(Math.round(diffHours / 24), "day");
};

const TrackAnotherCard = ({ delay }: { delay: number }) => {
  const t = useTranslations("teacherApplicationStatus");
  const router = useRouter();
  const [value, setValue] = useState("");

  const handleTrack = () => {
    const trimmed = value.trim();
    if (trimmed) router.push(`/teacher-application/status/${trimmed}`);
  };

  return (
    <motion.div {...fadeUp(delay)}>
      <Card className={`${CARD_CLASS} gap-3 p-5`}>
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${TONE_CLASSES.violet}`}
          >
            <Search className="size-4" />
          </span>
          <div>
            <h3 className="font-jakarta text-sm font-semibold text-foreground">
              {t("trackAnotherTitle")}
            </h3>
            <p className="font-manrope text-xs text-muted-foreground">
              {t("trackAnotherSub")}
            </p>
          </div>
        </div>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleTrack();
          }}
          placeholder={t("trackPlaceholder")}
          aria-label={t("trackPlaceholder")}
          className={fieldClass(false)}
        />
        <Button
          type="button"
          onClick={handleTrack}
          disabled={!value.trim()}
          className={`h-10 w-full gap-2 text-sm ${PRIMARY_PILL_CLASS}`}
        >
          <Search className="size-4" />
          {t("trackButton")}
        </Button>
      </Card>
    </motion.div>
  );
};

const StatusSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
    <div className="space-y-4 lg:col-span-2">
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-44 rounded-2xl" />
    </div>
  </div>
);

const TeacherApplicationStatusPage = () => {
  const t = useTranslations("teacherApplicationStatus");
  const params = useParams<{ id: string }>();
  const applicationId = params?.id ?? "";
  const [now] = useState(() => Date.now());

  const { data, isLoading, isError } =
    useGetTeacherApplicationStatusForTeacher(applicationId);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(applicationId);
      toast.success(t("idCopied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const meta = data ? STATUS_META[data.status] : undefined;
  const StatusIcon = meta?.icon ?? Clock;
  const steps = data ? buildSteps(data.status) : [];

  return (
    <div className="relative min-h-screen w-full bg-background px-4 pt-24 pb-10 sm:px-8 sm:pt-28">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(99,102,241,0.08),transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        <motion.header
          {...fadeUp(0)}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="icon"
              aria-label={t("backToForm")}
              className={`h-11 w-11 shrink-0 ${OUTLINE_PILL_CLASS}`}
            >
              <Link href="/teacher-application">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <h1 className="font-jakarta text-3xl font-bold tracking-tight text-foreground">
                {t("pageTitle")}
              </h1>
              <p className="mt-0.5 font-manrope text-sm text-muted-foreground">
                {t("pageSubtitle")}
              </p>
            </div>
          </div>
          {meta && (
            <Badge
              variant="outline"
              className={`gap-1.5 self-start rounded-full px-3 py-1 font-manrope text-xs font-medium sm:self-auto ${TONE_CLASSES[meta.tone]}`}
            >
              <StatusIcon className="size-3.5" />
              {t(meta.labelKey)}
            </Badge>
          )}
        </motion.header>

        {isLoading ? (
          <StatusSkeleton />
        ) : isError || !data || !meta ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <motion.div {...fadeUp(0.05)} className="lg:col-span-2">
              <Card
                className={`${CARD_CLASS} h-full items-center justify-center gap-4 px-6 py-16 text-center`}
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${TONE_CLASSES.red}`}
                >
                  <SearchX className="size-6" />
                </span>
                <div>
                  <p className="font-jakarta text-lg font-semibold text-foreground">
                    {t("errorTitle")}
                  </p>
                  <p className="mt-1 font-manrope text-sm text-muted-foreground">
                    {t("errorSubtitle")}
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className={`h-10 gap-2 px-5 text-sm ${OUTLINE_PILL_CLASS}`}
                >
                  <Link href="/teacher-application">
                    <ArrowLeft className="size-4" />
                    {t("backToForm")}
                  </Link>
                </Button>
              </Card>
            </motion.div>
            <TrackAnotherCard delay={0.1} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <motion.div {...fadeUp(0.05)}>
                <Card
                  className={`${CARD_CLASS} relative overflow-hidden p-6 sm:p-8`}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-linear-to-br ${meta.glow} via-transparent to-transparent`}
                  />
                  <svg
                    className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 text-foreground"
                    viewBox="0 0 200 200"
                    fill="none"
                    aria-hidden="true"
                  >
                    {[40, 60, 80, 100].map((r) => (
                      <circle
                        key={r}
                        cx="100"
                        cy="100"
                        r={r}
                        stroke="currentColor"
                        strokeOpacity="0.06"
                      />
                    ))}
                  </svg>
                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
                    <span
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border ${TONE_CLASSES[meta.tone]}`}
                    >
                      <StatusIcon className="size-7" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-jakarta text-2xl font-bold text-foreground sm:text-3xl">
                        {t(meta.headlineKey)}
                      </h2>
                      <p className="mt-1.5 max-w-xl font-manrope text-sm leading-relaxed text-muted-foreground">
                        {t(meta.messageKey)}
                      </p>
                      <p className="mt-4 flex flex-wrap items-center gap-1.5 font-manrope text-xs text-muted-foreground">
                        <Clock className="size-3.5" />
                        {t("lastUpdated")} {formatDateTime(data.updatedAt)}
                        <span className="text-muted-foreground/60">·</span>
                        {formatRelative(data.updatedAt, now)}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div {...fadeUp(0.1)}>
                <Card className={`${CARD_CLASS} p-5 sm:p-6`}>
                  <h3 className="mb-6 font-jakarta text-base font-semibold text-foreground">
                    {t("progressTitle")}
                  </h3>
                  <ol className="grid grid-cols-4">
                    {steps.map((step, i) => {
                      const next = steps[i + 1];
                      const lineDone =
                        next &&
                        (next.state === "done" ||
                          next.state === "current" ||
                          next.state === "rejected");
                      return (
                        <li
                          key={step.key}
                          className="relative flex flex-col items-center text-center"
                        >
                          {next && (
                            <span
                              aria-hidden="true"
                              className={`absolute top-4 left-1/2 h-0.5 w-full ${
                                lineDone ? "bg-emerald-500" : "bg-border"
                              }`}
                            />
                          )}
                          <span
                            className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${STEP_CIRCLE_CLASS[step.state]}`}
                          >
                            {step.state === "done" && (
                              <Check className="size-4" />
                            )}
                            {step.state === "rejected" && (
                              <X className="size-4" />
                            )}
                            {step.state === "current" && (
                              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                            )}
                            {(step.state === "upcoming" ||
                              step.state === "skipped") && (
                              <span className="font-manrope text-xs font-semibold">
                                {i + 1}
                              </span>
                            )}
                          </span>
                          <span
                            className={`mt-2.5 px-1 font-manrope text-[11px] leading-tight sm:text-xs ${
                              step.state === "current"
                                ? "font-semibold text-foreground"
                                : step.state === "rejected"
                                  ? "font-semibold text-red-600 dark:text-red-400"
                                  : step.state === "done"
                                    ? "text-foreground/80"
                                    : "text-muted-foreground"
                            } ${step.state === "skipped" ? "line-through" : ""}`}
                          >
                            {t(step.labelKey)}
                          </span>
                          {step.state === "current" && (
                            <Badge
                              variant="outline"
                              className={`mt-1.5 rounded-full px-1.5 font-manrope text-[10px] ${TONE_CLASSES.indigo}`}
                            >
                              {t("currentStage")}
                            </Badge>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </Card>
              </motion.div>

              {data.status === ApplicationStatus.REJECTED && (
                <motion.div {...fadeUp(0.15)}>
                  <Card
                    className={`gap-2 rounded-2xl border p-5 shadow-none ${TONE_CLASSES.red}`}
                  >
                    <p className="font-manrope text-[11px] font-semibold tracking-widest uppercase opacity-80">
                      {t("rejectionReasonLabel")}
                    </p>
                    <p className="font-manrope text-sm leading-relaxed">
                      {data.rejectionReason || t("noReasonProvided")}
                    </p>
                  </Card>
                </motion.div>
              )}
            </div>

            <div className="space-y-4">
              <motion.div {...fadeUp(0.1)}>
                <Card className={`${CARD_CLASS} gap-2 p-5`}>
                  <p className="font-manrope text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
                    {t("applicationIdLabel")}
                  </p>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 py-1.5 pr-1.5 pl-3">
                    <code className="min-w-0 flex-1 truncate font-mono text-sm text-foreground">
                      {applicationId}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copyId}
                      aria-label={t("copyId")}
                      className={`h-8 w-8 shrink-0 ${OUTLINE_PILL_CLASS}`}
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </Card>
              </motion.div>

              <motion.div {...fadeUp(0.15)}>
                <Card className={`${CARD_CLASS} gap-4 p-5`}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-jakarta text-sm font-semibold text-foreground">
                      {t("nextStepsTitle")}
                    </h3>
                  </div>
                  <ol className="space-y-3">
                    {meta.nextKeys.map((key, i) => (
                      <li key={key} className="flex gap-3">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-manrope text-[11px] font-semibold ${TONE_CLASSES[meta.tone]}`}
                        >
                          {i + 1}
                        </span>
                        <p className="font-manrope text-sm leading-relaxed text-foreground/80">
                          {t(key)}
                        </p>
                      </li>
                    ))}
                  </ol>
                </Card>
              </motion.div>

              <TrackAnotherCard delay={0.2} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherApplicationStatusPage;
