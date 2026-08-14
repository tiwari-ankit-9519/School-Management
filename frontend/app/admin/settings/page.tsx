"use client";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import Image from "next/image";
import {
  Building2,
  Hash,
  GraduationCap,
  Award,
  CalendarDays,
  Phone,
  Mail,
  Globe,
  ImageIcon,
  MapPin,
  Landmark,
  Flag,
  Locate,
  Power,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedInput from "@/components/smoothui/animated-input";
import {
  useGetSchoolSettings,
  useUpdateSchoolSettings,
} from "@/hooks/useSchoolSettings";
import { useTranslations } from "@/hooks/useTranslations";
import { UpdateSchoolSettingsType } from "@/validations/validations";

const schoolSettingsSchema = z.object({
  phone: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      error: "Enter a valid email address",
    }),
  website: z.string().trim().optional(),
  logoUrl: z.string().trim().optional(),
});

type SchoolSettingsFormValues = z.infer<typeof schoolSettingsSchema>;

const inputClass =
  "h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50";
const labelClass = "text-white/40";

const SettingsPage = () => {
  const t = useTranslations("settings");

  const { data: settings, isLoading } = useGetSchoolSettings();
  const { mutate: updateSettings, isPending: isSaving } =
    useUpdateSchoolSettings();

  const {
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<SchoolSettingsFormValues>({
    resolver: zodResolver(schoolSettingsSchema),
    defaultValues: {
      phone: "",
      email: "",
      website: "",
      logoUrl: "",
    },
  });

  useEffect(() => {
    if (!settings) return;
    if (isDirty) return;
    reset({
      phone: settings.phone ?? "",
      email: settings.email ?? "",
      website: settings.website ?? "",
      logoUrl: settings.logoUrl ?? "",
    });
  }, [settings, reset, isDirty]);

  const phoneValue = useWatch({ control, name: "phone" });
  const emailValue = useWatch({ control, name: "email" });
  const websiteValue = useWatch({ control, name: "website" });
  const logoUrlValue = useWatch({ control, name: "logoUrl" });

  const onSubmit = (formData: SchoolSettingsFormValues) => {
    const payload: UpdateSchoolSettingsType = {
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      website: formData.website || undefined,
      logoUrl: formData.logoUrl || undefined,
    };
    updateSettings(
      { data: payload },
      {
        onSuccess: () => {
          reset(formData);
        },
      },
    );
  };
  if (isLoading) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center bg-[#050810]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
          <span className="font-manrope text-sm text-white/30">
            {t("loading")}
          </span>
        </div>
      </div>
    );
  }

  const infoRows = [
    {
      icon: <Building2 className="h-3.5 w-3.5" />,
      label: t("fieldName"),
      value: settings?.name,
    },
    {
      icon: <Hash className="h-3.5 w-3.5" />,
      label: t("fieldCode"),
      value: settings?.code,
    },
    {
      icon: <GraduationCap className="h-3.5 w-3.5" />,
      label: t("fieldBoardType"),
      value: settings?.boardType,
    },
    {
      icon: <Award className="h-3.5 w-3.5" />,
      label: t("fieldAffiliationNumber"),
      value: settings?.affiliationNumber ?? "—",
    },
    {
      icon: <CalendarDays className="h-3.5 w-3.5" />,
      label: t("fieldEstablishedYear"),
      value: settings?.establishedYear ? String(settings.establishedYear) : "—",
    },
  ];

  const addressRows = [
    {
      icon: <MapPin className="h-3.5 w-3.5" />,
      label: t("fieldAddress"),
      value: settings?.address,
    },
    {
      icon: <Landmark className="h-3.5 w-3.5" />,
      label: t("fieldCity"),
      value: settings?.city,
    },
    {
      icon: <Landmark className="h-3.5 w-3.5" />,
      label: t("fieldState"),
      value: settings?.state,
    },
    {
      icon: <Flag className="h-3.5 w-3.5" />,
      label: t("fieldCountry"),
      value: settings?.country,
    },
    {
      icon: <Locate className="h-3.5 w-3.5" />,
      label: t("fieldPincode"),
      value: settings?.pincode,
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-3 py-6 sm:px-8 sm:py-10">
      <div
        className="pointer-events-none fixed inset-0 select-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, #1e3a5f18 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, #6366f10a 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 sm:mb-10 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/20 shrink-0">
              <Image
                src="/logo.png"
                alt="EduSphere Logo"
                width={22}
                height={22}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="font-jakarta text-xl sm:text-2xl font-extrabold leading-tight text-white">
                {t("pageTitle")}
              </h1>
              <p className="font-manrope text-xs sm:text-sm text-white/40 mt-0.5">
                {t("pageSubtitle")}
              </p>
            </div>
          </div>
          {settings && (
            <span
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-manrope text-xs font-medium ${
                settings.isActive
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border-white/10 bg-white/5 text-white/30"
              }`}
            >
              <Power className="h-3 w-3" />
              {settings.isActive ? t("activeLabel") : t("inactiveLabel")}
            </span>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="relative mb-5 sm:mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/4 p-5 sm:p-6 backdrop-blur-xl"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
          <h2 className="mb-4 font-jakarta text-sm font-bold uppercase tracking-widest text-white/30">
            {t("sectionIdentity")}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {infoRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                  {row.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-manrope text-[11px] uppercase tracking-wide text-white/30">
                    {row.label}
                  </p>
                  <p className="font-manrope text-sm text-white/70 truncate">
                    {row.value || "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative mb-5 sm:mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/4 p-5 sm:p-6 backdrop-blur-xl"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
          <h2 className="mb-4 font-jakarta text-sm font-bold uppercase tracking-widest text-white/30">
            {t("sectionAddress")}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {addressRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                  {row.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-manrope text-[11px] uppercase tracking-wide text-white/30">
                    {row.label}
                  </p>
                  <p className="font-manrope text-sm text-white/70 truncate">
                    {row.value || "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 p-5 sm:p-6 backdrop-blur-xl"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
            <h2 className="mb-4 font-jakarta text-sm font-bold uppercase tracking-widest text-white/30">
              {t("sectionContact")}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <AnimatedInput
                  label={t("fieldPhone")}
                  icon={<Phone className="h-4 w-4 text-indigo-400" />}
                  value={phoneValue ?? ""}
                  onChange={(v) =>
                    setValue("phone", v, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  inputClassName={inputClass}
                  labelClassName={labelClass}
                />
                {errors.phone && (
                  <p className="ml-1 font-manrope text-xs text-red-400">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <AnimatedInput
                  label={t("fieldEmail")}
                  icon={<Mail className="h-4 w-4 text-indigo-400" />}
                  value={emailValue ?? ""}
                  onChange={(v) =>
                    setValue("email", v, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  inputClassName={inputClass}
                  labelClassName={labelClass}
                />
                {errors.email && (
                  <p className="ml-1 font-manrope text-xs text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <AnimatedInput
                  label={t("fieldWebsite")}
                  icon={<Globe className="h-4 w-4 text-indigo-400" />}
                  value={websiteValue ?? ""}
                  onChange={(v) =>
                    setValue("website", v, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  inputClassName={inputClass}
                  labelClassName={labelClass}
                />
              </div>
              <div className="space-y-1">
                <AnimatedInput
                  label={t("fieldLogoUrl")}
                  icon={<ImageIcon className="h-4 w-4 text-indigo-400" />}
                  value={logoUrlValue ?? ""}
                  onChange={(v) =>
                    setValue("logoUrl", v, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                  inputClassName={inputClass}
                  labelClassName={labelClass}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <Button
                type="submit"
                disabled={isSaving || !isDirty}
                className="h-12 rounded-xl border-0 bg-indigo-600 px-6 font-jakarta text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/30 disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("saving")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {t("saveBtn")}
                  </span>
                )}
              </Button>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
