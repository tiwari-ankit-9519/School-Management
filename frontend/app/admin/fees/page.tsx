"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Layers,
  Plus,
  Receipt,
  Repeat,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CARD_CLASS, fadeUp } from "@/components/dashboard/DashboardWidgets";
import {
  PRIMARY_PILL_CLASS,
  TAB_TRIGGER_CLASS,
} from "@/components/forms/FormParts";
import {
  ApplicationsPagination,
  StatFilterCard,
} from "@/components/admissions/AdmissionsListParts";
import {
  FeeFormDialog,
  FeesTable,
  FeesTableSkeleton,
  formatAmount,
} from "@/components/fees/FeeStructureParts";
import { useGetAllClassGroup } from "@/hooks/useClass";
import { useGetFeeStructureForClass } from "@/hooks/useFees";
import { useTranslations } from "@/hooks/useTranslations";
import { FeeStructure } from "@/types";

const PAGE_SIZE = 10;

const FeeStructurePage = () => {
  const t = useTranslations("feeStructure");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [dialogFee, setDialogFee] = useState<FeeStructure | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: groupData, isLoading: isGroupsLoading } = useGetAllClassGroup();
  const groups = useMemo(() => groupData?.data ?? [], [groupData]);
  const activeGroupId = selectedGroupId ?? groups[0]?.classGroupId ?? "";
  const activeGroupName =
    groups.find((g) => g.classGroupId === activeGroupId)?.classGroup ?? "";

  const { data: allFeesData, isLoading: isStatsLoading } =
    useGetFeeStructureForClass(activeGroupId, 1, 100);
  const { data: feeData, isLoading: isFeesLoading } =
    useGetFeeStructureForClass(activeGroupId, page, PAGE_SIZE);

  const allFees = useMemo(() => allFeesData?.data ?? [], [allFeesData]);
  const fees = feeData?.data ?? [];
  const oneTimeTotal = allFees
    .filter((f) => !f.isRecurring)
    .reduce((sum, f) => sum + f.amount, 0);
  const recurringTotal = allFees
    .filter((f) => f.isRecurring)
    .reduce((sum, f) => sum + f.amount, 0);
  const activeCount = allFees.filter((f) => f.isActive).length;
  const totalPages = feeData?.totalPages ?? 1;
  const groupLabel = activeGroupName
    ? `${t("classLabel")} ${activeGroupName}`
    : "";

  const openCreate = () => {
    setDialogFee(null);
    setIsDialogOpen(true);
  };

  const openEdit = (fee: FeeStructure) => {
    setDialogFee(fee);
    setIsDialogOpen(true);
  };

  const selectGroup = (value: string) => {
    setSelectedGroupId(value);
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
          onClick={openCreate}
          disabled={!activeGroupId}
          className="h-11 gap-2 self-start rounded-full bg-linear-to-r from-indigo-600 to-indigo-800 px-5 font-manrope text-sm font-semibold text-white shadow-none hover:opacity-90 sm:self-auto"
        >
          <Plus className="size-4" />
          {t("addFee")}
        </Button>
      </motion.header>

      <motion.div {...fadeUp(0.05)}>
        <Card className={`${CARD_CLASS} gap-3 p-4 sm:p-5`}>
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-muted-foreground" />
            <p className="font-jakarta text-sm font-semibold text-foreground">
              {t("classGroupsTitle")}
            </p>
          </div>
          {isGroupsLoading ? (
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-20 rounded-full" />
              ))}
            </div>
          ) : groups.length === 0 ? (
            <p className="font-manrope text-sm text-muted-foreground">
              {t("noGroups")}
            </p>
          ) : (
            <Tabs
              value={activeGroupId}
              onValueChange={(value: string) => selectGroup(value)}
            >
              <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1.5 bg-transparent p-0">
                {groups.map((group) => (
                  <TabsTrigger
                    key={group.classGroupId}
                    value={group.classGroupId}
                    className={`${TAB_TRIGGER_CLASS} px-4`}
                  >
                    {t("classLabel")} {group.classGroup}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </Card>
      </motion.div>

      {activeGroupId && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatFilterCard
              highlighted
              label={t("kpiItems")}
              value={String(allFeesData?.total ?? 0)}
              footnote={`${t("kpiItemsNote")} ${groupLabel}`}
              icon={<Receipt className="size-4" />}
              tone="indigo"
              loading={isStatsLoading}
              delay={0.1}
            />
            <StatFilterCard
              label={t("kpiOneTime")}
              value={formatAmount(oneTimeTotal)}
              footnote={t("kpiOneTimeNote")}
              icon={<Wallet className="size-4" />}
              tone="violet"
              loading={isStatsLoading}
              delay={0.15}
            />
            <StatFilterCard
              label={t("kpiRecurring")}
              value={formatAmount(recurringTotal)}
              footnote={t("kpiRecurringNote")}
              icon={<Repeat className="size-4" />}
              tone="indigo"
              loading={isStatsLoading}
              delay={0.2}
            />
            <StatFilterCard
              label={t("kpiActive")}
              value={`${activeCount}/${allFees.length}`}
              footnote={t("kpiActiveNote")}
              icon={<CheckCircle2 className="size-4" />}
              tone="emerald"
              loading={isStatsLoading}
              delay={0.25}
            />
          </div>

          <motion.div {...fadeUp(0.3)}>
            <Card className={CARD_CLASS}>
              <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 sm:px-5">
                <div>
                  <h2 className="font-jakarta text-base font-semibold text-foreground">
                    {t("feesFor")} {groupLabel}
                  </h2>
                  <p className="font-manrope text-xs text-muted-foreground">
                    {t("feesForSub")}
                  </p>
                </div>
                <span className="font-manrope text-xs text-muted-foreground">
                  {feeData?.total ?? 0} {t("results")}
                </span>
              </div>
              <Separator />
              {isFeesLoading ? (
                <FeesTableSkeleton />
              ) : fees.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 px-4 py-20 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
                    <Wallet className="size-6 text-muted-foreground" />
                  </span>
                  <div>
                    <p className="font-jakarta text-sm font-semibold text-foreground">
                      {t("emptyTitle")}
                    </p>
                    <p className="mt-1 font-manrope text-xs text-muted-foreground">
                      {t("emptySub")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={openCreate}
                    className={`h-9 gap-2 px-4 text-xs ${PRIMARY_PILL_CLASS}`}
                  >
                    <Plus className="size-3.5" />
                    {t("addFee")}
                  </Button>
                </div>
              ) : (
                <FeesTable fees={fees} onEdit={openEdit} />
              )}
              {feeData && totalPages > 1 && (
                <>
                  <Separator />
                  <ApplicationsPagination
                    page={feeData.page}
                    totalPages={totalPages}
                    total={feeData.total}
                    onChange={setPage}
                  />
                </>
              )}
            </Card>
          </motion.div>
        </>
      )}

      {activeGroupId && (
        <FeeFormDialog
          key={isDialogOpen ? (dialogFee?.id ?? "new") : "closed"}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          classGroupId={activeGroupId}
          groupName={groupLabel}
          fee={dialogFee}
        />
      )}
    </div>
  );
};

export default FeeStructurePage;
