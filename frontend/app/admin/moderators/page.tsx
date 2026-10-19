"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Building2,
  CalendarOff,
  CheckCircle2,
  LayoutGrid,
  List,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CARD_CLASS,
  TONE_CLASSES,
  fadeUp,
} from "@/components/dashboard/DashboardWidgets";
import {
  OUTLINE_PILL_CLASS,
  TAB_TRIGGER_CLASS,
} from "@/components/forms/FormParts";
import {
  ApplicationsPagination,
  StatFilterCard,
} from "@/components/admissions/AdmissionsListParts";
import {
  AdminFilterChips,
  AdminFilters,
  AdminFiltersPopover,
  AdminsGrid,
  AdminsSkeleton,
  AdminsTable,
  NO_DEPARTMENT,
  countActiveFilters,
  departmentKey,
  matchesAdminFilters,
  toTitleCase,
} from "@/components/admins/AdminsListParts";
import { useGetAllAdmins } from "@/hooks/useModerator";
import { useGetDashboardSummary } from "@/hooks/useDashboard";
import { useTranslations } from "@/hooks/useTranslations";

const PAGE_SIZE = 12;

const AdminsListPage = () => {
  const t = useTranslations("adminsList");
  const [page, setPage] = useState(1);
  const [department, setDepartment] = useState("ALL");
  const [filters, setFilters] = useState<AdminFilters>({});
  const [view, setView] = useState<"table" | "grid">("table");
  const [now] = useState(() => Date.now());

  const {
    data: allData,
    isLoading: isAllLoading,
    isFetching,
    refetch,
  } = useGetAllAdmins(1, 100, "ALL");
  const { data, isLoading } = useGetAllAdmins(page, PAGE_SIZE, "ALL");
  const { data: summary, isLoading: isSummaryLoading } =
    useGetDashboardSummary();

  const allAdmins = useMemo(() => allData?.data ?? [], [allData]);

  const departments = useMemo(() => {
    const map = new Map<string, { label: string; count: number }>();
    allAdmins.forEach((admin) => {
      const key = departmentKey(admin.department);
      const existing = map.get(key);
      map.set(key, {
        label:
          key === NO_DEPARTMENT
            ? t("noDepartment")
            : toTitleCase(admin.department ?? ""),
        count: (existing?.count ?? 0) + 1,
      });
    });
    return Array.from(map.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) =>
        a.key === NO_DEPARTMENT
          ? 1
          : b.key === NO_DEPARTMENT
            ? -1
            : b.count - a.count,
      );
  }, [allAdmins, t]);

  const isClientFiltering =
    countActiveFilters(filters) > 0 || department !== "ALL";
  const filteredAdmins = useMemo(
    () =>
      allAdmins.filter((admin) =>
        matchesAdminFilters(admin, filters, department),
      ),
    [allAdmins, filters, department],
  );
  const admins = isClientFiltering ? filteredAdmins : (data?.data ?? []);
  const showLoading = isClientFiltering ? isAllLoading : isLoading;
  const totalAdmins = summary?.admins.total ?? allData?.total ?? 0;
  const counts: Record<string, number> = summary?.admins.byStatus ?? {};
  const totalPages = data?.totalPages ?? 1;

  const selectDepartment = (value: string) => {
    setDepartment(value);
    setPage(1);
  };

  const clearAll = () => {
    setFilters({});
    setDepartment("ALL");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <motion.header
        {...fadeUp(0)}
        className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-jakarta text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("pageTitle")}
            </h1>
            {!isSummaryLoading && (
              <Badge
                variant="outline"
                className={`rounded-full font-manrope text-[11px] font-medium ${TONE_CLASSES.indigo}`}
              >
                {totalAdmins} {t("total")}
              </Badge>
            )}
          </div>
          <p className="mt-1.5 font-manrope text-sm text-muted-foreground">
            {t("pageSubtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-11 gap-2 rounded-full border-border bg-card px-5 font-manrope text-sm font-medium text-foreground shadow-none hover:bg-accent dark:border-border dark:bg-card dark:hover:bg-accent"
          >
            <RefreshCw
              className={`size-4 ${isFetching ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""}`}
            />
            {t("refresh")}
          </Button>
          <Button
            asChild
            className="h-11 gap-2 rounded-full bg-linear-to-r from-indigo-600 to-indigo-800 px-5 font-manrope text-sm font-semibold text-white shadow-none hover:opacity-90"
          >
            <Link href="/admin/moderators/create">
              <Plus className="size-4" />
              <span className="hidden sm:inline">{t("createModerator")}</span>
              <span className="sm:hidden">{t("createModeratorShort")}</span>
            </Link>
          </Button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatFilterCard
          highlighted
          label={t("kpiTotal")}
          value={String(totalAdmins)}
          footnote={t("kpiTotalNote")}
          icon={<ShieldCheck className="size-4" />}
          tone="indigo"
          active={department === "ALL"}
          onSelect={() => selectDepartment("ALL")}
          loading={isSummaryLoading && isAllLoading}
          delay={0.05}
        />
        <StatFilterCard
          label={t("kpiActive")}
          value={String(counts.ACTIVE ?? 0)}
          footnote={t("kpiActiveNote")}
          icon={<CheckCircle2 className="size-4" />}
          tone="emerald"
          loading={isSummaryLoading}
          delay={0.1}
        />
        <StatFilterCard
          label={t("kpiOnLeave")}
          value={String(counts.ON_LEAVE ?? 0)}
          footnote={t("kpiOnLeaveNote")}
          icon={<CalendarOff className="size-4" />}
          tone="violet"
          loading={isSummaryLoading}
          delay={0.15}
        />
        <StatFilterCard
          label={t("kpiDepartments")}
          value={String(
            departments.filter((d) => d.key !== NO_DEPARTMENT).length,
          )}
          footnote={t("kpiDepartmentsNote")}
          icon={<Building2 className="size-4" />}
          tone="amber"
          loading={isAllLoading}
          delay={0.2}
        />
      </div>

      <motion.div {...fadeUp(0.25)}>
        <Card className={CARD_CLASS}>
          <div className="space-y-3 px-4 pt-4 pb-3 sm:px-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <Tabs
                value={department}
                onValueChange={(value: string) => selectDepartment(value)}
                className="min-w-0"
              >
                <TabsList className="flex h-auto w-full justify-start gap-1.5 overflow-x-auto bg-transparent p-0 scrollbar-none">
                  <TabsTrigger
                    value="ALL"
                    className={`group ${TAB_TRIGGER_CLASS} px-3.5`}
                  >
                    {t("allDepartments")}
                    <span className="rounded-full bg-background px-1.5 py-px text-[10px] text-muted-foreground group-data-[state=active]:bg-primary-foreground/15 group-data-[state=active]:text-primary-foreground/80">
                      {allAdmins.length}
                    </span>
                  </TabsTrigger>
                  {departments.map((dept) => (
                    <TabsTrigger
                      key={dept.key}
                      value={dept.key}
                      className={`group ${TAB_TRIGGER_CLASS} px-3.5`}
                    >
                      <Building2 className="size-3" />
                      {dept.label}
                      <span className="rounded-full bg-background px-1.5 py-px text-[10px] text-muted-foreground group-data-[state=active]:bg-primary-foreground/15 group-data-[state=active]:text-primary-foreground/80">
                        {dept.count}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="flex shrink-0 items-center gap-2">
                <span className="mr-1 hidden font-manrope text-xs text-muted-foreground sm:inline">
                  {isClientFiltering
                    ? filteredAdmins.length
                    : (data?.total ?? 0)}{" "}
                  {t("results")}
                </span>
                <ToggleGroup
                  type="single"
                  value={view}
                  onValueChange={(value: string) => {
                    if (value === "table" || value === "grid") setView(value);
                  }}
                  className="hidden gap-0.5 rounded-full border border-border bg-muted p-0.5 md:flex"
                >
                  <ToggleGroupItem
                    value="table"
                    aria-label={t("viewTable")}
                    className="h-8 w-8 rounded-full! p-0 text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                  >
                    <List className="size-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="grid"
                    aria-label={t("viewGrid")}
                    className="h-8 w-8 rounded-full! p-0 text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                  >
                    <LayoutGrid className="size-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
                <AdminFiltersPopover
                  applied={filters}
                  onApply={(next) => {
                    setFilters(next);
                    setPage(1);
                  }}
                  onClear={() => setFilters({})}
                />
              </div>
            </div>
            <AdminFilterChips
              filters={filters}
              onRemove={(key) => setFilters({ ...filters, [key]: undefined })}
            />
          </div>

          <Separator />

          {showLoading ? (
            <AdminsSkeleton view={view} />
          ) : admins.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
                <Users className="size-6 text-muted-foreground" />
              </span>
              <div>
                <p className="font-jakarta text-sm font-semibold text-foreground">
                  {t("emptyTitle")}
                </p>
                <p className="mt-1 font-manrope text-xs text-muted-foreground">
                  {isClientFiltering ? t("emptyFiltered") : t("emptySubtitle")}
                </p>
              </div>
              {isClientFiltering && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearAll}
                  className={`h-8 px-4 text-xs ${OUTLINE_PILL_CLASS}`}
                >
                  {t("clearFilters")}
                </Button>
              )}
            </div>
          ) : view === "grid" ? (
            <AdminsGrid admins={admins} now={now} />
          ) : (
            <AdminsTable admins={admins} now={now} />
          )}

          {!isClientFiltering && data && totalPages > 1 && (
            <>
              <Separator />
              <ApplicationsPagination
                page={data.page}
                totalPages={totalPages}
                total={data.total}
                onChange={(next) => {
                  setPage(next);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminsListPage;
