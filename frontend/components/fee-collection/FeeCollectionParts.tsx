"use client";
import { ArrowUpRight, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
} from "@/components/forms/FormParts";
import { useTranslations } from "@/hooks/useTranslations";
import {
  FeeBillListItem,
  FeeDueStatus,
  FeeStatus,
  FeeStudentRow,
} from "@/types";

const SLATE_TONE =
  "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-300";
const SKY_TONE =
  "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300";
const DAY_MS = 86_400_000;
const MONEY_EPSILON = 0.005;

export const BILL_STATUS_CONFIG = {
  [FeeStatus.PENDING]: {
    labelKey: "statusPending",
    tone: SLATE_TONE,
    dot: "bg-slate-400",
  },
  [FeeStatus.PARTIAL]: {
    labelKey: "statusPartial",
    tone: SKY_TONE,
    dot: "bg-sky-500",
  },
  [FeeStatus.OVERDUE]: {
    labelKey: "statusOverdue",
    tone: TONE_CLASSES.red,
    dot: "bg-red-500",
  },
  [FeeStatus.PAID]: {
    labelKey: "statusPaid",
    tone: TONE_CLASSES.emerald,
    dot: "bg-emerald-500",
  },
  [FeeStatus.WAIVED]: {
    labelKey: "statusWaived",
    tone: TONE_CLASSES.violet,
    dot: "bg-violet-500",
  },
} as const;

export const BILL_STATUS_TABS = [
  "ALL",
  FeeStatus.PENDING,
  FeeStatus.PARTIAL,
  FeeStatus.OVERDUE,
  FeeStatus.PAID,
  FeeStatus.WAIVED,
] as const;
export type BillStatusTab = (typeof BILL_STATUS_TABS)[number];

export const DUE_STATUS_CONFIG = {
  ALL: { labelKey: "dueAll", dot: "" },
  DUE: { labelKey: "dueHasDues", dot: "bg-amber-500" },
  OVERDUE: { labelKey: "dueOverdue", dot: "bg-red-500" },
  CLEARED: { labelKey: "dueCleared", dot: "bg-emerald-500" },
} as const satisfies Record<FeeDueStatus, { labelKey: string; dot: string }>;

export const DUE_STATUS_TABS: FeeDueStatus[] = [
  "ALL",
  "DUE",
  "OVERDUE",
  "CLEARED",
];

const AVATAR_PALETTE = [
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
];

export const formatMoney = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);

export const formatCompactMoney = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: amount >= 100_000 ? "compact" : "standard",
    maximumFractionDigits: amount >= 100_000 ? 1 : 0,
  }).format(amount);

export const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatRelativeDate = (iso: string, today: Date) => {
  const days = Math.floor((today.getTime() - new Date(iso).getTime()) / DAY_MS);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatPeriod = (
  billingPeriod: string | null,
  oneTimeLabel: string,
) => {
  if (!billingPeriod) return oneTimeLabel;
  const [year, month] = billingPeriod.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

export const formatMode = (mode: string) =>
  mode
    .toLowerCase()
    .split("_")
    .map((word) =>
      word === "upi" ? "UPI" : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");

export const getDaysOverdue = (
  dueDate: string,
  today: Date,
  balance: number,
) => {
  if (balance <= MONEY_EPSILON) return 0;
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return Math.max(
    0,
    Math.floor((todayUtc - new Date(dueDate).getTime()) / DAY_MS),
  );
};

export const getMonthOptions = (today: Date, count = 12) =>
  Array.from({ length: count }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      }),
    };
  });

export const getInitials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

export const getAvatarClass = (seed: string) => {
  const hash = Array.from(seed ?? "").reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

export const BillStatusBadge = ({ status }: { status: FeeStatus }) => {
  const t = useTranslations("feeCollection");
  const config = BILL_STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-full font-manrope text-[11px] font-medium ${config.tone}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {t(config.labelKey)}
    </Badge>
  );
};

export const StudentDueBadge = ({
  row,
}: {
  row: Pick<FeeStudentRow, "billCount" | "outstanding" | "overdueCount">;
}) => {
  const t = useTranslations("feeCollection");
  const state =
    row.billCount === 0
      ? { label: t("noBills"), tone: SLATE_TONE, dot: "bg-slate-400" }
      : row.overdueCount > 0
        ? {
            label: `${row.overdueCount} ${t("overdueShort")}`,
            tone: TONE_CLASSES.red,
            dot: "bg-red-500",
          }
        : row.outstanding > MONEY_EPSILON
          ? {
              label: t("dueHasDues"),
              tone: TONE_CLASSES.amber,
              dot: "bg-amber-500",
            }
          : {
              label: t("dueCleared"),
              tone: TONE_CLASSES.emerald,
              dot: "bg-emerald-500",
            };

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 rounded-full font-manrope text-[11px] font-medium ${state.tone}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${state.dot}`} />
      {state.label}
    </Badge>
  );
};

export const PaidProgress = ({
  paid,
  due,
  waived,
}: {
  paid: number;
  due: number;
  waived: number;
}) => {
  const percent =
    due > 0 ? Math.min(100, Math.round(((paid + waived) / due) * 100)) : 0;
  return (
    <div className="min-w-24">
      <p className="font-manrope text-sm text-foreground/85">
        {formatMoney(paid)}
      </p>
      <Progress
        value={percent}
        className="mt-1 h-1 bg-muted [&>*]:bg-emerald-500"
      />
    </div>
  );
};

const StudentIdentity = ({
  id,
  firstName,
  lastName,
  subtitle,
}: {
  id: string;
  firstName: string;
  lastName: string;
  subtitle: string;
}) => (
  <div className="flex min-w-0 items-center gap-3">
    <Avatar className="h-9 w-9 shrink-0">
      <AvatarFallback
        className={`font-jakarta text-[11px] font-bold ${getAvatarClass(id)}`}
      >
        {getInitials(firstName, lastName)}
      </AvatarFallback>
    </Avatar>
    <div className="min-w-0">
      <p className="truncate font-jakarta text-sm font-semibold text-foreground">
        {firstName} {lastName}
      </p>
      <p className="truncate font-manrope text-[11px] text-muted-foreground">
        {subtitle}
      </p>
    </div>
  </div>
);

const headClass =
  "h-11 px-4 font-manrope text-[11px] font-medium tracking-wider text-muted-foreground uppercase";

interface FeeStudentsTableProps {
  rows: FeeStudentRow[];
  today: Date;
  onOpen: (row: FeeStudentRow) => void;
}

export const FeeStudentsTable = ({
  rows,
  today,
  onOpen,
}: FeeStudentsTableProps) => {
  const t = useTranslations("feeCollection");

  const actionButton = (row: FeeStudentRow) =>
    row.outstanding > MONEY_EPSILON ? (
      <Button
        type="button"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(row);
        }}
        className={`h-8 gap-1.5 px-3 text-xs ${PRIMARY_PILL_CLASS}`}
      >
        <IndianRupee className="size-3.5" />
        {t("collect")}
      </Button>
    ) : (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(row);
        }}
        className={`h-8 gap-1 px-3 text-xs ${OUTLINE_PILL_CLASS}`}
      >
        {t("view")}
        <ArrowUpRight className="size-3.5" />
      </Button>
    );

  const subtitle = (row: FeeStudentRow) =>
    [
      row.regNumber,
      row.className ? `${t("classLabel")} ${row.className}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <>
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className={`${headClass} pl-5`}>
                {t("colStudent")}
              </TableHead>
              <TableHead className={`${headClass} text-right`}>
                {t("colBilled")}
              </TableHead>
              <TableHead className={headClass}>{t("colPaid")}</TableHead>
              <TableHead className={`${headClass} text-right`}>
                {t("colOutstanding")}
              </TableHead>
              <TableHead className={headClass}>{t("colStatus")}</TableHead>
              <TableHead className={headClass}>{t("colLastPayment")}</TableHead>
              <TableHead className={`${headClass} pr-5 text-right`}>
                {t("colAction")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.studentId}
                onClick={() => onOpen(row)}
                className="cursor-pointer border-border transition-colors hover:bg-muted/60"
              >
                <TableCell className="py-3 pr-4 pl-5">
                  <StudentIdentity
                    id={row.studentId}
                    firstName={row.firstName}
                    lastName={row.lastName}
                    subtitle={subtitle(row)}
                  />
                </TableCell>
                <TableCell className="px-4 py-3 text-right font-manrope text-sm text-foreground/85">
                  {formatMoney(row.billed)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <PaidProgress
                    paid={row.paid}
                    due={row.billed}
                    waived={row.waived}
                  />
                </TableCell>
                <TableCell
                  className={`px-4 py-3 text-right font-jakarta text-sm font-bold ${
                    row.outstanding > MONEY_EPSILON
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatMoney(row.outstanding)}
                </TableCell>
                <TableCell className="px-4 py-3">
                  <StudentDueBadge row={row} />
                </TableCell>
                <TableCell className="px-4 py-3 font-manrope text-xs text-muted-foreground">
                  {row.lastPaymentAt
                    ? formatRelativeDate(row.lastPaymentAt, today)
                    : "—"}
                </TableCell>
                <TableCell className="py-3 pr-5 pl-4 text-right">
                  {actionButton(row)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y divide-border lg:hidden">
        {rows.map((row) => (
          <div
            key={row.studentId}
            role="button"
            tabIndex={0}
            onClick={() => onOpen(row)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen(row);
              }
            }}
            className="space-y-3 px-4 py-4 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
          >
            <div className="flex items-start justify-between gap-3">
              <StudentIdentity
                id={row.studentId}
                firstName={row.firstName}
                lastName={row.lastName}
                subtitle={subtitle(row)}
              />
              <StudentDueBadge row={row} />
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/30 p-3 font-manrope text-xs">
              <div>
                <p className="text-muted-foreground">{t("colBilled")}</p>
                <p className="font-semibold text-foreground">
                  {formatMoney(row.billed)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("colPaid")}</p>
                <p className="font-semibold text-foreground">
                  {formatMoney(row.paid)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("colOutstanding")}</p>
                <p className="font-bold text-foreground">
                  {formatMoney(row.outstanding)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="font-manrope text-[11px] text-muted-foreground">
                {t("colLastPayment")}:{" "}
                {row.lastPaymentAt
                  ? formatRelativeDate(row.lastPaymentAt, today)
                  : "—"}
              </p>
              {actionButton(row)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

interface FeeBillsTableProps {
  bills: FeeBillListItem[];
  today: Date;
  onOpen: (bill: FeeBillListItem) => void;
}

export const FeeBillsTable = ({ bills, today, onOpen }: FeeBillsTableProps) => {
  const t = useTranslations("feeCollection");

  const actionButton = (bill: FeeBillListItem) =>
    bill.balance > MONEY_EPSILON ? (
      <Button
        type="button"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(bill);
        }}
        className={`h-8 gap-1.5 px-3 text-xs ${PRIMARY_PILL_CLASS}`}
      >
        <IndianRupee className="size-3.5" />
        {t("collect")}
      </Button>
    ) : (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(bill);
        }}
        className={`h-8 gap-1 px-3 text-xs ${OUTLINE_PILL_CLASS}`}
      >
        {t("view")}
        <ArrowUpRight className="size-3.5" />
      </Button>
    );

  return (
    <>
      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className={`${headClass} pl-5`}>
                {t("colStudent")}
              </TableHead>
              <TableHead className={headClass}>{t("colFee")}</TableHead>
              <TableHead className={headClass}>{t("colDueDate")}</TableHead>
              <TableHead className={`${headClass} text-right`}>
                {t("colAmount")}
              </TableHead>
              <TableHead className={headClass}>{t("colPaid")}</TableHead>
              <TableHead className={`${headClass} text-right`}>
                {t("colBalance")}
              </TableHead>
              <TableHead className={headClass}>{t("colStatus")}</TableHead>
              <TableHead className={`${headClass} pr-5 text-right`}>
                {t("colAction")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => {
              const overdueDays = getDaysOverdue(
                bill.dueDate,
                today,
                bill.balance,
              );
              return (
                <TableRow
                  key={bill.id}
                  onClick={() => onOpen(bill)}
                  className="cursor-pointer border-border transition-colors hover:bg-muted/60"
                >
                  <TableCell className="py-3 pr-4 pl-5">
                    <StudentIdentity
                      id={bill.student.id}
                      firstName={bill.student.firstName}
                      lastName={bill.student.lastName}
                      subtitle={[
                        bill.student.regNumber,
                        bill.student.className
                          ? `${t("classLabel")} ${bill.student.className}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <p className="max-w-44 truncate font-manrope text-sm font-medium text-foreground">
                      {bill.feeStructure.name}
                    </p>
                    <p className="font-manrope text-[11px] text-muted-foreground">
                      {formatPeriod(bill.billingPeriod, t("oneTime"))}
                    </p>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <p className="font-manrope text-sm text-foreground/85">
                      {formatShortDate(bill.dueDate)}
                    </p>
                    {overdueDays > 0 && (
                      <p className="font-manrope text-[11px] font-medium text-red-600 dark:text-red-400">
                        {overdueDays} {t("daysOverdue")}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-manrope text-sm text-foreground/85">
                    {formatMoney(bill.amountDue)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <PaidProgress
                      paid={bill.amountPaid}
                      due={bill.amountDue}
                      waived={bill.waivedAmount}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-jakarta text-sm font-bold text-foreground">
                    {formatMoney(bill.balance)}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <BillStatusBadge status={bill.status} />
                  </TableCell>
                  <TableCell className="py-3 pr-5 pl-4 text-right">
                    {actionButton(bill)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y divide-border lg:hidden">
        {bills.map((bill) => {
          const overdueDays = getDaysOverdue(bill.dueDate, today, bill.balance);
          return (
            <div
              key={bill.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpen(bill)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen(bill);
                }
              }}
              className="space-y-3 px-4 py-4 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
            >
              <div className="flex items-start justify-between gap-3">
                <StudentIdentity
                  id={bill.student.id}
                  firstName={bill.student.firstName}
                  lastName={bill.student.lastName}
                  subtitle={`${bill.feeStructure.name} · ${formatPeriod(bill.billingPeriod, t("oneTime"))}`}
                />
                <BillStatusBadge status={bill.status} />
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/30 p-3 font-manrope text-xs">
                <div>
                  <p className="text-muted-foreground">{t("colAmount")}</p>
                  <p className="font-semibold text-foreground">
                    {formatMoney(bill.amountDue)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("colPaid")}</p>
                  <p className="font-semibold text-foreground">
                    {formatMoney(bill.amountPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("colBalance")}</p>
                  <p className="font-bold text-foreground">
                    {formatMoney(bill.balance)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="font-manrope text-[11px] text-muted-foreground">
                  {t("dueOn")} {formatShortDate(bill.dueDate)}
                  {overdueDays > 0 && (
                    <span className="ml-1.5 font-medium text-red-600 dark:text-red-400">
                      · {overdueDays} {t("daysOverdue")}
                    </span>
                  )}
                </p>
                {actionButton(bill)}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export const FeeListSkeleton = () => (
  <div className="space-y-1 p-4 sm:p-5">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-2.5">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-44" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="hidden h-4 w-20 lg:block" />
        <Skeleton className="hidden h-4 w-20 lg:block" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="hidden h-8 w-24 rounded-full lg:block" />
      </div>
    ))}
  </div>
);
