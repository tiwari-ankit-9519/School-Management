"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CalendarDays,
  Check,
  Copy,
  FileText,
  GraduationCap,
  History,
  Info,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CARD_CLASS,
  TONE_CLASSES,
  fadeUp,
} from "@/components/dashboard/DashboardWidgets";
import {
  DetailSkeleton,
  DocumentTile,
  InfoTile,
  SectionCard,
  formatDate,
  formatEnum,
} from "@/components/admissions/AdmissionDetailParts";
import {
  DETAIL_PATH,
  StatusBadge,
} from "@/components/teacher-applications/TeacherApplicationsParts";
import {
  TeacherActionDialog,
  TeacherActionType,
  TeacherStatusTimeline,
} from "@/components/teacher-applications/TeacherApplicationDetailParts";
import {
  useApproveTeacherApplication,
  useGetSingleTeacherApplication,
  useRejectTeacherApplication,
  useShortlistTeacherApplication,
} from "@/hooks/useTeacher";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTranslations } from "@/hooks/useTranslations";
import { ApplicationStatus, Role } from "@/types";

const TeacherApplicationDetailPage = () => {
  const t = useTranslations("teacherApplicationDetail");
  const params = useParams<{ id: string }>();
  const applicationId = params?.id ?? "";
  const [activeAction, setActiveAction] = useState<TeacherActionType | null>(
    null,
  );

  const { user } = useAuthStore();
  const role = user?.role as Role | undefined;
  const isModerator = role === Role.MODERATOR;
  const isAdmin = role === Role.ADMIN;

  const {
    data: application,
    isLoading,
    isError,
  } = useGetSingleTeacherApplication(applicationId);
  const { mutate: shortlist, isPending: isShortlisting } =
    useShortlistTeacherApplication();
  const { mutate: approve, isPending: isApproving } =
    useApproveTeacherApplication();
  const { mutate: reject, isPending: isRejecting } =
    useRejectTeacherApplication();
  const isActionPending = isShortlisting || isApproving || isRejecting;

  const closeDialog = () => setActiveAction(null);

  const handleConfirm = (reason?: string) => {
    if (!applicationId) return;
    if (activeAction === "shortlist") {
      shortlist({ applicationId }, { onSuccess: closeDialog });
    } else if (activeAction === "approve") {
      approve({ applicationId }, { onSuccess: closeDialog });
    } else if (activeAction === "reject" && reason) {
      reject(
        { applicationId, rejectionReason: reason },
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
      className="h-9 gap-1.5 rounded-full px-3 font-manrope text-xs text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent"
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
  const moderatorCanAct = isModerator && status === ApplicationStatus.PENDING;
  const adminCanAct = isAdmin && status === ApplicationStatus.SHORTLISTED;
  const showActions = moderatorCanAct || adminCanAct;
  const isDecided =
    status === ApplicationStatus.SELECTED ||
    status === ApplicationStatus.REJECTED;
  const fullName = `${application.firstName} ${application.lastName}`;
  const initials =
    `${application.firstName.charAt(0)}${application.lastName.charAt(0)}`.toUpperCase();
  const experienceText = `${application.experience} ${application.experience === 1 ? t("yearSingular") : t("yearsPlural")}`;
  const documents = application.documents ?? [];
  const histories = application.histories ?? [];

  const roleNote = isModerator
    ? t("roleModeratorNote")
    : isAdmin
      ? t("roleAdminNote")
      : t("roleViewOnlyNote");

  const noActionReason = isDecided
    ? t("decisionClosed")
    : isModerator
      ? t("moderatorWaiting")
      : isAdmin
        ? t("adminWaiting")
        : t("roleViewOnlyNote");

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
                className="h-7 w-7 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent"
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
                    {initials}
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
                    {application.qualification} · {experienceText}{" "}
                    {t("ofExperience")}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      {
                        icon: CalendarDays,
                        text: `${t("appliedOn")} ${formatDate(application.appliedAt)}`,
                      },
                      { icon: Phone, text: application.phone },
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
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Star className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-manrope text-[10px] tracking-wider text-white/60 uppercase">
                      {t("specialization")}
                    </p>
                    <p className="truncate font-jakarta text-sm font-semibold">
                      {application.specialization || t("notSpecified")}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <SectionCard
            title={t("sectionPersonal")}
            description={t("sectionPersonalSub")}
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
          </SectionCard>

          <SectionCard
            title={t("sectionContact")}
            description={t("sectionContactSub")}
            icon={<Phone className="size-4" />}
            tone="violet"
            delay={0.15}
          >
            <InfoTile
              icon={<Mail className="size-3.5" />}
              label={t("email")}
              value={application.email}
            />
            <InfoTile
              icon={<Phone className="size-3.5" />}
              label={t("phone")}
              value={application.phone}
            />
          </SectionCard>

          <SectionCard
            title={t("sectionAddress")}
            description={t("sectionAddressSub")}
            icon={<MapPin className="size-4" />}
            tone="emerald"
            delay={0.2}
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

          <SectionCard
            title={t("sectionProfessional")}
            description={t("sectionProfessionalSub")}
            icon={<Briefcase className="size-4" />}
            tone="amber"
            delay={0.25}
          >
            <InfoTile
              icon={<GraduationCap className="size-3.5" />}
              label={t("qualification")}
              value={application.qualification}
            />
            <InfoTile
              icon={<Briefcase className="size-3.5" />}
              label={t("experience")}
              value={experienceText}
            />
            <InfoTile
              className="sm:col-span-2"
              icon={<Star className="size-3.5" />}
              label={t("specialization")}
              value={application.specialization}
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
            <Card className={`${CARD_CLASS} gap-4 p-5`}>
              <h3 className="font-jakarta text-base font-semibold text-foreground">
                {t("decisionTitle")}
              </h3>
              <div
                className={`flex items-start gap-2.5 rounded-xl border p-3 ${
                  isModerator
                    ? TONE_CLASSES.indigo
                    : isAdmin
                      ? TONE_CLASSES.emerald
                      : TONE_CLASSES.violet
                }`}
              >
                <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                <p className="font-manrope text-xs leading-relaxed">
                  {roleNote}
                </p>
              </div>

              {showActions ? (
                <div className="flex flex-col gap-2">
                  {moderatorCanAct && (
                    <Button
                      type="button"
                      onClick={() => setActiveAction("shortlist")}
                      disabled={isActionPending}
                      className="h-11 gap-2 rounded-full bg-indigo-600 font-manrope text-sm font-semibold text-white shadow-none hover:bg-indigo-500"
                    >
                      <ShieldCheck className="size-4" />
                      {t("shortlist")}
                    </Button>
                  )}
                  {adminCanAct && (
                    <Button
                      type="button"
                      onClick={() => setActiveAction("approve")}
                      disabled={isActionPending}
                      className="h-11 gap-2 rounded-full bg-emerald-600 font-manrope text-sm font-semibold text-white shadow-none hover:bg-emerald-500"
                    >
                      <Check className="size-4" />
                      {t("approve")}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveAction("reject")}
                    disabled={isActionPending}
                    className={`h-11 gap-2 rounded-full font-manrope text-sm font-semibold shadow-none hover:opacity-80 ${TONE_CLASSES.red} dark:${TONE_CLASSES.red.split(" ")[0]}`}
                  >
                    <X className="size-4" />
                    {t("reject")}
                  </Button>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3.5">
                  <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <p className="font-manrope text-xs leading-relaxed text-muted-foreground">
                    {noActionReason}
                  </p>
                </div>
              )}
            </Card>
          </motion.div>

          {(application.reviewedAt || application.rejectionReason) && (
            <motion.div {...fadeUp(0.15)}>
              <Card className={`${CARD_CLASS} gap-3 p-5`}>
                <h3 className="font-jakarta text-base font-semibold text-foreground">
                  {t("reviewTitle")}
                </h3>
                {application.reviewedAt && (
                  <div className="grid grid-cols-1 gap-2">
                    <InfoTile
                      icon={<Calendar className="size-3.5" />}
                      label={t("reviewedOn")}
                      value={formatDate(application.reviewedAt)}
                    />
                    <InfoTile
                      icon={<UserCheck className="size-3.5" />}
                      label={t("reviewedBy")}
                      value={application.reviewedBy}
                    />
                  </div>
                )}
                {application.status === ApplicationStatus.REJECTED &&
                  application.rejectionReason && (
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
              <TeacherStatusTimeline
                appliedAt={application.appliedAt}
                histories={histories}
              />
            </Card>
          </motion.div>
        </div>
      </div>

      <TeacherActionDialog
        key={activeAction ?? "closed"}
        type={activeAction}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        isPending={isActionPending}
      />
    </div>
  );
};

export default TeacherApplicationDetailPage;
