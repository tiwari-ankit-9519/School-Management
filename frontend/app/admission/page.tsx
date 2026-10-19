"use client";
import { useState, useRef, useId, ReactNode, HTMLAttributes } from "react";
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
  AlertCircle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Search,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCreateAdmissionApplication } from "@/hooks/useAdmission";
import {
  admissionApplicationSchema,
  AdmissionApplicationFormValues,
} from "@/validations/validations";
import { Gender, ParentType, DocumentType } from "@/types";
import { useTranslations } from "@/hooks/useTranslations";
import { useRouter } from "next/navigation";

const STEPS = [
  { id: 0, labelKey: "stepStudent" },
  { id: 1, labelKey: "stepAddress" },
  { id: 2, labelKey: "stepAcademic" },
  { id: 3, labelKey: "stepGuardian" },
  { id: 4, labelKey: "stepDocuments" },
] as const;

const GENDER_OPTIONS = [
  { value: Gender.MALE, labelKey: "genderMale" },
  { value: Gender.FEMALE, labelKey: "genderFemale" },
  { value: Gender.OTHER, labelKey: "genderOther" },
] as const;

const PARENT_TYPE_OPTIONS = [
  { value: ParentType.FATHER, labelKey: "relationFather" },
  { value: ParentType.MOTHER, labelKey: "relationMother" },
  { value: ParentType.GUARDIAN, labelKey: "relationGuardian" },
] as const;

const DOCUMENT_TYPE_OPTIONS = Object.values(DocumentType).map((d) => ({
  value: d,
  label: d.replace(/_/g, " "),
}));

const STEP_FIELDS: (keyof AdmissionApplicationFormValues)[][] = [
  ["firstName", "lastName", "gender", "dateOfBirth"],
  ["address", "city", "state", "pincode"],
  ["appliedForClass", "previousSchool", "previousClass"],
  [
    "guardianFirstName",
    "guardianLastName",
    "guardianRelation",
    "guardianPhone",
    "guardianEmail",
  ],
  [],
];

const MIN_BIRTH_MONTH = new Date(new Date().getFullYear() - 25, 0);
const MAX_BIRTH_MONTH = new Date();

const toDateOnly = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

const fieldClass = (hasError: boolean) =>
  `h-10 rounded-lg bg-white/3 font-manrope text-sm text-white placeholder:text-white/25 shadow-none focus-visible:ring-0 ${
    hasError
      ? "border-red-500/50 focus-visible:border-red-500"
      : "border-white/10 focus-visible:border-indigo-500"
  }`;

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-1.5 flex items-center gap-1 font-manrope text-xs text-red-400"
    >
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </motion.p>
  );
};

const FieldLabel = ({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) => (
  <Label
    htmlFor={htmlFor}
    className="mb-1.5 block font-manrope text-xs font-normal text-white/50"
  >
    {children}
  </Label>
);

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  className?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}

const TextField = ({
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  className,
  inputMode,
}: TextFieldProps) => {
  const id = useId();
  return (
    <div className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass(!!error)}
      />
      <FieldError message={error} />
    </div>
  );
};

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <section className="grid grid-cols-1 gap-5 border-b border-white/8 py-8 last:border-b-0 lg:grid-cols-[minmax(0,260px)_1fr] lg:gap-10">
    <div>
      <h3 className="font-jakarta text-[15px] font-semibold text-white">
        {title}
      </h3>
      <p className="mt-1 font-manrope text-xs leading-relaxed text-white/40">
        {description}
      </p>
    </div>
    <div className="min-w-0">{children}</div>
  </section>
);

interface PillGroupProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T | undefined;
  onSelect: (value: T) => void;
  error?: string;
}

function PillGroup<T extends string>({
  label,
  options,
  value,
  onSelect,
  error,
}: PillGroupProps<T>) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <ToggleGroup
        type="single"
        value={value ?? ""}
        onValueChange={(next: string) => {
          const match = options.find((opt) => opt.value === next);
          if (match) onSelect(match.value);
        }}
        className="flex flex-wrap justify-start gap-2"
      >
        {options.map((opt) => (
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            className="h-10 flex-none rounded-full! border-0 bg-white/8 px-4 font-manrope text-xs font-medium text-white/60 hover:bg-white/12 hover:text-white data-[state=on]:bg-white data-[state=on]:text-black"
          >
            {opt.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <FieldError message={error} />
    </div>
  );
}

interface PhotoPickerProps {
  preview: string | null;
  alt: string;
  editLabel: string;
  removeLabel: string;
  hint: string;
  onPick: (file: File) => void;
  onRemove: () => void;
}

const PhotoPicker = ({
  preview,
  alt,
  editLabel,
  removeLabel,
  hint,
  onPick,
  onRemove,
}: PhotoPickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-full transition-opacity hover:opacity-80"
      >
        <Avatar className="h-28 w-28 border border-white/10">
          {preview && (
            <AvatarImage src={preview} alt={alt} className="object-cover" />
          )}
          <AvatarFallback className="bg-white/5">
            <User className="h-8 w-8 text-white/20" />
          </AvatarFallback>
        </Avatar>
      </button>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="h-8 rounded-full border-white/15 bg-transparent px-3 font-manrope text-xs font-normal text-white/80 hover:bg-white/8 hover:text-white"
        >
          {editLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRemove}
          disabled={!preview}
          aria-label={removeLabel}
          className="h-8 w-8 rounded-full border-white/15 bg-transparent text-white/60 hover:bg-white/8 hover:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <p className="max-w-36 text-center font-manrope text-[11px] leading-snug text-white/30">
        {hint}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};

const AdmissionApplicationPage = () => {
  const router = useRouter();
  const t = useTranslations("admission");
  const [currentStep, setCurrentStep] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [guardianPhotoFile, setGuardianPhotoFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<
    { file: File; documentType: DocumentType; title: string }[]
  >([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [guardianPhotoPreview, setGuardianPhotoPreview] = useState<
    string | null
  >(null);
  const [searchValue, setSearchValue] = useState("");
  const [isDobOpen, setIsDobOpen] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  const { mutate: submitApplication, isPending } =
    useCreateAdmissionApplication();

  const {
    handleSubmit,
    control,
    setValue,
    trigger,
    clearErrors,
    formState: { errors },
  } = useForm<
    AdmissionApplicationFormValues,
    unknown,
    AdmissionApplicationFormValues
  >({
    resolver: zodResolver(
      admissionApplicationSchema,
    ) as Resolver<AdmissionApplicationFormValues>,
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: undefined,
      dateOfBirth: undefined as unknown as Date,
      address: "",
      city: "",
      state: "",
      pincode: "",
      previousSchool: undefined,
      previousClass: undefined,
      appliedForClass: "",
      guardianFirstName: "",
      guardianLastName: "",
      guardianRelation: undefined,
      guardianPhone: "",
      guardianEmail: undefined,
      photoUrl: undefined,
      guardianPhotoUrl: undefined,
      documents: [],
    },
  });

  const firstNameValue = useWatch({ control, name: "firstName" });
  const lastNameValue = useWatch({ control, name: "lastName" });
  const dateOfBirthValue = useWatch({ control, name: "dateOfBirth" });
  const addressValue = useWatch({ control, name: "address" });
  const cityValue = useWatch({ control, name: "city" });
  const stateValue = useWatch({ control, name: "state" });
  const pincodeValue = useWatch({ control, name: "pincode" });
  const previousSchoolValue = useWatch({ control, name: "previousSchool" });
  const previousClassValue = useWatch({ control, name: "previousClass" });
  const appliedForClassValue = useWatch({ control, name: "appliedForClass" });
  const guardianFirstNameValue = useWatch({
    control,
    name: "guardianFirstName",
  });
  const guardianLastNameValue = useWatch({ control, name: "guardianLastName" });
  const guardianPhoneValue = useWatch({ control, name: "guardianPhone" });
  const guardianEmailValue = useWatch({ control, name: "guardianEmail" });

  const selectedDob = isValidDate(dateOfBirthValue)
    ? dateOfBirthValue
    : undefined;

  const handleSearch = () => {
    const trimmed = searchValue.trim();
    if (trimmed) router.push(`/admission/status/${trimmed}`);
  };

  const goToStep = async (target: number) => {
    if (target === currentStep) return;
    if (target < currentStep) {
      clearErrors();
      setCurrentStep(target);
      return;
    }
    for (let step = currentStep; step < target; step++) {
      const valid = await trigger(STEP_FIELDS[step]);
      if (!valid) {
        setCurrentStep(step);
        return;
      }
    }
    clearErrors();
    setCurrentStep(target);
  };

  const handleNext = () =>
    goToStep(Math.min(STEPS.length - 1, currentStep + 1));

  const handleBack = () => goToStep(Math.max(0, currentStep - 1));

  const handlePhotoChange = (file: File, type: "student" | "guardian") => {
    const url = URL.createObjectURL(file);
    if (type === "student") {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoFile(file);
      setPhotoPreview(url);
    } else {
      if (guardianPhotoPreview) URL.revokeObjectURL(guardianPhotoPreview);
      setGuardianPhotoFile(file);
      setGuardianPhotoPreview(url);
    }
  };

  const handlePhotoRemove = (type: "student" | "guardian") => {
    if (type === "student") {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoFile(null);
      setPhotoPreview(null);
    } else {
      if (guardianPhotoPreview) URL.revokeObjectURL(guardianPhotoPreview);
      setGuardianPhotoFile(null);
      setGuardianPhotoPreview(null);
    }
  };

  const handleAddDocument = (file: File) => {
    setDocumentFiles((prev) => [
      ...prev,
      { file, documentType: DocumentType.OTHER, title: file.name },
    ]);
  };

  const handleRemoveDocument = (index: number) => {
    setDocumentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDocumentTitle = (index: number, title: string) => {
    setDocumentFiles((prev) =>
      prev.map((d, i) => (i === index ? { ...d, title } : d)),
    );
  };

  const updateDocumentType = (index: number, value: string) => {
    const match = DOCUMENT_TYPE_OPTIONS.find((opt) => opt.value === value);
    if (!match) return;
    setDocumentFiles((prev) =>
      prev.map((d, i) =>
        i === index ? { ...d, documentType: match.value } : d,
      ),
    );
  };

  const onSubmit = (data: AdmissionApplicationFormValues) => {
    submitApplication({
      formData: {
        ...data,
        dateOfBirth: toDateOnly(data.dateOfBirth) as unknown as Date,
        documents: documentFiles.map((d) => ({
          documentType: d.documentType,
          title: d.title,
        })),
      },
      photoFile: photoFile ?? undefined,
      guardianPhotoFile: guardianPhotoFile ?? undefined,
      files: documentFiles.map((d) => d.file),
    });
  };

  const onInvalid = (
    formErrors: FieldErrors<AdmissionApplicationFormValues>,
  ) => {
    const stepWithError = STEP_FIELDS.findIndex((fields) =>
      fields.some((field) => formErrors[field]),
    );
    if (stepWithError >= 0) setCurrentStep(stepWithError);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-4 pt-20 pb-10 sm:px-8 sm:pt-24">
      <div className="relative z-10 mx-auto max-w-5xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="EduSphere"
              width={28}
              height={28}
              className="object-contain"
            />
            <div>
              <h1 className="font-jakarta text-2xl font-bold leading-tight text-white">
                {t("pageTitle")}
              </h1>
              <p className="mt-0.5 font-manrope text-xs text-white/50">
                {t("pageSubtitle")}
              </p>
            </div>
          </div>

          <div className="w-full lg:max-w-sm">
            <FieldLabel htmlFor="application-search">
              {t("searchHint")}
            </FieldLabel>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
                <Input
                  id="application-search"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  placeholder={t("searchPlaceholder")}
                  className={`${fieldClass(false)} pl-9`}
                />
              </div>
              <Button
                type="button"
                onClick={handleSearch}
                disabled={!searchValue.trim()}
                className="h-10 shrink-0 rounded-full bg-white/8 px-4 font-manrope text-xs font-medium text-white hover:bg-white/12"
              >
                {t("searchButton")}
              </Button>
            </div>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-8"
        >
          <Tabs
            value={String(currentStep)}
            onValueChange={(value: string) => goToStep(Number(value))}
          >
            <TabsList className="flex h-auto w-full justify-start gap-2 overflow-x-auto bg-transparent p-0 scrollbar-none">
              {STEPS.map((step, i) => (
                <TabsTrigger
                  key={step.id}
                  value={String(step.id)}
                  className="h-9 flex-none gap-1.5 rounded-full border-0 bg-white/8 px-4 font-manrope text-xs font-medium text-white/70 shadow-none hover:bg-white/12 hover:text-white data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-none"
                >
                  {i < currentStep && <Check className="h-3 w-3" />}
                  {t(step.labelKey)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-2"
          >
            {currentStep === 0 && (
              <>
                <Section
                  title={t("stepStudentTitle")}
                  description={t("stepStudentSub")}
                >
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]">
                    <div className="grid grid-cols-1 content-start gap-4 sm:grid-cols-2">
                      <TextField
                        label={t("firstName")}
                        value={firstNameValue}
                        onChange={(v) =>
                          setValue("firstName", v, { shouldValidate: true })
                        }
                        error={errors.firstName?.message}
                      />
                      <TextField
                        label={t("lastName")}
                        value={lastNameValue}
                        onChange={(v) =>
                          setValue("lastName", v, { shouldValidate: true })
                        }
                        error={errors.lastName?.message}
                      />
                    </div>
                    <div className="order-first md:order-0">
                      <PhotoPicker
                        preview={photoPreview}
                        alt={t("studentPhoto")}
                        editLabel={t("editPhoto")}
                        removeLabel={t("removePhoto")}
                        hint={t("photoHint")}
                        onPick={(file) => handlePhotoChange(file, "student")}
                        onRemove={() => handlePhotoRemove("student")}
                      />
                    </div>
                  </div>
                </Section>

                <Section
                  title={t("personalDetailsTitle")}
                  description={t("personalDetailsSub")}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Controller
                      control={control}
                      name="gender"
                      render={({ field }) => (
                        <PillGroup
                          label={t("gender")}
                          options={GENDER_OPTIONS.map((opt) => ({
                            value: opt.value,
                            label: t(opt.labelKey),
                          }))}
                          value={field.value as Gender | undefined}
                          onSelect={(value) => {
                            field.onChange(value);
                            clearErrors("gender");
                          }}
                          error={errors.gender?.message}
                        />
                      )}
                    />
                    <div>
                      <FieldLabel htmlFor="dateOfBirth">
                        {t("dateOfBirth")}
                      </FieldLabel>
                      <Popover open={isDobOpen} onOpenChange={setIsDobOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            id="dateOfBirth"
                            type="button"
                            variant="outline"
                            aria-invalid={!!errors.dateOfBirth}
                            className={`${fieldClass(!!errors.dateOfBirth)} w-full justify-start gap-2 px-3 font-normal hover:bg-white/5 aria-expanded:border-indigo-500 aria-expanded:bg-white/5 data-[state=open]:bg-white/5 ${
                              selectedDob
                                ? "text-white hover:text-white aria-expanded:text-white"
                                : "text-white/25 hover:text-white/40 aria-expanded:text-white/40"
                            }`}
                          >
                            <CalendarDays className="h-4 w-4 text-white/40" />
                            {selectedDob
                              ? selectedDob.toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : t("pickDate")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          align="start"
                          className="w-auto border-white/10 bg-[#0b0f1a] p-0 text-white scheme-dark"
                        >
                          <Calendar
                            mode="single"
                            selected={selectedDob}
                            defaultMonth={selectedDob ?? MIN_BIRTH_MONTH}
                            captionLayout="dropdown"
                            startMonth={MIN_BIRTH_MONTH}
                            endMonth={MAX_BIRTH_MONTH}
                            disabled={{ after: new Date() }}
                            className="bg-transparent [&_option]:bg-[#0b0f1a] [&_option]:text-white [&_select]:bg-[#0b0f1a]"
                            onSelect={(date) => {
                              if (!date) return;
                              setValue("dateOfBirth", date, {
                                shouldValidate: true,
                              });
                              setIsDobOpen(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FieldError message={errors.dateOfBirth?.message} />
                    </div>
                  </div>
                </Section>
              </>
            )}

            {currentStep === 1 && (
              <Section
                title={t("stepAddressTitle")}
                description={t("stepAddressSub")}
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <TextField
                    className="sm:col-span-3"
                    label={t("address")}
                    value={addressValue}
                    onChange={(v) =>
                      setValue("address", v, { shouldValidate: true })
                    }
                    error={errors.address?.message}
                  />
                  <TextField
                    label={t("city")}
                    value={cityValue}
                    onChange={(v) =>
                      setValue("city", v, { shouldValidate: true })
                    }
                    error={errors.city?.message}
                  />
                  <TextField
                    label={t("state")}
                    value={stateValue}
                    onChange={(v) =>
                      setValue("state", v, { shouldValidate: true })
                    }
                    error={errors.state?.message}
                  />
                  <TextField
                    label={t("pincode")}
                    value={pincodeValue}
                    inputMode="numeric"
                    onChange={(v) =>
                      setValue("pincode", v, { shouldValidate: true })
                    }
                    error={errors.pincode?.message}
                  />
                </div>
              </Section>
            )}

            {currentStep === 2 && (
              <>
                <Section
                  title={t("stepAcademicTitle")}
                  description={t("stepAcademicSub")}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                      label={t("appliedForClass")}
                      value={appliedForClassValue}
                      onChange={(v) =>
                        setValue("appliedForClass", v, {
                          shouldValidate: true,
                        })
                      }
                      error={errors.appliedForClass?.message}
                    />
                  </div>
                </Section>

                <Section
                  title={t("previousSchoolOptional")}
                  description={t("previousSchoolSub")}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                      label={t("previousSchool")}
                      value={previousSchoolValue ?? ""}
                      onChange={(v) =>
                        setValue("previousSchool", v || undefined, {
                          shouldValidate: true,
                        })
                      }
                      error={errors.previousSchool?.message}
                    />
                    <TextField
                      label={t("previousClass")}
                      value={previousClassValue ?? ""}
                      onChange={(v) =>
                        setValue("previousClass", v || undefined, {
                          shouldValidate: true,
                        })
                      }
                      error={errors.previousClass?.message}
                    />
                  </div>
                </Section>
              </>
            )}

            {currentStep === 3 && (
              <>
                <Section
                  title={t("stepGuardianTitle")}
                  description={t("stepGuardianSub")}
                >
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto]">
                    <div className="grid grid-cols-1 content-start gap-4 sm:grid-cols-2">
                      <TextField
                        label={t("guardianFirstName")}
                        value={guardianFirstNameValue}
                        onChange={(v) =>
                          setValue("guardianFirstName", v, {
                            shouldValidate: true,
                          })
                        }
                        error={errors.guardianFirstName?.message}
                      />
                      <TextField
                        label={t("guardianLastName")}
                        value={guardianLastNameValue}
                        onChange={(v) =>
                          setValue("guardianLastName", v, {
                            shouldValidate: true,
                          })
                        }
                        error={errors.guardianLastName?.message}
                      />
                      <div className="sm:col-span-2">
                        <Controller
                          control={control}
                          name="guardianRelation"
                          render={({ field }) => (
                            <PillGroup
                              label={t("guardianRelation")}
                              options={PARENT_TYPE_OPTIONS.map((opt) => ({
                                value: opt.value,
                                label: t(opt.labelKey),
                              }))}
                              value={field.value as ParentType | undefined}
                              onSelect={(value) => {
                                field.onChange(value);
                                clearErrors("guardianRelation");
                              }}
                              error={errors.guardianRelation?.message}
                            />
                          )}
                        />
                      </div>
                    </div>
                    <div className="order-first md:order-0">
                      <PhotoPicker
                        preview={guardianPhotoPreview}
                        alt={t("guardianPhoto")}
                        editLabel={t("editPhoto")}
                        removeLabel={t("removePhoto")}
                        hint={t("photoHint")}
                        onPick={(file) => handlePhotoChange(file, "guardian")}
                        onRemove={() => handlePhotoRemove("guardian")}
                      />
                    </div>
                  </div>
                </Section>

                <Section
                  title={t("guardianContactTitle")}
                  description={t("guardianContactSub")}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                      label={t("guardianPhone")}
                      type="tel"
                      inputMode="tel"
                      value={guardianPhoneValue}
                      onChange={(v) =>
                        setValue("guardianPhone", v, { shouldValidate: true })
                      }
                      error={errors.guardianPhone?.message}
                    />
                    <TextField
                      label={t("guardianEmail")}
                      type="email"
                      inputMode="email"
                      value={guardianEmailValue ?? ""}
                      onChange={(v) =>
                        setValue("guardianEmail", v || undefined, {
                          shouldValidate: true,
                        })
                      }
                      error={errors.guardianEmail?.message}
                    />
                  </div>
                </Section>
              </>
            )}

            {currentStep === 4 && (
              <Section
                title={t("stepDocumentsTitle")}
                description={t("stepDocumentsSub")}
              >
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => docInputRef.current?.click()}
                    className="flex h-auto w-full flex-col items-center justify-center gap-3 rounded-xl border-dashed border-white/15 bg-white/2 py-8 whitespace-normal hover:border-white/30 hover:bg-white/4"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      <Upload className="h-4 w-4 text-white/40" />
                    </span>
                    <span className="text-center">
                      <span className="block font-jakarta text-sm font-semibold text-white/70">
                        {t("uploadDocuments")}
                      </span>
                      <span className="mt-0.5 block font-manrope text-xs font-normal text-white/30">
                        {t("uploadHint")}
                      </span>
                    </span>
                  </Button>
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

                  {documentFiles.length > 0 ? (
                    <div className="space-y-3">
                      {documentFiles.map((doc, i) => (
                        <motion.div
                          key={`${doc.file.name}-${doc.file.lastModified}-${i}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border border-white/10 bg-white/3 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <FileText className="h-4 w-4 shrink-0 text-white/40" />
                              <span className="truncate font-manrope text-xs text-white/70">
                                {doc.file.name}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handleRemoveDocument(i)}
                              aria-label={t("removePhoto")}
                              className="h-7 w-7 shrink-0 rounded-full border-white/10 bg-transparent text-white/40 hover:bg-white/8 hover:text-red-400"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <FieldLabel htmlFor={`doc-title-${i}`}>
                                {t("docTitle")}
                              </FieldLabel>
                              <Input
                                id={`doc-title-${i}`}
                                value={doc.title}
                                onChange={(e) =>
                                  updateDocumentTitle(i, e.target.value)
                                }
                                className={fieldClass(false)}
                              />
                            </div>
                            <div>
                              <FieldLabel htmlFor={`doc-type-${i}`}>
                                {t("docType")}
                              </FieldLabel>
                              <Select
                                value={doc.documentType}
                                onValueChange={(value: string) =>
                                  updateDocumentType(i, value)
                                }
                              >
                                <SelectTrigger
                                  id={`doc-type-${i}`}
                                  className={`${fieldClass(false)} w-full data-[size=default]:h-10`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="border-white/10 bg-[#0b0f1a] text-white">
                                  {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                                    <SelectItem
                                      key={opt.value}
                                      value={opt.value}
                                      className="font-manrope text-xs focus:bg-white/8 focus:text-white"
                                    >
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center font-manrope text-xs text-white/30">
                      {t("noDocuments")}
                    </p>
                  )}
                </div>
              </Section>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/8 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="h-10 gap-1.5 rounded-full border-white/15 bg-transparent px-4 font-manrope text-sm font-normal text-white/80 hover:bg-white/8 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("back")}
          </Button>

          <span className="font-manrope text-xs text-white/40">
            {currentStep + 1} / {STEPS.length}
          </span>

          {currentStep < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="h-10 gap-1.5 rounded-full bg-white px-5 font-manrope text-sm font-semibold text-black hover:bg-white/90"
            >
              {t("next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              disabled={isPending}
              className="h-10 gap-1.5 rounded-full bg-white px-5 font-manrope text-sm font-semibold text-black hover:bg-white/90"
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

        <p className="mt-6 text-center font-manrope text-[11px] text-white/20">
          {t("footer")}
        </p>
      </div>
    </div>
  );
};

export default AdmissionApplicationPage;
