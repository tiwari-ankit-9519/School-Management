"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Clock, RefreshCw, Star, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CARD_CLASS,
  TONE_CLASSES,
  fadeUp,
} from "@/components/dashboard/DashboardWidgets";
import { TAB_TRIGGER_CLASS } from "@/components/forms/FormParts";
import {
  ApplicationsPagination,
  StatFilterCard,
  TableSkeleton,
} from "@/components/admissions/AdmissionsListParts";
import {
  ActiveFilterChips,
  FiltersPopover,
  STATUS_CONFIG,
  STATUS_FILTERS,
  StatusFilter,
  TeacherApplicationsTable,
  TeacherEmptyState,
  TeacherFilters,
  countActiveFilters,
  matchesFilters,
} from "@/components/teacher-applications/TeacherApplicationsParts";
import { useGetAllTeacherApplications } from "@/hooks/useTeacher";
import { useGetDashboardSummary } from "@/hooks/useDashboard";
import { useTranslations } from "@/hooks/useTranslations";
import { ApplicationStatus } from "@/types";

const PAGE_SIZE = 10;

const TeacherApplicationsPage = () => {
  const t = useTranslations("teacherApplications");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<TeacherFilters>({});
  const [now] = useState(() => Date.now());

  const { data, isLoading, isFetching, refetch } = useGetAllTeacherApplications(
    page,
    PAGE_SIZE,
    status,
  );
  const { data: summary, isLoading: isSummaryLoading } =
    useGetDashboardSummary();

  const counts = useMemo<Record<string, number>>(
    () => summary?.teacherApplications.byStatus ?? {},
    [summary],
  );
  const totalApplications = summary?.teacherApplications.total ?? 0;

  const applications = useMemo(
    () => (data?.data ?? []).filter((app) => matchesFilters(app, filters)),
    [data, filters],
  );
  const activeFilterCount = countActiveFilters(filters);
  const totalPages = data?.totalPages ?? 1;

  const selectStatus = (value: string) => {
    const next = STATUS_FILTERS.find((filter) => filter === value);
    if (!next) return;
    setStatus(next);
    setPage(1);
  };

  const removeFilter = (key: keyof TeacherFilters) =>
    setFilters((prev) => ({ ...prev, [key]: undefined }));

  const filterLabel = (value: StatusFilter) =>
    value === "ALL" ? t("filterAll") : t(STATUS_CONFIG[value].labelKey);

  const filterCount = (value: StatusFilter) =>
    value === "ALL" ? totalApplications : (counts[value] ?? 0);

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
                {totalApplications.toLocaleString("en-IN")} {t("total")}
              </Badge>
            )}
          </div>
          <p className="mt-1.5 font-manrope text-sm text-muted-foreground">
            {t("pageSubtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-11 gap-2 self-start rounded-full border-border bg-card px-5 font-manrope text-sm font-medium text-foreground shadow-none hover:bg-accent sm:self-auto dark:border-border dark:bg-card dark:hover:bg-accent"
        >
          <RefreshCw
            className={`size-4 ${isFetching ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""}`}
          />
          {t("refresh")}
        </Button>
      </motion.header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatFilterCard
          highlighted
          label={t("kpiTotal")}
          value={totalApplications.toLocaleString("en-IN")}
          footnote={t("kpiTotalNote")}
          icon={<Users className="size-4" />}
          tone="indigo"
          active={status === "ALL"}
          onSelect={() => selectStatus("ALL")}
          loading={isSummaryLoading}
          delay={0.05}
        />
        <StatFilterCard
          label={t("kpiPending")}
          value={(counts[ApplicationStatus.PENDING] ?? 0).toLocaleString(
            "en-IN",
          )}
          footnote={t("kpiPendingNote")}
          icon={<Clock className="size-4" />}
          tone="amber"
          active={status === ApplicationStatus.PENDING}
          onSelect={() => selectStatus(ApplicationStatus.PENDING)}
          loading={isSummaryLoading}
          delay={0.1}
        />
        <StatFilterCard
          label={t("kpiShortlisted")}
          value={(counts[ApplicationStatus.SHORTLISTED] ?? 0).toLocaleString(
            "en-IN",
          )}
          footnote={t("kpiShortlistedNote")}
          icon={<Star className="size-4" />}
          tone="indigo"
          active={status === ApplicationStatus.SHORTLISTED}
          onSelect={() => selectStatus(ApplicationStatus.SHORTLISTED)}
          loading={isSummaryLoading}
          delay={0.15}
        />
        <StatFilterCard
          label={t("kpiSelected")}
          value={(counts[ApplicationStatus.SELECTED] ?? 0).toLocaleString(
            "en-IN",
          )}
          footnote={t("kpiSelectedNote")}
          icon={<CheckCircle2 className="size-4" />}
          tone="emerald"
          active={status === ApplicationStatus.SELECTED}
          onSelect={() => selectStatus(ApplicationStatus.SELECTED)}
          loading={isSummaryLoading}
          delay={0.2}
        />
      </div>

      <motion.div {...fadeUp(0.25)}>
        <Card className={CARD_CLASS}>
          <div className="space-y-3 px-4 pt-4 pb-3 sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Tabs
                value={status}
                onValueChange={(value: string) => selectStatus(value)}
              >
                <TabsList className="flex h-auto w-full justify-start gap-1.5 overflow-x-auto bg-transparent p-0 scrollbar-none">
                  {STATUS_FILTERS.map((filter) => (
                    <TabsTrigger
                      key={filter}
                      value={filter}
                      className={`group ${TAB_TRIGGER_CLASS} px-3.5`}
                    >
                      {filter !== "ALL" && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[filter].dot}`}
                        />
                      )}
                      {filterLabel(filter)}
                      {!isSummaryLoading && (
                        <span className="rounded-full bg-background px-1.5 py-px text-[10px] text-muted-foreground group-data-[state=active]:bg-primary-foreground/15 group-data-[state=active]:text-primary-foreground/80">
                          {filterCount(filter)}
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="flex shrink-0 items-center gap-3">
                {data && (
                  <span className="font-manrope text-xs text-muted-foreground">
                    {applications.length} {t("results")}
                  </span>
                )}
                <FiltersPopover
                  applied={filters}
                  onApply={setFilters}
                  onClear={() => setFilters({})}
                />
              </div>
            </div>
            <ActiveFilterChips filters={filters} onRemove={removeFilter} />
            {activeFilterCount > 0 && (
              <p className="font-manrope text-[11px] text-muted-foreground">
                {t("filterPageHint")}
              </p>
            )}
          </div>

          <Separator />

          {isLoading ? (
            <TableSkeleton />
          ) : applications.length === 0 ? (
            <TeacherEmptyState
              onClear={
                activeFilterCount > 0
                  ? () => setFilters({})
                  : status !== "ALL"
                    ? () => selectStatus("ALL")
                    : undefined
              }
            />
          ) : (
            <TeacherApplicationsTable applications={applications} now={now} />
          )}

          {data && totalPages > 1 && (
            <>
              <Separator />
              <ApplicationsPagination
                page={data.page}
                totalPages={totalPages}
                total={data.total}
                onChange={setPage}
              />
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default TeacherApplicationsPage;
