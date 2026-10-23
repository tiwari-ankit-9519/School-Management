"use client";
import {
  AlertCircle,
  CalendarDays,
  Download,
  Eye,
  HandCoins,
  IndianRupee,
  Loader2,
  Mail,
  Phone,
  Receipt,
  Undo2,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TONE_CLASSES } from "@/components/dashboard/DashboardWidgets";
import {
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
} from "@/components/forms/FormParts";
import {
  BillStatusBadge,
  formatDateTime,
  formatMoney,
  formatPeriod,
  formatShortDate,
  getAvatarClass,
  getInitials,
} from "@/components/fee-collection/FeeCollectionParts";
import {
  BillTarget,
  TransactionTarget,
} from "@/components/fee-collection/FeeDialogs";
import { useDownloadReceipt, useGetFeeBill } from "@/hooks/useFeePayments";
import { useTranslations } from "@/hooks/useTranslations";
import { FeeBillDetail, TransactionStatus } from "@/types";

const formatMode = (mode: string) =>
  mode
    .toLowerCase()
    .split("_")
    .map((word) =>
      word === "upi" ? "UPI" : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");

export const toBillTarget = (
  bill: FeeBillDetail,
  oneTimeLabel: string,
): BillTarget => ({
  id: bill.id,
  balance: bill.balance,
  studentName: `${bill.student.firstName} ${bill.student.lastName}`,
  feeName: bill.feeStructure.name,
  period: formatPeriod(bill.billingPeriod, oneTimeLabel),
});

interface FeeBillSheetProps {
  billId: string | null;
  canWaive: boolean;
  canReverse: boolean;
  onOpenChange: (open: boolean) => void;
  onCollect: (target: BillTarget) => void;
  onWaive: (target: BillTarget) => void;
  onReverse: (target: TransactionTarget) => void;
}

export const FeeBillSheet = ({
  billId,
  canWaive,
  canReverse,
  onOpenChange,
  onCollect,
  onWaive,
  onReverse,
}: FeeBillSheetProps) => {
  const t = useTranslations("feeCollection");
  const { data: bill, isLoading, isError } = useGetFeeBill(billId);
  const {
    mutate: downloadReceipt,
    isPending: isDownloading,
    variables,
  } = useDownloadReceipt();

  const settledPercent =
    bill && bill.amountDue > 0
      ? Math.min(
          100,
          Math.round(
            ((bill.amountPaid + bill.waivedAmount) / bill.amountDue) * 100,
          ),
        )
      : 0;

  return (
    <Sheet open={!!billId} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto border-border bg-background p-0 sm:max-w-lg"
      >
        {isLoading || !bill ? (
          <div className="space-y-4 p-6">
            {isError ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <AlertCircle className="size-6 text-red-500" />
                <p className="font-manrope text-sm text-muted-foreground">
                  {t("detailError")}
                </p>
              </div>
            ) : (
              <>
                <SheetHeader className="sr-only">
                  <SheetTitle>{t("detailTitle")}</SheetTitle>
                  <SheetDescription>{t("loading")}</SheetDescription>
                </SheetHeader>
                <Skeleton className="h-16 rounded-2xl" />
                <Skeleton className="h-36 rounded-2xl" />
                <Skeleton className="h-48 rounded-2xl" />
              </>
            )}
          </div>
        ) : (
          <>
            <SheetHeader className="space-y-3 border-b border-border p-6 text-left">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback
                    className={`font-jakarta text-sm font-bold ${getAvatarClass(bill.student.id)}`}
                  >
                    {getInitials(bill.student.firstName, bill.student.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <SheetTitle className="truncate font-jakarta text-lg font-bold text-foreground">
                    {bill.student.firstName} {bill.student.lastName}
                  </SheetTitle>
                  <SheetDescription className="truncate font-manrope text-xs text-muted-foreground">
                    {bill.student.regNumber}
                    {bill.student.className
                      ? ` · ${t("classLabel")} ${bill.student.className}`
                      : ""}
                    {bill.student.rollNumber
                      ? ` · ${t("rollNo")} ${bill.student.rollNumber}`
                      : ""}
                  </SheetDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={`gap-1 rounded-full font-manrope text-[11px] font-medium ${TONE_CLASSES.indigo}`}
                >
                  <Receipt className="size-3" />
                  {bill.feeStructure.name}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full border-border bg-muted font-manrope text-[11px] text-foreground/80"
                >
                  {formatPeriod(bill.billingPeriod, t("oneTime"))} ·{" "}
                  {bill.feeStructure.academicYear.name}
                </Badge>
                <BillStatusBadge status={bill.status} />
              </div>
            </SheetHeader>

            <div className="space-y-5 p-6">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="font-manrope text-[11px] tracking-wider text-muted-foreground uppercase">
                      {t("balance")}
                    </p>
                    <p className="font-jakarta text-3xl font-bold tracking-tight text-foreground">
                      {formatMoney(bill.balance)}
                    </p>
                  </div>
                  <p className="flex items-center gap-1.5 font-manrope text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    {t("dueOn")} {formatShortDate(bill.dueDate)}
                  </p>
                </div>
                <Progress
                  value={settledPercent}
                  className="mt-3 h-1.5 bg-muted [&>*]:bg-emerald-500"
                />
                <div className="mt-3 grid grid-cols-3 gap-2 font-manrope text-xs">
                  {[
                    { label: t("colAmount"), value: bill.amountDue },
                    { label: t("colPaid"), value: bill.amountPaid },
                    { label: t("waived"), value: bill.waivedAmount },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg bg-muted/50 px-2.5 py-2"
                    >
                      <p className="text-muted-foreground">{item.label}</p>
                      <p className="font-semibold text-foreground">
                        {formatMoney(item.value)}
                      </p>
                    </div>
                  ))}
                </div>
                {bill.balance > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {canWaive && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          onWaive(toBillTarget(bill, t("oneTime")))
                        }
                        className={`h-10 gap-1.5 text-sm ${OUTLINE_PILL_CLASS}`}
                      >
                        <HandCoins className="size-4" />
                        {t("waive")}
                      </Button>
                    )}
                    <Button
                      type="button"
                      onClick={() =>
                        onCollect(toBillTarget(bill, t("oneTime")))
                      }
                      className={`h-10 gap-1.5 text-sm ${PRIMARY_PILL_CLASS} ${canWaive ? "" : "col-span-2"}`}
                    >
                      <IndianRupee className="size-4" />
                      {t("collect")}
                    </Button>
                  </div>
                )}
              </div>

              {bill.student.guardians.length > 0 && (
                <section className="space-y-2">
                  <h3 className="font-jakarta text-sm font-semibold text-foreground">
                    {t("guardians")}
                  </h3>
                  {bill.student.guardians.map((guardian) => (
                    <div
                      key={`${guardian.relation}-${guardian.name}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <User className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-jakarta text-sm font-semibold text-foreground">
                          {guardian.name}
                        </p>
                        <p className="font-manrope text-[11px] text-muted-foreground">
                          {guardian.relation.charAt(0) +
                            guardian.relation.slice(1).toLowerCase()}
                        </p>
                      </div>
                      {guardian.phone && (
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          aria-label={t("call")}
                          className="h-8 w-8 rounded-full"
                        >
                          <a href={`tel:${guardian.phone}`}>
                            <Phone className="size-3.5" />
                          </a>
                        </Button>
                      )}
                      {guardian.email && (
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          aria-label={t("email")}
                          className="h-8 w-8 rounded-full"
                        >
                          <a href={`mailto:${guardian.email}`}>
                            <Mail className="size-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {bill.waiverReason && (
                <section className="space-y-2">
                  <h3 className="font-jakarta text-sm font-semibold text-foreground">
                    {t("waiverHistory")}
                  </h3>
                  <div
                    className={`space-y-1 rounded-xl border p-3 font-manrope text-xs ${TONE_CLASSES.violet}`}
                  >
                    {bill.waiverReason.split("\n").map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                    {bill.waivedBy && (
                      <p className="pt-1 opacity-80">
                        {t("lastWaivedBy")} {bill.waivedBy}
                        {bill.waivedAt
                          ? ` · ${formatDateTime(bill.waivedAt)}`
                          : ""}
                      </p>
                    )}
                  </div>
                </section>
              )}

              <Separator />

              <section className="space-y-3">
                <h3 className="font-jakarta text-sm font-semibold text-foreground">
                  {t("payments")} ({bill.transactions.length})
                </h3>
                {bill.transactions.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border py-8 text-center font-manrope text-sm text-muted-foreground">
                    {t("noPayments")}
                  </p>
                ) : (
                  bill.transactions.map((transaction) => {
                    const reversed =
                      transaction.status === TransactionStatus.REVERSED;
                    const busy =
                      isDownloading &&
                      variables?.transactionId === transaction.id;
                    return (
                      <div
                        key={transaction.id}
                        className={`space-y-2 rounded-xl border p-3 ${reversed ? "border-red-500/20 bg-red-500/5" : "border-border bg-card"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className={`font-jakarta text-base font-bold ${
                                reversed
                                  ? "text-muted-foreground line-through"
                                  : "text-foreground"
                              }`}
                            >
                              {formatMoney(transaction.amount)}
                            </p>
                            <p className="truncate font-mono text-[11px] text-muted-foreground">
                              {transaction.receiptNumber}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`shrink-0 rounded-full font-manrope text-[10px] ${reversed ? TONE_CLASSES.red : TONE_CLASSES.emerald}`}
                          >
                            {reversed
                              ? t("reversed")
                              : formatMode(transaction.paymentMode)}
                          </Badge>
                        </div>
                        <p className="font-manrope text-[11px] text-muted-foreground">
                          {formatDateTime(transaction.paidAt)}
                          {transaction.collectedBy
                            ? ` · ${t("by")} ${transaction.collectedBy}`
                            : ""}
                          {transaction.referenceNumber
                            ? ` · ${t("ref")} ${transaction.referenceNumber}`
                            : ""}
                        </p>
                        {transaction.remarks && (
                          <p className="font-manrope text-xs text-foreground/80 italic">
                            {transaction.remarks}
                          </p>
                        )}
                        {reversed && (
                          <p className="font-manrope text-[11px] text-red-700 dark:text-red-300">
                            {t("reversedBy")} {transaction.reversedBy ?? "—"}
                            {transaction.reversedAt
                              ? ` · ${formatDateTime(transaction.reversedAt)}`
                              : ""}
                            : {transaction.reversalReason}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              downloadReceipt({
                                transactionId: transaction.id,
                                receiptNumber: transaction.receiptNumber,
                                inline: true,
                              })
                            }
                            className={`h-8 gap-1.5 px-3 text-xs ${OUTLINE_PILL_CLASS}`}
                          >
                            <Eye className="size-3.5" />
                            {t("view")}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              downloadReceipt({
                                transactionId: transaction.id,
                                receiptNumber: transaction.receiptNumber,
                              })
                            }
                            className={`h-8 gap-1.5 px-3 text-xs ${OUTLINE_PILL_CLASS}`}
                          >
                            {busy ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Download className="size-3.5" />
                            )}
                            {t("download")}
                          </Button>
                          {canReverse && !reversed && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onReverse({
                                  id: transaction.id,
                                  receiptNumber: transaction.receiptNumber,
                                  amount: transaction.amount,
                                })
                              }
                              className="ml-auto h-8 gap-1.5 rounded-full px-3 font-manrope text-xs text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
                            >
                              <Undo2 className="size-3.5" />
                              {t("reverse")}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
