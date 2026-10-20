"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeftRight,
  BookOpen,
  CalendarDays,
  CalendarPlus,
  GraduationCap,
  LayoutGrid,
  List,
  School,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  TAB_TRIGGER_CLASS,
  fieldClass,
} from "@/components/forms/FormParts";
import { StatFilterCard } from "@/components/admissions/AdmissionsListParts";
import {
  DAY_SHORT_KEYS,
  DayList,
  EditEntryDialog,
  Lookup,
  SubjectOption,
  SwapConfirmDialog,
  TeacherOption,
  TimetableSkeleton,
  WEEK_DAYS,
  WeeklyGrid,
} from "@/components/timetable/TimetableParts";
import { TimetableBuilderDialog } from "@/components/timetable/TimetableBuilderDialog";
import { useGetAllAcademicYears } from "@/hooks/useAcademicYear";
import { useGetAllClasses } from "@/hooks/useClass";
import { useGetAllSubjects } from "@/hooks/useSubject";
import { useGetAllTeachers } from "@/hooks/useTeacher";
import { useGetTimeTable, useSwapTimeTable } from "@/hooks/useTimeTable";
import { useTranslations } from "@/hooks/useTranslations";
import { DayOfWeek, TimetableListItem } from "@/types";

const ALL = "ALL";
type DayFilter = typeof ALL | DayOfWeek;

const TimetablePage = () => {
  const t = useTranslations("timetable");
  const [yearId, setYearId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<DayFilter>(ALL);
  const [teacherFilter, setTeacherFilter] = useState(ALL);
  const [subjectFilter, setSubjectFilter] = useState(ALL);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [swapMode, setSwapMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [builder, setBuilder] = useState<{
    open: boolean;
    slot: { day: DayOfWeek; period: number } | null;
  }>({
    open: false,
    slot: null,
  });
  const [editing, setEditing] = useState<TimetableListItem | null>(null);

  const { data: yearsData } = useGetAllAcademicYears();
  const years = yearsData?.data ?? [];
  const activeYearId =
    yearId ?? years.find((y) => y.isCurrent)?.id ?? years[0]?.id ?? "";

  const { data: classesData, isLoading: isClassesLoading } = useGetAllClasses(
    { academicYearId: activeYearId },
    1,
    100,
  );
  const classes = classesData?.data ?? [];
  const activeClassId = classId ?? classes[0]?.id ?? "";
  const activeClass = classes.find((c) => c.id === activeClassId);
  const classLabel = activeClass
    ? `${t("classLabel")} ${activeClass.name}-${activeClass.section}`
    : "";

  const { data: subjectsData } = useGetAllSubjects(1, 100);
  const { data: teachersData } = useGetAllTeachers(
    "ACTIVE",
    "",
    "",
    "",
    "",
    undefined,
    1,
    100,
  );
  const { data: timetableData, isLoading: isTimetableLoading } =
    useGetTimeTable(activeClassId, 1, 100);
  const { mutate: swapEntries, isPending: isSwapping } = useSwapTimeTable();

  const subjects: SubjectOption[] = useMemo(
    () =>
      (subjectsData?.data ?? [])
        .filter((s) => s.isActive)
        .map((s) => ({ id: s.id, name: s.name, code: s.code })),
    [subjectsData],
  );
  const teachers: TeacherOption[] = useMemo(
    () =>
      (teachersData?.data ?? []).map((teacher) => ({
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        specialization: teacher.specialization,
      })),
    [teachersData],
  );
  const lookup: Lookup = useMemo(
    () => ({
      subjects: new Map(
        (subjectsData?.data ?? []).map((s) => [
          s.id,
          { id: s.id, name: s.name, code: s.code },
        ]),
      ),
      teachers: new Map(teachers.map((teacher) => [teacher.id, teacher])),
    }),
    [subjectsData, teachers],
  );

  const entries = useMemo(() => timetableData?.data ?? [], [timetableData]);
  const hasSunday = entries.some((e) => e.dayOfWeek === DayOfWeek.SUNDAY);
  const allDays = hasSunday ? [...WEEK_DAYS, DayOfWeek.SUNDAY] : WEEK_DAYS;
  const visibleDays = dayFilter === ALL ? allDays : [dayFilter];
  const maxPeriod = Math.max(6, ...entries.map((e) => e.periodNumber));

  const usedSubjectIds = Array.from(new Set(entries.map((e) => e.subjectId)));
  const usedTeacherIds = Array.from(new Set(entries.map((e) => e.teacherId)));
  const weekdayEntries = entries.filter(
    (e) => e.dayOfWeek !== DayOfWeek.SUNDAY,
  ).length;
  const freeSlots = Math.max(0, WEEK_DAYS.length * maxPeriod - weekdayEntries);
  const filtersActive =
    teacherFilter !== ALL || subjectFilter !== ALL || dayFilter !== ALL;

  const isHighlighted = (entry: TimetableListItem) =>
    (teacherFilter === ALL || entry.teacherId === teacherFilter) &&
    (subjectFilter === ALL || entry.subjectId === subjectFilter);

  const swapPair = useMemo(() => {
    if (selectedIds.length !== 2) return null;
    const first = entries.find((e) => e.id === selectedIds[0]);
    const second = entries.find((e) => e.id === selectedIds[1]);
    return first && second
      ? ([first, second] as [TimetableListItem, TimetableListItem])
      : null;
  }, [selectedIds, entries]);

  const handleEntryClick = (entry: TimetableListItem) => {
    if (!swapMode) {
      setEditing(entry);
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(entry.id)
        ? prev.filter((id) => id !== entry.id)
        : prev.length < 2
          ? [...prev, entry.id]
          : prev,
    );
  };

  const exitSwapMode = () => {
    setSwapMode(false);
    setSelectedIds([]);
  };

  const confirmSwap = () => {
    if (!swapPair) return;
    swapEntries(
      { data: { timeTableId1: swapPair[0].id, timeTableId2: swapPair[1].id } },
      { onSuccess: exitSwapMode },
    );
  };

  const resetFilters = () => {
    setDayFilter(ALL);
    setTeacherFilter(ALL);
    setSubjectFilter(ALL);
  };

  const selectTrigger = `${fieldClass(false)} w-full data-[size=default]:h-10 dark:hover:bg-card`;

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
            {classLabel && (
              <Badge
                variant="outline"
                className={`rounded-full font-manrope text-[11px] font-medium ${TONE_CLASSES.indigo}`}
              >
                {classLabel}
              </Badge>
            )}
          </div>
          <p className="mt-1.5 font-manrope text-sm text-muted-foreground">
            {t("pageSubtitle")}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setBuilder({ open: true, slot: null })}
          disabled={!activeClassId}
          className="h-11 gap-2 self-start rounded-full bg-linear-to-r from-indigo-600 to-indigo-800 px-5 font-manrope text-sm font-semibold text-white shadow-none hover:opacity-90 sm:self-auto"
        >
          <CalendarPlus className="size-4" />
          {t("buildTimetable")}
        </Button>
      </motion.header>

      <motion.div {...fadeUp(0.05)}>
        <Card className={`${CARD_CLASS} gap-4 p-4 sm:p-5`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="font-manrope text-xs font-normal text-foreground/70">
                {t("filterYear")}
              </Label>
              <Select
                value={activeYearId}
                onValueChange={(value: string) => {
                  setYearId(value);
                  setClassId(null);
                  exitSwapMode();
                }}
              >
                <SelectTrigger className={selectTrigger}>
                  <GraduationCap className="size-4 text-muted-foreground" />
                  <SelectValue placeholder={t("filterYear")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {years.map((year) => (
                    <SelectItem
                      key={year.id}
                      value={year.id}
                      className="font-manrope text-sm"
                    >
                      {year.name}
                      {year.isCurrent && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {" "}
                          · {t("current")}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-manrope text-xs font-normal text-foreground/70">
                {t("filterClass")}
              </Label>
              <Select
                value={activeClassId}
                onValueChange={(value: string) => {
                  setClassId(value);
                  exitSwapMode();
                }}
                disabled={isClassesLoading || classes.length === 0}
              >
                <SelectTrigger className={selectTrigger}>
                  <School className="size-4 text-muted-foreground" />
                  <SelectValue placeholder={t("noClasses")} />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-xl">
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
            </div>
            <div className="space-y-1.5">
              <Label className="font-manrope text-xs font-normal text-foreground/70">
                {t("filterTeacher")}
              </Label>
              <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                <SelectTrigger className={selectTrigger}>
                  <Users className="size-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-xl">
                  <SelectItem value={ALL} className="font-manrope text-sm">
                    {t("allTeachers")}
                  </SelectItem>
                  {usedTeacherIds.map((id) => (
                    <SelectItem
                      key={id}
                      value={id}
                      className="font-manrope text-sm"
                    >
                      {lookup.teachers.get(id)?.name ?? t("unknownTeacher")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-manrope text-xs font-normal text-foreground/70">
                {t("filterSubject")}
              </Label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className={selectTrigger}>
                  <BookOpen className="size-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72 rounded-xl">
                  <SelectItem value={ALL} className="font-manrope text-sm">
                    {t("allSubjects")}
                  </SelectItem>
                  {usedSubjectIds.map((id) => (
                    <SelectItem
                      key={id}
                      value={id}
                      className="font-manrope text-sm"
                    >
                      {lookup.subjects.get(id)?.name ?? t("unknownSubject")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </motion.div>

      {activeClassId ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatFilterCard
              highlighted
              label={t("kpiPeriods")}
              value={String(entries.length)}
              footnote={t("kpiPeriodsNote")}
              icon={<CalendarDays className="size-4" />}
              tone="indigo"
              loading={isTimetableLoading}
              delay={0.1}
            />
            <StatFilterCard
              label={t("kpiSubjects")}
              value={String(usedSubjectIds.length)}
              footnote={t("kpiSubjectsNote")}
              icon={<BookOpen className="size-4" />}
              tone="violet"
              loading={isTimetableLoading}
              delay={0.15}
            />
            <StatFilterCard
              label={t("kpiTeachers")}
              value={String(usedTeacherIds.length)}
              footnote={t("kpiTeachersNote")}
              icon={<Users className="size-4" />}
              tone="emerald"
              loading={isTimetableLoading}
              delay={0.2}
            />
            <StatFilterCard
              label={t("kpiFree")}
              value={String(freeSlots)}
              footnote={`${t("kpiFreeNote")} ${WEEK_DAYS.length} × ${maxPeriod}`}
              icon={<Sparkles className="size-4" />}
              tone="amber"
              loading={isTimetableLoading}
              delay={0.25}
            />
          </div>

          <motion.div {...fadeUp(0.3)}>
            <Card className={`${CARD_CLASS} overflow-hidden`}>
              <div className="flex flex-col gap-3 px-4 pt-4 pb-3 sm:px-5 xl:flex-row xl:items-center xl:justify-between">
                <Tabs
                  value={dayFilter}
                  onValueChange={(value: string) =>
                    setDayFilter(
                      value === ALL
                        ? ALL
                        : (allDays.find((d) => d === value) ?? ALL),
                    )
                  }
                  className="min-w-0"
                >
                  <TabsList className="flex h-auto w-full justify-start gap-1.5 overflow-x-auto bg-transparent p-0 scrollbar-none">
                    <TabsTrigger
                      value={ALL}
                      className={`${TAB_TRIGGER_CLASS} px-3.5`}
                    >
                      {t("allDays")}
                    </TabsTrigger>
                    {allDays.map((day) => (
                      <TabsTrigger
                        key={day}
                        value={day}
                        className={`${TAB_TRIGGER_CLASS} px-3.5`}
                      >
                        {t(DAY_SHORT_KEYS[day])}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {filtersActive && (
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      swapMode ? exitSwapMode() : setSwapMode(true)
                    }
                    disabled={entries.length < 2}
                    className={`h-9 gap-1.5 px-4 text-xs ${swapMode ? PRIMARY_PILL_CLASS : OUTLINE_PILL_CLASS}`}
                  >
                    <ArrowLeftRight className="size-3.5" />
                    {swapMode ? t("exitSwap") : t("swapMode")}
                  </Button>
                  <ToggleGroup
                    type="single"
                    value={view}
                    onValueChange={(value: string) => {
                      if (value === "grid" || value === "list") setView(value);
                    }}
                    className="gap-0.5 rounded-full border border-border bg-muted p-0.5"
                  >
                    <ToggleGroupItem
                      value="grid"
                      aria-label={t("viewGrid")}
                      className="h-8 w-8 rounded-full! p-0 text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                    >
                      <LayoutGrid className="size-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="list"
                      aria-label={t("viewList")}
                      className="h-8 w-8 rounded-full! p-0 text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                    >
                      <List className="size-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>

              {swapMode && (
                <div
                  className={`mx-4 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 sm:mx-5 ${TONE_CLASSES.indigo}`}
                >
                  <p className="flex items-center gap-2 font-manrope text-xs">
                    <ArrowLeftRight className="size-3.5" />
                    {t("swapHint")} ({selectedIds.length}/2)
                  </p>
                  {selectedIds.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setSelectedIds([])}
                      className="h-7 rounded-full px-2.5 font-manrope text-xs"
                    >
                      {t("clearSelection")}
                    </Button>
                  )}
                </div>
              )}

              {!isTimetableLoading && entries.length === 0 && (
                <div
                  className={`mx-4 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 sm:mx-5 ${TONE_CLASSES.amber}`}
                >
                  <p className="font-manrope text-xs">{t("emptyHint")}</p>
                  <Button
                    type="button"
                    onClick={() => setBuilder({ open: true, slot: null })}
                    className={`h-8 gap-1.5 px-4 text-xs ${PRIMARY_PILL_CLASS}`}
                  >
                    <CalendarPlus className="size-3.5" />
                    {t("buildTimetable")}
                  </Button>
                </div>
              )}

              <Separator />

              {isTimetableLoading ? (
                <TimetableSkeleton />
              ) : view === "grid" ? (
                <WeeklyGrid
                  entries={entries}
                  days={visibleDays}
                  maxPeriod={maxPeriod}
                  lookup={lookup}
                  isHighlighted={isHighlighted}
                  swapMode={swapMode}
                  selectedIds={selectedIds}
                  onEntryClick={handleEntryClick}
                  onEmptyClick={(day, period) =>
                    setBuilder({ open: true, slot: { day, period } })
                  }
                />
              ) : (
                <DayList
                  entries={entries}
                  days={visibleDays}
                  lookup={lookup}
                  isHighlighted={isHighlighted}
                  swapMode={swapMode}
                  selectedIds={selectedIds}
                  onEntryClick={handleEntryClick}
                />
              )}
            </Card>
          </motion.div>
        </>
      ) : (
        !isClassesLoading && (
          <Card
            className={`${CARD_CLASS} items-center gap-4 px-4 py-20 text-center`}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
              <School className="size-6 text-muted-foreground" />
            </span>
            <div>
              <p className="font-jakarta text-sm font-semibold text-foreground">
                {t("noClassesTitle")}
              </p>
              <p className="mt-1 font-manrope text-xs text-muted-foreground">
                {t("noClassesSub")}
              </p>
            </div>
          </Card>
        )
      )}

      {activeClassId && builder.open && (
        <TimetableBuilderDialog
          key={`${builder.slot?.day ?? "new"}-${builder.slot?.period ?? 0}`}
          open={builder.open}
          onOpenChange={(open) => setBuilder((prev) => ({ ...prev, open }))}
          classId={activeClassId}
          classLabel={classLabel}
          existing={entries}
          subjects={subjects}
          teachers={teachers}
          initialSlot={builder.slot}
        />
      )}

      <EditEntryDialog
        key={editing?.id ?? "none"}
        entry={editing}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        subjects={subjects}
        teachers={teachers}
      />

      <SwapConfirmDialog
        pair={swapPair}
        lookup={lookup}
        isPending={isSwapping}
        onConfirm={confirmSwap}
        onCancel={() => setSelectedIds((prev) => prev.slice(0, 1))}
      />
    </div>
  );
};

export default TimetablePage;
