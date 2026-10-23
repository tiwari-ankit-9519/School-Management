"use client";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Download,
  Eye,
  HandCoins,
  IndianRupee,
  Info,
  Loader2,
  Mail,
  Phone,
  Receipt,
  Undo2,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TAB_TRIGGER_CLASS,
} from "@/components/forms/FormParts";
import {
  BillStatusBadge,
  formatDateTime,
  formatMode,
  formatMoney,
  formatPeriod,
  formatShortDate,
  getAvatarClass,
  getDaysOverdue,
  getInitials,
} from "@/components/fee-collection/FeeCollectionParts";
import {
  CollectTarget,
  ReceiptTarget,
  WaiveTarget,
} from "@/components/fee-collection/FeeDialogs";
import { useDownloadReceipt, useGetFeeStudent } from "@/hooks/useFeePayments";
import { useTranslations } from "@/hooks/useTranslations";
import {
  FeeReceiptSummary,
  FeeStatus,
  FeeStudentDetail,
  StudentFeeBill,
  TransactionStatus,
} from "@/types";

const MONEY_EPSILON = 0.005;

const isCollectable = (bill: StudentFeeBill) =>
  bill.balance > MONEY_EPSILON && bill.status !== FeeStatus.WAIVED;

interface FeeStudentPanelProps {
  studentId: string | null;
  initialBillIds: string[];
  canWaive: boolean;
  canReverse: boolean;
  onOpenChange: (open: boolean) => void;
  onCollect: (target: CollectTarget) => void;
  onWaive: (target: WaiveTarget) => void;
  onReverse: (target: ReceiptTarget) => void;
}

export const FeeStudentPanel = ({
  studentId,
  initialBillIds,
  canWaive,
  canReverse,
  onOpenChange,
  onCollect,
  onWaive,
  onReverse,
}: FeeStudentPanelProps) => {
  const t = useTranslations("feeCollection");
  const { data, isLoading, isError } = useGetFeeStudent(studentId);

  return (
    <Sheet open={!!studentId} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 border-border bg-background p-0 sm:max-w-xl"
      >
        {isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <SheetHeader className="sr-only">
              <SheetTitle>{t("detailTitle")}</SheetTitle>
              <SheetDescription>{t("detailError")}</SheetDescription>
            </SheetHeader>
            <AlertCircle className="size-6 text-red-500" />
            <p className="font-manrope text-sm text-muted-foreground">
              {t("detailError")}
            </p>
          </div>
        ) : isLoading || !data ? (
          <div className="space-y-4 p-6">
            <SheetHeader className="sr-only">
              <SheetTitle>{t("detailTitle")}</SheetTitle>
              <SheetDescription>{t("loading")}</SheetDescription>
            </SheetHeader>
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : (
          <PanelBody
            key={data.student.id}
            data={data}
            initialBillIds={initialBillIds}
            canWaive={canWaive}
            canReverse={canReverse}
            onCollect={onCollect}
            onWaive={onWaive}
            onReverse={onReverse}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

interface PanelBodyProps {
  data: FeeStudentDetail;
  initialBillIds: string[];
  canWaive: boolean;
  canReverse: boolean;
  onCollect: (target: CollectTarget) => void;
  onWaive: (target: WaiveTarget) => void;
  onReverse: (target: ReceiptTarget) => void;
}

const PanelBody = ({
  data,
  initialBillIds,
  canWaive,
  canReverse,
  onCollect,
  onWaive,
  onReverse,
}: PanelBodyProps) => {
  const t = useTranslations("feeCollection");
  const [today] = useState(() => new Date());
  const [tab, setTab] = useState<"bills" | "receipts">("bills");
  const [selection, setSelection] = useState<string[] | null>(null);
  const [switchedSession, setSwitchedSession] = useState(false);

  const studentName = `${data.student.firstName} ${data.student.lastName}`;

  const yearOfBill = useMemo(() => {
    const map = new Map<string, string>();
    data.years.forEach((year) =>
      year.bills.forEach((bill) => map.set(bill.id, year.academicYearId)),
    );
    return map;
  }, [data.years]);

  const collectableById = useMemo(() => {
    const map = new Map<string, StudentFeeBill>();
    data.years.forEach((year) =>
      year.bills
        .filter(isCollectable)
        .forEach((bill) => map.set(bill.id, bill)),
    );
    return map;
  }, [data.years]);

  const defaultSelection = useMemo(() => {
    const fromInitial = initialBillIds.filter((id) => collectableById.has(id));
    if (fromInitial.length > 0) {
      const yearId = yearOfBill.get(fromInitial[0]);
      return fromInitial.filter((id) => yearOfBill.get(id) === yearId);
    }
    const firstYearWithDues = data.years.find((year) =>
      year.bills.some(isCollectable),
    );
    return firstYearWithDues
      ? firstYearWithDues.bills.filter(isCollectable).map((bill) => bill.id)
      : [];
  }, [initialBillIds, collectableById, yearOfBill, data.years]);

  const selectedIds = (selection ?? defaultSelection).filter((id) =>
    collectableById.has(id),
  );
  const selectedBills = selectedIds
    .map((id) => collectableById.get(id))
    .filter((bill): bill is StudentFeeBill => !!bill);
  const selectedTotal = selectedBills.reduce(
    (sum, bill) => sum + bill.balance,
    0,
  );
  const selectedYearId = selectedIds.length
    ? yearOfBill.get(selectedIds[0])
    : undefined;

  const toggleBill = (bill: StudentFeeBill, yearId: string) => {
    if (selectedIds.includes(bill.id)) {
      setSelection(selectedIds.filter((id) => id !== bill.id));
      return;
    }
    if (selectedYearId && selectedYearId !== yearId) {
      setSelection([bill.id]);
      setSwitchedSession(true);
      return;
    }
    setSelection([...selectedIds, bill.id]);
  };

  const selectAllInYear = (yearId: string) => {
    const year = data.years.find((item) => item.academicYearId === yearId);
    if (!year) return;
    setSwitchedSession(!!selectedYearId && selectedYearId !== yearId);
    setSelection(year.bills.filter(isCollectable).map((bill) => bill.id));
  };

  const openCollect = () => {
    if (selectedBills.length === 0) return;
    onCollect({
      studentId: data.student.id,
      studentName,
      bills: selectedBills.map((bill) => ({
        id: bill.id,
        feeName: bill.feeStructure.name,
        period: formatPeriod(bill.billingPeriod, t("oneTime")),
        dueDate: bill.dueDate,
        balance: bill.balance,
      })),
    });
  };

  const settledPercent =
    data.summary.billed > 0
      ? Math.min(
          100,
          Math.round(
            ((data.summary.paid + data.summary.waived) / data.summary.billed) *
              100,
          ),
        )
      : 0;

  return (
    <>
      <SheetHeader className="space-y-3 border-b border-border p-5 text-left sm:p-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback
              className={`font-jakarta text-sm font-bold ${getAvatarClass(data.student.id)}`}
            >
              {getInitials(data.student.firstName, data.student.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate font-jakarta text-lg font-bold text-foreground">
              {studentName}
            </SheetTitle>
            <SheetDescription className="truncate font-manrope text-xs text-muted-foreground">
              {[
                data.student.regNumber,
                data.student.className
                  ? `${t("classLabel")} ${data.student.className}`
                  : null,
                data.student.rollNumber
                  ? `${t("rollNo")} ${data.student.rollNumber}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </SheetDescription>
          </div>
        </div>
        {data.student.guardians.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.student.guardians.map((guardian) => (
              <div
                key={`${guardian.relation}-${guardian.name}`}
                className="flex items-center gap-1 rounded-full border border-border bg-card py-0.5 pr-1 pl-2.5"
              >
                <User className="size-3 text-muted-foreground" />
                <span className="font-manrope text-[11px] text-foreground">
                  {guardian.name}
                </span>
                {guardian.phone && (
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    aria-label={t("call")}
                    className="h-6 w-6 rounded-full"
                  >
                    <a href={`tel:${guardian.phone}`}>
                      <Phone className="size-3" />
                    </a>
                  </Button>
                )}
                {guardian.email && (
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    aria-label={t("email")}
                    className="h-6 w-6 rounded-full"
                  >
                    <a href={`mailto:${guardian.email}`}>
                      <Mail className="size-3" />
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </SheetHeader>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-5 sm:p-6">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="font-manrope text-[11px] tracking-wider text-muted-foreground uppercase">
                  {t("colOutstanding")}
                </p>
                <p className="font-jakarta text-3xl font-bold tracking-tight text-foreground">
                  {formatMoney(data.summary.outstanding)}
                </p>
              </div>
              {data.summary.overdueCount > 0 && (
                <Badge
                  variant="outline"
                  className={`rounded-full font-manrope text-[11px] ${TONE_CLASSES.red}`}
                >
                  {data.summary.overdueCount} {t("overdueShort")}
                </Badge>
              )}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${settledPercent}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 font-manrope text-xs">
              {[
                { label: t("colBilled"), value: data.summary.billed },
                { label: t("colPaid"), value: data.summary.paid },
                { label: t("waived"), value: data.summary.waived },
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
          </div>

          <Tabs
            value={tab}
            onValueChange={(value: string) =>
              setTab(value === "receipts" ? "receipts" : "bills")
            }
            className="gap-3"
          >
            <TabsList className="h-auto gap-1.5 bg-transparent p-0">
              <TabsTrigger
                value="bills"
                className={`${TAB_TRIGGER_CLASS} px-4`}
              >
                {t("tabBills")} ({data.summary.billCount})
              </TabsTrigger>
              <TabsTrigger
                value="receipts"
                className={`${TAB_TRIGGER_CLASS} gap-1.5 px-4`}
              >
                <Receipt className="size-3" />
                {t("tabReceipts")} ({data.receipts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bills" className="mt-0 space-y-4">
              {switchedSession && (
                <p
                  className={`flex items-start gap-2 rounded-xl border px-3 py-2 font-manrope text-xs ${TONE_CLASSES.indigo}`}
                >
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  {t("oneSessionNote")}
                </p>
              )}
              {data.years.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border py-10 text-center font-manrope text-sm text-muted-foreground">
                  {t("noBillsYet")}
                </p>
              ) : (
                data.years.map((year) => {
                  const hasCollectable = year.bills.some(isCollectable);
                  return (
                    <section key={year.academicYearId} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-jakarta text-sm font-semibold text-foreground">
                            {year.name}
                          </h3>
                          {year.isCurrent && (
                            <Badge
                              variant="outline"
                              className={`rounded-full font-manrope text-[10px] ${TONE_CLASSES.indigo}`}
                            >
                              {t("currentSession")}
                            </Badge>
                          )}
                          <span className="font-manrope text-[11px] text-muted-foreground">
                            {formatMoney(year.summary.outstanding)}{" "}
                            {t("dueShort")}
                          </span>
                        </div>
                        {hasCollectable && (
                          <button
                            type="button"
                            onClick={() => selectAllInYear(year.academicYearId)}
                            className="font-manrope text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            {t("selectAllDue")}
                          </button>
                        )}
                      </div>
                      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                        {year.bills.map((bill) => (
                          <BillRow
                            key={bill.id}
                            bill={bill}
                            today={today}
                            checked={selectedIds.includes(bill.id)}
                            onToggle={() =>
                              toggleBill(bill, year.academicYearId)
                            }
                            canWaive={canWaive}
                            onWaive={() =>
                              onWaive({
                                id: bill.id,
                                balance: bill.balance,
                                studentName,
                                feeName: bill.feeStructure.name,
                                period: formatPeriod(
                                  bill.billingPeriod,
                                  t("oneTime"),
                                ),
                              })
                            }
                          />
                        ))}
                      </div>
                    </section>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="receipts" className="mt-0 space-y-3">
              {data.receipts.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border py-10 text-center font-manrope text-sm text-muted-foreground">
                  {t("noPayments")}
                </p>
              ) : (
                data.receipts.map((receipt) => (
                  <ReceiptCard
                    key={receipt.id}
                    receipt={receipt}
                    canReverse={canReverse}
                    onReverse={() =>
                      onReverse({
                        id: receipt.id,
                        receiptNumber: receipt.receiptNumber,
                        totalAmount: receipt.totalAmount,
                        items: receipt.items,
                        oneTimeLabel: t("oneTime"),
                      })
                    }
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {tab === "bills" && collectableById.size > 0 && (
        <div className="border-t border-border bg-card p-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-manrope text-[11px] text-muted-foreground">
                {selectedBills.length}{" "}
                {selectedBills.length === 1
                  ? t("billSingular")
                  : t("billPlural")}{" "}
                {t("selectedShort")}
              </p>
              <p className="font-jakarta text-lg font-bold text-foreground">
                {formatMoney(selectedTotal)}
              </p>
            </div>
            <Button
              type="button"
              onClick={openCollect}
              disabled={selectedBills.length === 0}
              className={`h-11 gap-2 px-6 text-sm ${PRIMARY_PILL_CLASS}`}
            >
              <IndianRupee className="size-4" />
              {t("collect")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

interface BillRowProps {
  bill: StudentFeeBill;
  today: Date;
  checked: boolean;
  onToggle: () => void;
  canWaive: boolean;
  onWaive: () => void;
}

const BillRow = ({
  bill,
  today,
  checked,
  onToggle,
  canWaive,
  onWaive,
}: BillRowProps) => {
  const t = useTranslations("feeCollection");
  const collectable = isCollectable(bill);
  const overdueDays = getDaysOverdue(bill.dueDate, today, bill.balance);
  const checkboxId = `bill-${bill.id}`;

  return (
    <div
      className={`flex gap-3 p-3 transition-colors ${checked ? "bg-indigo-500/5" : ""}`}
    >
      <div className="pt-0.5">
        <Checkbox
          id={checkboxId}
          checked={checked}
          disabled={!collectable}
          onCheckedChange={onToggle}
          aria-label={`${t("selectBill")} ${bill.feeStructure.name}`}
          className="data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600"
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <label
            htmlFor={checkboxId}
            className={`min-w-0 ${collectable ? "cursor-pointer" : ""}`}
          >
            <p className="truncate font-jakarta text-sm font-semibold text-foreground">
              {bill.feeStructure.name}
            </p>
            <p className="font-manrope text-[11px] text-muted-foreground">
              {formatPeriod(bill.billingPeriod, t("oneTime"))} · {t("dueOn")}{" "}
              {formatShortDate(bill.dueDate)}
              {overdueDays > 0 && (
                <span className="ml-1 font-medium text-red-600 dark:text-red-400">
                  · {overdueDays} {t("daysOverdue")}
                </span>
              )}
            </p>
          </label>
          <BillStatusBadge status={bill.status} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-manrope text-[11px] text-muted-foreground">
            {formatMoney(bill.amountDue)}
            {bill.amountPaid > 0 &&
              ` · ${t("colPaid")} ${formatMoney(bill.amountPaid)}`}
            {bill.waivedAmount > 0 &&
              ` · ${t("waived")} ${formatMoney(bill.waivedAmount)}`}
          </p>
          <div className="flex items-center gap-2">
            {canWaive && collectable && (
              <button
                type="button"
                onClick={onWaive}
                className="flex items-center gap-1 font-manrope text-[11px] font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                <HandCoins className="size-3" />
                {t("waive")}
              </button>
            )}
            <span className="font-jakarta text-sm font-bold text-foreground">
              {formatMoney(bill.balance)}
            </span>
          </div>
        </div>
        {bill.waiverReason && (
          <div
            className={`space-y-0.5 rounded-lg border px-2.5 py-1.5 font-manrope text-[11px] ${TONE_CLASSES.violet}`}
          >
            {bill.waiverReason.split("\n").map((line) => (
              <p key={line}>{line}</p>
            ))}
            {bill.waivedBy && (
              <p className="opacity-80">
                {t("lastWaivedBy")} {bill.waivedBy}
                {bill.waivedAt ? ` · ${formatDateTime(bill.waivedAt)}` : ""}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface ReceiptCardProps {
  receipt: FeeReceiptSummary;
  canReverse: boolean;
  onReverse: () => void;
}

const ReceiptCard = ({ receipt, canReverse, onReverse }: ReceiptCardProps) => {
  const t = useTranslations("feeCollection");
  const {
    mutate: downloadReceipt,
    isPending,
    variables,
  } = useDownloadReceipt();
  const reversed = receipt.status === TransactionStatus.REVERSED;
  const busy = isPending && variables?.receiptId === receipt.id;

  return (
    <div
      className={`space-y-2.5 rounded-xl border p-3.5 ${reversed ? "border-red-500/20 bg-red-500/5" : "border-border bg-card"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`font-jakarta text-lg font-bold ${reversed ? "text-muted-foreground line-through" : "text-foreground"}`}
          >
            {formatMoney(receipt.totalAmount)}
          </p>
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            {receipt.receiptNumber}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 rounded-full font-manrope text-[10px] ${reversed ? TONE_CLASSES.red : TONE_CLASSES.emerald}`}
        >
          {reversed ? t("reversed") : formatMode(receipt.paymentMode)}
        </Badge>
      </div>

      <div className="space-y-1 rounded-lg bg-muted/40 p-2.5">
        {receipt.items.map((item) => (
          <div
            key={item.billId}
            className="flex items-center justify-between gap-3 font-manrope text-xs"
          >
            <span className="truncate text-foreground/85">
              {item.feeName} · {formatPeriod(item.billingPeriod, t("oneTime"))}
            </span>
            <span className="shrink-0 font-medium text-foreground">
              {formatMoney(item.amount)}
            </span>
          </div>
        ))}
      </div>

      <p className="flex flex-wrap items-center gap-x-1.5 font-manrope text-[11px] text-muted-foreground">
        <CalendarDays className="size-3" />
        {formatDateTime(receipt.paidAt)}
        {receipt.collectedBy && (
          <span>
            · {t("by")} {receipt.collectedBy}
          </span>
        )}
        {receipt.referenceNumber && (
          <span>
            · {t("ref")} {receipt.referenceNumber}
          </span>
        )}
      </p>
      {receipt.remarks && (
        <p className="font-manrope text-xs text-foreground/80 italic">
          {receipt.remarks}
        </p>
      )}
      {reversed && (
        <p className="font-manrope text-[11px] text-red-700 dark:text-red-300">
          {t("reversedBy")} {receipt.reversedBy ?? "—"}
          {receipt.reversedAt ? ` · ${formatDateTime(receipt.reversedAt)}` : ""}
          : {receipt.reversalReason}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 pt-0.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() =>
            downloadReceipt({
              receiptId: receipt.id,
              receiptNumber: receipt.receiptNumber,
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
              receiptId: receipt.id,
              receiptNumber: receipt.receiptNumber,
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
            onClick={onReverse}
            className="ml-auto h-8 gap-1.5 rounded-full px-3 font-manrope text-xs text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <Undo2 className="size-3.5" />
            {t("reverse")}
          </Button>
        )}
      </div>
    </div>
  );
};
