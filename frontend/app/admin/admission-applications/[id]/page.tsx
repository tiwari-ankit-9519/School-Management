"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CalendarDays,
  Check,
  Clock,
  Copy,
  FileText,
  GraduationCap,
  History,
  Info,
  Mail,
  MapPin,
  Phone,
  School,
  Timer,
  User,
  Users,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  CARD_CLASS,
  TONE_CLASSES,
  fadeUp,
} from "@/components/dashboard/DashboardWidgets";
import {
  DETAIL_PATH,
  StatusBadge,
} from "@/components/admissions/AdmissionsListParts";
import {
  ActionDialog,
  ActionType,
  DetailSkeleton,
  DocumentTile,
  InfoTile,
  SectionCard,
  StatusTimeline,
  formatDate,
  formatEnum,
} from "@/components/admissions/AdmissionDetailParts";
import {
  useApproveAdmissionApplication,
  useGetAdmissionApplication,
  useRejectAdmissionApplication,
  useWaitlistAdmissionApplication,
} from "@/hooks/useAdmission";
import { useTranslations } from "@/hooks/useTranslations";
import { AdmissionStatus } from "@/types";

const getAge = (dob: string, now: number) => {
  const birth = new Date(dob);
  const today = new Date(now);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()))
    age--;
  return age;
};

const getInitials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

const AdmissionApplicationDetailPage = () => {
  const t = useTranslations("admissionDetail");
  const params = useParams<{ id: string }>();
  const applicationId = params?.id ?? "";
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [now] = useState(() => Date.now());

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

  const closeDialog = () => setActiveAction(null);

  const handleConfirm = (reason?: string, classId?: string) => {
    if (!applicationId) return;
    if (activeAction === "approve" && classId) {
      approve({ applicationId, classId }, { onSuccess: closeDialog });
    } else if (activeAction === "reject" && reason) {
      reject(
        { applicationId, rejectionReason: reason },
        { onSuccess: closeDialog },
      );
    } else if (activeAction === "waitlist" && reason) {
      waitlist(
        { applicationId, waitlistReason: reason },
        { onSuccess: closeDialog },
      );
    }
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(applicationId);
      toast.success(t("idCopied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const backButton = (
    <Button
      asChild
      variant="ghost"
      className="h-9 gap-1.5 rounded-full px-3 font-manrope text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      <Link href={DETAIL_PATH}>
        <ArrowLeft className="size-4" />
        {t("backToList")}
      </Link>
    </Button>
  );

  if (isLoading) return <DetailSkeleton />;

  if (isError || !application) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card
          className={`${CARD_CLASS} w-full max-w-sm items-center gap-4 px-6 py-8 text-center`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertCircle className="size-5" />
          </span>
          <div>
            <p className="font-jakarta text-base font-semibold text-foreground">
              {t("notFoundTitle")}
            </p>
            <p className="mt-1 font-manrope text-sm text-muted-foreground">
              {t("notFoundSub")}
            </p>
          </div>
          {backButton}
        </Card>
      </div>
    );
  }

  const status = application.status;
  const isPendingStatus = status === AdmissionStatus.PENDING;
  const isWaitlisted = status === AdmissionStatus.WAITLISTED;
  const showActions = isPendingStatus || isWaitlisted;
  const fullName = `${application.firstName} ${application.lastName}`;
  const guardianName = `${application.guardianFirstName} ${application.guardianLastName}`;
  const age = getAge(application.dateOfBirth, now);
  const documents = application.documents ?? [];
  const histories = application.histories ?? [];
  const showWaitlistReason =
    !!application.waitlistReason && application.waitlistReason !== "CLASS_FULL";
  const hasStatusDetails =
    !!application.waitlistPosition ||
    !!(application.slotOfferedAt && application.slotExpiresAt) ||
    !!application.rejectionReason ||
    showWaitlistReason;

  return (
    <div className="space-y-5">
      <motion.header {...fadeUp(0)} className="space-y-3 px-1">
        {backButton}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-jakarta text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("pageTitle")}
            </h1>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="truncate font-manrope text-xs text-muted-foreground">
                {t("applicationId")}: {application.id}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={copyId}
                aria-label={t("copyId")}
                className="h-7 w-7 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Copy className="size-3.5" />
              </Button>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </motion.header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <motion.div {...fadeUp(0.05)}>
            <Card className="relative gap-0 overflow-hidden rounded-2xl border-0 bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-800 p-6 text-white shadow-none">
              <svg
                className="pointer-events-none absolute -top-16 -right-16 h-64 w-64"
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
                    stroke="white"
                    strokeOpacity="0.1"
                  />
                ))}
              </svg>
              <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
                <Avatar className="h-20 w-20 rounded-2xl ring-4 ring-white/15">
                  {application.photoUrl && (
                    <AvatarImage
                      src={application.photoUrl}
                      alt={fullName}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="rounded-2xl bg-white/15 font-jakarta text-xl font-bold text-white">
                    {getInitials(application.firstName, application.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-jakarta text-2xl font-bold">
                      {fullName}
                    </h2>
                    <Badge className="rounded-full border-white/25 bg-white/15 font-manrope text-[11px] font-medium text-white">
                      {formatEnum(application.gender)}
                    </Badge>
                  </div>
                  <p className="mt-1 font-manrope text-sm text-white/80">
                    {t("appliedFor")} {t("classLabel")}{" "}
                    {application.appliedForClass} · {age} {t("yearsOld")}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      {
                        icon: CalendarDays,
                        text: `${t("appliedOn")} ${formatDate(application.appliedAt)}`,
                      },
                      { icon: Phone, text: application.guardianPhone },
                      { icon: MapPin, text: application.city },
                    ].map((chip) => (
                      <span
                        key={chip.text}
                        className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 font-manrope text-xs text-white/90"
                      >
                        <chip.icon className="size-3.5" />
                        {chip.text}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 md:max-w-56">
                  <Avatar className="h-11 w-11">
                    {application.guardianPhotoUrl && (
                      <AvatarImage
                        src={application.guardianPhotoUrl}
                        alt={guardianName}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-white/15 font-jakarta text-xs font-bold text-white">
                      {getInitials(
                        application.guardianFirstName,
                        application.guardianLastName,
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-manrope text-[10px] tracking-wider text-white/60 uppercase">
                      {t("guardianLabel")}
                    </p>
                    <p className="truncate font-jakarta text-sm font-semibold">
                      {guardianName}
                    </p>
                    <p className="font-manrope text-[11px] text-white/70">
                      {formatEnum(application.guardianRelation)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <SectionCard
            title={t("sectionStudent")}
            description={t("sectionStudentSub")}
            icon={<User className="size-4" />}
            delay={0.1}
          >
            <InfoTile
              icon={<User className="size-3.5" />}
              label={t("fullName")}
              value={fullName}
            />
            <InfoTile
              icon={<Users className="size-3.5" />}
              label={t("gender")}
              value={formatEnum(application.gender)}
            />
            <InfoTile
              icon={<Calendar className="size-3.5" />}
              label={t("dateOfBirth")}
              value={formatDate(application.dateOfBirth)}
            />
            <InfoTile
              icon={<GraduationCap className="size-3.5" />}
              label={t("appliedFor")}
              value={`${t("classLabel")} ${application.appliedForClass}`}
            />
          </SectionCard>

          <SectionCard
            title={t("sectionAddress")}
            description={t("sectionAddressSub")}
            icon={<MapPin className="size-4" />}
            tone="emerald"
            delay={0.15}
          >
            <InfoTile
              className="sm:col-span-2"
              icon={<MapPin className="size-3.5" />}
              label={t("address")}
              value={application.address}
            />
            <InfoTile
              icon={<MapPin className="size-3.5" />}
              label={t("city")}
              value={application.city}
            />
            <InfoTile
              icon={<MapPin className="size-3.5" />}
              label={t("state")}
              value={application.state}
            />
            <InfoTile
              icon={<MapPin className="size-3.5" />}
              label={t("pincode")}
              value={application.pincode}
            />
          </SectionCard>

          {(application.previousSchool || application.previousClass) && (
            <SectionCard
              title={t("sectionPrevious")}
              description={t("sectionPreviousSub")}
              icon={<School className="size-4" />}
              tone="amber"
              delay={0.2}
            >
              <InfoTile
                icon={<School className="size-3.5" />}
                label={t("previousSchool")}
                value={application.previousSchool}
              />
              <InfoTile
                icon={<BookOpen className="size-3.5" />}
                label={t("previousClass")}
                value={application.previousClass}
              />
            </SectionCard>
          )}

          <SectionCard
            title={t("sectionGuardian")}
            description={t("sectionGuardianSub")}
            icon={<Users className="size-4" />}
            tone="violet"
            delay={0.25}
          >
            <InfoTile
              icon={<User className="size-3.5" />}
              label={t("guardianName")}
              value={guardianName}
            />
            <InfoTile
              icon={<Users className="size-3.5" />}
              label={t("relation")}
              value={formatEnum(application.guardianRelation)}
            />
            <InfoTile
              icon={<Phone className="size-3.5" />}
              label={t("phone")}
              value={application.guardianPhone}
            />
            <InfoTile
              icon={<Mail className="size-3.5" />}
              label={t("email")}
              value={application.guardianEmail}
            />
          </SectionCard>

          <motion.div {...fadeUp(0.3)}>
            <Card className={`${CARD_CLASS} p-5`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border ${TONE_CLASSES.indigo}`}
                  >
                    <FileText className="size-4" />
                  </span>
                  <div>
                    <h3 className="font-jakarta text-base font-semibold text-foreground">
                      {t("sectionDocuments")}
                    </h3>
                    <p className="font-manrope text-xs text-muted-foreground">
                      {t("sectionDocumentsSub")}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full border-border bg-muted font-manrope text-[11px] text-foreground/70"
                >
                  {documents.length}
                </Badge>
              </div>
              {documents.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border py-8 text-center font-manrope text-sm text-muted-foreground">
                  {t("noDocuments")}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {documents.map((doc) => (
                    <DocumentTile key={doc.id} doc={doc} />
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <motion.div {...fadeUp(0.1)}>
            <Card className={`${CARD_CLASS} p-5`}>
              <h3 className="font-jakarta text-base font-semibold text-foreground">
                {t("decisionTitle")}
              </h3>
              {showActions ? (
                <>
                  <p className="mt-1 font-manrope text-xs leading-relaxed text-muted-foreground">
                    {isWaitlisted
                      ? t("decisionWaitlistedSub")
                      : t("decisionPendingSub")}
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Button
                      type="button"
                      onClick={() => setActiveAction("approve")}
                      disabled={isActionPending}
                      className="h-11 gap-2 rounded-full bg-emerald-600 font-manrope text-sm font-semibold text-white shadow-none hover:bg-emerald-500"
                    >
                      <Check className="size-4" />
                      {t("approve")}
                    </Button>
                    {isPendingStatus && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveAction("waitlist")}
                        disabled={isActionPending}
                        className={`h-11 gap-2 rounded-full font-manrope text-sm font-semibold shadow-none hover:opacity-80 ${TONE_CLASSES.amber}`}
                      >
                        <Clock className="size-4" />
                        {t("waitlist")}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveAction("reject")}
                      disabled={isActionPending}
                      className={`h-11 gap-2 rounded-full font-manrope text-sm font-semibold shadow-none hover:opacity-80 ${TONE_CLASSES.red}`}
                    >
                      <X className="size-4" />
                      {t("reject")}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="mt-3 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3.5">
                  <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="space-y-2">
                    <StatusBadge status={status} />
                    <p className="font-manrope text-xs leading-relaxed text-muted-foreground">
                      {t("decisionClosed")}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>

          {hasStatusDetails && (
            <motion.div {...fadeUp(0.15)}>
              <Card className={`${CARD_CLASS} gap-3 p-5`}>
                <h3 className="font-jakarta text-base font-semibold text-foreground">
                  {t("statusDetailsTitle")}
                </h3>
                {application.waitlistPosition && (
                  <div
                    className={`rounded-xl border p-3.5 ${TONE_CLASSES.violet}`}
                  >
                    <p className="font-manrope text-[11px] tracking-wider uppercase opacity-80">
                      {t("waitlistPosition")}
                    </p>
                    <p className="mt-1 font-jakarta text-3xl font-bold">
                      #{application.waitlistPosition}
                    </p>
                  </div>
                )}
                {application.slotOfferedAt && application.slotExpiresAt && (
                  <div
                    className={`space-y-2 rounded-xl border p-3.5 ${TONE_CLASSES.indigo}`}
                  >
                    <p className="flex items-center gap-1.5 font-manrope text-xs">
                      <Timer className="size-3.5" />
                      {t("slotOfferedOn")}{" "}
                      {formatDate(application.slotOfferedAt)}
                    </p>
                    <Separator className="bg-current opacity-15" />
                    <p className="flex items-center gap-1.5 font-manrope text-xs font-semibold">
                      <Timer className="size-3.5" />
                      {t("slotExpiresOn")}{" "}
                      {formatDate(application.slotExpiresAt)}
                    </p>
                  </div>
                )}
                {application.rejectionReason && (
                  <div
                    className={`rounded-xl border p-3.5 ${TONE_CLASSES.red}`}
                  >
                    <p className="font-manrope text-[11px] tracking-wider uppercase opacity-80">
                      {t("rejectionReason")}
                    </p>
                    <p className="mt-1 font-manrope text-sm">
                      {application.rejectionReason}
                    </p>
                  </div>
                )}
                {showWaitlistReason && (
                  <div
                    className={`rounded-xl border p-3.5 ${TONE_CLASSES.amber}`}
                  >
                    <p className="font-manrope text-[11px] tracking-wider uppercase opacity-80">
                      {t("waitlistReason")}
                    </p>
                    <p className="mt-1 font-manrope text-sm">
                      {application.waitlistReason}
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          <motion.div {...fadeUp(0.2)}>
            <Card className={`${CARD_CLASS} p-5`}>
              <div className="mb-4 flex items-center gap-2">
                <History className="size-4 text-muted-foreground" />
                <h3 className="font-jakarta text-base font-semibold text-foreground">
                  {t("timelineTitle")}
                </h3>
              </div>
              <StatusTimeline
                appliedAt={application.appliedAt}
                histories={histories}
              />
            </Card>
          </motion.div>
        </div>
      </div>

      <ActionDialog
        key={activeAction ?? "closed"}
        type={activeAction}
        appliedForClass={application.appliedForClass}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        isPending={isActionPending}
      />
    </div>
  );
};

export default AdmissionApplicationDetailPage;
