"use client";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Building2,
  CheckCircle2,
  CreditCard,
  Download,
  Eye,
  FileCheck2,
  HandCoins,
  IndianRupee,
  Loader2,
  Smartphone,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TONE_CLASSES } from "@/components/dashboard/DashboardWidgets";
import {
  FieldError,
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import {
  formatMoney,
  formatShortDate,
} from "@/components/fee-collection/FeeCollectionParts";
import {
  useCollectStudentFees,
  useDownloadReceipt,
  useReverseFeeReceipt,
  useWaiveFeePayment,
} from "@/hooks/useFeePayments";
import { useTranslations } from "@/hooks/useTranslations";
import { CollectStudentFeesResult, FeeReceiptItem, PaymentMode } from "@/types";

type Translate = ReturnType<typeof useTranslations<"feeCollection">>;

const MONEY_EPSILON = 0.005;
const DATE_INPUT_FORMAT = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const labelClass = "font-manrope text-xs font-normal text-foreground/70";
const textareaClass =
  "resize-none rounded-lg border-input bg-card font-manrope text-sm focus-visible:ring-0 dark:bg-card";

const COLLECT_MODES = [
  { value: PaymentMode.CASH, labelKey: "modeCash", icon: Banknote },
  { value: PaymentMode.UPI, labelKey: "modeUpi", icon: Smartphone },
  { value: PaymentMode.CHEQUE, labelKey: "modeCheque", icon: FileCheck2 },
  { value: PaymentMode.BANK_TRANSFER, labelKey: "modeBank", icon: Building2 },
  { value: PaymentMode.CARD, labelKey: "modeCard", icon: CreditCard },
] as const;

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export interface CollectBill {
  id: string;
  feeName: string;
  period: string;
  dueDate: string;
  balance: number;
}

export interface CollectTarget {
  studentId: string;
  studentName: string;
  bills: CollectBill[];
}

export interface WaiveTarget {
  id: string;
  balance: number;
  studentName: string;
  feeName: string;
  period: string;
}

export interface ReceiptTarget {
  id: string;
  receiptNumber: string;
  totalAmount: number;
  items: FeeReceiptItem[];
  oneTimeLabel: string;
}

const allocate = (bills: CollectBill[], amount: number) => {
  let remaining = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  return bills.map((bill) => {
    const share = roundMoney(Math.min(remaining, bill.balance));
    remaining = roundMoney(remaining - share);
    return { ...bill, share, after: roundMoney(bill.balance - share) };
  });
};

const buildCollectSchema = (
  t: Translate,
  combined: number,
  allowPartial: boolean,
) =>
  z
    .object({
      amount: z
        .number({ error: t("errAmount") })
        .positive({ error: t("errAmount") })
        .max(combined + MONEY_EPSILON, {
          error: `${t("errAmountMax")} ${formatMoney(combined)}`,
        }),
      paymentMode: z.enum([
        PaymentMode.CASH,
        PaymentMode.UPI,
        PaymentMode.CHEQUE,
        PaymentMode.BANK_TRANSFER,
        PaymentMode.CARD,
      ]),
      referenceNumber: z
        .string()
        .trim()
        .max(64, { error: t("errReferenceLong") }),
      paidAt: z.string().min(1, { error: t("errPaidAt") }),
      remarks: z
        .string()
        .trim()
        .max(300, { error: t("errRemarks") }),
    })
    .refine(
      (data) =>
        data.paymentMode === PaymentMode.CASH ||
        data.referenceNumber.length > 0,
      {
        error: t("errReference"),
        path: ["referenceNumber"],
      },
    )
    .refine(
      (data) =>
        allowPartial || Math.abs(data.amount - combined) <= MONEY_EPSILON,
      {
        error: t("errFullOnly"),
        path: ["amount"],
      },
    );

type CollectFormValues = z.infer<ReturnType<typeof buildCollectSchema>>;

interface CollectFeesDialogProps {
  target: CollectTarget | null;
  allowPartial: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CollectFeesDialog = ({
  target,
  allowPartial,
  onOpenChange,
}: CollectFeesDialogProps) => {
  const t = useTranslations("feeCollection");
  const bills = useMemo(
    () =>
      [...(target?.bills ?? [])].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
      ),
    [target],
  );
  const combined = roundMoney(
    bills.reduce((sum, bill) => sum + bill.balance, 0),
  );
  const schema = useMemo(
    () => buildCollectSchema(t, combined, allowPartial),
    [t, combined, allowPartial],
  );
  const { mutate: collect, isPending } = useCollectStudentFees(
    target?.studentId ?? "",
  );
  const { mutate: downloadReceipt, isPending: isDownloading } =
    useDownloadReceipt();
  const [result, setResult] = useState<CollectStudentFeesResult | null>(null);
  const [today] = useState(() => DATE_INPUT_FORMAT.format(new Date()));

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CollectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: combined,
      paymentMode: PaymentMode.CASH,
      referenceNumber: "",
      paidAt: today,
      remarks: "",
    },
  });

  const amount = useWatch({ control, name: "amount" });
  const paymentMode = useWatch({ control, name: "paymentMode" });
  const preview = allocate(bills, amount);
  const balanceAfter = roundMoney(
    preview.reduce((sum, bill) => sum + bill.after, 0),
  );

  const onSubmit = (values: CollectFormValues) => {
    collect(
      {
        billIds: bills.map((bill) => bill.id),
        amount: values.amount,
        paymentMode: values.paymentMode,
        referenceNumber: values.referenceNumber || undefined,
        paidAt: values.paidAt,
        remarks: values.remarks || undefined,
      },
      { onSuccess: (response) => setResult(response.data) },
    );
  };

  const receiptButtons = (receiptId: string, receiptNumber: string) => (
    <div className="grid w-full grid-cols-2 gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={isDownloading}
        onClick={() =>
          downloadReceipt({ receiptId, receiptNumber, inline: true })
        }
        className={`h-10 gap-1.5 text-sm ${OUTLINE_PILL_CLASS}`}
      >
        <Eye className="size-4" />
        {t("viewReceipt")}
      </Button>
      <Button
        type="button"
        disabled={isDownloading}
        onClick={() => downloadReceipt({ receiptId, receiptNumber })}
        className={`h-10 gap-1.5 text-sm ${PRIMARY_PILL_CLASS}`}
      >
        {isDownloading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        {t("downloadReceipt")}
      </Button>
    </div>
  );

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => !isPending && onOpenChange(open)}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-border bg-card sm:max-w-lg">
        {result ? (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full border ${TONE_CLASSES.emerald}`}
            >
              <CheckCircle2 className="size-7" />
            </span>
            <DialogHeader className="items-center space-y-1">
              <DialogTitle className="font-jakarta text-lg font-bold text-foreground">
                {t("collectSuccessTitle")}
              </DialogTitle>
              <DialogDescription className="font-manrope text-sm text-muted-foreground">
                {formatMoney(result.receipt.totalAmount)} · {t("receiptNo")}{" "}
                {result.receipt.receiptNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="w-full space-y-1.5 rounded-xl border border-border bg-muted/30 p-3 text-left">
              {result.receipt.items.map((item) => (
                <div
                  key={item.billId}
                  className="flex items-center justify-between gap-3 font-manrope text-xs"
                >
                  <span className="truncate text-foreground/85">
                    {item.feeName}
                  </span>
                  <span className="shrink-0 font-semibold text-foreground">
                    {formatMoney(item.amount)}
                  </span>
                </div>
              ))}
            </div>
            <p className="font-manrope text-xs text-muted-foreground">
              {result.balanceRemaining > MONEY_EPSILON
                ? `${t("remainingOnSelected")} ${formatMoney(result.balanceRemaining)}`
                : t("selectedSettled")}
            </p>
            {receiptButtons(result.receipt.id, result.receipt.receiptNumber)}
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-full px-4 text-xs"
            >
              {t("done")}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="flex-row items-start gap-4 space-y-0 text-left">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${TONE_CLASSES.emerald}`}
              >
                <IndianRupee className="size-5" />
              </span>
              <div className="space-y-1">
                <DialogTitle className="font-jakarta text-lg font-bold text-foreground">
                  {t("collectTitle")}
                </DialogTitle>
                <DialogDescription className="font-manrope text-sm text-muted-foreground">
                  {target?.studentName} · {bills.length}{" "}
                  {bills.length === 1 ? t("billSingular") : t("billPlural")}
                </DialogDescription>
              </div>
            </DialogHeader>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="collect-amount" className={labelClass}>
                    {t("fieldAmount")}
                  </Label>
                  {allowPartial && (
                    <button
                      type="button"
                      onClick={() =>
                        setValue("amount", combined, { shouldValidate: true })
                      }
                      className="font-manrope text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {t("fullBalance")} · {formatMoney(combined)}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-jakarta text-sm font-semibold text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="collect-amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    readOnly={!allowPartial}
                    aria-invalid={!!errors.amount}
                    className={`${fieldClass(!!errors.amount)} pl-7 font-jakarta text-base font-semibold ${
                      !allowPartial ? "cursor-not-allowed bg-muted" : ""
                    }`}
                    {...register("amount", { valueAsNumber: true })}
                  />
                </div>
                <FieldError message={errors.amount?.message} />
                {!allowPartial && (
                  <p className="font-manrope text-[11px] text-muted-foreground">
                    {t("partialOffNote")}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-3">
                <p className="font-manrope text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  {t("allocationTitle")}
                </p>
                {preview.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center gap-2 font-manrope text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {bill.feeName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {bill.period} · {t("dueOn")}{" "}
                        {formatShortDate(bill.dueDate)}
                      </p>
                    </div>
                    <span className="shrink-0 text-muted-foreground">
                      {formatMoney(bill.balance)}
                    </span>
                    <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                    <span
                      className={`w-24 shrink-0 text-right font-semibold ${
                        bill.after <= MONEY_EPSILON
                          ? "text-emerald-700 dark:text-emerald-300"
                          : bill.share > 0
                            ? "text-sky-700 dark:text-sky-300"
                            : "text-muted-foreground"
                      }`}
                    >
                      {bill.after <= MONEY_EPSILON
                        ? t("cleared")
                        : `${formatMoney(bill.after)} ${t("leftShort")}`}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border pt-2 font-manrope text-xs">
                  <span className="text-muted-foreground">
                    {t("balanceAfter")}
                  </span>
                  <span className="font-jakarta text-sm font-bold text-foreground">
                    {formatMoney(balanceAfter)}
                  </span>
                </div>
              </div>

              <Controller
                control={control}
                name="paymentMode"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label className={labelClass}>{t("fieldMode")}</Label>
                    <div
                      className="grid grid-cols-3 gap-2 sm:grid-cols-5"
                      role="radiogroup"
                      aria-label={t("fieldMode")}
                    >
                      {COLLECT_MODES.map((mode) => {
                        const selected = field.value === mode.value;
                        return (
                          <button
                            key={mode.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => field.onChange(mode.value)}
                            className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                              selected
                                ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                                : "border-border bg-card text-muted-foreground hover:border-indigo-500/30 hover:text-foreground"
                            }`}
                          >
                            <mode.icon className="size-4" />
                            <span className="font-manrope text-[11px] font-medium">
                              {t(mode.labelKey)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="collect-reference" className={labelClass}>
                    {paymentMode === PaymentMode.CASH
                      ? t("fieldReferenceOptional")
                      : t("fieldReference")}
                  </Label>
                  <Input
                    id="collect-reference"
                    placeholder={
                      paymentMode === PaymentMode.CHEQUE
                        ? t("chequePlaceholder")
                        : t("referencePlaceholder")
                    }
                    aria-invalid={!!errors.referenceNumber}
                    className={fieldClass(!!errors.referenceNumber)}
                    {...register("referenceNumber")}
                  />
                  <FieldError message={errors.referenceNumber?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="collect-date" className={labelClass}>
                    {t("fieldPaidAt")}
                  </Label>
                  <Input
                    id="collect-date"
                    type="date"
                    max={today}
                    aria-invalid={!!errors.paidAt}
                    className={fieldClass(!!errors.paidAt)}
                    {...register("paidAt")}
                  />
                  <FieldError message={errors.paidAt?.message} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="collect-remarks" className={labelClass}>
                  {t("fieldRemarks")}
                </Label>
                <Textarea
                  id="collect-remarks"
                  rows={2}
                  placeholder={t("remarksPlaceholder")}
                  className={`${textareaClass} focus-visible:border-indigo-500`}
                  {...register("remarks")}
                />
                <FieldError message={errors.remarks?.message} />
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
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
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <IndianRupee className="size-4" />
                  )}
                  {isPending
                    ? t("recording")
                    : `${t("recordPayment")} · ${formatMoney(Number.isFinite(amount) ? amount : 0)}`}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const buildWaiveSchema = (t: Translate, balance: number) =>
  z
    .object({
      full: z.boolean(),
      amount: z.number().optional(),
      reason: z
        .string()
        .trim()
        .min(5, { error: t("errReasonShort") })
        .max(300, { error: t("errReasonLong") }),
    })
    .refine(
      (data) =>
        data.full ||
        (data.amount !== undefined &&
          Number.isFinite(data.amount) &&
          data.amount > 0),
      {
        error: t("errAmount"),
        path: ["amount"],
      },
    )
    .refine(
      (data) => data.full || (data.amount ?? 0) <= balance + MONEY_EPSILON,
      {
        error: `${t("errAmountMax")} ${formatMoney(balance)}`,
        path: ["amount"],
      },
    );

type WaiveFormValues = z.infer<ReturnType<typeof buildWaiveSchema>>;

interface WaiveFeeDialogProps {
  target: WaiveTarget | null;
  onOpenChange: (open: boolean) => void;
}

export const WaiveFeeDialog = ({
  target,
  onOpenChange,
}: WaiveFeeDialogProps) => {
  const t = useTranslations("feeCollection");
  const balance = target?.balance ?? 0;
  const schema = useMemo(() => buildWaiveSchema(t, balance), [t, balance]);
  const { mutate: waive, isPending } = useWaiveFeePayment(target?.id ?? "");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<WaiveFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full: true, amount: undefined, reason: "" },
  });

  const full = useWatch({ control, name: "full" });

  const onSubmit = (values: WaiveFormValues) => {
    waive(
      {
        amount: values.full ? undefined : values.amount,
        reason: values.reason,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => !isPending && onOpenChange(open)}
    >
      <DialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-4 space-y-0 text-left">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${TONE_CLASSES.violet}`}
          >
            <HandCoins className="size-5" />
          </span>
          <div className="space-y-1">
            <DialogTitle className="font-jakarta text-lg font-bold text-foreground">
              {t("waiveTitle")}
            </DialogTitle>
            <DialogDescription className="font-manrope text-sm text-muted-foreground">
              {t("waiveSub")}
            </DialogDescription>
          </div>
        </DialogHeader>

        {target && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3">
            <div className="min-w-0">
              <p className="truncate font-jakarta text-sm font-semibold text-foreground">
                {target.feeName}
              </p>
              <p className="truncate font-manrope text-[11px] text-muted-foreground">
                {target.studentName} · {target.period}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-manrope text-[11px] text-muted-foreground">
                {t("balance")}
              </p>
              <p className="font-jakarta text-base font-bold text-foreground">
                {formatMoney(target.balance)}
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <Controller
            control={control}
            name="full"
            render={({ field }) => (
              <div
                className="grid grid-cols-2 gap-2"
                role="radiogroup"
                aria-label={t("waiveHow")}
              >
                {[
                  { value: true, label: t("waiveFull") },
                  { value: false, label: t("waivePart") },
                ].map((option) => (
                  <button
                    key={String(option.value)}
                    type="button"
                    role="radio"
                    aria-checked={field.value === option.value}
                    onClick={() => field.onChange(option.value)}
                    className={`rounded-xl border px-3 py-2.5 font-manrope text-sm transition-colors ${
                      field.value === option.value
                        ? "border-violet-500/50 bg-violet-500/10 font-medium text-violet-700 dark:text-violet-300"
                        : "border-border bg-card text-muted-foreground hover:border-violet-500/30"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          />

          {!full && (
            <div className="space-y-1.5">
              <Label htmlFor="waive-amount" className={labelClass}>
                {t("fieldWaiveAmount")}
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-jakarta text-sm font-semibold text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="waive-amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  aria-invalid={!!errors.amount}
                  className={`${fieldClass(!!errors.amount)} pl-7`}
                  {...register("amount", { valueAsNumber: true })}
                />
              </div>
              <FieldError message={errors.amount?.message} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="waive-reason" className={labelClass}>
              {t("fieldReason")}
            </Label>
            <Textarea
              id="waive-reason"
              rows={3}
              placeholder={t("waiveReasonPlaceholder")}
              aria-invalid={!!errors.reason}
              className={`${textareaClass} focus-visible:border-violet-500`}
              {...register("reason")}
            />
            <FieldError message={errors.reason?.message} />
          </div>

          <p
            className={`flex items-start gap-2 rounded-xl border px-3 py-2 font-manrope text-xs ${TONE_CLASSES.amber}`}
          >
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            {t("waiveWarning")}
          </p>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className={`h-11 flex-1 text-sm ${OUTLINE_PILL_CLASS}`}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 flex-1 gap-2 rounded-full bg-violet-600 font-manrope text-sm font-semibold text-white shadow-none hover:bg-violet-500"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <HandCoins className="size-4" />
              )}
              {isPending ? t("waiving") : t("confirmWaive")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const buildReverseSchema = (t: Translate) =>
  z.object({
    reason: z
      .string()
      .trim()
      .min(10, { error: t("errReverseShort") })
      .max(300, { error: t("errReasonLong") }),
  });

type ReverseFormValues = z.infer<ReturnType<typeof buildReverseSchema>>;

interface ReverseReceiptDialogProps {
  target: ReceiptTarget | null;
  onOpenChange: (open: boolean) => void;
}

export const ReverseReceiptDialog = ({
  target,
  onOpenChange,
}: ReverseReceiptDialogProps) => {
  const t = useTranslations("feeCollection");
  const schema = useMemo(() => buildReverseSchema(t), [t]);
  const { mutate: reverse, isPending } = useReverseFeeReceipt();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReverseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "" },
  });

  const onSubmit = (values: ReverseFormValues) => {
    if (!target) return;
    reverse(
      { receiptId: target.id, data: { reason: values.reason } },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog
      open={!!target}
      onOpenChange={(open) => !isPending && onOpenChange(open)}
    >
      <DialogContent className="rounded-2xl border-border bg-card sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-4 space-y-0 text-left">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${TONE_CLASSES.red}`}
          >
            <Undo2 className="size-5" />
          </span>
          <div className="space-y-1">
            <DialogTitle className="font-jakarta text-lg font-bold text-foreground">
              {t("reverseTitle")}
            </DialogTitle>
            <DialogDescription className="font-manrope text-sm text-muted-foreground">
              {target
                ? `${t("receiptNo")} ${target.receiptNumber} · ${formatMoney(target.totalAmount)}`
                : ""}
            </DialogDescription>
          </div>
        </DialogHeader>

        {target && (
          <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-3">
            <p className="font-manrope text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              {t("reverseAffects")}
            </p>
            {target.items.map((item) => (
              <div
                key={item.billId}
                className="flex items-center justify-between gap-3 font-manrope text-xs"
              >
                <span className="truncate text-foreground/85">
                  {item.feeName} · {item.billingPeriod ?? target.oneTimeLabel}
                </span>
                <span className="shrink-0 font-semibold text-foreground">
                  {formatMoney(item.amount)}
                </span>
              </div>
            ))}
          </div>
        )}

        <p
          className={`flex items-start gap-2 rounded-xl border px-3 py-2 font-manrope text-xs ${TONE_CLASSES.red}`}
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {t("reverseWarning")}
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="reverse-reason" className={labelClass}>
              {t("fieldReason")}
            </Label>
            <Textarea
              id="reverse-reason"
              rows={3}
              placeholder={t("reverseReasonPlaceholder")}
              aria-invalid={!!errors.reason}
              className={`${textareaClass} focus-visible:border-red-500`}
              {...register("reason")}
            />
            <FieldError message={errors.reason?.message} />
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className={`h-11 flex-1 text-sm ${OUTLINE_PILL_CLASS}`}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 flex-1 gap-2 rounded-full bg-red-600 font-manrope text-sm font-semibold text-white shadow-none hover:bg-red-500"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Undo2 className="size-4" />
              )}
              {isPending ? t("reversing") : t("confirmReverse")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
