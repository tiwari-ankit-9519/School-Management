"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Clock,
  FileText,
  Percent,
  RefreshCw,
} from "lucide-react";
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
import {
  ApplicationsPagination,
  ApplicationsTable,
  EmptyState,
  STATUS_CONFIG,
  STATUS_FILTERS,
  StatFilterCard,
  StatusFilter,
  TableSkeleton,
} from "@/components/admissions/AdmissionsListParts";
import { useGetAllAdmissionApplications } from "@/hooks/useAdmission";
import { useGetDashboardSummary } from "@/hooks/useDashboard";
import { useTranslations } from "@/hooks/useTranslations";
import { AdmissionStatus } from "@/types";

const PAGE_SIZE = 10;

const AdmissionsListPage = () => {
  const t = useTranslations("admissionsList");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [now] = useState(() => Date.now());

  const { data, isLoading, isFetching, refetch } =
    useGetAllAdmissionApplications(page, PAGE_SIZE, status);
  const { data: summary, isLoading: isSummaryLoading } =
    useGetDashboardSummary();

  const counts = useMemo<Record<string, number>>(
    () => summary?.admissionApplications.byStatus ?? {},
    [summary],
  );
  const totalApplications = summary?.admissionApplications.total ?? 0;
  const pendingCount = counts[AdmissionStatus.PENDING] ?? 0;
  const approvedCount = counts[AdmissionStatus.APPROVED] ?? 0;
  const approvalRate =
    totalApplications > 0
      ? Math.round((approvedCount / totalApplications) * 100)
      : 0;

  const applications = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const selectStatus = (value: string) => {
    const next = STATUS_FILTERS.find((filter) => filter === value);
    if (!next) return;
    setStatus(next);
    setPage(1);
  };

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
          className="h-11 gap-2 self-start rounded-full border-border bg-card px-5 font-manrope text-sm font-medium text-foreground shadow-none hover:bg-accent sm:self-auto"
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
          icon={<FileText className="size-4" />}
          tone="indigo"
          active={status === "ALL"}
          onSelect={() => selectStatus("ALL")}
          loading={isSummaryLoading}
          delay={0.05}
        />
        <StatFilterCard
          label={t("kpiPending")}
          value={pendingCount.toLocaleString("en-IN")}
          footnote={t("kpiPendingNote")}
          icon={<Clock className="size-4" />}
          tone="amber"
          active={status === AdmissionStatus.PENDING}
          onSelect={() => selectStatus(AdmissionStatus.PENDING)}
          loading={isSummaryLoading}
          delay={0.1}
        />
        <StatFilterCard
          label={t("kpiApproved")}
          value={approvedCount.toLocaleString("en-IN")}
          footnote={t("kpiApprovedNote")}
          icon={<CheckCircle2 className="size-4" />}
          tone="emerald"
          active={status === AdmissionStatus.APPROVED}
          onSelect={() => selectStatus(AdmissionStatus.APPROVED)}
          loading={isSummaryLoading}
          delay={0.15}
        />
        <StatFilterCard
          label={t("kpiConversion")}
          value={`${approvalRate}%`}
          footnote={t("kpiConversionNote")}
          icon={<Percent className="size-4" />}
          tone="violet"
          loading={isSummaryLoading}
          delay={0.2}
        />
      </div>

      <motion.div {...fadeUp(0.25)}>
        <Card className={CARD_CLASS}>
          <div className="flex flex-col gap-3 px-4 pt-4 pb-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
            <Tabs
              value={status}
              onValueChange={(value: string) => selectStatus(value)}
            >
              <TabsList className="flex h-auto w-full justify-start gap-1.5 overflow-x-auto bg-transparent p-0 scrollbar-none">
                {STATUS_FILTERS.map((filter) => (
                  <TabsTrigger
                    key={filter}
                    value={filter}
                    className="group h-9 flex-none gap-1.5 rounded-full border-0 bg-muted px-3.5 font-manrope text-xs font-medium text-foreground/70 shadow-none hover:bg-accent hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none"
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
            {data && (
              <span className="shrink-0 font-manrope text-xs text-muted-foreground">
                {data.total.toLocaleString("en-IN")} {t("results")}
              </span>
            )}
          </div>

          <Separator />

          {isLoading ? (
            <TableSkeleton />
          ) : applications.length === 0 ? (
            <EmptyState
              onClear={status !== "ALL" ? () => selectStatus("ALL") : undefined}
            />
          ) : (
            <ApplicationsTable applications={applications} now={now} />
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

export default AdmissionsListPage;
