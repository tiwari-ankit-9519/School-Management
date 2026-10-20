"use client";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Repeat,
  Wallet,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TONE_CLASSES } from "@/components/dashboard/DashboardWidgets";
import {
  FieldError,
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import { useCreateFeeStructure, useUpdateFeeStructure } from "@/hooks/useFees";
import { useTranslations } from "@/hooks/useTranslations";
import {
  FeesStructureSchema,
  FeesStructureType,
} from "@/validations/validations";
import { FeeStructure } from "@/types";

const SLATE_TONE =
  "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300";
const SKY_TONE =
  "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
const DEFAULT_YEARLY_MONTH = 4;

export const MONTH_NAMES = Array.from({ length: 12 }, (_, i) =>
  new Intl.DateTimeFormat("en-IN", { month: "long" }).format(
    new Date(2000, i, 1),
  ),
);

export const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const TypeBadge = ({ fee }: { fee: FeeStructure }) => {
  const t = useTranslations("feeStructure");
  if (!fee.isRecurring) {
    return (
      <Badge
        variant="outline"
        className={`rounded-full font-manrope text-[11px] font-medium ${SLATE_TONE}`}
      >
        {t("oneTime")}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-full font-manrope text-[11px] font-medium ${SKY_TONE}`}
    >
      <Repeat className="size-3" />
      {fee.recurringMonth
        ? `${t("frequencyYearly")} · ${MONTH_NAMES[fee.recurringMonth - 1]}`
        : t("frequencyMonthly")}
    </Badge>
  );
};

const StatusBadge = ({ isActive }: { isActive: boolean }) => {
  const t = useTranslations("feeStructure");
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-full font-manrope text-[11px] font-medium ${isActive ? TONE_CLASSES.emerald : SLATE_TONE}`}
    >
      {isActive ? (
        <CheckCircle2 className="size-3" />
      ) : (
        <XCircle className="size-3" />
      )}
      {isActive ? t("active") : t("inactive")}
    </Badge>
  );
};

interface FeesTableProps {
  fees: FeeStructure[];
  onEdit: (fee: FeeStructure) => void;
}

export const FeesTable = ({ fees, onEdit }: FeesTableProps) => {
  const t = useTranslations("feeStructure");
  const headClass =
    "h-11 px-5 font-manrope text-[11px] font-medium tracking-wider text-muted-foreground uppercase";

  const editButton = (fee: FeeStructure) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => onEdit(fee)}
      className={`h-8 gap-1.5 px-3 text-xs ${OUTLINE_PILL_CLASS} hover:border-indigo-500/40 hover:text-indigo-700 dark:hover:border-indigo-500/40 dark:hover:text-indigo-300`}
    >
      <Pencil className="size-3" />
      {t("edit")}
    </Button>
  );

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className={headClass}>{t("colFee")}</TableHead>
              <TableHead className={headClass}>{t("colAmount")}</TableHead>
              <TableHead className={headClass}>{t("colType")}</TableHead>
              <TableHead className={headClass}>{t("colStatus")}</TableHead>
              <TableHead className={`${headClass} text-right`}>
                {t("colAction")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fees.map((fee) => (
              <TableRow
                key={fee.id}
                className="border-border hover:bg-muted/60"
              >
                <TableCell className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${TONE_CLASSES.indigo}`}
                    >
                      <Wallet className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-jakarta text-sm font-semibold text-foreground">
                        {fee.name}
                      </p>
                      <p className="max-w-72 truncate font-manrope text-[11px] text-muted-foreground">
                        {fee.description || t("noDescription")}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-3.5 font-jakarta text-base font-bold text-foreground">
                  {formatAmount(fee.amount)}
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <TypeBadge fee={fee} />
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <StatusBadge isActive={fee.isActive} />
                </TableCell>
                <TableCell className="px-5 py-3.5 text-right">
                  {editButton(fee)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y divide-border md:hidden">
        {fees.map((fee) => (
          <div key={fee.id} className="space-y-3 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-jakarta text-sm font-semibold text-foreground">
                  {fee.name}
                </p>
                <p className="line-clamp-1 font-manrope text-xs text-muted-foreground">
                  {fee.description || t("noDescription")}
                </p>
              </div>
              <p className="shrink-0 font-jakarta text-base font-bold text-foreground">
                {formatAmount(fee.amount)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge fee={fee} />
              <StatusBadge isActive={fee.isActive} />
            </div>
            {editButton(fee)}
          </div>
        ))}
      </div>
    </>
  );
};

export const FeesTableSkeleton = () => (
  <div className="space-y-1 p-4 sm:p-5">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-2.5">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="hidden h-5 w-20 md:block" />
        <Skeleton className="hidden h-6 w-24 rounded-full md:block" />
      </div>
    ))}
  </div>
);

interface FeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classGroupId: string;
  groupName: string;
  fee: FeeStructure | null;
}

export const FeeFormDialog = ({
  open,
  onOpenChange,
  classGroupId,
  groupName,
  fee,
}: FeeFormDialogProps) => {
  const t = useTranslations("feeStructure");
  const isEdit = !!fee;
  const { mutate: createFee, isPending: isCreating } =
    useCreateFeeStructure(classGroupId);
  const { mutate: updateFee, isPending: isUpdating } = useUpdateFeeStructure(
    fee?.id ?? "",
  );
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FeesStructureType>({
    resolver: zodResolver(FeesStructureSchema),
    defaultValues: {
      name: fee?.name ?? "",
      amount: fee?.amount ?? 0,
      description: fee?.description ?? undefined,
      isRecurring: fee?.isRecurring ?? false,
      recurringMonth: fee?.recurringMonth ?? null,
    },
  });

  const isRecurring = useWatch({ control, name: "isRecurring" });

  const onSubmit = (data: FeesStructureType) => {
    const payload: FeesStructureType = {
      ...data,
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      recurringMonth: data.isRecurring ? (data.recurringMonth ?? null) : null,
    };
    const onSuccess = () => onOpenChange(false);
    if (isEdit) updateFee(payload, { onSuccess });
    else createFee(payload, { onSuccess });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-border bg-card sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-4 space-y-0 text-left">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${TONE_CLASSES.indigo}`}
          >
            {isEdit ? (
              <Pencil className="size-5" />
            ) : (
              <Wallet className="size-5" />
            )}
          </span>
          <div className="space-y-1">
            <DialogTitle className="font-jakarta text-lg font-bold text-foreground">
              {isEdit ? t("editTitle") : t("createTitle")}
            </DialogTitle>
            <DialogDescription className="font-manrope text-sm text-muted-foreground">
              {isEdit
                ? `${t("editingLabel")} ${fee.name}`
                : `${t("createSub")} ${groupName}`}
            </DialogDescription>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label
              htmlFor="fee-name"
              className="font-manrope text-xs font-normal text-foreground/70"
            >
              {t("fieldName")}
            </Label>
            <Input
              id="fee-name"
              placeholder={t("namePlaceholder")}
              aria-invalid={!!errors.name}
              className={fieldClass(!!errors.name)}
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="fee-amount"
              className="font-manrope text-xs font-normal text-foreground/70"
            >
              {t("fieldAmount")}
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-jakarta text-sm font-semibold text-muted-foreground">
                ₹
              </span>
              <Input
                id="fee-amount"
                type="number"
                inputMode="numeric"
                min={1}
                aria-invalid={!!errors.amount}
                className={`${fieldClass(!!errors.amount)} pl-7`}
                {...register("amount", { valueAsNumber: true })}
              />
            </div>
            <FieldError message={errors.amount?.message} />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="fee-description"
              className="font-manrope text-xs font-normal text-foreground/70"
            >
              {t("fieldDescription")}
            </Label>
            <Textarea
              id="fee-description"
              rows={2}
              placeholder={t("descriptionPlaceholder")}
              className="resize-none rounded-lg border-input bg-card font-manrope text-sm focus-visible:border-indigo-500 focus-visible:ring-0 dark:bg-card"
              {...register("description")}
            />
          </div>

          <Controller
            control={control}
            name="isRecurring"
            render={({ field }) => (
              <div
                className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
                  field.value
                    ? "border-sky-500/30 bg-sky-500/5"
                    : "border-border bg-muted/40"
                }`}
              >
                <div>
                  <Label
                    htmlFor="fee-recurring"
                    className="font-jakarta text-sm font-semibold text-foreground"
                  >
                    {t("fieldRecurring")}
                  </Label>
                  <p className="mt-0.5 font-manrope text-xs text-muted-foreground">
                    {field.value ? t("recurringSub") : t("oneTimeSub")}
                  </p>
                </div>
                <Switch
                  id="fee-recurring"
                  checked={field.value ?? false}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    setValue("recurringMonth", null);
                  }}
                  className="data-[state=checked]:bg-sky-600 dark:data-[state=checked]:bg-sky-600"
                />
              </div>
            )}
          />

          {isRecurring && (
            <Controller
              control={control}
              name="recurringMonth"
              render={({ field }) => {
                const isYearly =
                  field.value !== null && field.value !== undefined;
                const frequencyOptions = [
                  {
                    yearly: false,
                    label: t("frequencyMonthly"),
                    hint: t("frequencyMonthlyHint"),
                  },
                  {
                    yearly: true,
                    label: t("frequencyYearly"),
                    hint: t("frequencyYearlyHint"),
                  },
                ];
                return (
                  <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                    <div className="space-y-1.5">
                      <Label className="font-manrope text-xs font-normal text-foreground/70">
                        {t("fieldFrequency")}
                      </Label>
                      <div
                        className="grid grid-cols-2 gap-2"
                        role="radiogroup"
                        aria-label={t("fieldFrequency")}
                      >
                        {frequencyOptions.map((option) => {
                          const selected = option.yearly === isYearly;
                          return (
                            <button
                              key={option.label}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() =>
                                field.onChange(
                                  option.yearly
                                    ? (field.value ?? DEFAULT_YEARLY_MONTH)
                                    : null,
                                )
                              }
                              className={`rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                                selected
                                  ? "border-sky-500/50 bg-sky-500/10"
                                  : "border-border bg-card hover:border-sky-500/30"
                              }`}
                            >
                              <span className="block font-jakarta text-sm font-semibold text-foreground">
                                {option.label}
                              </span>
                              <span className="block font-manrope text-[11px] text-muted-foreground">
                                {option.hint}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {isYearly && (
                      <div className="space-y-1.5">
                        <Label className="font-manrope text-xs font-normal text-foreground/70">
                          {t("fieldMonth")}
                        </Label>
                        <Select
                          value={String(field.value)}
                          onValueChange={(value: string) =>
                            field.onChange(Number(value))
                          }
                        >
                          <SelectTrigger
                            className={`${fieldClass(!!errors.recurringMonth)} w-full bg-card data-[size=default]:h-10 dark:hover:bg-card`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-72 rounded-xl">
                            {MONTH_NAMES.map((name, i) => (
                              <SelectItem
                                key={name}
                                value={String(i + 1)}
                                className="font-manrope text-sm"
                              >
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FieldError message={errors.recurringMonth?.message} />
                      </div>
                    )}

                    <p className="font-manrope text-[11px] text-muted-foreground">
                      {isYearly
                        ? `${t("summaryYearly")} ${MONTH_NAMES[(field.value ?? DEFAULT_YEARLY_MONTH) - 1]}.`
                        : t("summaryMonthly")}
                    </p>
                  </div>
                );
              }}
            />
          )}

          <DialogFooter className="gap-2 pt-1 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={`h-11 flex-1 text-sm ${OUTLINE_PILL_CLASS}`}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={`h-11 flex-1 gap-2 text-sm ${PRIMARY_PILL_CLASS}`}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {isEdit ? t("saving") : t("creating")}
                </>
              ) : isEdit ? (
                t("saveChanges")
              ) : (
                <>
                  <Plus className="size-4" />
                  {t("create")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
