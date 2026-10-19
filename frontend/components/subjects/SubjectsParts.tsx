"use client";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  FlaskConical,
  Hash,
  Loader2,
  Plus,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CARD_CLASS,
  TONE_CLASSES,
  fadeUp,
} from "@/components/dashboard/DashboardWidgets";
import {
  FieldError,
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import { useCreateSubject } from "@/hooks/useSubject";
import { useTranslations } from "@/hooks/useTranslations";
import { SubjectFormValues, subjectSchema } from "@/validations/validations";
import { Subject } from "@/types";

export const SUBJECT_DETAIL_PATH = "/admin/subjects";

const MONOGRAM_PALETTE = [
  "from-indigo-500 to-indigo-700",
  "from-emerald-500 to-emerald-700",
  "from-sky-500 to-sky-700",
  "from-amber-500 to-orange-600",
  "from-violet-500 to-violet-700",
  "from-rose-500 to-rose-700",
];

export const getMonogram = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
};

export const getMonogramClass = (seed: string) => {
  const hash = Array.from(seed).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return MONOGRAM_PALETTE[hash % MONOGRAM_PALETTE.length];
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const SubjectCard = ({
  subject,
  delay,
}: {
  subject: Subject;
  delay: number;
}) => {
  const t = useTranslations("subjects");
  const teacherCount = subject.teacherSubjects?.length ?? 0;

  return (
    <motion.div {...fadeUp(delay)}>
      <Link
        href={`${SUBJECT_DETAIL_PATH}/${subject.id}`}
        aria-label={`${t("openSubject")}: ${subject.name}`}
        className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <Card
          className={`${CARD_CLASS} h-full gap-4 p-5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-indigo-500/40 group-hover:shadow-[0_12px_32px_rgba(79,70,229,0.12)]`}
        >
          <div className="flex items-start justify-between gap-3">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br font-jakarta text-base font-bold text-white ${getMonogramClass(subject.id)}`}
            >
              {getMonogram(subject.name)}
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
              <ArrowUpRight className="size-4" />
            </span>
          </div>

          <div className="min-w-0">
            <p className="truncate font-jakarta text-base font-semibold text-foreground">
              {subject.name}
            </p>
            <p className="mt-1 line-clamp-2 min-h-8 font-manrope text-xs leading-relaxed text-muted-foreground">
              {subject.description || t("noDescription")}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              className="gap-1 rounded-md border-border bg-muted font-mono text-[11px] font-medium text-foreground/80"
            >
              <Hash className="size-3" />
              {subject.code}
            </Badge>
            <Badge
              variant="outline"
              className={`rounded-md font-manrope text-[11px] font-medium ${
                subject.isElective ? TONE_CLASSES.violet : TONE_CLASSES.indigo
              }`}
            >
              {subject.isElective ? t("typeElective") : t("typeCore")}
            </Badge>
            {!subject.isActive && (
              <Badge
                variant="outline"
                className={`rounded-md font-manrope text-[11px] font-medium ${TONE_CLASSES.amber}`}
              >
                {t("inactive")}
              </Badge>
            )}
          </div>

          <Separator className="mt-auto" />

          <div className="flex items-center justify-between gap-2 font-manrope text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              {teacherCount} {t("teachersAssigned")}
            </span>
            <span>
              {t("addedOn")} {formatDate(subject.createdAt)}
            </span>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

export const SubjectsGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <Skeleton key={i} className="h-56 rounded-2xl" />
    ))}
  </div>
);

interface CreateSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateSubjectDialog = ({
  open,
  onOpenChange,
}: CreateSubjectDialogProps) => {
  const t = useTranslations("subjects");
  const { mutate: createSubject, isPending } = useCreateSubject();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: "", code: "" },
  });

  const nameValue = useWatch({ control, name: "name" });
  const codeValue = useWatch({ control, name: "code" });

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const onSubmit = (formData: SubjectFormValues) => {
    createSubject(
      { ...formData, code: formData.code.toUpperCase() },
      { onSuccess: () => handleOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-4 space-y-0 text-left">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${TONE_CLASSES.indigo}`}
          >
            <FlaskConical className="size-5" />
          </span>
          <div className="space-y-1">
            <DialogTitle className="font-jakarta text-lg font-bold text-foreground">
              {t("modalTitle")}
            </DialogTitle>
            <DialogDescription className="font-manrope text-sm text-muted-foreground">
              {t("modalSubtitle")}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br font-jakarta text-sm font-bold text-white ${getMonogramClass(nameValue || "preview")}`}
          >
            {nameValue ? getMonogram(nameValue) : "?"}
          </span>
          <div className="min-w-0">
            <p className="font-manrope text-[10px] tracking-wider text-muted-foreground uppercase">
              {t("previewLabel")}
            </p>
            <p className="truncate font-jakarta text-sm font-semibold text-foreground">
              {nameValue || t("namePlaceholder")}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              #{(codeValue || t("codePlaceholder")).toUpperCase()}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr]">
            <div className="space-y-1.5">
              <Label
                htmlFor="subject-name"
                className="font-manrope text-xs font-normal text-foreground/70"
              >
                {t("fieldName")}
              </Label>
              <Input
                id="subject-name"
                placeholder={t("namePlaceholder")}
                aria-invalid={!!errors.name}
                className={fieldClass(!!errors.name)}
                {...register("name")}
              />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="subject-code"
                className="font-manrope text-xs font-normal text-foreground/70"
              >
                {t("fieldCode")}
              </Label>
              <Input
                id="subject-code"
                placeholder={t("codePlaceholder")}
                aria-invalid={!!errors.code}
                className={`${fieldClass(!!errors.code)} font-mono uppercase`}
                {...register("code")}
              />
              <FieldError message={errors.code?.message} />
            </div>
          </div>
          <p className="font-manrope text-[11px] text-muted-foreground">
            {t("codeHint")}
          </p>

          <DialogFooter className="gap-2 pt-1 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className={`h-11 flex-1 text-sm ${OUTLINE_PILL_CLASS}`}
            >
              {t("cancelBtn")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={`h-11 flex-1 gap-2 text-sm ${PRIMARY_PILL_CLASS}`}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("creating")}
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  {t("createBtn")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
