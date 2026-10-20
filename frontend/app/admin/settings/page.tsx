"use client";
import { useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  Award,
  Building2,
  CalendarClock,
  CalendarDays,
  ExternalLink,
  GraduationCap,
  Hash,
  Info,
  Mail,
  Phone,
  Power,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CARD_CLASS,
  TONE_CLASSES,
  fadeUp,
} from "@/components/dashboard/DashboardWidgets";
import { OUTLINE_PILL_CLASS } from "@/components/forms/FormParts";
import {
  InfoTile,
  SectionCard,
  formatDate,
} from "@/components/admissions/AdmissionDetailParts";
import {
  SchoolAddressCard,
  SchoolBillingCard,
  SchoolContactForm,
  SchoolLogo,
  SchoolLogoCard,
  SettingsSkeleton,
} from "@/components/settings/SettingsParts";
import { useGetSchoolSettings } from "@/hooks/useSchoolSettings";
import { useTranslations } from "@/hooks/useTranslations";

const SettingsPage = () => {
  const t = useTranslations("settings");
  const {
    data: settings,
    isLoading,
    isError,
    refetch,
  } = useGetSchoolSettings();
  const [currentYear] = useState(() => new Date().getFullYear());

  if (isLoading) return <SettingsSkeleton />;

  if (isError || !settings) {
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
            className={`h-9 px-4 text-xs ${OUTLINE_PILL_CLASS}`}
          >
            {t("retry")}
          </Button>
        </Card>
      </div>
    );
  }

  const yearsServing = settings.establishedYear
    ? Math.max(0, currentYear - settings.establishedYear)
    : null;

  const quickFacts = [
    {
      icon: CalendarDays,
      label: t("fieldEstablishedYear"),
      value: settings.establishedYear ? String(settings.establishedYear) : null,
    },
    {
      icon: Sparkles,
      label: t("yearsServing"),
      value: yearsServing !== null ? `${yearsServing} ${t("years")}` : null,
    },
    {
      icon: Award,
      label: t("fieldAffiliationNumber"),
      value: settings.affiliationNumber,
    },
    {
      icon: CalendarClock,
      label: t("lastUpdated"),
      value: formatDate(settings.updatedAt),
    },
  ];

  const contactActions = [
    {
      key: "call",
      icon: Phone,
      label: t("callSchool"),
      href: settings.phone ? `tel:${settings.phone}` : null,
      external: false,
    },
    {
      key: "email",
      icon: Mail,
      label: t("emailSchool"),
      href: settings.email ? `mailto:${settings.email}` : null,
      external: false,
    },
    {
      key: "web",
      icon: ExternalLink,
      label: t("visitWebsite"),
      href: settings.website,
      external: true,
    },
  ].filter(
    (action): action is typeof action & { href: string } => !!action.href,
  );

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
            <SchoolLogo url={settings.logoUrl} name={settings.name} />
            <h2 className="mt-4 font-jakarta text-lg leading-snug font-bold text-foreground">
              {settings.name}
            </h2>
            <Badge
              variant="outline"
              className="mt-2 gap-1 rounded-md border-border bg-muted font-mono text-[11px] text-foreground/80"
            >
              <Hash className="size-3" />
              {settings.code}
            </Badge>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <Badge
                variant="outline"
                className={`gap-1 rounded-full font-manrope text-[11px] font-medium ${TONE_CLASSES.indigo}`}
              >
                <GraduationCap className="size-3" />
                {settings.boardType}
              </Badge>
              <Badge
                variant="outline"
                className={`gap-1 rounded-full font-manrope text-[11px] font-medium ${
                  settings.isActive ? TONE_CLASSES.emerald : TONE_CLASSES.red
                }`}
              >
                <Power className="size-3" />
                {settings.isActive ? t("activeLabel") : t("inactiveLabel")}
              </Badge>
            </div>

            {contactActions.length > 0 && (
              <div className="mt-5 grid w-full grid-cols-3 gap-2">
                {contactActions.map((action) => (
                  <Button
                    key={action.key}
                    asChild
                    variant="outline"
                    className={`h-auto flex-col gap-1 rounded-xl py-2.5 text-[11px] ${OUTLINE_PILL_CLASS}`}
                  >
                    <a
                      href={action.href}
                      target={action.external ? "_blank" : undefined}
                      rel={action.external ? "noopener noreferrer" : undefined}
                    >
                      <action.icon className="size-4" />
                      {action.label}
                    </a>
                  </Button>
                ))}
              </div>
            )}

            <Separator className="my-5" />

            <div className="w-full space-y-2.5 text-left">
              <p className="px-1 font-manrope text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                {t("quickFacts")}
              </p>
              {quickFacts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-xl border border-border bg-muted/40 px-3.5 py-2.5"
                >
                  <p className="flex items-center gap-1.5 font-manrope text-[11px] text-muted-foreground">
                    <fact.icon className="size-3" />
                    {fact.label}
                  </p>
                  <p
                    className={`truncate font-jakarta text-sm font-semibold ${
                      fact.value
                        ? "text-foreground"
                        : "text-muted-foreground italic"
                    }`}
                  >
                    {fact.value ?? "—"}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <div className="min-w-0 space-y-4">
          <SectionCard
            title={t("sectionIdentity")}
            description={t("identitySub")}
            icon={<Building2 className="size-4" />}
            delay={0.1}
          >
            <InfoTile
              icon={<Building2 className="size-3.5" />}
              label={t("fieldName")}
              value={settings.name}
            />
            <InfoTile
              icon={<Hash className="size-3.5" />}
              label={t("fieldCode")}
              value={settings.code}
            />
            <InfoTile
              icon={<GraduationCap className="size-3.5" />}
              label={t("fieldBoardType")}
              value={settings.boardType}
            />
            <InfoTile
              icon={<Award className="size-3.5" />}
              label={t("fieldAffiliationNumber")}
              value={settings.affiliationNumber}
            />
            <InfoTile
              icon={<CalendarDays className="size-3.5" />}
              label={t("fieldEstablishedYear")}
              value={
                settings.establishedYear
                  ? String(settings.establishedYear)
                  : null
              }
            />
          </SectionCard>

          <motion.div {...fadeUp(0.12)}>
            <p
              className={`flex items-start gap-2 rounded-xl border px-4 py-3 font-manrope text-xs ${TONE_CLASSES.indigo}`}
            >
              <Info className="mt-0.5 size-3.5 shrink-0" />
              {t("managedNote")}
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.15)}>
            <SchoolAddressCard
              key={`address-${settings.updatedAt}`}
              settings={settings}
            />
          </motion.div>

          <motion.div {...fadeUp(0.18)}>
            <SchoolLogoCard
              key={`logo-${settings.updatedAt}`}
              settings={settings}
            />
          </motion.div>

          <motion.div {...fadeUp(0.19)}>
            <SchoolBillingCard
              key={`billing-${settings.updatedAt}`}
              settings={settings}
            />
          </motion.div>

          <motion.div {...fadeUp(0.2)}>
            <SchoolContactForm
              key={`contact-${settings.updatedAt}`}
              settings={settings}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
