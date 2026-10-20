"use client";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Flag,
  Globe,
  ImagePlus,
  Landmark,
  Loader2,
  Locate,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
  CalendarClock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CARD_CLASS,
  TONE_CLASSES,
} from "@/components/dashboard/DashboardWidgets";
import {
  FieldError,
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import { InfoTile } from "@/components/admissions/AdmissionDetailParts";
import {
  useRemoveSchoolLogo,
  useUpdateSchoolSettings,
  useUploadSchoolLogo,
} from "@/hooks/useSchoolSettings";
import { useTranslations } from "@/hooks/useTranslations";
import { UpdateSchoolSettingsType } from "@/validations/validations";
import { SchoolConfig } from "@/types";

type Translate = ReturnType<typeof useTranslations<"settings">>;

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const LOGO_INPUT_ID = "school-logo-input";

const changedFields = <T extends Record<string, string>>(
  values: T,
  defaults: T,
): Partial<T> =>
  Object.fromEntries(
    Object.entries(values)
      .map(([key, value]) => [key, value.trim()] as const)
      .filter(([key, value]) => value !== (defaults[key] ?? "").trim()),
  ) as Partial<T>;

const CardHeader = ({
  icon,
  tone,
  title,
  subtitle,
  badge,
  action,
}: {
  icon: React.ReactNode;
  tone: string;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-3 px-5 pt-5 pb-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-3">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tone}`}
      >
        {icon}
      </span>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-jakarta text-base font-semibold text-foreground">
            {title}
          </h3>
          {badge}
        </div>
        <p className="font-manrope text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    {action}
  </div>
);

export const SchoolLogo = ({
  url,
  name,
  size = "lg",
}: {
  url: string | null;
  name: string;
  size?: "md" | "lg";
}) => (
  <Avatar
    className={`${size === "lg" ? "h-24 w-24" : "h-16 w-16"} rounded-2xl bg-card ring-4 ring-indigo-500/15`}
  >
    {url && <AvatarImage src={url} alt={name} className="object-contain p-2" />}
    <AvatarFallback className="rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-700 text-white">
      <Building2 className={size === "lg" ? "size-9" : "size-6"} />
    </AvatarFallback>
  </Avatar>
);

export const SchoolLogoCard = ({ settings }: { settings: SchoolConfig }) => {
  const t = useTranslations("settings");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { mutate: uploadLogo, isPending: isUploading } = useUploadSchoolLogo();
  const { mutate: removeLogo, isPending: isRemoving } = useRemoveSchoolLogo();
  const isBusy = isUploading || isRemoving;

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pickFile = (candidate: File | undefined) => {
    if (!candidate) return;
    if (!LOGO_TYPES.includes(candidate.type)) {
      setError(t("errLogoType"));
      return;
    }
    if (candidate.size > MAX_LOGO_BYTES) {
      setError(t("errLogoSize"));
      return;
    }
    setError(null);
    setFile(candidate);
  };

  const clearSelection = () => {
    setFile(null);
    setError(null);
  };

  return (
    <Card className={`${CARD_CLASS} gap-0 overflow-hidden`}>
      <CardHeader
        icon={<ImagePlus className="size-4" />}
        tone={TONE_CLASSES.violet}
        title={t("sectionLogo")}
        subtitle={t("logoSub")}
      />
      <Separator />
      <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex flex-col items-center gap-2">
          <SchoolLogo
            url={previewUrl ?? settings.logoUrl}
            name={settings.name}
          />
          <span className="font-manrope text-[11px] text-muted-foreground">
            {previewUrl
              ? t("newLogo")
              : settings.logoUrl
                ? t("currentLogo")
                : t("noLogo")}
          </span>
        </div>

        <div className="space-y-3">
          <label
            htmlFor={LOGO_INPUT_ID}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              pickFile(e.dataTransfer.files[0]);
            }}
            className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors focus-within:ring-2 focus-within:ring-indigo-500 ${
              isDragging
                ? "border-indigo-500 bg-indigo-500/5"
                : "border-border bg-muted/30 hover:border-indigo-500/50 hover:bg-indigo-500/5"
            }`}
          >
            <Upload className="size-5 text-muted-foreground" />
            <span className="font-jakarta text-sm font-semibold text-foreground">
              {file ? (
                file.name
              ) : (
                <>
                  {t("dropLogo")}{" "}
                  <span className="text-indigo-600 underline underline-offset-2 dark:text-indigo-400">
                    {t("browse")}
                  </span>
                </>
              )}
            </span>
            <span className="font-manrope text-[11px] text-muted-foreground">
              {t("logoHint")}
            </span>
            <input
              id={LOGO_INPUT_ID}
              type="file"
              accept={LOGO_TYPES.join(",")}
              className="sr-only"
              disabled={isBusy}
              onChange={(e) => {
                pickFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <FieldError message={error ?? undefined} />

          <div className="flex flex-wrap items-center justify-end gap-2">
            {file ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearSelection}
                  disabled={isBusy}
                  className={`h-9 gap-1.5 px-4 text-xs ${OUTLINE_PILL_CLASS}`}
                >
                  <X className="size-3.5" />
                  {t("cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    uploadLogo(file, { onSuccess: clearSelection })
                  }
                  disabled={isBusy}
                  className={`h-9 gap-1.5 px-4 text-xs ${PRIMARY_PILL_CLASS}`}
                >
                  {isUploading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  {isUploading ? t("uploading") : t("saveLogo")}
                </Button>
              </>
            ) : (
              settings.logoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeLogo(undefined)}
                  disabled={isBusy}
                  className="h-9 gap-1.5 rounded-full px-4 font-manrope text-xs text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                >
                  {isRemoving ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  {isRemoving ? t("removing") : t("removeLogo")}
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

const buildAddressSchema = (t: Translate) =>
  z.object({
    address: z
      .string()
      .trim()
      .min(10, { error: t("errAddressMin") })
      .max(200, { error: t("errAddressMax") }),
    city: z
      .string()
      .trim()
      .min(2, { error: t("errRequired") })
      .max(50, { error: t("errTooLong") }),
    state: z
      .string()
      .trim()
      .min(2, { error: t("errRequired") })
      .max(50, { error: t("errTooLong") }),
    country: z
      .string()
      .trim()
      .min(2, { error: t("errRequired") })
      .max(56, { error: t("errTooLong") }),
    pincode: z
      .string()
      .trim()
      .regex(/^\d{4,10}$/, { error: t("errPincode") }),
  });

type AddressFormValues = z.infer<ReturnType<typeof buildAddressSchema>>;

const ADDRESS_FIELDS = [
  { name: "address", labelKey: "fieldAddress", icon: MapPin, full: true },
  { name: "city", labelKey: "fieldCity", icon: Landmark },
  { name: "state", labelKey: "fieldState", icon: Landmark },
  { name: "country", labelKey: "fieldCountry", icon: Flag },
  { name: "pincode", labelKey: "fieldPincode", icon: Locate },
] as const;

export const SchoolAddressCard = ({ settings }: { settings: SchoolConfig }) => {
  const t = useTranslations("settings");
  const [isEditing, setIsEditing] = useState(false);
  const schema = useMemo(() => buildAddressSchema(t), [t]);
  const { mutate: updateSettings, isPending } = useUpdateSchoolSettings();

  const defaults: AddressFormValues = {
    address: settings.address,
    city: settings.city,
    state: settings.state,
    country: settings.country,
    pincode: settings.pincode,
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const fullAddress = [
    settings.address,
    settings.city,
    settings.state,
    settings.pincode,
    settings.country,
  ]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.name}, ${fullAddress}`)}`;

  const cancel = () => {
    reset(defaults);
    setIsEditing(false);
  };

  const onSubmit = (values: AddressFormValues) => {
    const changes = changedFields(values, defaults);
    if (Object.keys(changes).length === 0) {
      setIsEditing(false);
      return;
    }
    const payload: UpdateSchoolSettingsType = changes;
    updateSettings({ data: payload }, { onSuccess: () => setIsEditing(false) });
  };

  return (
    <Card className={`${CARD_CLASS} gap-0 overflow-hidden`}>
      <CardHeader
        icon={<MapPin className="size-4" />}
        tone={TONE_CLASSES.emerald}
        title={t("sectionAddress")}
        subtitle={t("addressSub")}
        badge={
          isEditing && isDirty ? (
            <Badge
              variant="outline"
              className={`rounded-full font-manrope text-[10px] ${TONE_CLASSES.amber}`}
            >
              {t("unsaved")}
            </Badge>
          ) : undefined
        }
        action={
          !isEditing && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className={`h-9 gap-1.5 self-start px-4 text-xs sm:self-auto ${OUTLINE_PILL_CLASS}`}
            >
              <Pencil className="size-3.5" />
              {t("editAddress")}
            </Button>
          )
        }
      />
      <Separator />

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            {ADDRESS_FIELDS.map((field) => {
              const error = errors[field.name]?.message;
              const id = `school-${field.name}`;
              return (
                <div
                  key={field.name}
                  className={`space-y-1.5 ${"full" in field ? "sm:col-span-2" : ""}`}
                >
                  <Label
                    htmlFor={id}
                    className="font-manrope text-xs font-normal text-foreground/70"
                  >
                    {t(field.labelKey)}
                  </Label>
                  <div className="relative">
                    <field.icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={id}
                      inputMode={
                        field.name === "pincode" ? "numeric" : undefined
                      }
                      aria-invalid={!!error}
                      className={`${fieldClass(!!error)} pl-9`}
                      {...register(field.name)}
                    />
                  </div>
                  <FieldError message={error} />
                </div>
              );
            })}
            <p
              className={`flex items-start gap-2 rounded-xl border px-3 py-2 font-manrope text-xs sm:col-span-2 ${TONE_CLASSES.amber}`}
            >
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              {t("addressWarning")}
            </p>
          </div>
          <Separator />
          <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end sm:px-5">
            <Button
              type="button"
              variant="outline"
              onClick={cancel}
              disabled={isPending}
              className={`h-10 gap-1.5 px-4 text-sm ${OUTLINE_PILL_CLASS}`}
            >
              <X className="size-3.5" />
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || isPending}
              className={`h-10 gap-1.5 px-5 text-sm ${PRIMARY_PILL_CLASS}`}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isPending ? t("saving") : t("saveAddress")}
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <InfoTile
            icon={<MapPin className="size-3.5" />}
            label={t("fieldAddress")}
            value={settings.address}
          />
          <InfoTile
            icon={<Landmark className="size-3.5" />}
            label={t("fieldCity")}
            value={settings.city}
          />
          <InfoTile
            icon={<Landmark className="size-3.5" />}
            label={t("fieldState")}
            value={settings.state}
          />
          <InfoTile
            icon={<Flag className="size-3.5" />}
            label={t("fieldCountry")}
            value={settings.country}
          />
          <InfoTile
            icon={<Locate className="size-3.5" />}
            label={t("fieldPincode")}
            value={settings.pincode}
          />
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-3.5 sm:col-span-2 sm:flex-row sm:items-center">
            <p className="font-manrope text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {t("fullAddress")}:
              </span>{" "}
              {fullAddress}
            </p>
            <Button
              asChild
              variant="outline"
              size="sm"
              className={`h-8 shrink-0 gap-1.5 px-3 text-xs ${OUTLINE_PILL_CLASS}`}
            >
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <MapPin className="size-3.5" />
                {t("openInMaps")}
              </a>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

const buildContactSchema = (t: Translate) =>
  z.object({
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9][0-9\s-]{6,14}$/, { error: t("errPhone") }),
    email: z
      .string()
      .trim()
      .email({ error: t("errEmail") }),
    website: z.union([
      z.literal(""),
      z
        .string()
        .trim()
        .url({ error: t("errUrl") }),
    ]),
  });

type ContactFormValues = z.infer<ReturnType<typeof buildContactSchema>>;

const CONTACT_FIELDS = [
  {
    name: "phone",
    labelKey: "fieldPhone",
    icon: Phone,
    type: "tel",
    placeholder: "+91 98765 43210",
  },
  {
    name: "email",
    labelKey: "fieldEmail",
    icon: Mail,
    type: "email",
    placeholder: "office@school.edu.in",
  },
  {
    name: "website",
    labelKey: "fieldWebsite",
    icon: Globe,
    type: "url",
    placeholder: "https://",
  },
] as const;

export const SchoolContactForm = ({ settings }: { settings: SchoolConfig }) => {
  const t = useTranslations("settings");
  const schema = useMemo(() => buildContactSchema(t), [t]);
  const { mutate: updateSettings, isPending } = useUpdateSchoolSettings();

  const defaults: ContactFormValues = {
    phone: settings.phone ?? "",
    email: settings.email ?? "",
    website: settings.website ?? "",
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const onSubmit = (values: ContactFormValues) => {
    const changes = changedFields(values, defaults);
    if (Object.keys(changes).length === 0) return;
    const payload: UpdateSchoolSettingsType = changes;
    updateSettings({ data: payload }, { onSuccess: () => reset(values) });
  };

  return (
    <Card className={`${CARD_CLASS} gap-0 overflow-hidden`}>
      <CardHeader
        icon={<Phone className="size-4" />}
        tone={TONE_CLASSES.indigo}
        title={t("sectionContact")}
        subtitle={t("contactSub")}
        badge={
          isDirty ? (
            <Badge
              variant="outline"
              className={`rounded-full font-manrope text-[10px] ${TONE_CLASSES.amber}`}
            >
              {t("unsaved")}
            </Badge>
          ) : undefined
        }
      />
      <Separator />
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          {CONTACT_FIELDS.map((field) => {
            const error = errors[field.name]?.message;
            const id = `school-${field.name}`;
            return (
              <div
                key={field.name}
                className={`space-y-1.5 ${field.name === "website" ? "sm:col-span-2" : ""}`}
              >
                <Label
                  htmlFor={id}
                  className="font-manrope text-xs font-normal text-foreground/70"
                >
                  {t(field.labelKey)}
                </Label>
                <div className="relative">
                  <field.icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={id}
                    type={field.type}
                    placeholder={field.placeholder}
                    aria-invalid={!!error}
                    className={`${fieldClass(!!error)} pl-9`}
                    {...register(field.name)}
                  />
                </div>
                <FieldError message={error} />
              </div>
            );
          })}
        </div>
        <Separator />
        <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end sm:px-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset(defaults)}
            disabled={!isDirty || isPending}
            className={`h-10 gap-1.5 px-4 text-sm ${OUTLINE_PILL_CLASS}`}
          >
            <RotateCcw className="size-3.5" />
            {t("resetChanges")}
          </Button>
          <Button
            type="submit"
            disabled={!isDirty || isPending}
            className={`h-10 gap-1.5 px-5 text-sm ${PRIMARY_PILL_CLASS}`}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isPending ? t("saving") : t("saveBtn")}
          </Button>
        </div>
      </form>
    </Card>
  );
};

const MAX_DUE_DAY = 28;
const QUICK_DUE_DAYS = [1, 5, 10, 15];

const buildBillingSchema = (t: Translate) =>
  z.object({
    feeDueDay: z
      .number({ error: t("errDueDay") })
      .int({ error: t("errDueDay") })
      .min(1, { error: t("errDueDay") })
      .max(MAX_DUE_DAY, { error: t("errDueDay") }),
  });

type BillingFormValues = z.infer<ReturnType<typeof buildBillingSchema>>;

const formatLongDate = (date: Date) =>
  date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const getNextDueDate = (dueDay: number, today: Date): Date => {
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay);
  return thisMonth >=
    new Date(today.getFullYear(), today.getMonth(), today.getDate())
    ? thisMonth
    : new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
};

export const SchoolBillingCard = ({ settings }: { settings: SchoolConfig }) => {
  const t = useTranslations("settings");
  const schema = useMemo(() => buildBillingSchema(t), [t]);
  const { mutate: updateSettings, isPending } = useUpdateSchoolSettings();
  const [today] = useState(() => new Date());

  const defaults: BillingFormValues = { feeDueDay: settings.feeDueDay ?? 10 };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isDirty },
  } = useForm<BillingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const dueDay = useWatch({ control, name: "feeDueDay" });
  const validDueDay =
    Number.isInteger(dueDay) && dueDay >= 1 && dueDay <= MAX_DUE_DAY;

  const onSubmit = (values: BillingFormValues) => {
    if (values.feeDueDay === defaults.feeDueDay) return;
    const payload: UpdateSchoolSettingsType = { feeDueDay: values.feeDueDay };
    updateSettings({ data: payload }, { onSuccess: () => reset(values) });
  };

  return (
    <Card className={`${CARD_CLASS} gap-0 overflow-hidden`}>
      <CardHeader
        icon={<CalendarClock className="size-4" />}
        tone={TONE_CLASSES.amber}
        title={t("sectionBilling")}
        subtitle={t("billingSub")}
        badge={
          isDirty ? (
            <Badge
              variant="outline"
              className={`rounded-full font-manrope text-[10px] ${TONE_CLASSES.amber}`}
            >
              {t("unsaved")}
            </Badge>
          ) : undefined
        }
      />
      <Separator />
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-[1fr_auto] md:items-start">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="school-fee-due-day"
                className="font-manrope text-xs font-normal text-foreground/70"
              >
                {t("fieldDueDay")}
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="school-fee-due-day"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_DUE_DAY}
                  aria-invalid={!!errors.feeDueDay}
                  className={`${fieldClass(!!errors.feeDueDay)} w-24 text-center font-jakarta text-base font-semibold`}
                  {...register("feeDueDay", { valueAsNumber: true })}
                />
                <span className="font-manrope text-sm text-muted-foreground">
                  {t("ofEveryMonth")}
                </span>
              </div>
              <FieldError message={errors.feeDueDay?.message} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_DUE_DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setValue("feeDueDay", day, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  className={`h-7 rounded-full border px-3 font-manrope text-xs transition-colors ${
                    dueDay === day
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                      : "border-border bg-card text-muted-foreground hover:border-amber-500/30 hover:text-foreground"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <p className="font-manrope text-[11px] leading-relaxed text-muted-foreground">
              {t("dueDayHint")}
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-center md:min-w-48">
            <p className="font-manrope text-[11px] tracking-wider text-muted-foreground uppercase">
              {t("nextDueDate")}
            </p>
            <p className="mt-1 font-jakarta text-base font-bold text-foreground">
              {validDueDay
                ? formatLongDate(getNextDueDate(dueDay, today))
                : "—"}
            </p>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end sm:px-5">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset(defaults)}
            disabled={!isDirty || isPending}
            className={`h-10 gap-1.5 px-4 text-sm ${OUTLINE_PILL_CLASS}`}
          >
            <RotateCcw className="size-3.5" />
            {t("resetChanges")}
          </Button>
          <Button
            type="submit"
            disabled={!isDirty || isPending}
            className={`h-10 gap-1.5 px-5 text-sm ${PRIMARY_PILL_CLASS}`}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isPending ? t("saving") : t("saveDueDay")}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export const SettingsSkeleton = () => (
  <div className="space-y-5">
    <Skeleton className="h-10 w-56 rounded-lg" />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
      <Skeleton className="h-120 rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    </div>
  </div>
);
