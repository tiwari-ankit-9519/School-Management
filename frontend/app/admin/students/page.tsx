"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  GraduationCap,
  LayoutGrid,
  List,
  RefreshCw,
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
  STATUS_CONFIG,
  STATUS_FILTERS,
  StatusFilter,
  StudentFilterChips,
  StudentFilters,
  StudentFiltersPopover,
  StudentsGrid,
  StudentsSkeleton,
  StudentsTable,
  countActiveFilters,
} from "@/components/students/StudentsListParts";
import { useGetAllStudents } from "@/hooks/useStudent";
import { useGetAllClasses } from "@/hooks/useClass";
import { useGetAllAcademicYears } from "@/hooks/useAcademicYear";
import { useGetDashboardSummary } from "@/hooks/useDashboard";
import { useTranslations } from "@/hooks/useTranslations";
import { EnrollmentStatus } from "@/types";

const PAGE_SIZE = 12;

const AllStudentsPage = () => {
  const t = useTranslations("studentsList");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [filters, setFilters] = useState<StudentFilters>({});
  const [view, setView] = useState<"table" | "grid">("table");
  const [now] = useState(() => Date.now());

  const queryFilters = useMemo(
    () => ({ ...filters, status: status === "ALL" ? undefined : status }),
    [filters, status],
  );

  const { data, isLoading, isFetching, refetch } = useGetAllStudents(
    queryFilters,
    page,
    PAGE_SIZE,
  );
  const { data: summary, isLoading: isSummaryLoading } =
    useGetDashboardSummary();
  const { data: yearsData } = useGetAllAcademicYears(
    undefined,
    undefined,
    1,
    100,
  );

  const years = yearsData?.data ?? [];
  const currentYearId = years.find((y) => y.isCurrent)?.id ?? "";
  const chipYearId = filters.academicYearId ?? currentYearId;
  const { data: chipClassesData } = useGetAllClasses(
    { academicYearId: chipYearId },
    1,
    100,
  );

  const counts: Record<string, number> = summary?.students.byStatus ?? {};
  const totalStudents = summary?.students.total ?? 0;
  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const activeFilterCount =
    countActiveFilters(filters) + (status !== "ALL" ? 1 : 0);

  const yearName = years.find((y) => y.id === filters.academicYearId)?.name;
  const chipClass = chipClassesData?.data.find((c) => c.id === filters.classId);
  const className = chipClass
    ? `${chipClass.name}-${chipClass.section}`
    : undefined;

  const selectStatus = (value: string) => {
    const next = STATUS_FILTERS.find((s) => s === value);
    if (!next) return;
    setStatus(next);
    setPage(1);
  };

  const applyFilters = (next: StudentFilters) => {
    setFilters(next);
    setPage(1);
  };

  const clearAll = () => {
    setFilters({});
    setStatus("ALL");
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
                {totalStudents.toLocaleString("en-IN")} {t("total")}
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
          value={totalStudents.toLocaleString("en-IN")}
          footnote={t("kpiTotalNote")}
          icon={<GraduationCap className="size-4" />}
          tone="indigo"
          active={status === "ALL"}
          onSelect={() => selectStatus("ALL")}
          loading={isSummaryLoading}
          delay={0.05}
        />
        <StatFilterCard
          label={t("kpiActive")}
          value={(counts[EnrollmentStatus.ACTIVE] ?? 0).toLocaleString("en-IN")}
          footnote={t("kpiActiveNote")}
          icon={<CheckCircle2 className="size-4" />}
          tone="emerald"
          active={status === EnrollmentStatus.ACTIVE}
          onSelect={() => selectStatus(EnrollmentStatus.ACTIVE)}
          loading={isSummaryLoading}
          delay={0.1}
        />
        <StatFilterCard
          label={t("kpiGraduated")}
          value={(counts[EnrollmentStatus.GRADUATED] ?? 0).toLocaleString(
            "en-IN",
          )}
          footnote={t("kpiGraduatedNote")}
          icon={<Award className="size-4" />}
          tone="violet"
          active={status === EnrollmentStatus.GRADUATED}
          onSelect={() => selectStatus(EnrollmentStatus.GRADUATED)}
          loading={isSummaryLoading}
          delay={0.15}
        />
        <StatFilterCard
          label={t("kpiAttention")}
          value={(counts[EnrollmentStatus.SUSPENDED] ?? 0).toLocaleString(
            "en-IN",
          )}
          footnote={t("kpiAttentionNote")}
          icon={<AlertTriangle className="size-4" />}
          tone="amber"
          active={status === EnrollmentStatus.SUSPENDED}
          onSelect={() => selectStatus(EnrollmentStatus.SUSPENDED)}
          loading={isSummaryLoading}
          delay={0.2}
        />
      </div>

      <motion.div {...fadeUp(0.25)}>
        <Card className={CARD_CLASS}>
          <div className="space-y-3 px-4 pt-4 pb-3 sm:px-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <Tabs
                value={status}
                onValueChange={(value: string) => selectStatus(value)}
                className="min-w-0"
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
                      {filter === "ALL"
                        ? t("filterAll")
                        : t(STATUS_CONFIG[filter].labelKey)}
                      {!isSummaryLoading && (
                        <span className="rounded-full bg-background px-1.5 py-px text-[10px] text-muted-foreground group-data-[state=active]:bg-primary-foreground/15 group-data-[state=active]:text-primary-foreground/80">
                          {filter === "ALL"
                            ? totalStudents
                            : (counts[filter] ?? 0)}
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="flex shrink-0 items-center gap-2">
                <span className="mr-1 hidden font-manrope text-xs text-muted-foreground sm:inline">
                  {data?.total ?? 0} {t("results")}
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
                <StudentFiltersPopover
                  applied={filters}
                  years={years}
                  defaultYearId={currentYearId}
                  onApply={applyFilters}
                  onClear={() => applyFilters({})}
                />
              </div>
            </div>
            <StudentFilterChips
              filters={filters}
              yearName={yearName}
              className={className}
              onRemove={(key) =>
                applyFilters(
                  key === "academicYearId"
                    ? {
                        ...filters,
                        academicYearId: undefined,
                        classId: undefined,
                      }
                    : { ...filters, [key]: undefined },
                )
              }
            />
          </div>

          <Separator />

          {isLoading ? (
            <StudentsSkeleton view={view} />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
                <Users className="size-6 text-muted-foreground" />
              </span>
              <div>
                <p className="font-jakarta text-sm font-semibold text-foreground">
                  {t("emptyTitle")}
                </p>
                <p className="mt-1 font-manrope text-xs text-muted-foreground">
                  {activeFilterCount > 0
                    ? t("emptyFiltered")
                    : t("emptySubtitle")}
                </p>
              </div>
              {activeFilterCount > 0 && (
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
            <StudentsGrid items={items} now={now} />
          ) : (
            <StudentsTable items={items} now={now} />
          )}

          {data && totalPages > 1 && (
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

export default AllStudentsPage;
