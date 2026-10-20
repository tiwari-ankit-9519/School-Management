"use client";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Briefcase,
  HeartPulse,
  Loader2,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  User,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
import {
  isParentProfile,
  isStudentProfile,
  isTeacherProfile,
  useUpdateMyProfile,
} from "@/hooks/useProfile";
import { useTranslations } from "@/hooks/useTranslations";
import {
  MyProfile,
  UpdateMyProfilePayload,
  UpdateTeacherProfilePayload,
} from "@/types";

export type ProfileFormValues = Record<string, string>;
export type ProfileKind = "student" | "teacher" | "parent" | "admin";
export type GroupKey =
  | "personal"
  | "contact"
  | "address"
  | "health"
  | "professional"
  | "work";
type FieldKind = "email" | "tel" | "text" | "number" | "textarea";

export type FieldLabelKey =
  | "fieldEmail"
  | "fieldPhone"
  | "fieldAlternatePhone"
  | "fieldAddress"
  | "fieldCity"
  | "fieldState"
  | "fieldPincode"
  | "fieldBloodGroup"
  | "fieldMedical"
  | "fieldEmergency"
  | "fieldQualification"
  | "fieldExperience"
  | "fieldSpecialization"
  | "fieldDesignation"
  | "fieldDepartment";

export interface FieldConfig {
  name: string;
  labelKey: FieldLabelKey;
  kind: FieldKind;
  group: Exclude<GroupKey, "personal">;
  full?: boolean;
}

const CONTACT_FIELDS: FieldConfig[] = [
  { name: "email", labelKey: "fieldEmail", kind: "email", group: "contact" },
  { name: "phone", labelKey: "fieldPhone", kind: "tel", group: "contact" },
];

const ADDRESS_FIELDS: FieldConfig[] = [
  {
    name: "address",
    labelKey: "fieldAddress",
    kind: "text",
    group: "address",
    full: true,
  },
  { name: "city", labelKey: "fieldCity", kind: "text", group: "address" },
  { name: "state", labelKey: "fieldState", kind: "text", group: "address" },
  { name: "pincode", labelKey: "fieldPincode", kind: "text", group: "address" },
];

export const FIELDS_BY_KIND: Record<ProfileKind, FieldConfig[]> = {
  student: [
    ...CONTACT_FIELDS,
    ...ADDRESS_FIELDS,
    {
      name: "bloodGroup",
      labelKey: "fieldBloodGroup",
      kind: "text",
      group: "health",
    },
    {
      name: "emergencyContact",
      labelKey: "fieldEmergency",
      kind: "tel",
      group: "health",
    },
    {
      name: "medicalConditions",
      labelKey: "fieldMedical",
      kind: "textarea",
      group: "health",
      full: true,
    },
  ],
  teacher: [
    ...CONTACT_FIELDS,
    ...ADDRESS_FIELDS,
    {
      name: "qualification",
      labelKey: "fieldQualification",
      kind: "text",
      group: "professional",
    },
    {
      name: "experience",
      labelKey: "fieldExperience",
      kind: "number",
      group: "professional",
    },
    {
      name: "specialization",
      labelKey: "fieldSpecialization",
      kind: "text",
      group: "professional",
    },
  ],
  parent: [
    ...CONTACT_FIELDS,
    {
      name: "alternatePhone",
      labelKey: "fieldAlternatePhone",
      kind: "tel",
      group: "contact",
    },
  ],
  admin: [
    ...CONTACT_FIELDS,
    {
      name: "designation",
      labelKey: "fieldDesignation",
      kind: "text",
      group: "work",
    },
    {
      name: "department",
      labelKey: "fieldDepartment",
      kind: "text",
      group: "work",
    },
  ],
};

export const GROUP_CONFIG = {
  personal: {
    titleKey: "groupPersonal",
    icon: User,
    tone: TONE_CLASSES.violet,
  },
  contact: { titleKey: "groupContact", icon: Phone, tone: TONE_CLASSES.indigo },
  address: {
    titleKey: "groupAddress",
    icon: MapPin,
    tone: TONE_CLASSES.emerald,
  },
  health: { titleKey: "groupHealth", icon: HeartPulse, tone: TONE_CLASSES.red },
  professional: {
    titleKey: "groupProfessional",
    icon: Briefcase,
    tone: TONE_CLASSES.amber,
  },
  work: { titleKey: "groupWork", icon: Briefcase, tone: TONE_CLASSES.amber },
} as const;

export const getProfileKind = (profile: MyProfile): ProfileKind =>
  isStudentProfile(profile)
    ? "student"
    : isTeacherProfile(profile)
      ? "teacher"
      : isParentProfile(profile)
        ? "parent"
        : "admin";

export const getDefaults = (profile: MyProfile): ProfileFormValues => {
  const base = { email: profile.email ?? "", phone: profile.phone ?? "" };
  if (isStudentProfile(profile)) {
    const s = profile.student;
    return {
      ...base,
      address: s?.address ?? "",
      city: s?.city ?? "",
      state: s?.state ?? "",
      pincode: s?.pincode ?? "",
      bloodGroup: s?.bloodGroup ?? "",
      emergencyContact: s?.emergencyContact ?? "",
      medicalConditions: s?.medicalConditions ?? "",
    };
  }
  if (isTeacherProfile(profile)) {
    const tr = profile.teacher;
    return {
      ...base,
      address: tr?.address ?? "",
      city: tr?.city ?? "",
      state: tr?.state ?? "",
      pincode: tr?.pincode ?? "",
      qualification: tr?.qualification ?? "",
      experience: tr ? String(tr.experience) : "",
      specialization: tr?.specialization ?? "",
    };
  }
  if (isParentProfile(profile)) {
    return { ...base, alternatePhone: profile.parent?.alternatePhone ?? "" };
  }
  return {
    ...base,
    designation: profile.admin?.designation ?? "",
    department: profile.admin?.department ?? "",
  };
};

export const getCompleteness = (profile: MyProfile) => {
  const fields = FIELDS_BY_KIND[getProfileKind(profile)];
  const values = getDefaults(profile);
  const filled = fields.map(
    (field) => (values[field.name] ?? "").trim() !== "",
  );
  const filledCount = filled.filter(Boolean).length;
  return {
    filled,
    filledCount,
    missingCount: fields.length - filledCount,
    percent:
      fields.length > 0 ? Math.round((filledCount / fields.length) * 100) : 100,
  };
};

type Translate = ReturnType<typeof useTranslations<"profile">>;

const buildSchema = (
  kind: ProfileKind,
  t: Translate,
): z.ZodType<ProfileFormValues, ProfileFormValues> => {
  const blankOr = (schema: z.ZodType<string, string>) =>
    z.union([z.literal(""), schema]);
  const email = blankOr(
    z
      .string()
      .trim()
      .email({ error: t("errEmail") }),
  );
  const phone = blankOr(
    z
      .string()
      .trim()
      .regex(/^\+?[0-9]{7,15}$/, { error: t("errPhone") }),
  );
  const pincode = blankOr(
    z
      .string()
      .trim()
      .regex(/^\d{4,10}$/, { error: t("errPincode") }),
  );
  const text = (max: number) =>
    blankOr(
      z
        .string()
        .trim()
        .max(max, { error: `${t("errMax")} ${max}` }),
    );

  const shapes: Record<
    ProfileKind,
    Record<string, z.ZodType<string, string>>
  > = {
    student: {
      email,
      phone,
      address: text(200),
      city: text(50),
      state: text(50),
      pincode,
      bloodGroup: text(5),
      emergencyContact: phone,
      medicalConditions: text(500),
    },
    teacher: {
      email,
      phone,
      address: text(200),
      city: text(50),
      state: text(50),
      pincode,
      qualification: text(40),
      experience: blankOr(
        z
          .string()
          .trim()
          .regex(/^\d{1,2}$/, { error: t("errExperience") }),
      ),
      specialization: text(50),
    },
    parent: { email, phone, alternatePhone: phone },
    admin: { email, phone, designation: text(100), department: text(100) },
  };

  return z.object(shapes[kind]);
};

const buildPayload = (
  kind: ProfileKind,
  changes: ProfileFormValues,
): UpdateMyProfilePayload => {
  if (kind !== "teacher") return changes;
  const { experience, ...rest } = changes;
  const payload: UpdateTeacherProfilePayload = {
    ...rest,
    ...(experience ? { experience: Number(experience) } : {}),
  };
  return payload;
};

interface ProfileEditFormProps {
  profile: MyProfile;
  onDone: () => void;
}

export const ProfileEditForm = ({ profile, onDone }: ProfileEditFormProps) => {
  const t = useTranslations("profile");
  const kind = getProfileKind(profile);
  const fields = FIELDS_BY_KIND[kind];
  const defaults = useMemo(() => getDefaults(profile), [profile]);
  const schema = useMemo(() => buildSchema(kind, t), [kind, t]);
  const { mutate: updateProfile, isPending } = useUpdateMyProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const groups = Array.from(new Set(fields.map((field) => field.group)));

  const onSubmit = (values: ProfileFormValues) => {
    const changes = Object.fromEntries(
      Object.entries(values)
        .map(([key, value]) => [key, value.trim()] as const)
        .filter(
          ([key, value]) => value !== "" && value !== (defaults[key] ?? ""),
        ),
    );
    if (Object.keys(changes).length === 0) {
      reset(values);
      onDone();
      return;
    }
    updateProfile(buildPayload(kind, changes), {
      onSuccess: () => {
        reset(values);
        onDone();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="space-y-6 p-4 sm:p-5">
        {isDirty && (
          <Badge
            variant="outline"
            className={`rounded-full font-manrope text-[11px] ${TONE_CLASSES.amber}`}
          >
            {t("unsaved")}
          </Badge>
        )}
        {groups.map((group) => {
          const config = GROUP_CONFIG[group];
          const Icon = config.icon;
          return (
            <section key={group} className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border ${config.tone}`}
                >
                  <Icon className="size-3.5" />
                </span>
                <p className="font-jakarta text-sm font-semibold text-foreground">
                  {t(config.titleKey)}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fields
                  .filter((field) => field.group === group)
                  .map((field) => {
                    const error = errors[field.name]?.message;
                    const id = `profile-${field.name}`;
                    return (
                      <div
                        key={field.name}
                        className={`space-y-1.5 ${field.full ? "sm:col-span-2" : ""}`}
                      >
                        <Label
                          htmlFor={id}
                          className="font-manrope text-xs font-normal text-foreground/70"
                        >
                          {t(field.labelKey)}
                        </Label>
                        {field.kind === "textarea" ? (
                          <Textarea
                            id={id}
                            rows={3}
                            aria-invalid={!!error}
                            className="resize-none rounded-lg border-input bg-card font-manrope text-sm focus-visible:border-indigo-500 focus-visible:ring-0 dark:bg-card"
                            {...register(field.name)}
                          />
                        ) : (
                          <Input
                            id={id}
                            type={
                              field.kind === "number" ? "number" : field.kind
                            }
                            inputMode={
                              field.kind === "number"
                                ? "numeric"
                                : field.kind === "tel"
                                  ? "tel"
                                  : undefined
                            }
                            min={field.kind === "number" ? 0 : undefined}
                            aria-invalid={!!error}
                            className={fieldClass(!!error)}
                            {...register(field.name)}
                          />
                        )}
                        <FieldError message={error} />
                      </div>
                    );
                  })}
              </div>
              {group === "contact" && (
                <p className="font-manrope text-[11px] text-muted-foreground">
                  {t("emailHint")}
                </p>
              )}
            </section>
          );
        })}
      </div>
      <Separator />
      <div className="flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end sm:px-5">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset(defaults);
            onDone();
          }}
          disabled={isPending}
          className={`h-10 gap-1.5 px-4 text-sm ${OUTLINE_PILL_CLASS}`}
        >
          <RotateCcw className="size-3.5" />
          {t("cancelEdit")}
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
          {isPending ? t("saving") : t("saveChanges")}
        </Button>
      </div>
    </form>
  );
};

const BAR_TONES = {
  indigo: {
    active: "bg-indigo-500",
    muted: "bg-indigo-500/20",
    text: "text-indigo-600 dark:text-indigo-400",
  },
  violet: {
    active: "bg-violet-500",
    muted: "bg-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    active: "bg-amber-500",
    muted: "bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
  },
  emerald: {
    active: "bg-emerald-500",
    muted: "bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
  },
} as const;

interface ProfileStatCardProps {
  value: string;
  label: string;
  footnote: string;
  icon: React.ReactNode;
  tone: keyof typeof BAR_TONES;
  bars: number[];
  highlighted?: boolean;
  onClick?: () => void;
}

export const ProfileStatCard = ({
  value,
  label,
  footnote,
  icon,
  tone,
  bars,
  highlighted,
  onClick,
}: ProfileStatCardProps) => {
  const colors = BAR_TONES[tone];
  const content = (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p
          className={`font-jakarta text-3xl font-bold tracking-tight ${colors.text}`}
        >
          {value}
        </p>
        <p className="mt-1 font-jakarta text-sm font-semibold text-foreground">
          {label}
        </p>
        <p className="mt-2 flex items-center gap-1.5 font-manrope text-[11px] text-muted-foreground">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {icon}
          </span>
          {footnote}
        </p>
      </div>
      <div className="flex h-16 shrink-0 items-end gap-1" aria-hidden="true">
        {bars.map((height, i) => (
          <span
            key={i}
            className={`w-2.5 rounded-t-sm ${i === bars.length - 1 || height >= 1 ? colors.active : colors.muted}`}
            style={{ height: `${Math.max(15, Math.round(height * 100))}%` }}
          />
        ))}
      </div>
    </div>
  );

  const cardClass = `${CARD_CLASS} gap-0 p-5 transition-all ${
    highlighted
      ? "border-transparent shadow-[0_16px_40px_rgba(0,0,0,0.10)] lg:-translate-y-1 dark:shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
      : ""
  }`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <Card className={`${cardClass} h-full hover:border-indigo-500/40`}>
          {content}
        </Card>
      </button>
    );
  }
  return <Card className={`${cardClass} h-full`}>{content}</Card>;
};

export const ProfileSkeleton = () => (
  <div className="space-y-5">
    <Skeleton className="h-10 w-48 rounded-lg" />
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
      <Skeleton className="h-130 rounded-2xl" />
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  </div>
);
