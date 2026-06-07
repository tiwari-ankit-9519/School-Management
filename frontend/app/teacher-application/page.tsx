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
  Briefcase,
  FileText,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  X,
  Loader2,
  AlertCircle,
  ImageIcon,
  Phone,
  Mail,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedInput from "@/components/smoothui/animated-input";
import { useCreateTeacherApplication } from "@/hooks/useTeacher";
import {
  teacherApplicationSchema,
  TeacherApplicationFormValues,
} from "@/validations/validations";
import { Gender, DocumentType } from "@/types";
import { useTranslations } from "@/hooks/useTranslations";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const STEPS = [
  { id: 0, labelKey: "stepPersonal", icon: User },
  { id: 1, labelKey: "stepAddress", icon: MapPin },
  { id: 2, labelKey: "stepProfessional", icon: Briefcase },
  { id: 3, labelKey: "stepDocuments", icon: FileText },
];

const GENDER_OPTIONS = [
  { value: Gender.MALE, labelKey: "genderMale" },
  { value: Gender.FEMALE, labelKey: "genderFemale" },
  { value: Gender.OTHER, labelKey: "genderOther" },
];

const DOCUMENT_TYPE_OPTIONS = Object.values(DocumentType).map((d) => ({
  value: d,
  label: d.replace(/_/g, " "),
}));

// ─────────────────────────────────────────────
// SHARED STYLES
// ─────────────────────────────────────────────

const inputClass =
  "h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50";
const labelClass = "text-white/40";

// ─────────────────────────────────────────────
// ERROR MESSAGE COMPONENT
// ─────────────────────────────────────────────

const ErrorMsg = ({
  errors,
  field,
}: {
  errors: FieldErrors<TeacherApplicationFormValues>;
  field: keyof TeacherApplicationFormValues;
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
// MAIN PAGE
// ─────────────────────────────────────────────

const TeacherApplicationPage = () => {
  const t = useTranslations("teacherApplication");

  const [currentStep, setCurrentStep] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [documentFiles, setDocumentFiles] = useState<
    { file: File; documentType: DocumentType; title: string }[]
  >([]);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const { mutate: submitApplication, isPending } =
    useCreateTeacherApplication();

  const {
    handleSubmit,
    control,
    setValue,
    trigger,
    clearErrors,
    formState: { errors },
  } = useForm<
    TeacherApplicationFormValues,
    unknown,
    TeacherApplicationFormValues
  >({
    resolver: zodResolver(
      teacherApplicationSchema,
    ) as Resolver<TeacherApplicationFormValues>,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: undefined,
      dateOfBirth: undefined as unknown as Date,
      address: "",
      city: "",
      state: "",
      pincode: "",
      qualification: "",
      experience: undefined as unknown as number,
      specialization: undefined,
      photoUrl: undefined,
      documents: [],
    },
  });

  // ── Watched values ──────────────────────────
  const firstNameValue = useWatch({ control, name: "firstName" });
  const lastNameValue = useWatch({ control, name: "lastName" });
  const emailValue = useWatch({ control, name: "email" });
  const phoneValue = useWatch({ control, name: "phone" });
  const dateOfBirthValue = useWatch({ control, name: "dateOfBirth" });
  const addressValue = useWatch({ control, name: "address" });
  const cityValue = useWatch({ control, name: "city" });
  const stateValue = useWatch({ control, name: "state" });
  const pincodeValue = useWatch({ control, name: "pincode" });
  const qualificationValue = useWatch({ control, name: "qualification" });
  const experienceValue = useWatch({ control, name: "experience" });
  const specializationValue = useWatch({ control, name: "specialization" });

  // ── Step field mapping ──────────────────────
  const STEP_FIELDS: (keyof TeacherApplicationFormValues)[][] = [
    ["firstName", "lastName", "email", "phone", "gender", "dateOfBirth"],
    ["address", "city", "state", "pincode"],
    ["qualification", "experience"],
    [],
  ];

  // ── Navigation ──────────────────────────────
  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[currentStep]);
    if (valid) {
      clearErrors();
      setCurrentStep((p) => Math.min(STEPS.length - 1, p + 1));
    }
  };

  const handleBack = () => {
    clearErrors();
    setCurrentStep((p) => Math.max(0, p - 1));
  };

  // ── Photo handlers ──────────────────────────
  const handlePhotoChange = (file: File) => {
    const url = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoPreview(url);
  };

  // ── Document handlers ───────────────────────
  const handleAddDocument = (file: File) => {
    setDocumentFiles((prev) => [
      ...prev,
      { file, documentType: DocumentType.OTHER, title: file.name },
    ]);
  };

  const handleRemoveDocument = (index: number) => {
    setDocumentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDocumentMeta = (
    index: number,
    field: "documentType" | "title",
    value: string,
  ) => {
    setDocumentFiles((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    );
  };

  // ── Submit ──────────────────────────────────
  const onSubmit = (data: TeacherApplicationFormValues) => {
    submitApplication({
      formData: {
        ...data,
        dateOfBirth: data.dateOfBirth
          .toISOString()
          .split("T")[0] as unknown as Date,
        documents: documentFiles.map((d) => ({
          documentType: d.documentType,
          title: d.title,
        })),
      },
      files: documentFiles.map((d) => d.file),
    });
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-3 pt-20 pb-6 sm:px-6 sm:pt-24 sm:pb-10">
      {/* Background radial glow */}
      <div
        className="pointer-events-none fixed inset-0 select-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, #1e3a5f18 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, #6366f10a 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-2xl">
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
          {STEPS.map((step, i) => {
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
                {i < STEPS.length - 1 && (
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
                  STEP 0 — Personal Information
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

                  {/* Photo upload */}
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
                        {t("teacherPhoto")}
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

                  {/* Name row */}
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
                      <User className="h-4 w-4 shrink-0 text-indigo-400" />
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
                </motion.div>
              )}

              {/* ════════════════════════════════
                  STEP 1 — Address
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
                      {t("stepAddressTitle")}
                    </h2>
                    <p className="font-manrope text-xs text-white/40 mt-0.5">
                      {t("stepAddressSub")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <AnimatedInput
                      label={t("address")}
                      icon={<MapPin className="h-4 w-4 text-indigo-400" />}
                      value={addressValue}
                      onChange={(v) =>
                        setValue("address", v, { shouldValidate: true })
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
                        value={cityValue}
                        onChange={(v) =>
                          setValue("city", v, { shouldValidate: true })
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
                        value={stateValue}
                        onChange={(v) =>
                          setValue("state", v, { shouldValidate: true })
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
                      value={pincodeValue}
                      onChange={(v) =>
                        setValue("pincode", v, { shouldValidate: true })
                      }
                      inputClassName={inputClass}
                      labelClassName={labelClass}
                    />
                    <ErrorMsg errors={errors} field="pincode" />
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════
                  STEP 2 — Professional Details
              ════════════════════════════════ */}
              {currentStep === 2 && (
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
                      {t("stepProfessionalTitle")}
                    </h2>
                    <p className="font-manrope text-xs text-white/40 mt-0.5">
                      {t("stepProfessionalSub")}
                    </p>
                  </div>

                  {/* Qualification */}
                  <div className="space-y-1">
                    <AnimatedInput
                      label={t("qualification")}
                      icon={
                        <GraduationCap className="h-4 w-4 text-indigo-400" />
                      }
                      value={qualificationValue}
                      onChange={(v) =>
                        setValue("qualification", v, { shouldValidate: true })
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
                              ? (undefined as unknown as number)
                              : Number(e.target.value),
                            { shouldValidate: true },
                          )
                        }
                        className="flex-1 bg-transparent font-manrope text-sm text-white placeholder:text-white/20 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="font-manrope text-xs text-white/30 shrink-0">
                        {t("years")}
                      </span>
                    </div>
                    <ErrorMsg errors={errors} field="experience" />
                  </div>

                  {/* Specialization — optional */}
                  <div className="relative rounded-xl border border-white/8 bg-white/3 p-4">
                    <p className="mb-3 font-manrope text-xs font-medium uppercase tracking-widest text-white/30">
                      {t("specializationOptional")}
                    </p>
                    <div className="space-y-1">
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
                      <ErrorMsg errors={errors} field="specialization" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════
                  STEP 3 — Documents
              ════════════════════════════════ */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="mb-5">
                    <h2 className="font-jakarta text-lg font-bold text-white">
                      {t("stepDocumentsTitle")}
                    </h2>
                    <p className="font-manrope text-xs text-white/40 mt-0.5">
                      {t("stepDocumentsSub")}
                    </p>
                  </div>

                  {/* Suggested document types hint */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      DocumentType.RESUME,
                      DocumentType.QUALIFICATION_CERTIFICATE,
                      DocumentType.ID_PROOF,
                      DocumentType.MEDICAL_CERTIFICATE,
                    ].map((type) => (
                      <span
                        key={type}
                        className="rounded-lg border border-white/8 bg-white/5 px-2.5 py-1 font-manrope text-[10px] text-white/30"
                      >
                        {type.replace(/_/g, " ")}
                      </span>
                    ))}
                    <span className="rounded-lg border border-white/8 bg-white/5 px-2.5 py-1 font-manrope text-[10px] text-white/20">
                      + {t("moreDocuments")}
                    </span>
                  </div>

                  {/* Drop zone */}
                  <div
                    onClick={() => docInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/3 py-8 transition-colors hover:border-indigo-500/30 hover:bg-indigo-500/5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                      <Upload className="h-4 w-4 text-white/30" />
                    </div>
                    <div className="text-center">
                      <p className="font-jakarta text-sm font-semibold text-white/50">
                        {t("uploadDocuments")}
                      </p>
                      <p className="mt-0.5 font-manrope text-xs text-white/20">
                        {t("uploadHint")}
                      </p>
                    </div>
                    <input
                      ref={docInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        Array.from(e.target.files ?? []).forEach(
                          handleAddDocument,
                        );
                        e.target.value = "";
                      }}
                    />
                  </div>

                  {/* Document list */}
                  {documentFiles.length > 0 ? (
                    <div className="space-y-2">
                      {documentFiles.map((doc, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="relative rounded-xl border border-white/10 bg-white/5 p-3"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                              <span className="font-manrope text-xs text-white/60 truncate">
                                {doc.file.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDocument(i)}
                              className="ml-2 shrink-0 text-white/20 hover:text-red-400 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <input
                              type="text"
                              placeholder={t("docTitle")}
                              value={doc.title}
                              onChange={(e) =>
                                updateDocumentMeta(i, "title", e.target.value)
                              }
                              className="h-8 w-full rounded-lg border border-white/10 bg-white/5 px-3 font-manrope text-xs text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none"
                            />
                            <select
                              value={doc.documentType}
                              onChange={(e) =>
                                updateDocumentMeta(
                                  i,
                                  "documentType",
                                  e.target.value as DocumentType,
                                )
                              }
                              className="h-8 w-full rounded-lg border border-white/10 bg-[#0d1424] px-3 font-manrope text-xs text-white/60 focus:border-indigo-500/50 focus:outline-none"
                            >
                              {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center font-manrope text-xs text-white/20">
                      {t("noDocuments")}
                    </p>
                  )}
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
                {STEPS.map((_, i) => (
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

              {currentStep < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex h-11 items-center gap-2 rounded-xl border-0 bg-indigo-600 px-5 font-jakarta text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/30"
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
                  className="flex h-11 items-center gap-2 rounded-xl border-0 bg-indigo-600 px-5 font-jakarta text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/30 disabled:opacity-70"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("submitting")}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {t("submit")}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TeacherApplicationPage;
