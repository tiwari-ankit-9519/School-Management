"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Clock,
  Fingerprint,
  Mail,
  Phone,
  ShieldCheck,
  ShieldOff,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CARD_CLASS, fadeUp } from "@/components/dashboard/DashboardWidgets";
import { OUTLINE_PILL_CLASS } from "@/components/forms/FormParts";
import {
  InfoTile,
  formatDate,
  formatEnum,
} from "@/components/admissions/AdmissionDetailParts";
import {
  ADMIN_DETAIL_PATH,
  toTitleCase,
} from "@/components/admins/AdminsListParts";
import {
  AdminAttendanceCard,
  AdminDetailSkeleton,
  PermissionsCard,
  getAccessLevel,
  getAttendanceRate,
} from "@/components/admins/AdminDetailParts";
import { useGetSingleAdmin } from "@/hooks/useModerator";
import { useTranslations } from "@/hooks/useTranslations";

const RELATIVE_FORMAT = new Intl.RelativeTimeFormat("en-IN", {
  numeric: "auto",
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

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getTenure = (joiningDate: string, now: number) => {
  const start = new Date(joiningDate);
  const end = new Date(now);
  const months = Math.max(
    0,
    (end.getFullYear() - start.getFullYear()) * 12 +
      end.getMonth() -
      start.getMonth(),
  );
  return { years: Math.floor(months / 12), months: months % 12 };
};

const SingleAdminInfoPage = () => {
  const t = useTranslations("adminDetail");
  const params = useParams<{ id: string }>();
  const adminId = params?.id ?? "";
  const [now] = useState(() => Date.now());

  const { data: admin, isLoading, isError } = useGetSingleAdmin(adminId);

  const backButton = (
    <Button
      asChild
      variant="ghost"
      className="h-9 gap-1.5 rounded-full px-3 font-manrope text-xs text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent"
    >
      <Link href={ADMIN_DETAIL_PATH}>
        <ArrowLeft className="size-4" />
        {t("back")}
      </Link>
    </Button>
  );

  if (isLoading) return <AdminDetailSkeleton />;

  if (isError || !admin) {
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
              {t("notFound")}
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

  const fullName = `${admin.firstName} ${admin.lastName}`;
  const initials =
    `${admin.firstName.charAt(0)}${admin.lastName.charAt(0)}`.toUpperCase();
  const permissions = admin.user.userPermission ?? [];
  const attendance = admin.adminAttendance ?? [];
  const fullAccessCount = permissions.filter(
    (p) => getAccessLevel(p) === "full",
  ).length;
  const attendanceRate = getAttendanceRate(attendance);
  const tenure = getTenure(admin.joiningDate, now);
  const tenureText =
    tenure.years > 0
      ? `${tenure.years} ${t("yearsShort")} ${tenure.months} ${t("monthsShort")}`
      : `${tenure.months} ${t("monthsShort")}`;
  const email = admin.user.email;
  const phone = admin.user.phone;

  const stats = [
    {
      icon: ShieldCheck,
      value: String(permissions.length),
      label: t("statModules"),
    },
    {
      icon: BadgeCheck,
      value: String(fullAccessCount),
      label: t("statFullAccess"),
    },
    {
      icon: CalendarCheck,
      value: attendanceRate !== null ? `${attendanceRate}%` : "—",
      label: t("statAttendance"),
    },
    {
      icon: Clock,
      value: admin.user.lastLoginAt
        ? formatRelative(admin.user.lastLoginAt, now)
        : t("never"),
      label: t("lastLogin"),
    },
  ];

  return (
    <div className="space-y-5">
      <motion.header {...fadeUp(0)} className="px-1">
        {backButton}
      </motion.header>

      <motion.div {...fadeUp(0.05)}>
        <Card className="relative gap-0 overflow-hidden rounded-2xl border-0 bg-linear-to-br from-indigo-500 via-indigo-600 to-indigo-800 p-6 text-white shadow-none sm:p-7">
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
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center">
            <Avatar className="h-20 w-20 rounded-2xl ring-4 ring-white/15">
              {admin.photoUrl && (
                <AvatarImage
                  src={admin.photoUrl}
                  alt={fullName}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="rounded-2xl bg-white/15 font-jakarta text-2xl font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="font-jakarta text-3xl font-bold tracking-tight">
                {fullName}
              </h1>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <Badge className="rounded-full border-white/25 bg-white/15 font-manrope text-[11px] font-medium text-white">
                  {formatEnum(admin.user.role)}
                </Badge>
                <Badge className="gap-1 rounded-full border-white/25 bg-white/15 font-manrope text-[11px] font-medium text-white">
                  {admin.user.isActive ? (
                    <ShieldCheck className="size-3" />
                  ) : (
                    <ShieldOff className="size-3" />
                  )}
                  {admin.user.isActive ? t("active") : t("inactive")}
                </Badge>
                {admin.user.isVerified && (
                  <Badge className="gap-1 rounded-full border-white/25 bg-white/15 font-manrope text-[11px] font-medium text-white">
                    <BadgeCheck className="size-3" />
                    {t("verified")}
                  </Badge>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  {
                    icon: Briefcase,
                    text: admin.designation ?? t("noDesignation"),
                  },
                  {
                    icon: Building2,
                    text: admin.department
                      ? toTitleCase(admin.department)
                      : t("noDepartment"),
                  },
                  {
                    icon: CalendarClock,
                    text: `${t("joinedOn")} ${formatDate(admin.joiningDate)}`,
                  },
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-80 lg:grid-cols-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15"
                >
                  <stat.icon className="size-4 text-white/70" />
                  <p className="mt-1.5 truncate font-jakarta text-xl font-bold">
                    {stat.value}
                  </p>
                  <p className="font-manrope text-[10px] leading-tight text-white/70">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <motion.div {...fadeUp(0.1)}>
            <PermissionsCard
              adminId={adminId}
              userId={admin.userId}
              permissions={permissions}
            />
          </motion.div>
          <motion.div {...fadeUp(0.15)}>
            <AdminAttendanceCard records={attendance} />
          </motion.div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <motion.div {...fadeUp(0.1)}>
            <Card className={`${CARD_CLASS} gap-3 p-5`}>
              <h3 className="font-jakarta text-base font-semibold text-foreground">
                {t("contactTitle")}
              </h3>
              <InfoTile
                icon={<Mail className="size-3.5" />}
                label={t("email")}
                value={email}
              />
              <InfoTile
                icon={<Phone className="size-3.5" />}
                label={t("phone")}
                value={phone}
              />
              <InfoTile
                icon={<Fingerprint className="size-3.5" />}
                label={t("regNumber")}
                value={admin.user.regNumber}
              />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button
                  asChild={!!email}
                  variant="outline"
                  disabled={!email}
                  className={`h-10 gap-1.5 text-xs ${OUTLINE_PILL_CLASS}`}
                >
                  {email ? (
                    <a href={`mailto:${email}`}>
                      <Mail className="size-3.5" />
                      {t("emailAction")}
                    </a>
                  ) : (
                    <span>
                      <Mail className="size-3.5" />
                      {t("emailAction")}
                    </span>
                  )}
                </Button>
                <Button
                  asChild={!!phone}
                  variant="outline"
                  disabled={!phone}
                  className={`h-10 gap-1.5 text-xs ${OUTLINE_PILL_CLASS}`}
                >
                  {phone ? (
                    <a href={`tel:${phone}`}>
                      <Phone className="size-3.5" />
                      {t("callAction")}
                    </a>
                  ) : (
                    <span>
                      <Phone className="size-3.5" />
                      {t("callAction")}
                    </span>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div {...fadeUp(0.15)}>
            <Card className={`${CARD_CLASS} gap-3 p-5`}>
              <h3 className="font-jakarta text-base font-semibold text-foreground">
                {t("accountTitle")}
              </h3>
              <InfoTile
                icon={<User className="size-3.5" />}
                label={t("role")}
                value={formatEnum(admin.user.role)}
              />
              <InfoTile
                icon={<ShieldCheck className="size-3.5" />}
                label={t("status")}
                value={`${admin.user.isActive ? t("active") : t("inactive")} · ${admin.user.isVerified ? t("verified") : t("unverified")}`}
              />
              <InfoTile
                icon={<Clock className="size-3.5" />}
                label={t("lastLogin")}
                value={
                  admin.user.lastLoginAt
                    ? formatDateTime(admin.user.lastLoginAt)
                    : t("never")
                }
              />
              <InfoTile
                icon={<CalendarDays className="size-3.5" />}
                label={t("createdOn")}
                value={formatDate(admin.createdAt)}
              />
            </Card>
          </motion.div>

          <motion.div {...fadeUp(0.2)}>
            <Card className={`${CARD_CLASS} gap-3 p-5`}>
              <h3 className="font-jakarta text-base font-semibold text-foreground">
                {t("employmentTitle")}
              </h3>
              <InfoTile
                icon={<Briefcase className="size-3.5" />}
                label={t("designation")}
                value={admin.designation}
              />
              <InfoTile
                icon={<Building2 className="size-3.5" />}
                label={t("department")}
                value={admin.department ? toTitleCase(admin.department) : null}
              />
              <InfoTile
                icon={<CalendarClock className="size-3.5" />}
                label={t("joiningDate")}
                value={formatDate(admin.joiningDate)}
              />
              <InfoTile
                icon={<CalendarCheck className="size-3.5" />}
                label={t("tenure")}
                value={tenureText}
              />
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SingleAdminInfoPage;
