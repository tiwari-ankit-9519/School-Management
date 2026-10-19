"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  BookOpen,
  CheckCircle2,
  FlaskConical,
  Layers,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CARD_CLASS, fadeUp } from "@/components/dashboard/DashboardWidgets";
import {
  OUTLINE_PILL_CLASS,
  PRIMARY_PILL_CLASS,
  TAB_TRIGGER_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import {
  ApplicationsPagination,
  StatFilterCard,
} from "@/components/admissions/AdmissionsListParts";
import {
  CreateSubjectDialog,
  SubjectCard,
  SubjectsGridSkeleton,
} from "@/components/subjects/SubjectsParts";
import { useGetAllSubjects } from "@/hooks/useSubject";
import { useTranslations } from "@/hooks/useTranslations";

const PAGE_SIZE = 9;
const TYPE_TABS = ["ALL", "CORE", "ELECTIVE"] as const;
type TypeTab = (typeof TYPE_TABS)[number];

const TAB_LABEL_KEYS = {
  ALL: "tabAll",
  CORE: "tabCore",
  ELECTIVE: "tabElective",
} as const;

const SubjectsPage = () => {
  const t = useTranslations("subjects");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [typeTab, setTypeTab] = useState<TypeTab>("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data: allData, isLoading: isAllLoading } = useGetAllSubjects(1, 100);
  const { data, isLoading } = useGetAllSubjects(page, PAGE_SIZE);

  const allSubjects = useMemo(() => allData?.data ?? [], [allData]);
  const trimmedQuery = query.trim().toLowerCase();
  const isFiltering = trimmedQuery.length > 0 || typeTab !== "ALL";

  const filteredSubjects = useMemo(
    () =>
      allSubjects.filter((subject) => {
        const matchesType =
          typeTab === "ALL" ||
          (typeTab === "ELECTIVE" ? subject.isElective : !subject.isElective);
        const matchesQuery =
          !trimmedQuery ||
          subject.name.toLowerCase().includes(trimmedQuery) ||
          subject.code.toLowerCase().includes(trimmedQuery);
        return matchesType && matchesQuery;
      }),
    [allSubjects, typeTab, trimmedQuery],
  );

  const subjects = isFiltering ? filteredSubjects : (data?.data ?? []);
  const showLoading = isFiltering ? isAllLoading : isLoading;
  const totalCount = allData?.total ?? 0;
  const coreCount = allSubjects.filter((s) => !s.isElective).length;
  const electiveCount = allSubjects.filter((s) => s.isElective).length;
  const activeCount = allSubjects.filter((s) => s.isActive).length;
  const totalPages = data?.totalPages ?? 1;

  const selectTab = (value: string) => {
    const next = TYPE_TABS.find((tab) => tab === value);
    if (!next) return;
    setTypeTab(next);
    setPage(1);
  };

  const resetFilters = () => {
    setQuery("");
    setTypeTab("ALL");
    setPage(1);
  };

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
          <span className="hidden sm:inline">{t("newSubjectBtn")}</span>
          <span className="sm:hidden">{t("newSubjectBtnShort")}</span>
        </Button>
      </motion.header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatFilterCard
          highlighted
          label={t("kpiTotal")}
          value={String(totalCount)}
          footnote={t("kpiTotalNote")}
          icon={<BookOpen className="size-4" />}
          tone="indigo"
          active={typeTab === "ALL"}
          onSelect={() => selectTab("ALL")}
          loading={isAllLoading}
          delay={0.05}
        />
        <StatFilterCard
          label={t("kpiCore")}
          value={String(coreCount)}
          footnote={t("kpiCoreNote")}
          icon={<Layers className="size-4" />}
          tone="indigo"
          active={typeTab === "CORE"}
          onSelect={() => selectTab("CORE")}
          loading={isAllLoading}
          delay={0.1}
        />
        <StatFilterCard
          label={t("kpiElective")}
          value={String(electiveCount)}
          footnote={t("kpiElectiveNote")}
          icon={<Sparkles className="size-4" />}
          tone="violet"
          active={typeTab === "ELECTIVE"}
          onSelect={() => selectTab("ELECTIVE")}
          loading={isAllLoading}
          delay={0.15}
        />
        <StatFilterCard
          label={t("kpiActive")}
          value={String(activeCount)}
          footnote={t("kpiActiveNote")}
          icon={<CheckCircle2 className="size-4" />}
          tone="emerald"
          loading={isAllLoading}
          delay={0.2}
        />
      </div>

      <motion.div {...fadeUp(0.25)}>
        <Card className={CARD_CLASS}>
          <div className="flex flex-col gap-3 px-4 pt-4 pb-3 sm:px-5 md:flex-row md:items-center md:justify-between">
            <Tabs
              value={typeTab}
              onValueChange={(value: string) => selectTab(value)}
            >
              <TabsList className="h-auto gap-1.5 bg-transparent p-0">
                {TYPE_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className={TAB_TRIGGER_CLASS}
                  >
                    {t(TAB_LABEL_KEYS[tab])}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-72">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("searchPlaceholder")}
                  className={`${fieldClass(false)} rounded-full pr-9 pl-9`}
                />
                {query && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuery("")}
                    aria-label={t("clearSearch")}
                    className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground dark:hover:bg-accent"
                  >
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>
              <span className="hidden shrink-0 font-manrope text-xs text-muted-foreground sm:inline">
                {isFiltering ? filteredSubjects.length : (data?.total ?? 0)}{" "}
                {t("results")}
              </span>
            </div>
          </div>

          <Separator />

          {showLoading ? (
            <SubjectsGridSkeleton />
          ) : subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
                <FlaskConical className="size-6 text-muted-foreground" />
              </span>
              <div>
                <p className="font-jakarta text-sm font-semibold text-foreground">
                  {isFiltering ? t("noMatchesTitle") : t("emptyTitle")}
                </p>
                <p className="mt-1 font-manrope text-xs text-muted-foreground">
                  {isFiltering ? t("noMatchesSub") : t("emptySubtitle")}
                </p>
              </div>
              {isFiltering ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  className={`h-8 px-4 text-xs ${OUTLINE_PILL_CLASS}`}
                >
                  {t("resetFilters")}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => setIsDialogOpen(true)}
                  className={`h-9 gap-2 px-4 text-xs ${PRIMARY_PILL_CLASS}`}
                >
                  <Plus className="size-3.5" />
                  {t("newSubjectBtn")}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {subjects.map((subject, i) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  delay={Math.min(i * 0.03, 0.3)}
                />
              ))}
            </div>
          )}

          {!isFiltering && data && totalPages > 1 && (
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

      <CreateSubjectDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
};

export default SubjectsPage;
