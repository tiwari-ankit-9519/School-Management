"use client";
import { useSchoolApplication } from "@/hooks/useSchoolApplication";
import {
  schoolApplicationFormSchema,
  SchoolApplicationFormData,
} from "@/validations/validations";
import { Gender, DocumentType } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import AnimatedInput from "@/components/smoothui/animated-input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  User,
  Upload,
  X,
  FileText,
  Hash,
  GraduationCap,
  BookOpen,
  Users,
  Award,
} from "lucide-react";
import { useState, useRef } from "react";

const STEPS = [
  { id: 1, label: "School Info", icon: Building2 },
  { id: 2, label: "Location", icon: MapPin },
  { id: 3, label: "Admin Info", icon: User },
  { id: 4, label: "Documents", icon: FileText },
];

const BOARD_OPTIONS = [
  "CBSE",
  "ICSE",
  "UP Board",
  "Maharashtra Board",
  "Tamil Nadu Board",
  "Karnataka Board",
  "Other",
];

const GENDER_OPTIONS: { label: string; value: Gender }[] = [
  { label: "Male", value: Gender.MALE },
  { label: "Female", value: Gender.FEMALE },
  { label: "Other", value: Gender.OTHER },
];

const PLATFORM_FEATURES = [
  {
    icon: GraduationCap,
    label: "Student Management",
    desc: "Admissions, attendance, grades",
  },
  { icon: Users, label: "Staff Portal", desc: "HR, payroll, scheduling" },
  {
    icon: BookOpen,
    label: "Academic Tools",
    desc: "Curriculum, exams, reports",
  },
  {
    icon: Award,
    label: "Performance Analytics",
    desc: "Insights across all grades",
  },
];

const DOCUMENT_OPTIONS = [
  { icon: FileText, label: "Registration Certificate" },
  { icon: Award, label: "Affiliation Certificate" },
  { icon: BookOpen, label: "NOC / Approval Letter" },
  { icon: Building2, label: "Infrastructure Proof" },
];

const SchoolApplicationForm = () => {
  const { mutate: schoolApplicationRegister, isPending } =
    useSchoolApplication();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    trigger,
  } = useForm<SchoolApplicationFormData>({
    resolver: zodResolver(schoolApplicationFormSchema),
    defaultValues: {
      schoolName: "",
      address: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
      phone: "",
      email: "",
      website: "",
      establishedYear: new Date().getFullYear(),
      boardType: "",
      affiliationNumber: "",
      adminFirstName: "",
      adminLastName: "",
      adminEmail: "",
      adminPhone: "",
      adminGender: Gender.MALE,
    },
  });

  const watched = useWatch({ control });

  const stepFields: Record<number, (keyof SchoolApplicationFormData)[]> = {
    1: [
      "schoolName",
      "email",
      "phone",
      "website",
      "establishedYear",
      "boardType",
      "affiliationNumber",
    ],
    2: ["address", "city", "state", "country", "pincode"],
    3: [
      "adminFirstName",
      "adminLastName",
      "adminEmail",
      "adminPhone",
      "adminGender",
    ],
    4: [],
  };

  const handleNext = async () => {
    const valid = await trigger(stepFields[currentStep]);
    if (valid) setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const merged = [...uploadedFiles, ...files].slice(0, 10);
    setUploadedFiles(merged);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: SchoolApplicationFormData) => {
    if (currentStep !== 4) return;
    schoolApplicationRegister({
      formData: {
        ...data,
        documents: uploadedFiles.map((file) => ({
          documentType: DocumentType.OTHER,
          title: file.name,
        })),
      },
      files: uploadedFiles,
    });
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050810] overflow-x-hidden top-10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 20%, #1e3a5f18 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, #6366f10d 0%, transparent 50%)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.018]">
          <svg
            viewBox="0 0 800 600"
            className="w-full h-full"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern
                id="smallgrid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
              <pattern
                id="grid"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <rect width="100" height="100" fill="url(#smallgrid)" />
                <path
                  d="M 100 0 L 0 0 0 100"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <div className="absolute top-1/4 left-1/4 w-64 h-60 rounded-full bg-indigo-500/4 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-sky-500/4 blur-3xl" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-150 h-120 opacity-[0.025]"
            style={{
              background:
                "conic-gradient(from 0deg, #6366f1, #0ea5e9, #6366f1)",
              borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
              filter: "blur(60px)",
            }}
          />
        </div>
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.015]"
          viewBox="0 0 1200 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <g stroke="white" strokeWidth="0.5" fill="none">
            <path d="M 100 400 Q 300 200 500 400 T 900 400" />
            <path d="M 0 300 Q 200 100 400 300 T 800 300 T 1200 300" />
            <path d="M 0 500 Q 200 300 400 500 T 800 500 T 1200 500" />
          </g>
        </svg>
        <div className="absolute top-8 left-8 hidden xl:flex flex-col gap-3 opacity-40">
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm w-56">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center shrink-0">
              <GraduationCap className="h-4 w-4 text-indigo-300" />
            </div>
            <div>
              <p className="text-white text-xs font-bold font-jakarta leading-none mb-0.5">
                340+ Schools
              </p>
              <p className="text-white/40 text-[10px] font-manrope">
                Already onboarded
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm w-56">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/20 flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <p className="text-white text-xs font-bold font-jakarta leading-none mb-0.5">
                12,840+ Students
              </p>
              <p className="text-white/40 text-[10px] font-manrope">
                Managed on platform
              </p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-14 right-8 hidden xl:flex flex-col gap-3 opacity-40">
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm w-56">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/20 flex items-center justify-center shrink-0">
              <BookOpen className="h-4 w-4 text-sky-300" />
            </div>
            <div>
              <p className="text-white text-xs font-bold font-jakarta leading-none mb-0.5">
                48h Setup
              </p>
              <p className="text-white/40 text-[10px] font-manrope">
                After approval
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm w-56">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/20 flex items-center justify-center shrink-0">
              <Award className="h-4 w-4 text-amber-300" />
            </div>
            <div>
              <p className="text-white text-xs font-bold font-jakarta leading-none mb-0.5">
                24/7 Support
              </p>
              <p className="text-white/40 text-[10px] font-manrope">
                Always available
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-1/2 left-8 -translate-y-1/2 hidden xl:flex flex-col gap-2 opacity-20">
          {[
            "Springfield Academy",
            "Greenwood High",
            "Sunrise Public School",
            "Delhi Public School",
          ].map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-sm"
            >
              <div className="w-3 h-3 rounded-full bg-indigo-500/50 border border-indigo-400/30 shrink-0" />
              <span className="text-white/60 text-[10px] font-manrope">
                {name}
              </span>
            </motion.div>
          ))}
        </div>
        <div className="absolute top-1/2 right-8 -translate-y-1/2 hidden xl:flex flex-col gap-2 opacity-20">
          {PLATFORM_FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-sm"
              >
                <Icon className="h-3 w-3 text-indigo-300 shrink-0" />
                <span className="text-white/60 text-[10px] font-manrope">
                  {f.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex items-start justify-center px-3 py-6 sm:px-6 sm:py-8 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl"
        >
          <div className="relative bg-white/4 border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 backdrop-blur-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_32px_80px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl overflow-hidden pointer-events-none">
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/5 to-transparent" />
            </div>

            <div className="flex items-center gap-3 mb-5 sm:mb-6">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <Image
                  src="/logo.png"
                  alt="EduSphere Logo"
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-white text-sm font-bold font-jakarta tracking-tight block leading-none">
                  EduSphere
                </span>
                <span className="text-white/30 text-xs font-manrope">
                  School Management SaaS
                </span>
              </div>
            </div>

            <div className="mb-5 sm:mb-6">
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-400/20 rounded-full px-3 py-1 mb-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-indigo-300 text-xs font-manrope">
                  Applications open · 2026–27
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-jakarta text-white leading-tight mb-1">
                Register Your School
              </h1>
              <p className="text-xs sm:text-sm text-white/40 font-manrope">
                Complete the application to onboard your school onto EduSphere
              </p>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 mb-5 sm:mb-6">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <div
                    key={step.id}
                    className="flex items-center gap-1.5 sm:gap-2 flex-1"
                  >
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isCompleted
                            ? "bg-indigo-500 border border-indigo-400"
                            : isActive
                              ? "bg-indigo-500/20 border border-indigo-400/60"
                              : "bg-white/5 border border-white/10"
                        }`}
                      >
                        <Icon
                          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                            isCompleted || isActive
                              ? "text-indigo-300"
                              : "text-white/30"
                          }`}
                        />
                      </div>
                      <span
                        className={`text-[9px] sm:text-[10px] font-manrope hidden sm:block ${
                          isActive ? "text-white/70" : "text-white/25"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`h-px flex-1 mb-4 sm:mb-5 transition-all duration-500 ${
                          isCompleted ? "bg-indigo-500/50" : "bg-white/10"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (currentStep !== 4) return;
                handleSubmit(onSubmit)(e);
              }}
            >
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="col-span-1 sm:col-span-2 space-y-1.5">
                        <AnimatedInput
                          label="School Name"
                          icon={
                            <Building2 className="h-4 w-4 text-indigo-400" />
                          }
                          value={watched.schoolName ?? ""}
                          onChange={(val) =>
                            setValue("schoolName", val, {
                              shouldValidate: true,
                            })
                          }
                          inputClassName="h-11 sm:h-12 rounded-xl border-white/10 bg-white/5 text-white focus-visible:ring-indigo-500/50"
                          labelClassName="text-white/40"
                        />
                        {errors.schoolName && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.schoolName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <AnimatedInput
                          label="School Email"
                          icon={<Mail className="h-4 w-4 text-indigo-400" />}
                          value={watched.email ?? ""}
                          onChange={(val) =>
                            setValue("email", val, { shouldValidate: true })
                          }
                          inputClassName="h-11 sm:h-12 rounded-xl border-white/10 bg-white/5 text-white focus-visible:ring-indigo-500/50"
                          labelClassName="text-white/40"
                        />
                        {errors.email && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.email.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <AnimatedInput
                          label="School Phone"
                          icon={<Phone className="h-4 w-4 text-indigo-400" />}
                          value={watched.phone ?? ""}
                          onChange={(val) =>
                            setValue("phone", val, { shouldValidate: true })
                          }
                          inputClassName="h-11 sm:h-12 rounded-xl border-white/10 bg-white/5 text-white focus-visible:ring-indigo-500/50"
                          labelClassName="text-white/40"
                        />
                        {errors.phone && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.phone.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <AnimatedInput
                          label="Website (optional)"
                          icon={<Globe className="h-4 w-4 text-indigo-400" />}
                          value={watched.website ?? ""}
                          onChange={(val) =>
                            setValue("website", val, { shouldValidate: true })
                          }
                          inputClassName="h-11 sm:h-12 rounded-xl border-white/10 bg-white/5 text-white focus-visible:ring-indigo-500/50"
                          labelClassName="text-white/40"
                        />
                        {errors.website && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.website.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <AnimatedInput
                          label="Established Year"
                          icon={
                            <Calendar className="h-4 w-4 text-indigo-400" />
                          }
                          value={String(watched.establishedYear ?? "")}
                          onChange={(val) =>
                            setValue("establishedYear", parseInt(val) || 0, {
                              shouldValidate: true,
                            })
                          }
                          inputClassName="h-11 sm:h-12 rounded-xl border-white/10 bg-white/5 text-white focus-visible:ring-indigo-500/50"
                          labelClassName="text-white/40"
                        />
                        {errors.establishedYear && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.establishedYear.message}
                          </p>
                        )}
                      </div>
                      <div className="col-span-1 sm:col-span-2 space-y-1.5">
                        <AnimatedInput
                          label="Affiliation Number (optional)"
                          icon={<Hash className="h-4 w-4 text-indigo-400" />}
                          value={watched.affiliationNumber ?? ""}
                          onChange={(val) =>
                            setValue("affiliationNumber", val, {
                              shouldValidate: true,
                            })
                          }
                          inputClassName="h-11 sm:h-12 rounded-xl border-white/10 bg-white/5 text-white focus-visible:ring-indigo-500/50"
                          labelClassName="text-white/40"
                        />
                        {errors.affiliationNumber && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.affiliationNumber.message}
                          </p>
                        )}
                      </div>
                      <div className="col-span-1 sm:col-span-2 space-y-1.5">
                        <label className="text-xs text-white/40 font-manrope ml-1 block mb-1.5">
                          Board Type
                        </label>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {BOARD_OPTIONS.map((board) => (
                            <button
                              key={board}
                              type="button"
                              onClick={() =>
                                setValue("boardType", board, {
                                  shouldValidate: true,
                                })
                              }
                              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-manrope border transition-all duration-200 ${
                                watched.boardType === board
                                  ? "bg-indigo-500/30 border-indigo-400/60 text-indigo-300"
                                  : "bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                              }`}
                            >
                              {board}
                            </button>
                          ))}
                        </div>
                        {errors.boardType && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.boardType.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="col-span-1 sm:col-span-2 space-y-1.5">
                        <AnimatedInput
                          label="Address"
                          icon={<MapPin className="h-4 w-4 text-indigo-400" />}
                          value={watched.address ?? ""}
                          onChange={(val) =>
                            setValue("address", val, { shouldValidate: true })
                          }
                          inputClassName="h-11 sm:h-12 rounded-xl border-white/10 bg-white/5 text-white focus-visible:ring-indigo-500/50"
                          labelClassName="text-white/40"
                        />
                        {errors.address && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.address.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <AnimatedInput
                          label="City"
                          icon={
                            <Building2 className="h-4 w-4 text-indigo-400" />
                          }
                          value={watched.city ?? ""}
                          onChange={(val) =>
                            setValue("city", val, { shouldValidate: true })
                          }
                          inputClassName="h-11 sm:h-12 rounded-xl border-white/10 bg-white/5 text-white focus-visible:ring-indigo-500/50"
                          labelClassName="text-white/40"
                        />
                        {errors.city && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.city.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <AnimatedInput
                          label="State"
                          icon={<MapPin className="h-4 w-4 text-indigo-400" />}
                          value={watched.state ?? ""}
                          onChange={(val) =>
                            setValue("state", val, { shouldValidate: true })
                          }
                          inputClassName="h-11 sm:h-12 rounded-xl border-white/10 bg-white/5 text-white focus-visible:ring-indigo-500/50"
                          labelClassName="text-white/40"
                        />
                        {errors.state && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.state.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <AnimatedInput
                          label="Country"
                          icon={<Globe className="h-4 w-4 text-indigo-400" />}
                          value={watched.country ?? ""}
                          onChange={(val) =>
                            setValue("country", val, { shouldValidate: true })
                          }
                          inputClassName="h-11 sm:h-12 rounded-xl border-white/10 bg-white/5 text-white focus-visible:ring-indigo-500/50"
                          labelClassName="text-white/40"
                        />
                        {errors.country && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.country.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <AnimatedInput
                          label="Pincode"
                          icon={<Hash className="h-4 w-4 text-indigo-400" />}
                          value={watched.pincode ?? ""}
                          onChange={(val) =>
                            setValue("pincode", val, { shouldValidate: true })
                          }
                          inputClassName="h-11 sm:h-12 rounded-xl border-white/10 bg-white/5 text-white focus-visible:ring-indigo-500/50"
                          labelClassName="text-white/40"
                        />
                        {errors.pincode && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.pincode.message}
                          </p>
                        )}
                      </div>
                      <div className="col-span-1 sm:col-span-2 bg-white/2 border border-white/6 rounded-2xl p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-white/60 text-xs font-jakarta font-semibold mb-0.5">
                              Location Details
                            </p>
                            <p className="text-white/25 text-xs font-manrope leading-relaxed">
                              Provide the complete registered address of your
                              school. This will be used for official
                              correspondence and verification purposes.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <AnimatedInput
                          label="First Name"
                          icon={<User className="h-4 w-4 text-indigo-400" />}
                          value={watched.adminFirstName ?? ""}
                          onChange={(val) =>
                            setValue("adminFirstName", val, {
                              shouldValidate: true,
                            })
                          }
                          inputClassName="h-11 sm:h-12 rounded-xl border-white/10 bg-white/5 text-white focus-visible:ring-indigo-500/50"
                          labelClassName="text-white/40"
                        />
                        {errors.adminFirstName && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.adminFirstName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <AnimatedInput
                          label="Last Name"
                          icon={<User className="h-4 w-4 text-indigo-400" />}
                          value={watched.adminLastName ?? ""}
                          onChange={(val) =>
                            setValue("adminLastName", val, {
                              shouldValidate: true,
                            })
                          }
                          inputClassName="h-11 sm:h-12 rounded-xl border-white/10 bg-white/5 text-white focus-visible:ring-indigo-500/50"
                          labelClassName="text-white/40"
                        />
                        {errors.adminLastName && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.adminLastName.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <AnimatedInput
                          label="Admin Email"
                          icon={<Mail className="h-4 w-4 text-indigo-400" />}
                          value={watched.adminEmail ?? ""}
                          onChange={(val) =>
                            setValue("adminEmail", val, {
                              shouldValidate: true,
                            })
                          }
                          inputClassName="h-11 sm:h-12 rounded-xl border-white/10 bg-white/5 text-white focus-visible:ring-indigo-500/50"
                          labelClassName="text-white/40"
                        />
                        {errors.adminEmail && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.adminEmail.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <AnimatedInput
                          label="Admin Phone"
                          icon={<Phone className="h-4 w-4 text-indigo-400" />}
                          value={watched.adminPhone ?? ""}
                          onChange={(val) =>
                            setValue("adminPhone", val, {
                              shouldValidate: true,
                            })
                          }
                          inputClassName="h-11 sm:h-12 rounded-xl border-white/10 bg-white/5 text-white focus-visible:ring-indigo-500/50"
                          labelClassName="text-white/40"
                        />
                        {errors.adminPhone && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.adminPhone.message}
                          </p>
                        )}
                      </div>
                      <div className="col-span-1 sm:col-span-2 space-y-1.5">
                        <label className="text-xs text-white/40 font-manrope ml-1 block mb-1.5">
                          Gender
                        </label>
                        <div className="flex gap-2 sm:gap-3">
                          {GENDER_OPTIONS.map((g) => (
                            <button
                              key={g.value}
                              type="button"
                              onClick={() =>
                                setValue("adminGender", g.value, {
                                  shouldValidate: true,
                                })
                              }
                              className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs font-manrope border transition-all duration-200 ${
                                watched.adminGender === g.value
                                  ? "bg-indigo-500/30 border-indigo-400/60 text-indigo-300"
                                  : "bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                              }`}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                        {errors.adminGender && (
                          <p className="text-xs text-red-400 font-manrope ml-1">
                            {errors.adminGender.message}
                          </p>
                        )}
                      </div>
                      <div className="col-span-1 sm:col-span-2 bg-white/2 border border-white/6 rounded-2xl p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-white/60 text-xs font-jakarta font-semibold mb-0.5">
                              Administrator Account
                            </p>
                            <p className="text-white/25 text-xs font-manrope leading-relaxed">
                              This person will be the primary administrator.
                              Login credentials will be sent to the admin email
                              after approval.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 sm:space-y-4"
                  >
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/10 rounded-2xl p-5 sm:p-8 flex flex-col items-center justify-center gap-2.5 sm:gap-3 cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all duration-300 group"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all duration-300">
                        <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-white/60 text-sm font-manrope">
                          Click to upload documents
                        </p>
                        <p className="text-white/25 text-xs font-manrope mt-0.5">
                          PDF, PNG, JPG up to 10MB each · Max 10 files
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-white/30 font-manrope ml-1">
                          {uploadedFiles.length} file
                          {uploadedFiles.length > 1 ? "s" : ""} selected
                        </p>
                        <div className="space-y-2 max-h-36 sm:max-h-48 overflow-y-auto pr-1">
                          {uploadedFiles.map((file, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-center gap-2.5 sm:gap-3 bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3"
                            >
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white/70 text-xs font-manrope truncate">
                                  {file.name}
                                </p>
                                <p className="text-white/25 text-[10px] font-manrope">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(i)}
                                className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200 shrink-0"
                              >
                                <X className="h-3 w-3 text-white/40" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                      {DOCUMENT_OPTIONS.map((doc) => {
                        const Icon = doc.icon;
                        return (
                          <div
                            key={doc.label}
                            className="bg-white/2 border border-white/6 rounded-xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-2.5"
                          >
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center shrink-0">
                              <Icon className="h-3 w-3 text-indigo-400" />
                            </div>
                            <p className="text-white/50 text-xs font-manrope leading-tight">
                              {doc.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/6">
                <Button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="h-10 sm:h-11 px-3 sm:px-5 rounded-xl font-jakarta font-medium text-sm bg-white/5 hover:bg-white/10 text-white/60 border border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden xs:inline">Back</span>
                  </span>
                </Button>

                <div className="flex items-center gap-1 sm:gap-1.5">
                  {STEPS.map((step) => (
                    <div
                      key={step.id}
                      className={`rounded-full transition-all duration-300 ${
                        currentStep === step.id
                          ? "w-4 sm:w-5 h-1.5 bg-indigo-400"
                          : currentStep > step.id
                            ? "w-1.5 h-1.5 bg-indigo-500/50"
                            : "w-1.5 h-1.5 bg-white/15"
                      }`}
                    />
                  ))}
                </div>

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="h-10 sm:h-11 px-3 sm:px-5 rounded-xl font-jakarta font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white border-0 transition-all duration-200 shadow-lg shadow-indigo-500/20 group"
                  >
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <span className="hidden xs:inline">Next</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      if (currentStep === 4) {
                        handleSubmit(onSubmit)();
                      }
                    }}
                    className="h-10 sm:h-11 px-3 sm:px-5 rounded-xl font-jakarta font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white border-0 transition-all duration-200 shadow-lg shadow-indigo-500/20 group"
                  >
                    {isPending ? (
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                        <span className="hidden xs:inline">Submitting...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 sm:gap-2">
                        <span className="hidden xs:inline">Submit</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SchoolApplicationForm;
