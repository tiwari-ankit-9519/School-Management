/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FieldErrors, Resolver, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DatePickerField,
  DocumentUploader,
  FieldLabel,
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
  PhotoPicker,
  PillGroup,
  Section,
  TAB_TRIGGER_CLASS,
  TextField,
  UploadedDocument,
  fieldClass,
  isValidDate,
  toDateOnly,
} from "@/components/forms/FormParts";
import { useCreateTeacherApplication } from "@/hooks/useTeacher";
import {
  teacherApplicationSchema,
  TeacherApplicationFormValues,
} from "@/validations/validations";
import { DocumentType, Gender } from "@/types";
import { useTranslations } from "@/hooks/useTranslations";

const STEPS = [
  { id: 0, labelKey: "stepPersonal" },
  { id: 1, labelKey: "stepAddress" },
  { id: 2, labelKey: "stepProfessional" },
  { id: 3, labelKey: "stepDocuments" },
] as const;

const GENDER_OPTIONS = [
  { value: Gender.MALE, labelKey: "genderMale" },
  { value: Gender.FEMALE, labelKey: "genderFemale" },
  { value: Gender.OTHER, labelKey: "genderOther" },
] as const;

const SUGGESTED_DOCUMENTS = [
  DocumentType.RESUME,
  DocumentType.QUALIFICATION_CERTIFICATE,
  DocumentType.ID_PROOF,
  DocumentType.MEDICAL_CERTIFICATE,
];

const STEP_FIELDS: (keyof TeacherApplicationFormValues)[][] = [
  ["firstName", "lastName", "email", "phone", "gender", "dateOfBirth"],
  ["address", "city", "state", "pincode"],
  ["qualification", "experience", "specialization"],
  [],
];

const MIN_BIRTH_MONTH = new Date(new Date().getFullYear() - 70, 0);
const MAX_BIRTH_MONTH = new Date();

const TeacherApplicationPage = () => {
  const t = useTranslations("teacherApplication");
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [documentFiles, setDocumentFiles] = useState<UploadedDocument[]>([]);
  const [searchValue, setSearchValue] = useState("");

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

  const firstNameValue = useWatch({ control, name: "firstName" });
  const lastNameValue = useWatch({ control, name: "lastName" });
  const emailValue = useWatch({ control, name: "email" });
  const phoneValue = useWatch({ control, name: "phone" });
  const genderValue = useWatch({ control, name: "gender" });
  const dateOfBirthValue = useWatch({ control, name: "dateOfBirth" });
  const addressValue = useWatch({ control, name: "address" });
  const cityValue = useWatch({ control, name: "city" });
  const stateValue = useWatch({ control, name: "state" });
  const pincodeValue = useWatch({ control, name: "pincode" });
  const qualificationValue = useWatch({ control, name: "qualification" });
  const experienceValue = useWatch({ control, name: "experience" });
  const specializationValue = useWatch({ control, name: "specialization" });

  const handleSearch = () => {
    const trimmed = searchValue.trim();
    if (trimmed) router.push(`/teacher-application/status/${trimmed}`);
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

  const handlePhotoChange = (file: File) => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoRemove = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const addDocuments = (files: File[]) => {
    setDocumentFiles((prev) => [
      ...prev,
      ...files.map((file) => ({
        file,
        documentType: DocumentType.OTHER,
        title: file.name,
      })),
    ]);
  };

  const onSubmit = (data: TeacherApplicationFormValues) => {
    submitApplication({
      formData: {
        ...data,
        dateOfBirth: toDateOnly(data.dateOfBirth) as unknown as Date,
        documents: documentFiles.map((d) => ({
          documentType: d.documentType,
          title: d.title,
        })),
      },
      files: documentFiles.map((d) => d.file),
    });
  };

  const onInvalid = (formErrors: FieldErrors<TeacherApplicationFormValues>) => {
    const stepWithError = STEP_FIELDS.findIndex((fields) =>
      fields.some((field) => formErrors[field]),
    );
    if (stepWithError >= 0) setCurrentStep(stepWithError);
  };

  return (
    <div className="relative min-h-screen w-full bg-background px-4 pt-24 pb-10 sm:px-8 sm:pt-28">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(99,102,241,0.08),transparent_50%)]" />

      <div className="relative z-10 mx-auto max-w-5xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
              <Image
                src="/logo.png"
                alt="EduSphere"
                width={24}
                height={24}
                className="object-contain"
              />
            </span>
            <div>
              <h1 className="font-jakarta text-3xl font-bold tracking-tight text-foreground">
                {t("pageTitle")}
              </h1>
              <p className="mt-0.5 font-manrope text-sm text-muted-foreground">
                {t("pageSubtitle")}
              </p>
            </div>
          </div>

          <div className="w-full lg:max-w-sm">
            <FieldLabel htmlFor="teacher-application-search">
              {t("searchHint")}
            </FieldLabel>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="teacher-application-search"
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
                className={`h-10 shrink-0 px-4 text-xs ${PRIMARY_PILL_CLASS}`}
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
                  className={TAB_TRIGGER_CLASS}
                >
                  {i < currentStep && <Check className="size-3" />}
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
                  title={t("stepPersonalTitle")}
                  description={t("stepPersonalSub")}
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
                        alt={t("teacherPhoto")}
                        editLabel={t("editPhoto")}
                        removeLabel={t("removePhoto")}
                        hint={t("photoHint")}
                        onPick={handlePhotoChange}
                        onRemove={handlePhotoRemove}
                      />
                    </div>
                  </div>
                </Section>

                <Section
                  title={t("contactTitle")}
                  description={t("contactSub")}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                      label={t("email")}
                      type="email"
                      inputMode="email"
                      value={emailValue}
                      onChange={(v) =>
                        setValue("email", v, { shouldValidate: true })
                      }
                      error={errors.email?.message}
                    />
                    <TextField
                      label={t("phone")}
                      type="tel"
                      inputMode="tel"
                      value={phoneValue}
                      onChange={(v) =>
                        setValue("phone", v, { shouldValidate: true })
                      }
                      error={errors.phone?.message}
                    />
                  </div>
                </Section>

                <Section
                  title={t("personalDetailsTitle")}
                  description={t("personalDetailsSub")}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <PillGroup
                      label={t("gender")}
                      options={GENDER_OPTIONS.map((opt) => ({
                        value: opt.value,
                        label: t(opt.labelKey),
                      }))}
                      value={genderValue as Gender | undefined}
                      onSelect={(value) => {
                        setValue("gender", value, { shouldValidate: true });
                        clearErrors("gender");
                      }}
                      error={errors.gender?.message}
                    />
                    <DatePickerField
                      label={t("dateOfBirth")}
                      value={
                        isValidDate(dateOfBirthValue)
                          ? dateOfBirthValue
                          : undefined
                      }
                      onChange={(date) =>
                        setValue("dateOfBirth", date, { shouldValidate: true })
                      }
                      placeholder={t("pickDate")}
                      startMonth={MIN_BIRTH_MONTH}
                      endMonth={MAX_BIRTH_MONTH}
                      error={errors.dateOfBirth?.message}
                    />
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
                    inputMode="numeric"
                    value={pincodeValue}
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
                  title={t("stepProfessionalTitle")}
                  description={t("stepProfessionalSub")}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                      label={t("qualification")}
                      value={qualificationValue}
                      onChange={(v) =>
                        setValue("qualification", v, { shouldValidate: true })
                      }
                      error={errors.qualification?.message}
                    />
                    <TextField
                      label={t("experience")}
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      suffix={t("years")}
                      value={
                        experienceValue === undefined ||
                        experienceValue === null
                          ? ""
                          : String(experienceValue)
                      }
                      onChange={(v) =>
                        setValue(
                          "experience",
                          v === ""
                            ? (undefined as unknown as number)
                            : Number(v),
                          { shouldValidate: true },
                        )
                      }
                      error={errors.experience?.message}
                    />
                  </div>
                </Section>

                <Section
                  title={t("specializationOptional")}
                  description={t("specializationSub")}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                      label={t("specialization")}
                      value={specializationValue ?? ""}
                      onChange={(v) =>
                        setValue("specialization", v || undefined, {
                          shouldValidate: true,
                        })
                      }
                      error={errors.specialization?.message}
                    />
                  </div>
                </Section>
              </>
            )}

            {currentStep === 3 && (
              <Section
                title={t("stepDocumentsTitle")}
                description={t("stepDocumentsSub")}
              >
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {SUGGESTED_DOCUMENTS.map((type) => (
                    <Badge
                      key={type}
                      variant="outline"
                      className="rounded-full border-border bg-muted font-manrope text-[11px] font-normal text-foreground/70"
                    >
                      {type.replace(/_/g, " ")}
                    </Badge>
                  ))}
                  <Badge
                    variant="outline"
                    className="rounded-full border-dashed border-border bg-transparent font-manrope text-[11px] font-normal text-muted-foreground"
                  >
                    + {t("moreDocuments")}
                  </Badge>
                </div>
                <DocumentUploader
                  documents={documentFiles}
                  onAdd={addDocuments}
                  onRemove={(index) =>
                    setDocumentFiles((prev) =>
                      prev.filter((_, i) => i !== index),
                    )
                  }
                  onTitleChange={(index, title) =>
                    setDocumentFiles((prev) =>
                      prev.map((d, i) => (i === index ? { ...d, title } : d)),
                    )
                  }
                  onTypeChange={(index, documentType) =>
                    setDocumentFiles((prev) =>
                      prev.map((d, i) =>
                        i === index ? { ...d, documentType } : d,
                      ),
                    )
                  }
                  labels={{
                    upload: t("uploadDocuments"),
                    hint: t("uploadHint"),
                    empty: t("noDocuments"),
                    title: t("docTitle"),
                    type: t("docType"),
                    remove: t("removeDocument"),
                  }}
                />
              </Section>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => goToStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`h-10 gap-1.5 px-4 text-sm font-normal ${OUTLINE_PILL_CLASS}`}
          >
            <ChevronLeft className="size-4" />
            {t("back")}
          </Button>

          <span className="font-manrope text-xs text-muted-foreground">
            {currentStep + 1} / {STEPS.length}
          </span>

          {currentStep < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() =>
                goToStep(Math.min(STEPS.length - 1, currentStep + 1))
              }
              className={`h-10 gap-1.5 px-5 text-sm ${PRIMARY_PILL_CLASS}`}
            >
              {t("next")}
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit(onSubmit, onInvalid)}
              disabled={isPending}
              className={`h-10 gap-1.5 px-5 text-sm ${PRIMARY_PILL_CLASS}`}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  {t("submit")}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherApplicationPage;
