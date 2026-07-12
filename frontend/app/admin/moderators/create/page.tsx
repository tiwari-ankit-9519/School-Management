"use client";

import { useState, useRef } from "react";
import {
  useForm,
  useWatch,
  Controller,
  FieldErrors,
  Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  User,
  MapPin,
  GraduationCap,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Loader2,
  AlertCircle,
  ImageIcon,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  Star,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedInput from "@/components/smoothui/animated-input";
import { useCreateModerator } from "@/hooks/useModerator";
import {
  moderatorSchema,
  CreateModeratorFormValues,
} from "@/validations/validations";
import { Gender, Module } from "@/types";
import { useTranslations } from "@/hooks/useTranslations";

const STEPS = [
  { id: 0, labelKey: "stepPersonal", icon: User },
  { id: 1, labelKey: "stepPermissions", icon: ShieldCheck },
  { id: 2, labelKey: "stepTeacher", icon: GraduationCap },
];

const GENDER_OPTIONS = [
  { value: Gender.MALE, labelKey: "genderMale" },
  { value: Gender.FEMALE, labelKey: "genderFemale" },
  { value: Gender.OTHER, labelKey: "genderOther" },
];

const ALL_MODULES = Object.values(Module);

const PERMISSION_COLS: {
  key: PermKey;
  label: string;
  shortLabel: string;
}[] = [
  { key: "canRead", label: "Read", shortLabel: "R" },
  { key: "canCreate", label: "Create", shortLabel: "C" },
  { key: "canUpdate", label: "Update", shortLabel: "U" },
  { key: "canDelete", label: "Delete", shortLabel: "D" },
  { key: "canApprove", label: "Approve", shortLabel: "A" },
  { key: "canExport", label: "Export", shortLabel: "E" },
];

type PermKey =
  | "canRead"
  | "canCreate"
  | "canUpdate"
  | "canDelete"
  | "canApprove"
  | "canExport";

type PermRow = {
  module: Module;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
};

function defaultPerm(module: Module): PermRow {
  return {
    module,
    canRead: true,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
    canApprove: false,
    canExport: false,
  };
}

// ─────────────────────────────────────────────
// SHARED STYLES
// ─────────────────────────────────────────────

const inputClass =
  "h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50";
const labelClass = "text-white/40";

// ─────────────────────────────────────────────
// ERROR MESSAGE
// ─────────────────────────────────────────────

const ErrorMsg = ({
  errors,
  field,
}: {
  errors: FieldErrors<CreateModeratorFormValues>;
  field: keyof CreateModeratorFormValues;
}) => {
  const error = errors[field];
  if (!error) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="ml-1 mt-1 flex items-center gap-1 font-manrope text-xs text-red-400"
    >
      <AlertCircle className="h-3 w-3 shrink-0" />
      {error.message as string}
    </motion.p>
  );
};

// ─────────────────────────────────────────────
// PERMISSION TOGGLE CELL
// ─────────────────────────────────────────────

const PermToggle = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`flex h-6 w-6 items-center justify-center rounded-md border transition-all duration-150 ${
      checked
        ? "border-indigo-500/40 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30"
        : "border-white/10 bg-white/5 text-white/20 hover:border-white/20 hover:text-white/40"
    }`}
  >
    {checked && <Check className="h-3 w-3" />}
  </button>
);

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

const CreateModeratorPage = () => {
  const t = useTranslations("createModerator");

  const [currentStep, setCurrentStep] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermRow[]>(
    ALL_MODULES.map(defaultPerm),
  );

  const photoInputRef = useRef<HTMLInputElement>(null);
  const { mutate: createModerator, isPending } = useCreateModerator();

  const {
    handleSubmit,
    control,
    setValue,
    trigger,
    clearErrors,
    formState: { errors },
  } = useForm<CreateModeratorFormValues>({
    resolver: zodResolver(
      moderatorSchema,
    ) as Resolver<CreateModeratorFormValues>,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: undefined,
      dateOfBirth: undefined as unknown as Date,
      designation: undefined,
      department: undefined,
      permissions: ALL_MODULES.map(defaultPerm),
      isTeacher: false,
      // ── All teacher-only fields start as undefined ──
      // so Zod's optional validators never run on empty strings
      address: undefined,
      city: undefined,
      state: undefined,
      pincode: undefined,
      qualification: undefined,
      experience: undefined,
      specialization: undefined,
      joiningDate: undefined,
    },
  });

  // ── Watched values ──────────────────────────
  const firstNameValue = useWatch({ control, name: "firstName" });
  const lastNameValue = useWatch({ control, name: "lastName" });
  const emailValue = useWatch({ control, name: "email" });
  const phoneValue = useWatch({ control, name: "phone" });
  const dateOfBirthValue = useWatch({ control, name: "dateOfBirth" });
  const designationValue = useWatch({ control, name: "designation" });
  const departmentValue = useWatch({ control, name: "department" });
  const isTeacherValue = useWatch({ control, name: "isTeacher" });
  const addressValue = useWatch({ control, name: "address" });
  const cityValue = useWatch({ control, name: "city" });
  const stateValue = useWatch({ control, name: "state" });
  const pincodeValue = useWatch({ control, name: "pincode" });
  const qualificationValue = useWatch({ control, name: "qualification" });
  const experienceValue = useWatch({ control, name: "experience" });
  const specializationValue = useWatch({ control, name: "specialization" });
  const joiningDateValue = useWatch({ control, name: "joiningDate" });

  // ── Steps: step 2 only shown when isTeacher ─
  const visibleSteps = isTeacherValue ? STEPS : STEPS.slice(0, 2);

  // ── Step field mapping ──────────────────────
  const STEP_FIELDS: (keyof CreateModeratorFormValues)[][] = [
    ["firstName", "lastName", "email", "phone", "gender", "dateOfBirth"],
    ["permissions"],
    // Only validate teacher fields if isTeacher is true
    isTeacherValue
      ? ["address", "city", "state", "pincode", "qualification", "joiningDate"]
      : [],
  ];

  // ── Navigation ──────────────────────────────
  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[currentStep]);
    if (valid) {
      clearErrors();
      setCurrentStep((p) => Math.min(visibleSteps.length - 1, p + 1));
    }
  };

  const handleBack = () => {
    clearErrors();
    setCurrentStep((p) => Math.max(0, p - 1));
  };

  // ── Photo ────────────────────────────────────
  const handlePhotoChange = (file: File) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // ── Permission helpers ───────────────────────
  const updatePerm = (moduleIndex: number, key: PermKey, value: boolean) => {
    const updated = permissions.map((p, i) =>
      i === moduleIndex ? { ...p, [key]: value } : p,
    );
    setPermissions(updated);
    setValue("permissions", updated, { shouldValidate: true });
  };

  const toggleAllForColumn = (key: PermKey, value: boolean) => {
    const updated = permissions.map((p) => ({ ...p, [key]: value }));
    setPermissions(updated);
    setValue("permissions", updated, { shouldValidate: true });
  };

  const toggleAllForModule = (moduleIndex: number, value: boolean) => {
    const updated = permissions.map((p, i) =>
      i === moduleIndex
        ? {
            ...p,
            canRead: value,
            canCreate: value,
            canUpdate: value,
            canDelete: value,
            canApprove: value,
            canExport: value,
          }
        : p,
    );
    setPermissions(updated);
    setValue("permissions", updated, { shouldValidate: true });
  };

  const onSubmit = (data: CreateModeratorFormValues) => {
    const payload: CreateModeratorFormValues = {
      ...data,
      dateOfBirth: data.dateOfBirth
        ? (data.dateOfBirth.toISOString().split("T")[0] as unknown as Date)
        : data.dateOfBirth,
      permissions,
      ...(data.isTeacher
        ? {}
        : {
            address: undefined,
            city: undefined,
            state: undefined,
            pincode: undefined,
            qualification: undefined,
            experience: undefined,
            specialization: undefined,
            joiningDate: undefined,
          }),
    };

    createModerator({
      formData: payload,
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-3 pb-6 sm:px-8 pt-10 sm:pt-8 sm:pb-10">
      <div
        className="pointer-events-none fixed inset-0 select-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, #1e3a5f18 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, #6366f10a 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/20">
              <Image
                src="/logo.png"
                alt="EduSphere"
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
        </motion.div>

        {/* ── Step Indicator ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 flex items-center justify-between"
        >
          {visibleSteps.map((step, i) => {
            const Icon = step.icon;
            const isCompleted = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border transition-all duration-300 ${
                      isCompleted
                        ? "border-indigo-500 bg-indigo-500"
                        : isActive
                          ? "border-indigo-400 bg-indigo-500/20"
                          : "border-white/10 bg-white/5"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <Icon
                        className={`h-3.5 w-3.5 ${isActive ? "text-indigo-400" : "text-white/20"}`}
                      />
                    )}
                  </div>
                  <span
                    className={`hidden sm:block font-manrope text-[10px] font-medium transition-colors ${
                      isActive
                        ? "text-indigo-400"
                        : isCompleted
                          ? "text-white/50"
                          : "text-white/20"
                    }`}
                  >
                    {t(step.labelKey as Parameters<typeof t>[0])}
                  </span>
                </div>
                {i < visibleSteps.length - 1 && (
                  <div
                    className={`mx-1 sm:mx-2 h-px flex-1 transition-all duration-500 ${
                      i < currentStep ? "bg-indigo-500" : "bg-white/10"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </motion.div>

        {/* ── Card ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/5 to-transparent" />

          <div className="p-5 sm:p-8">
            <AnimatePresence mode="wait">
              {/* ════════════════════════════════
                  STEP 0 — Personal Info
              ════════════════════════════════ */}
              {currentStep === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="mb-5">
                    <h2 className="font-jakarta text-lg font-bold text-white">
                      {t("stepPersonalTitle")}
                    </h2>
                    <p className="font-manrope text-xs text-white/40 mt-0.5">
                      {t("stepPersonalSub")}
                    </p>
                  </div>

                  {/* Photo */}
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => photoInputRef.current?.click()}
                      className="relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-white/5 transition-colors hover:border-indigo-500/40 hover:bg-indigo-500/5"
                    >
                      {photoPreview ? (
                        <Image
                          src={photoPreview}
                          alt="Photo"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <ImageIcon className="h-5 w-5 text-white/20" />
                          <span className="font-manrope text-[10px] text-white/20">
                            {t("photo")}
                          </span>
                        </div>
                      )}
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoChange(file);
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-jakarta text-sm font-semibold text-white">
                        {t("profilePhoto")}
                      </p>
                      <p className="mt-0.5 font-manrope text-xs text-white/30">
                        {t("photoHint")}
                      </p>
                      {photoFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreview(null);
                          }}
                          className="mt-1.5 flex items-center gap-1 font-manrope text-xs text-red-400 hover:text-red-300"
                        >
                          <X className="h-3 w-3" /> {t("removePhoto")}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <AnimatedInput
                        label={t("firstName")}
                        icon={<User className="h-4 w-4 text-indigo-400" />}
                        value={firstNameValue}
                        onChange={(v) =>
                          setValue("firstName", v, { shouldValidate: true })
                        }
                        inputClassName={inputClass}
                        labelClassName={labelClass}
                      />
                      <ErrorMsg errors={errors} field="firstName" />
                    </div>
                    <div className="space-y-1">
                      <AnimatedInput
                        label={t("lastName")}
                        icon={<User className="h-4 w-4 text-indigo-400" />}
                        value={lastNameValue}
                        onChange={(v) =>
                          setValue("lastName", v, { shouldValidate: true })
                        }
                        inputClassName={inputClass}
                        labelClassName={labelClass}
                      />
                      <ErrorMsg errors={errors} field="lastName" />
                    </div>
                  </div>

                  {/* Email + Phone */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <AnimatedInput
                        label={t("email")}
                        icon={<Mail className="h-4 w-4 text-indigo-400" />}
                        value={emailValue}
                        onChange={(v) =>
                          setValue("email", v, { shouldValidate: true })
                        }
                        inputClassName={inputClass}
                        labelClassName={labelClass}
                      />
                      <ErrorMsg errors={errors} field="email" />
                    </div>
                    <div className="space-y-1">
                      <AnimatedInput
                        label={t("phone")}
                        icon={<Phone className="h-4 w-4 text-indigo-400" />}
                        value={phoneValue}
                        onChange={(v) =>
                          setValue("phone", v, { shouldValidate: true })
                        }
                        inputClassName={inputClass}
                        labelClassName={labelClass}
                      />
                      <ErrorMsg errors={errors} field="phone" />
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <p className="font-manrope text-xs text-white/40 mb-2">
                      {t("gender")}
                    </p>
                    <Controller
                      control={control}
                      name="gender"
                      render={({ field }) => (
                        <div className="flex gap-2">
                          {GENDER_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                field.onChange(opt.value);
                                clearErrors("gender");
                              }}
                              className={`flex-1 rounded-xl border py-2.5 font-manrope text-xs font-medium transition-all duration-200 ${
                                field.value === opt.value
                                  ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-300"
                                  : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/70"
                              }`}
                            >
                              {t(opt.labelKey as Parameters<typeof t>[0])}
                            </button>
                          ))}
                        </div>
                      )}
                    />
                    <ErrorMsg errors={errors} field="gender" />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1">
                    <label className="font-manrope text-xs text-white/40">
                      {t("dateOfBirth")}
                    </label>
                    <div className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 focus-within:border-indigo-500/50">
                      <Calendar className="h-4 w-4 shrink-0 text-indigo-400" />
                      <input
                        type="date"
                        value={
                          dateOfBirthValue
                            ? new Date(dateOfBirthValue)
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          setValue("dateOfBirth", new Date(e.target.value), {
                            shouldValidate: true,
                          })
                        }
                        className="flex-1 bg-transparent font-manrope text-sm text-white focus:outline-none scheme-dark"
                      />
                    </div>
                    <ErrorMsg errors={errors} field="dateOfBirth" />
                  </div>

                  {/* Designation + Department (optional) */}
                  <div className="relative rounded-xl border border-white/8 bg-white/3 p-4">
                    <p className="mb-3 font-manrope text-xs font-medium uppercase tracking-widest text-white/30">
                      {t("roleOptional")}
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <AnimatedInput
                          label={t("designation")}
                          icon={
                            <Briefcase className="h-4 w-4 text-indigo-400" />
                          }
                          value={designationValue ?? ""}
                          onChange={(v) =>
                            setValue("designation", v || undefined, {
                              shouldValidate: true,
                            })
                          }
                          inputClassName={inputClass}
                          labelClassName={labelClass}
                        />
                        <ErrorMsg errors={errors} field="designation" />
                      </div>
                      <div className="space-y-1">
                        <AnimatedInput
                          label={t("department")}
                          icon={
                            <Building2 className="h-4 w-4 text-indigo-400" />
                          }
                          value={departmentValue ?? ""}
                          onChange={(v) =>
                            setValue("department", v || undefined, {
                              shouldValidate: true,
                            })
                          }
                          inputClassName={inputClass}
                          labelClassName={labelClass}
                        />
                        <ErrorMsg errors={errors} field="department" />
                      </div>
                    </div>
                  </div>

                  {/* isTeacher toggle */}
                  <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 px-4 py-3.5">
                    <div>
                      <p className="font-jakarta text-sm font-semibold text-white">
                        {t("isTeacherLabel")}
                      </p>
                      <p className="mt-0.5 font-manrope text-xs text-white/40">
                        {t("isTeacherHint")}
                      </p>
                    </div>
                    <Controller
                      control={control}
                      name="isTeacher"
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => {
                            const nextValue = !field.value;

                            field.onChange(nextValue);

                            // If teacher mode is being turned off,
                            // return to the permissions step.
                            if (!nextValue) {
                              setCurrentStep(1);
                            }
                          }}
                          className="shrink-0 transition-colors"
                        >
                          {field.value ? (
                            <ToggleRight className="h-8 w-8 text-indigo-400" />
                          ) : (
                            <ToggleLeft className="h-8 w-8 text-white/20" />
                          )}
                        </button>
                      )}
                    />
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════
                  STEP 1 — Permissions
              ════════════════════════════════ */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="mb-5">
                    <h2 className="font-jakarta text-lg font-bold text-white">
                      {t("stepPermissionsTitle")}
                    </h2>
                    <p className="font-manrope text-xs text-white/40 mt-0.5">
                      {t("stepPermissionsSub")}
                    </p>
                  </div>

                  {errors.permissions && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 font-manrope text-xs text-red-400"
                    >
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {errors.permissions.message as string}
                    </motion.p>
                  )}

                  {/* Permissions table */}
                  <div className="overflow-hidden rounded-xl border border-white/8">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_repeat(6,40px)] gap-2 border-b border-white/8 bg-white/3 px-4 py-2.5 sm:grid-cols-[1fr_repeat(6,48px)]">
                      <span className="font-manrope text-[10px] font-semibold uppercase tracking-widest text-white/30">
                        {t("permColModule")}
                      </span>
                      {PERMISSION_COLS.map((col) => (
                        <div
                          key={col.key}
                          className="flex flex-col items-center gap-1"
                        >
                          <span className="hidden font-manrope text-[10px] font-semibold uppercase tracking-widest text-white/30 sm:block">
                            {col.label}
                          </span>
                          <span className="font-manrope text-[10px] font-semibold uppercase tracking-widest text-white/30 sm:hidden">
                            {col.shortLabel}
                          </span>
                          {/* Toggle entire column */}
                          <button
                            type="button"
                            title={`Toggle all ${col.label}`}
                            onClick={() => {
                              const allOn = permissions.every(
                                (p) => p[col.key],
                              );
                              toggleAllForColumn(col.key, !allOn);
                            }}
                            className="h-4 w-4 rounded border border-white/10 bg-white/5 transition-colors hover:border-indigo-500/40 hover:bg-indigo-500/10"
                          >
                            {permissions.every((p) => p[col.key]) && (
                              <Check className="mx-auto h-2.5 w-2.5 text-indigo-400" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Module rows */}
                    <div className="max-h-95 divide-y divide-white/5 overflow-y-auto">
                      {permissions.map((perm, idx) => {
                        const allOn = PERMISSION_COLS.every((c) => perm[c.key]);
                        return (
                          <div
                            key={perm.module}
                            className="grid grid-cols-[1fr_repeat(6,40px)] gap-2 items-center px-4 py-2.5 transition-colors hover:bg-white/3 sm:grid-cols-[1fr_repeat(6,48px)]"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Toggle all for this module */}
                              <button
                                type="button"
                                title="Toggle all for this module"
                                onClick={() => toggleAllForModule(idx, !allOn)}
                                className={`h-4 w-4 shrink-0 rounded border transition-colors ${
                                  allOn
                                    ? "border-indigo-500/40 bg-indigo-500/20"
                                    : "border-white/10 bg-white/5 hover:border-white/20"
                                }`}
                              >
                                {allOn && (
                                  <Check className="mx-auto h-2.5 w-2.5 text-indigo-400" />
                                )}
                              </button>
                              <span className="truncate font-manrope text-xs text-white/60">
                                {perm.module.replace(/_/g, " ")}
                              </span>
                            </div>
                            {PERMISSION_COLS.map((col) => (
                              <div
                                key={col.key}
                                className="flex items-center justify-center"
                              >
                                <PermToggle
                                  checked={perm[col.key]}
                                  onChange={(v) => updatePerm(idx, col.key, v)}
                                />
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    {PERMISSION_COLS.map((col) => (
                      <div key={col.key} className="flex items-center gap-1.5">
                        <div className="flex h-4 w-4 items-center justify-center rounded border border-indigo-500/40 bg-indigo-500/20">
                          <Check className="h-2.5 w-2.5 text-indigo-400" />
                        </div>
                        <span className="font-manrope text-[11px] text-white/30">
                          {col.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════
                  STEP 2 — Teacher Details
              ════════════════════════════════ */}
              {currentStep === 2 && isTeacherValue && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="mb-5">
                    <h2 className="font-jakarta text-lg font-bold text-white">
                      {t("stepTeacherTitle")}
                    </h2>
                    <p className="font-manrope text-xs text-white/40 mt-0.5">
                      {t("stepTeacherSub")}
                    </p>
                  </div>

                  {/* Address */}
                  <div className="space-y-1">
                    <AnimatedInput
                      label={t("address")}
                      icon={<MapPin className="h-4 w-4 text-indigo-400" />}
                      value={addressValue ?? ""}
                      onChange={(v) =>
                        setValue("address", v || undefined, {
                          shouldValidate: true,
                        })
                      }
                      inputClassName={inputClass}
                      labelClassName={labelClass}
                    />
                    <ErrorMsg errors={errors} field="address" />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <AnimatedInput
                        label={t("city")}
                        icon={<MapPin className="h-4 w-4 text-indigo-400" />}
                        value={cityValue ?? ""}
                        onChange={(v) =>
                          setValue("city", v || undefined, {
                            shouldValidate: true,
                          })
                        }
                        inputClassName={inputClass}
                        labelClassName={labelClass}
                      />
                      <ErrorMsg errors={errors} field="city" />
                    </div>
                    <div className="space-y-1">
                      <AnimatedInput
                        label={t("state")}
                        icon={<MapPin className="h-4 w-4 text-indigo-400" />}
                        value={stateValue ?? ""}
                        onChange={(v) =>
                          setValue("state", v || undefined, {
                            shouldValidate: true,
                          })
                        }
                        inputClassName={inputClass}
                        labelClassName={labelClass}
                      />
                      <ErrorMsg errors={errors} field="state" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <AnimatedInput
                      label={t("pincode")}
                      icon={<MapPin className="h-4 w-4 text-indigo-400" />}
                      value={pincodeValue ?? ""}
                      onChange={(v) =>
                        setValue("pincode", v || undefined, {
                          shouldValidate: true,
                        })
                      }
                      inputClassName={inputClass}
                      labelClassName={labelClass}
                    />
                    <ErrorMsg errors={errors} field="pincode" />
                  </div>

                  {/* Qualification */}
                  <div className="space-y-1">
                    <AnimatedInput
                      label={t("qualification")}
                      icon={
                        <GraduationCap className="h-4 w-4 text-indigo-400" />
                      }
                      value={qualificationValue ?? ""}
                      onChange={(v) =>
                        setValue("qualification", v || undefined, {
                          shouldValidate: true,
                        })
                      }
                      inputClassName={inputClass}
                      labelClassName={labelClass}
                    />
                    <ErrorMsg errors={errors} field="qualification" />
                  </div>

                  {/* Experience */}
                  <div className="space-y-1">
                    <label className="font-manrope text-xs text-white/40">
                      {t("experience")}
                    </label>
                    <div className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 focus-within:border-indigo-500/50">
                      <Briefcase className="h-4 w-4 shrink-0 text-indigo-400" />
                      <input
                        type="number"
                        min={0}
                        max={60}
                        placeholder="0"
                        value={experienceValue ?? ""}
                        onChange={(e) =>
                          setValue(
                            "experience",
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                            { shouldValidate: true },
                          )
                        }
                        className="flex-1 bg-transparent font-manrope text-sm text-white placeholder:text-white/20 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="shrink-0 font-manrope text-xs text-white/30">
                        {t("years")}
                      </span>
                    </div>
                    <ErrorMsg errors={errors} field="experience" />
                  </div>

                  {/* Joining Date */}
                  <div className="space-y-1">
                    <label className="font-manrope text-xs text-white/40">
                      {t("joiningDate")}
                    </label>
                    <div className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 focus-within:border-indigo-500/50">
                      <Calendar className="h-4 w-4 shrink-0 text-indigo-400" />
                      <input
                        type="date"
                        value={joiningDateValue ?? ""}
                        onChange={(e) =>
                          setValue("joiningDate", e.target.value || undefined, {
                            shouldValidate: true,
                          })
                        }
                        className="flex-1 bg-transparent font-manrope text-sm text-white focus:outline-none scheme-dark"
                      />
                    </div>
                    <ErrorMsg errors={errors} field="joiningDate" />
                  </div>

                  {/* Specialization (optional) */}
                  <div className="relative rounded-xl border border-white/8 bg-white/3 p-4">
                    <p className="mb-3 font-manrope text-xs font-medium uppercase tracking-widest text-white/30">
                      {t("specializationOptional")}
                    </p>
                    <AnimatedInput
                      label={t("specialization")}
                      icon={<Star className="h-4 w-4 text-indigo-400" />}
                      value={specializationValue ?? ""}
                      onChange={(v) =>
                        setValue("specialization", v || undefined, {
                          shouldValidate: true,
                        })
                      }
                      inputClassName={inputClass}
                      labelClassName={labelClass}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Footer Navigation ── */}
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/8 pt-6">
              <Button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 font-jakarta text-sm font-bold text-white/60 transition-all duration-200 hover:bg-white/8 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                {t("back")}
              </Button>

              {/* Progress dots */}
              <div className="flex items-center gap-1.5">
                {visibleSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? "w-5 bg-indigo-500"
                        : i < currentStep
                          ? "w-1.5 bg-indigo-500/40"
                          : "w-1.5 bg-white/10"
                    }`}
                  />
                ))}
              </div>

              {currentStep < visibleSteps.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex h-11 items-center gap-2 rounded-xl border-0 bg-indigo-600 px-5 font-jakarta text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500"
                >
                  {t("next")}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit(onSubmit, (errs) =>
                    console.log("Submit errors:", errs),
                  )}
                  disabled={isPending}
                  className="flex h-11 items-center gap-2 rounded-xl border-0 bg-indigo-600 px-5 font-jakarta text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500 disabled:opacity-70"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("creating")}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {t("create")}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <p className="mt-5 text-center font-manrope text-[11px] text-white/20">
          {t("footer")}
        </p>
      </div>
    </div>
  );
};

export default CreateModeratorPage;
