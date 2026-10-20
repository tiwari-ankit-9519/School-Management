"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  AlertCircle,
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock,
  Copy,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
  ShieldOff,
  UserPen,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  fadeUp,
} from "@/components/dashboard/DashboardWidgets";
import {
  PRIMARY_PILL_CLASS,
  TAB_TRIGGER_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import {
  formatDate,
  formatEnum,
} from "@/components/admissions/AdmissionDetailParts";
import {
  FIELDS_BY_KIND,
  GROUP_CONFIG,
  GroupKey,
  ProfileEditForm,
  ProfileSkeleton,
  getCompleteness,
  getDefaults,
  getProfileKind,
} from "@/components/profile/ProfileParts";
import { TodayCards } from "@/components/profile/TodayCards";
import { ProfilePhotoDialog } from "@/components/profile/ProfilePhotoDialog";
import {
  getProfilePhotoUrl,
  isParentProfile,
  isStudentProfile,
  isTeacherProfile,
  useGetMyProfile,
} from "@/hooks/useProfile";
import { useTranslations } from "@/hooks/useTranslations";
import { MyProfile } from "@/types";

const ALL = "ALL";
const SLATE_TONE =
  "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300";

type Translate = ReturnType<typeof useTranslations<"profile">>;

interface DetailRow {
  key: string;
  group: GroupKey;
  label: string;
  value: string | null;
  editable: boolean;
}

const getRecord = (profile: MyProfile) =>
  isStudentProfile(profile)
    ? profile.student
    : isTeacherProfile(profile)
      ? profile.teacher
      : isParentProfile(profile)
        ? profile.parent
        : profile.admin;

const buildPersonalRows = (profile: MyProfile, t: Translate): DetailRow[] => {
  const row = (
    key: string,
    label: string,
    value: string | null,
  ): DetailRow => ({
    key,
    group: "personal",
    label,
    value,
    editable: false,
  });
  const record = getRecord(profile);
  const rows: DetailRow[] = [
    row(
      "fullName",
      t("fullName"),
      record ? `${record.firstName} ${record.lastName}` : null,
    ),
  ];

  if (isStudentProfile(profile) && profile.student) {
    const s = profile.student;
    rows.push(
      row("gender", t("gender"), formatEnum(s.gender)),
      row("dob", t("dateOfBirth"), formatDate(s.dateOfBirth)),
      row("enrollment", t("enrollmentStatus"), formatEnum(s.enrollmentStatus)),
      row("admission", t("admissionDate"), formatDate(s.admissionDate)),
    );
  } else if (isTeacherProfile(profile) && profile.teacher) {
    const tr = profile.teacher;
    rows.push(
      row("gender", t("gender"), formatEnum(tr.gender)),
      row("dob", t("dateOfBirth"), formatDate(tr.dateOfBirth)),
      row("employment", t("employmentStatus"), formatEnum(tr.employmentStatus)),
      row("joining", t("joiningDate"), formatDate(tr.joiningDate)),
    );
  } else if (
    !isStudentProfile(profile) &&
    !isTeacherProfile(profile) &&
    !isParentProfile(profile) &&
    profile.admin
  ) {
    const a = profile.admin;
    rows.push(
      row("gender", t("gender"), formatEnum(a.gender)),
      row(
        "dob",
        t("dateOfBirth"),
        a.dateOfBirth ? formatDate(a.dateOfBirth) : null,
      ),
      row("joining", t("joiningDate"), formatDate(a.joiningDate)),
    );
  }
  return rows;
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const ProfilePage = () => {
  const t = useTranslations("profile");
  const { data: profile, isLoading, isError, refetch } = useGetMyProfile();
  const [tab, setTab] = useState<"overview" | "edit">("overview");
  const [section, setSection] = useState<string>(ALL);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  const rows = useMemo<DetailRow[]>(() => {
    if (!profile) return [];
    const values = getDefaults(profile);
    const editableRows = FIELDS_BY_KIND[getProfileKind(profile)].map(
      (field) => ({
        key: field.name,
        group: field.group,
        label: t(field.labelKey),
        value: values[field.name]?.trim() ? values[field.name] : null,
        editable: true,
      }),
    );
    return [...buildPersonalRows(profile, t), ...editableRows];
  }, [profile, t]);

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !profile) {
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
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            className="h-9 rounded-full px-4 text-xs"
          >
            {t("retry")}
          </Button>
        </Card>
      </div>
    );
  }

  const record = getRecord(profile);
  const photoUrl = getProfilePhotoUrl(profile);
  const fullName = record
    ? `${record.firstName} ${record.lastName}`
    : profile.regNumber;
  const initials = record
    ? `${record.firstName.charAt(0)}${record.lastName.charAt(0)}`.toUpperCase()
    : profile.regNumber.slice(0, 2);
  const completeness = getCompleteness(profile);
  const groups = Array.from(new Set(rows.map((row) => row.group)));
  const visibleRows =
    section === ALL ? rows : rows.filter((row) => row.group === section);

  const openEdit = () => setTab("edit");
  const openPhoto = () => setIsPhotoOpen(true);

  const copyReg = async () => {
    try {
      await navigator.clipboard.writeText(profile.regNumber);
      toast.success(t("regCopied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const sideTiles = [
    { icon: Mail, label: t("fieldEmail"), value: profile.email },
    { icon: Phone, label: t("fieldPhone"), value: profile.phone },
    {
      icon: CalendarDays,
      label: t("memberSince"),
      value: formatDate(profile.createdAt),
    },
    {
      icon: Clock,
      label: t("lastLogin"),
      value: profile.lastLoginAt
        ? formatDateTime(profile.lastLoginAt)
        : t("never"),
    },
  ];

  return (
    <div className="space-y-5">
      <motion.header {...fadeUp(0)} className="px-1">
        <h1 className="font-jakarta text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-1.5 font-manrope text-sm text-muted-foreground">
          {t("pageSubtitle")}
        </p>
      </motion.header>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[320px_1fr]">
        <motion.div {...fadeUp(0.05)} className="lg:sticky lg:top-24">
          <Card className={`${CARD_CLASS} items-center gap-0 p-6 text-center`}>
            <div className="relative">
              <button
                type="button"
                onClick={openPhoto}
                aria-label={photoUrl ? t("changePhoto") : t("addPhoto")}
                className="group relative block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <Avatar className="h-28 w-28 ring-4 ring-indigo-500/15">
                  {photoUrl && (
                    <AvatarImage
                      src={photoUrl}
                      alt={fullName}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-linear-to-br from-indigo-500 to-indigo-700 font-jakarta text-3xl font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Camera className="size-6" />
                </span>
              </button>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-0.5 bottom-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground"
              >
                <Camera className="size-3.5" />
              </span>
            </div>

            {!photoUrl && (
              <button
                type="button"
                onClick={openPhoto}
                className="mt-2 font-manrope text-xs font-medium text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
              >
                {t("addPhoto")}
              </button>
            )}

            <h2 className="mt-3 font-jakarta text-xl font-bold text-foreground">
              {fullName}
            </h2>
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              <Badge
                variant="outline"
                className={`rounded-full font-manrope text-[11px] font-medium ${TONE_CLASSES.emerald}`}
              >
                {formatEnum(profile.role)}
              </Badge>
              <Badge
                variant="outline"
                className={`gap-1 rounded-full font-manrope text-[11px] font-medium ${profile.isActive ? TONE_CLASSES.indigo : TONE_CLASSES.red}`}
              >
                {profile.isActive ? (
                  <ShieldCheck className="size-3" />
                ) : (
                  <ShieldOff className="size-3" />
                )}
                {profile.isActive ? t("activeAccount") : t("inactiveAccount")}
              </Badge>
              {profile.isVerified && (
                <Badge
                  variant="outline"
                  className={`gap-1 rounded-full font-manrope text-[11px] font-medium ${TONE_CLASSES.violet}`}
                >
                  <BadgeCheck className="size-3" />
                  {t("verified")}
                </Badge>
              )}
            </div>

            <Button
              type="button"
              onClick={openEdit}
              className={`mt-5 h-11 w-full gap-2 text-sm ${PRIMARY_PILL_CLASS}`}
            >
              <UserPen className="size-4" />
              {t("editProfile")}
            </Button>

            {completeness.missingCount > 0 && (
              <button
                type="button"
                onClick={openEdit}
                className={`mt-3 w-full rounded-xl border px-3 py-2 text-left font-manrope text-xs ${TONE_CLASSES.amber}`}
              >
                {completeness.percent}% {t("profileCompleteShort")} ·{" "}
                {completeness.missingCount} {t("missingShort")}
              </button>
            )}

            <div className="mt-5 w-full space-y-2.5 text-left">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="font-manrope text-[11px] text-muted-foreground">
                    {t("regNumber")}
                  </p>
                  <p className="truncate font-mono text-sm font-semibold text-foreground">
                    {profile.regNumber}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={copyReg}
                  aria-label={t("copyReg")}
                  className="h-8 w-8 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent"
                >
                  <Copy className="size-3.5" />
                </Button>
              </div>
              {sideTiles.map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-xl border border-border bg-muted/40 px-3.5 py-2.5"
                >
                  <p className="flex items-center gap-1.5 font-manrope text-[11px] text-muted-foreground">
                    <tile.icon className="size-3" />
                    {tile.label}
                  </p>
                  <p
                    className={`truncate font-jakarta text-sm font-semibold ${tile.value ? "text-foreground" : "text-muted-foreground italic"}`}
                  >
                    {tile.value ?? t("notAdded")}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <div className="min-w-0 space-y-4">
          <TodayCards />

          <motion.div {...fadeUp(0.15)}>
            <Card className={`${CARD_CLASS} gap-0 overflow-hidden`}>
              <Tabs
                value={tab}
                onValueChange={(value: string) =>
                  setTab(value === "edit" ? "edit" : "overview")
                }
                className="gap-0"
              >
                <div className="flex flex-col gap-3 px-4 pt-4 pb-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <TabsList className="h-auto gap-1.5 bg-transparent p-0">
                    <TabsTrigger
                      value="overview"
                      className={`${TAB_TRIGGER_CLASS} px-4`}
                    >
                      {t("tabOverview")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="edit"
                      className={`${TAB_TRIGGER_CLASS} gap-1.5 px-4`}
                    >
                      <Pencil className="size-3" />
                      {t("tabEdit")}
                    </TabsTrigger>
                  </TabsList>
                  {tab === "overview" && (
                    <Select value={section} onValueChange={setSection}>
                      <SelectTrigger
                        className={`${fieldClass(false)} h-9 w-full rounded-full text-xs data-[size=default]:h-9 sm:w-48 dark:hover:bg-card`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem
                          value={ALL}
                          className="font-manrope text-sm"
                        >
                          {t("allSections")} ({rows.length})
                        </SelectItem>
                        {groups.map((group) => (
                          <SelectItem
                            key={group}
                            value={group}
                            className="font-manrope text-sm"
                          >
                            {t(GROUP_CONFIG[group].titleKey)} (
                            {rows.filter((r) => r.group === group).length})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <Separator />

                <TabsContent value="overview" className="mt-0">
                  <div className="divide-y divide-border">
                    {visibleRows.map((row) => {
                      const config = GROUP_CONFIG[row.group];
                      const Icon = config.icon;
                      const status = !row.editable
                        ? "managed"
                        : row.value
                          ? "added"
                          : "missing";
                      return (
                        <div
                          key={row.key}
                          className="flex items-center gap-3 px-4 py-3.5 sm:px-5"
                        >
                          <span
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${config.tone}`}
                          >
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-jakarta text-sm font-semibold text-foreground">
                              {row.label}
                            </p>
                            <p className="font-manrope text-[11px] text-muted-foreground">
                              {t(config.titleKey)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`hidden shrink-0 gap-1 rounded-full font-manrope text-[10px] font-medium sm:flex ${
                              status === "added"
                                ? TONE_CLASSES.emerald
                                : status === "missing"
                                  ? TONE_CLASSES.amber
                                  : SLATE_TONE
                            }`}
                          >
                            {status === "added" && (
                              <CheckCircle2 className="size-3" />
                            )}
                            {status === "added"
                              ? t("statusAdded")
                              : status === "missing"
                                ? t("statusMissing")
                                : t("statusManaged")}
                          </Badge>
                          <p
                            className={`w-32 shrink-0 truncate text-right font-jakarta text-sm sm:w-48 ${
                              row.value
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground italic"
                            }`}
                            title={row.value ?? undefined}
                          >
                            {row.value ?? t("notAdded")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  {completeness.missingCount > 0 && (
                    <>
                      <Separator />
                      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                        <p className="font-manrope text-xs text-muted-foreground">
                          {completeness.missingCount} {t("missingPrompt")}
                        </p>
                        <Button
                          type="button"
                          onClick={openEdit}
                          className={`h-9 gap-1.5 px-4 text-xs ${PRIMARY_PILL_CLASS}`}
                        >
                          <UserPen className="size-3.5" />
                          {t("completeProfile")}
                        </Button>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="edit" className="mt-0">
                  <ProfileEditForm
                    key={profile.id}
                    profile={profile}
                    onDone={() => setTab("overview")}
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        </div>
      </div>

      <ProfilePhotoDialog
        open={isPhotoOpen}
        onOpenChange={setIsPhotoOpen}
        currentUrl={photoUrl}
        initials={initials}
        name={fullName}
      />
    </div>
  );
};

export default ProfilePage;
