"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Plus,
  UserCheck,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  PRIMARY_PILL_CLASS,
} from "@/components/forms/FormParts";
import {
  ApplicationsPagination,
  StatFilterCard,
} from "@/components/admissions/AdmissionsListParts";
import {
  ClassCard,
  ClassFilterChips,
  ClassFilters,
  ClassFiltersPopover,
  ClassesGridSkeleton,
  CreateClassDialog,
  countActiveFilters,
} from "@/components/classes/ClassesParts";
import { useGetAllClasses } from "@/hooks/useClass";
import { useGetAllAcademicYears } from "@/hooks/useAcademicYear";
import { useTranslations } from "@/hooks/useTranslations";

const PAGE_SIZE = 9;
type TeacherView = "ALL" | "ASSIGNED" | "UNASSIGNED";

const ClassesPage = () => {
  const t = useTranslations("classes");
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ClassFilters>({});
  const [teacherView, setTeacherView] = useState<TeacherView>("ALL");
  const [page, setPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: yearsData, isLoading: isYearsLoading } =
    useGetAllAcademicYears();
  const years = yearsData?.data ?? [];
  const currentYear = years.find((y) => y.isCurrent);
  const activeYearId = selectedYearId ?? currentYear?.id ?? years[0]?.id ?? "";
  const activeYear = years.find((y) => y.id === activeYearId);

  const { data: allData, isLoading: isAllLoading } = useGetAllClasses(
    { academicYearId: activeYearId },
    1,
    100,
  );
  const { data, isLoading } = useGetAllClasses(
    { academicYearId: activeYearId, ...filters },
    page,
    PAGE_SIZE,
  );

  const allClasses = useMemo(() => allData?.data ?? [], [allData]);
  const assignedCount = allClasses.filter(
    (c) => (c.classTeachers?.length ?? 0) > 0,
  ).length;
  const unassignedCount = allClasses.length - assignedCount;
  const totalSeats = allClasses.reduce((sum, c) => sum + (c.capacity ?? 0), 0);

  const pageClasses = useMemo(() => {
    const list = data?.data ?? [];
    if (teacherView === "ASSIGNED")
      return list.filter((c) => (c.classTeachers?.length ?? 0) > 0);
    if (teacherView === "UNASSIGNED")
      return list.filter((c) => (c.classTeachers?.length ?? 0) === 0);
    return list;
  }, [data, teacherView]);

  const activeFilterCount =
    countActiveFilters(filters) + (teacherView !== "ALL" ? 1 : 0);
  const totalPages = data?.totalPages ?? 1;

  const applyFilters = (next: ClassFilters) => {
    setFilters(next);
    setPage(1);
  };

  const clearAll = () => {
    setFilters({});
    setTeacherView("ALL");
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
            {activeYear && (
              <Badge
                variant="outline"
                className={`rounded-full font-manrope text-[11px] font-medium ${TONE_CLASSES.indigo}`}
              >
                {activeYear.name}
              </Badge>
            )}
          </div>
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
          <span className="hidden sm:inline">{t("newClassBtn")}</span>
          <span className="sm:hidden">{t("newClassBtnShort")}</span>
        </Button>
      </motion.header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatFilterCard
          highlighted
          label={t("kpiClasses")}
          value={String(allData?.total ?? 0)}
          footnote={
            activeYear
              ? `${t("kpiClassesNote")} ${activeYear.name}`
              : t("kpiClassesNote")
          }
          icon={<BookOpen className="size-4" />}
          tone="indigo"
          active={teacherView === "ALL"}
          onSelect={() => setTeacherView("ALL")}
          loading={isAllLoading}
          delay={0.05}
        />
        <StatFilterCard
          label={t("kpiSeats")}
          value={totalSeats.toLocaleString("en-IN")}
          footnote={t("kpiSeatsNote")}
          icon={<Users className="size-4" />}
          tone="violet"
          loading={isAllLoading}
          delay={0.1}
        />
        <StatFilterCard
          label={t("kpiAssigned")}
          value={String(assignedCount)}
          footnote={t("kpiAssignedNote")}
          icon={<UserCheck className="size-4" />}
          tone="emerald"
          active={teacherView === "ASSIGNED"}
          onSelect={() => setTeacherView("ASSIGNED")}
          loading={isAllLoading}
          delay={0.15}
        />
        <StatFilterCard
          label={t("kpiUnassigned")}
          value={String(unassignedCount)}
          footnote={t("kpiUnassignedNote")}
          icon={<AlertTriangle className="size-4" />}
          tone="amber"
          active={teacherView === "UNASSIGNED"}
          onSelect={() => setTeacherView("UNASSIGNED")}
          loading={isAllLoading}
          delay={0.2}
        />
      </div>

      <motion.div {...fadeUp(0.25)}>
        <Card className={CARD_CLASS}>
          <div className="space-y-3 px-4 pt-4 pb-3 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Select
                value={activeYearId}
                onValueChange={(value: string) => {
                  setSelectedYearId(value);
                  setPage(1);
                }}
                disabled={isYearsLoading || years.length === 0}
              >
                <SelectTrigger
                  aria-label={t("selectYear")}
                  className={`h-9 min-w-44 gap-2 text-xs data-[size=default]:h-9 ${OUTLINE_PILL_CLASS}`}
                >
                  <GraduationCap className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                  <SelectValue placeholder={t("selectYear")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {years.map((year) => (
                    <SelectItem
                      key={year.id}
                      value={year.id}
                      className="font-manrope text-sm"
                    >
                      <span className="flex items-center gap-2">
                        {year.name}
                        {year.isCurrent && (
                          <Badge
                            variant="outline"
                            className={`rounded-full px-1.5 py-0 font-manrope text-[10px] ${TONE_CLASSES.emerald}`}
                          >
                            {t("current")}
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-3">
                <span className="font-manrope text-xs text-muted-foreground">
                  {data?.total ?? 0} {t("results")}
                </span>
                <ClassFiltersPopover
                  applied={filters}
                  onApply={applyFilters}
                  onClear={() => applyFilters({})}
                />
              </div>
            </div>
            <ClassFilterChips
              filters={filters}
              onRemove={(key) => applyFilters({ ...filters, [key]: undefined })}
            />
          </div>

          <Separator />

          {!activeYearId && !isYearsLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
                <GraduationCap className="size-6 text-muted-foreground" />
              </span>
              <div>
                <p className="font-jakarta text-sm font-semibold text-foreground">
                  {t("noYearTitle")}
                </p>
                <p className="mt-1 font-manrope text-xs text-muted-foreground">
                  {t("noYearSubtitle")}
                </p>
              </div>
            </div>
          ) : isLoading || isYearsLoading ? (
            <ClassesGridSkeleton />
          ) : pageClasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
                <BookOpen className="size-6 text-muted-foreground" />
              </span>
              <div>
                <p className="font-jakarta text-sm font-semibold text-foreground">
                  {activeFilterCount > 0
                    ? t("noMatchesTitle")
                    : t("emptyTitle")}
                </p>
                <p className="mt-1 font-manrope text-xs text-muted-foreground">
                  {activeFilterCount > 0
                    ? t("noMatchesSub")
                    : t("emptySubtitle")}
                </p>
              </div>
              {activeFilterCount > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearAll}
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
                  {t("newClassBtn")}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {pageClasses.map((cls, i) => (
                <ClassCard
                  key={cls.id}
                  cls={cls}
                  delay={Math.min(i * 0.03, 0.3)}
                />
              ))}
            </div>
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

      <CreateClassDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        yearName={currentYear?.name ?? ""}
      />
    </div>
  );
};

export default ClassesPage;
