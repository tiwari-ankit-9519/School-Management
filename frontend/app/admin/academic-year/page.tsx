"use client";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { CalendarRange, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CARD_CLASS, fadeUp } from "@/components/dashboard/DashboardWidgets";
import {
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
  TAB_TRIGGER_CLASS,
} from "@/components/forms/FormParts";
import {
  ApplicationsPagination,
  TableSkeleton,
} from "@/components/admissions/AdmissionsListParts";
import {
  CreateYearDialog,
  CurrentYearCard,
  OverviewCard,
  YearsTable,
  getPhase,
} from "@/components/academic-years/AcademicYearParts";
import { useGetAllAcademicYears } from "@/hooks/useAcademicYear";
import { useTranslations } from "@/hooks/useTranslations";

const PAGE_SIZE = 10;
const ALL_NAMES = "ALL";

const AcademicYearPage = () => {
  const t = useTranslations("academicYear");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [now] = useState(() => Date.now());

  const urlIsCurrent = searchParams.get("isCurrent");
  const urlName = searchParams.get("name") ?? undefined;
  const urlPage = Math.max(
    1,
    parseInt(searchParams.get("page") ?? "1", 10) || 1,
  );
  const isCurrent = urlIsCurrent === "true" ? true : undefined;

  const { data: allData, isLoading: isAllLoading } = useGetAllAcademicYears(
    undefined,
    undefined,
    1,
    100,
  );
  const { data, isLoading } = useGetAllAcademicYears(
    isCurrent,
    urlName,
    urlPage,
    PAGE_SIZE,
  );

  const allYears = useMemo(() => allData?.data ?? [], [allData]);
  const allNames = useMemo(
    () => Array.from(new Set(allYears.map((y) => y.name))),
    [allYears],
  );
  const currentYear = allYears.find((y) => y.isCurrent);
  const upcomingCount = allYears.filter(
    (y) => getPhase(y, now) === "upcoming",
  ).length;
  const completedCount = allYears.filter(
    (y) => getPhase(y, now) === "completed",
  ).length;
  const hasFilters = isCurrent !== undefined || !!urlName;

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined) params.delete(key);
      else params.set(key, value);
    });
    if (!("page" in updates)) params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const years = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

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
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className="h-11 gap-2 self-start rounded-full bg-linear-to-r from-indigo-600 to-indigo-800 px-5 font-manrope text-sm font-semibold text-white shadow-none hover:opacity-90 sm:self-auto"
        >
          <Plus className="size-4" />
          {t("newYearBtn")}
        </Button>
      </motion.header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CurrentYearCard
          year={currentYear}
          now={now}
          onCreate={() => setIsDialogOpen(true)}
          loading={isAllLoading}
        />
        <OverviewCard
          total={allData?.total ?? 0}
          upcoming={upcomingCount}
          completed={completedCount}
        />
      </div>

      <motion.div {...fadeUp(0.15)}>
        <Card className={CARD_CLASS}>
          <div className="flex flex-col gap-3 px-4 pt-4 pb-3 sm:px-5 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Tabs
                value={isCurrent ? "current" : "all"}
                onValueChange={(value: string) =>
                  updateParams({
                    isCurrent: value === "current" ? "true" : undefined,
                  })
                }
              >
                <TabsList className="h-auto gap-1.5 bg-transparent p-0">
                  <TabsTrigger value="all" className={TAB_TRIGGER_CLASS}>
                    {t("filterAll")}
                  </TabsTrigger>
                  <TabsTrigger value="current" className={TAB_TRIGGER_CLASS}>
                    {t("filterCurrent")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Select
                value={urlName ?? ALL_NAMES}
                onValueChange={(value: string) =>
                  updateParams({
                    name: value === ALL_NAMES ? undefined : value,
                  })
                }
                disabled={allNames.length === 0}
              >
                <SelectTrigger
                  aria-label={t("filterByName")}
                  className={`h-9 min-w-40 gap-2 text-xs data-[size=default]:h-9 ${OUTLINE_PILL_CLASS} ${
                    urlName
                      ? "border-indigo-500/40 text-indigo-700 dark:border-indigo-500/40 dark:text-indigo-300"
                      : ""
                  }`}
                >
                  <CalendarRange className="size-3.5" />
                  <SelectValue placeholder={t("filterByName")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem
                    value={ALL_NAMES}
                    className="font-manrope text-sm"
                  >
                    {t("filterAllNames")}
                  </SelectItem>
                  {allNames.map((name) => (
                    <SelectItem
                      key={name}
                      value={name}
                      className="font-manrope text-sm"
                    >
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push(pathname)}
                  className="h-9 gap-1 rounded-full px-3 font-manrope text-xs text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent"
                >
                  <X className="size-3.5" />
                  {t("clearFilters")}
                </Button>
              )}
            </div>
            {data && (
              <span className="shrink-0 font-manrope text-xs text-muted-foreground">
                {data.total} {t("total")}
              </span>
            )}
          </div>

          <Separator />

          {isLoading ? (
            <TableSkeleton />
          ) : years.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
                <CalendarRange className="size-6 text-muted-foreground" />
              </span>
              <div>
                <p className="font-jakarta text-sm font-semibold text-foreground">
                  {t("emptyTitle")}
                </p>
                <p className="mt-1 font-manrope text-xs text-muted-foreground">
                  {t("emptySubtitle")}
                </p>
              </div>
              {hasFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(pathname)}
                  className={`h-8 px-4 text-xs ${OUTLINE_PILL_CLASS}`}
                >
                  {t("clearFilters")}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => setIsDialogOpen(true)}
                  className={`h-9 gap-2 px-4 text-xs ${PRIMARY_PILL_CLASS}`}
                >
                  <Plus className="size-3.5" />
                  {t("newYearBtn")}
                </Button>
              )}
            </div>
          ) : (
            <YearsTable years={years} now={now} />
          )}

          {data && totalPages > 1 && (
            <>
              <Separator />
              <ApplicationsPagination
                page={data.page}
                totalPages={totalPages}
                total={data.total}
                onChange={(next) => updateParams({ page: String(next) })}
              />
            </>
          )}
        </Card>
      </motion.div>

      <CreateYearDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
};

export default AcademicYearPage;
