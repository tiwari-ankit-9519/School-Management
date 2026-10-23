"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  HandCoins,
  ListChecks,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CARD_CLASS,
  TONE_CLASSES,
  fadeUp,
} from "@/components/dashboard/DashboardWidgets";
import {
  OUTLINE_PILL_CLASS,
  TAB_TRIGGER_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import { ApplicationsPagination } from "@/components/admissions/AdmissionsListParts";
import {
  BILL_STATUS_CONFIG,
  BILL_STATUS_TABS,
  BillStatusTab,
  DUE_STATUS_CONFIG,
  DUE_STATUS_TABS,
  FeeBillsTable,
  FeeListSkeleton,
  FeeStudentsTable,
  formatCompactMoney,
  getMonthOptions,
} from "@/components/fee-collection/FeeCollectionParts";
import {
  CollectFeesDialog,
  CollectTarget,
  ReceiptTarget,
  ReverseReceiptDialog,
  WaiveFeeDialog,
  WaiveTarget,
} from "@/components/fee-collection/FeeDialogs";
import { FeeStudentPanel } from "@/components/fee-collection/FeeStudentPanel";
import { useGetFeeBills, useGetFeeStudents } from "@/hooks/useFeePayments";
import { useGetSchoolSettings } from "@/hooks/useSchoolSettings";
import { useGetAllAcademicYears } from "@/hooks/useAcademicYear";
import { useGetAllClasses } from "@/hooks/useClass";
import { useTranslations } from "@/hooks/useTranslations";
import { useAuthStore } from "@/stores/useAuthStore";
import { FeeBillFilters, FeeDueStatus, FeeStudentFilters, Role } from "@/types";

type View = "students" | "bills";

const PAGE_SIZE = 15;
const ALL = "ALL";
const SEARCH_DEBOUNCE_MS = 400;

const STUDENT_SORTS = [
  { value: "outstanding:desc", labelKey: "sortOutstanding" },
  { value: "overdue:desc", labelKey: "sortMostOverdue" },
  { value: "name:asc", labelKey: "sortName" },
  { value: "lastPayment:desc", labelKey: "sortLastPaymentRecent" },
  { value: "lastPayment:asc", labelKey: "sortLastPaymentOldest" },
] as const;

const BILL_SORTS = [
  { value: "dueDate:asc", labelKey: "sortDueSoonest" },
  { value: "dueDate:desc", labelKey: "sortDueLatest" },
  { value: "paymentDate:desc", labelKey: "sortRecentlyPaid" },
  { value: "amountDue:desc", labelKey: "sortHighestAmount" },
] as const;

type StudentSortValue = (typeof STUDENT_SORTS)[number]["value"];
type BillSortValue = (typeof BILL_SORTS)[number]["value"];

interface PanelState {
  studentId: string;
  initialBillIds: string[];
}

const useDebouncedValue = <T,>(value: T, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

const FeeCollectionPage = () => {
  const t = useTranslations("feeCollection");
  const { user } = useAuthStore();
  const isAdmin = user?.role === Role.ADMIN;
  const [today] = useState(() => new Date());

  const [view, setView] = useState<View>("students");
  const [search, setSearch] = useState("");
  const [classId, setClassId] = useState<string>(ALL);

  const [dueStatus, setDueStatus] = useState<FeeDueStatus>("ALL");
  const [studentSort, setStudentSort] =
    useState<StudentSortValue>("outstanding:desc");
  const [studentPage, setStudentPage] = useState(1);

  const [billStatus, setBillStatus] = useState<BillStatusTab>(ALL);
  const [billingPeriod, setBillingPeriod] = useState<string>(ALL);
  const [billSort, setBillSort] = useState<BillSortValue>("dueDate:asc");
  const [billPage, setBillPage] = useState(1);

  const [panel, setPanel] = useState<PanelState | null>(null);
  const [collectTarget, setCollectTarget] = useState<CollectTarget | null>(
    null,
  );
  const [waiveTarget, setWaiveTarget] = useState<WaiveTarget | null>(null);
  const [reverseTarget, setReverseTarget] = useState<ReceiptTarget | null>(
    null,
  );

  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);

  const { data: settings } = useGetSchoolSettings();
  const { data: yearsData } = useGetAllAcademicYears();
  const currentYearId = yearsData?.data?.find((y) => y.isCurrent)?.id ?? "";
  const { data: classesData } = useGetAllClasses(
    { academicYearId: currentYearId },
    1,
    100,
  );
  const classes = classesData?.data ?? [];
  const monthOptions = useMemo(() => getMonthOptions(today), [today]);

  const [studentSortBy, studentOrder] = studentSort.split(":") as [
    NonNullable<FeeStudentFilters["sortBy"]>,
    "asc" | "desc",
  ];
  const studentFilters: FeeStudentFilters = {
    page: studentPage,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    classId: classId === ALL ? undefined : classId,
    dueStatus,
    sortBy: studentSortBy,
    order: studentOrder,
  };

  const [billSortBy, billOrder] = billSort.split(":") as [
    NonNullable<FeeBillFilters["sortBy"]>,
    "asc" | "desc",
  ];
  const billFilters: FeeBillFilters = {
    page: billPage,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    classId: classId === ALL ? undefined : classId,
    status: billStatus === ALL ? undefined : billStatus,
    billingPeriod: billingPeriod === ALL ? undefined : billingPeriod,
    sortBy: billSortBy,
    order: billOrder,
  };

  const studentsQuery = useGetFeeStudents(studentFilters, view === "students");
  const billsQuery = useGetFeeBills(billFilters, view === "bills");
  const activeQuery = view === "students" ? studentsQuery : billsQuery;
  const isLoading = activeQuery.isLoading;
  const isFetching = activeQuery.isFetching;

  const studentData = studentsQuery.data;
  const billData = billsQuery.data;

  const totals =
    view === "students"
      ? {
          billed: studentData?.totals.billed ?? 0,
          collected: studentData?.totals.collected ?? 0,
          outstanding: studentData?.totals.outstanding ?? 0,
        }
      : {
          billed: billData?.totals.billed ?? 0,
          collected: billData?.totals.collected ?? 0,
          outstanding: billData?.totals.outstanding ?? 0,
        };
  const collectedPercent =
    totals.billed > 0
      ? Math.round((totals.collected / totals.billed) * 100)
      : 0;

  const hasStudentFilters =
    dueStatus !== "ALL" || classId !== ALL || !!debouncedSearch;
  const hasBillFilters =
    billStatus !== ALL ||
    billingPeriod !== ALL ||
    classId !== ALL ||
    !!debouncedSearch;
  const hasFilters = view === "students" ? hasStudentFilters : hasBillFilters;

  const resetPages = () => {
    setStudentPage(1);
    setBillPage(1);
  };

  const updateSearch = (value: string) => {
    setSearch(value);
    resetPages();
  };

  const updateClass = (value: string) => {
    setClassId(value);
    resetPages();
  };

  const resetFilters = () => {
    setSearch("");
    setClassId(ALL);
    setDueStatus("ALL");
    setBillStatus(ALL);
    setBillingPeriod(ALL);
    resetPages();
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const kpis = [
    {
      key: "billed",
      label: t("kpiBilled"),
      value: formatCompactMoney(totals.billed),
      icon: Wallet,
      tone: TONE_CLASSES.indigo,
    },
    {
      key: "collected",
      label: t("kpiCollected"),
      value: formatCompactMoney(totals.collected),
      icon: TrendingUp,
      tone: TONE_CLASSES.emerald,
    },
    {
      key: "outstanding",
      label: t("kpiOutstanding"),
      value: formatCompactMoney(totals.outstanding),
      icon: AlertTriangle,
      tone: TONE_CLASSES.amber,
    },
    view === "students"
      ? {
          key: "withDues",
          label: t("kpiStudentsWithDues"),
          value: String(studentData?.totals.withDues ?? 0),
          sub: `${t("ofStudentsPrefix")} ${studentData?.totals.students ?? 0} ${t("studentsFound")}`,
          icon: Users,
          tone: TONE_CLASSES.red,
        }
      : {
          key: "waived",
          label: t("kpiWaived"),
          value: formatCompactMoney(billData?.totals.waived ?? 0),
          icon: HandCoins,
          tone: TONE_CLASSES.violet,
        },
  ];

  const selectTrigger = `${fieldClass(false)} h-9 w-full rounded-full text-xs data-[size=default]:h-9 dark:hover:bg-card`;
  const total =
    view === "students" ? (studentData?.total ?? 0) : (billData?.total ?? 0);
  const paging = view === "students" ? studentData : billData;

  return (
    <div className="space-y-5">
      <motion.header
        {...fadeUp(0)}
        className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="font-jakarta text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("pageTitle")}
          </h1>
          <p className="mt-1.5 font-manrope text-sm text-muted-foreground">
            {t("pageSubtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => activeQuery.refetch()}
          disabled={isFetching}
          className="h-11 gap-2 self-start rounded-full border-border bg-card px-5 font-manrope text-sm font-medium text-foreground shadow-none hover:bg-accent sm:self-auto dark:border-border dark:bg-card dark:hover:bg-accent"
        >
          <RefreshCw
            className={`size-4 ${isFetching ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""}`}
          />
          {t("refresh")}
        </Button>
      </motion.header>

      <motion.div
        {...fadeUp(0.05)}
        className="grid grid-cols-2 gap-4 xl:grid-cols-4"
      >
        {kpis.map((kpi, index) => (
          <Card
            key={kpi.key}
            className={`${CARD_CLASS} gap-2 p-5 ${index === 0 ? "ring-1 ring-indigo-500/20" : ""}`}
          >
            <div className="flex items-center justify-between">
              <p className="font-manrope text-xs font-medium text-muted-foreground">
                {kpi.label}
              </p>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg border ${kpi.tone}`}
              >
                <kpi.icon className="size-4" />
              </span>
            </div>
            <p className="font-jakarta text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {isLoading ? "—" : kpi.value}
            </p>
            {kpi.key === "collected" ? (
              <div>
                <Progress
                  value={collectedPercent}
                  className="h-1.5 bg-muted *:bg-emerald-500"
                />
                <p className="mt-1 font-manrope text-[11px] text-muted-foreground">
                  {collectedPercent}% {t("ofBilled")}
                </p>
              </div>
            ) : (
              <p className="font-manrope text-[11px] text-muted-foreground">
                {"sub" in kpi && kpi.sub
                  ? kpi.sub
                  : hasFilters
                    ? t("forFilters")
                    : t("thisSession")}
              </p>
            )}
          </Card>
        ))}
      </motion.div>

      <motion.div {...fadeUp(0.1)}>
        <Card className={`${CARD_CLASS} gap-0 overflow-hidden`}>
          <div className="space-y-3 px-4 pt-4 pb-3 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                role="tablist"
                aria-label={t("viewLabel")}
                className="inline-flex w-fit rounded-full border border-border bg-muted/60 p-1"
              >
                {(
                  [
                    {
                      value: "students",
                      label: t("tabByStudent"),
                      icon: Users,
                    },
                    { value: "bills", label: t("tabByBill"), icon: ListChecks },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={view === option.value}
                    onClick={() => setView(option.value)}
                    className={`flex h-8 items-center gap-1.5 rounded-full px-4 font-manrope text-xs font-medium transition-colors ${
                      view === option.value
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <option.icon className="size-3.5" />
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="font-manrope text-xs text-muted-foreground">
                {total}{" "}
                {view === "students" ? t("studentsFound") : t("billsFound")}
              </p>
            </div>

            {view === "students" ? (
              <Tabs
                value={dueStatus}
                onValueChange={(value: string) => {
                  setDueStatus(
                    DUE_STATUS_TABS.find((tab) => tab === value) ?? "ALL",
                  );
                  setStudentPage(1);
                }}
              >
                <TabsList className="flex h-auto w-full justify-start gap-1.5 overflow-x-auto bg-transparent p-0 scrollbar-none">
                  {DUE_STATUS_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className={`${TAB_TRIGGER_CLASS} px-3.5`}
                    >
                      {DUE_STATUS_CONFIG[tab].dot && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${DUE_STATUS_CONFIG[tab].dot}`}
                        />
                      )}
                      {t(DUE_STATUS_CONFIG[tab].labelKey)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            ) : (
              <Tabs
                value={billStatus}
                onValueChange={(value: string) => {
                  setBillStatus(
                    BILL_STATUS_TABS.find((tab) => tab === value) ?? ALL,
                  );
                  setBillPage(1);
                }}
              >
                <TabsList className="flex h-auto w-full justify-start gap-1.5 overflow-x-auto bg-transparent p-0 scrollbar-none">
                  {BILL_STATUS_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      className={`${TAB_TRIGGER_CLASS} px-3.5`}
                    >
                      {tab !== ALL && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${BILL_STATUS_CONFIG[tab].dot}`}
                        />
                      )}
                      {tab === ALL
                        ? t("tabAll")
                        : t(BILL_STATUS_CONFIG[tab].labelKey)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

            <div
              className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${
                view === "students"
                  ? "xl:grid-cols-[1fr_200px_220px_auto]"
                  : "xl:grid-cols-[1fr_180px_180px_200px_auto]"
              }`}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => updateSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("searchPlaceholder")}
                  className={`${fieldClass(false)} h-9 rounded-full pr-9 pl-9 text-sm`}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => updateSearch("")}
                    aria-label={t("clearSearch")}
                    className="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Select value={classId} onValueChange={updateClass}>
                <SelectTrigger
                  className={selectTrigger}
                  aria-label={t("filterClass")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-xl">
                  <SelectItem value={ALL} className="font-manrope text-sm">
                    {t("allClasses")}
                  </SelectItem>
                  {classes.map((cls) => (
                    <SelectItem
                      key={cls.id}
                      value={cls.id}
                      className="font-manrope text-sm"
                    >
                      {t("classLabel")} {cls.name}-{cls.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {view === "bills" && (
                <Select
                  value={billingPeriod}
                  onValueChange={(value: string) => {
                    setBillingPeriod(value);
                    setBillPage(1);
                  }}
                >
                  <SelectTrigger
                    className={selectTrigger}
                    aria-label={t("filterMonth")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72 rounded-xl">
                    <SelectItem value={ALL} className="font-manrope text-sm">
                      {t("allMonths")}
                    </SelectItem>
                    {monthOptions.map((month) => (
                      <SelectItem
                        key={month.value}
                        value={month.value}
                        className="font-manrope text-sm"
                      >
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {view === "students" ? (
                <Select
                  value={studentSort}
                  onValueChange={(value: string) => {
                    const next = STUDENT_SORTS.find(
                      (option) => option.value === value,
                    );
                    if (next) setStudentSort(next.value);
                  }}
                >
                  <SelectTrigger
                    className={selectTrigger}
                    aria-label={t("sortBy")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {STUDENT_SORTS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="font-manrope text-sm"
                      >
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={billSort}
                  onValueChange={(value: string) => {
                    const next = BILL_SORTS.find(
                      (option) => option.value === value,
                    );
                    if (next) setBillSort(next.value);
                  }}
                >
                  <SelectTrigger
                    className={selectTrigger}
                    aria-label={t("sortBy")}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {BILL_SORTS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="font-manrope text-sm"
                      >
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {hasFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetFilters}
                  className="h-9 gap-1.5 rounded-full px-3 font-manrope text-xs text-muted-foreground hover:bg-accent dark:hover:bg-accent"
                >
                  <X className="size-3.5" />
                  {t("resetFilters")}
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {isLoading ? (
            <FeeListSkeleton />
          ) : total === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
                {view === "students" ? (
                  <Users className="size-6 text-muted-foreground" />
                ) : (
                  <Wallet className="size-6 text-muted-foreground" />
                )}
              </span>
              <div>
                <p className="font-jakarta text-sm font-semibold text-foreground">
                  {hasFilters
                    ? t("emptyFilteredTitle")
                    : view === "students"
                      ? t("emptyStudentsTitle")
                      : t("emptyTitle")}
                </p>
                <p className="mt-1 font-manrope text-xs text-muted-foreground">
                  {hasFilters
                    ? t("emptyFilteredSub")
                    : view === "students"
                      ? t("emptyStudentsSub")
                      : t("emptySub")}
                </p>
              </div>
              {hasFilters && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  className={`h-8 px-4 text-xs ${OUTLINE_PILL_CLASS}`}
                >
                  {t("resetFilters")}
                </Button>
              )}
            </div>
          ) : (
            <div
              className={
                isFetching
                  ? "opacity-70 transition-opacity"
                  : "transition-opacity"
              }
            >
              {view === "students" ? (
                <FeeStudentsTable
                  rows={studentData?.data ?? []}
                  today={today}
                  onOpen={(row) =>
                    setPanel({ studentId: row.studentId, initialBillIds: [] })
                  }
                />
              ) : (
                <FeeBillsTable
                  bills={billData?.data ?? []}
                  today={today}
                  onOpen={(bill) =>
                    setPanel({
                      studentId: bill.student.id,
                      initialBillIds: [bill.id],
                    })
                  }
                />
              )}
            </div>
          )}

          {paging && paging.totalPages > 1 && (
            <>
              <Separator />
              <ApplicationsPagination
                page={paging.page}
                totalPages={paging.totalPages}
                total={paging.total}
                onChange={(next) => {
                  if (view === "students") setStudentPage(next);
                  else setBillPage(next);
                  scrollTop();
                }}
              />
            </>
          )}
        </Card>
      </motion.div>

      <FeeStudentPanel
        key={
          panel
            ? `${panel.studentId}-${panel.initialBillIds.join(",")}`
            : "panel-closed"
        }
        studentId={panel?.studentId ?? null}
        initialBillIds={panel?.initialBillIds ?? []}
        canWaive
        canReverse={isAdmin}
        onOpenChange={(open) => !open && setPanel(null)}
        onCollect={setCollectTarget}
        onWaive={setWaiveTarget}
        onReverse={setReverseTarget}
      />

      <CollectFeesDialog
        key={
          collectTarget
            ? `${collectTarget.studentId}-${collectTarget.bills.map((bill) => bill.id).join(",")}`
            : "collect-closed"
        }
        target={collectTarget}
        allowPartial={settings?.allowPartialPayments ?? true}
        onOpenChange={(open) => !open && setCollectTarget(null)}
      />

      <WaiveFeeDialog
        key={waiveTarget?.id ?? "waive-closed"}
        target={waiveTarget}
        onOpenChange={(open) => !open && setWaiveTarget(null)}
      />

      <ReverseReceiptDialog
        key={reverseTarget?.id ?? "reverse-closed"}
        target={reverseTarget}
        onOpenChange={(open) => !open && setReverseTarget(null)}
      />
    </div>
  );
};

export default FeeCollectionPage;
