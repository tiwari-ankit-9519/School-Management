"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Wallet,
  ChevronDown,
  CheckCircle2,
  XCircle,
  CalendarIcon,
  Repeat,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Layers,
  X,
  Pencil,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { useGetAllClassGroup } from "@/hooks/useClass";
import {
  useGetFeeStructureForClass,
  useUpdateFeeStructure,
} from "@/hooks/useFees";
import { FeeStructureUpdateType } from "@/validations/validations";
import { FeesStructureUpdatePayload } from "@/validations/validations";
import { FeeStructure } from "@/types";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const inputClass =
  "h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 font-manrope text-sm text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors";
const labelClass = "mb-1 block font-manrope text-xs text-white/40";

const UpdateFeeModal = ({
  fee,
  onClose,
}: {
  fee: FeeStructure;
  onClose: () => void;
}) => {
  const { mutate: updateFee, isPending } = useUpdateFeeStructure(fee.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FeeStructureUpdateType>({
    resolver: zodResolver(FeesStructureUpdatePayload),
    defaultValues: {
      name: fee.name,
      amount: fee.amount,
      description: fee.description ?? undefined,
      isRecurring: fee.isRecurring,
      recurringMonth: fee.recurringMonth ?? undefined,
    },
  });

  const onSubmit = (data: FeeStructureUpdateType) => {
    updateFee(data, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0d1525] shadow-[0_24px_60px_rgba(0,0,0,0.7)]"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div>
            <h2 className="font-jakarta text-base font-bold text-white">
              Update Fee Structure
            </h2>
            <p className="mt-0.5 font-manrope text-xs text-white/40">
              Editing: {fee.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-5">
          <div>
            <label className={labelClass}>Fee Name</label>
            <input
              {...register("name")}
              placeholder="e.g. Admission Fee"
              className={inputClass}
            />
            {errors.name && (
              <p className="mt-1 flex items-center gap-1 font-manrope text-xs text-red-400">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Amount (₹)</label>
            <input
              {...register("amount", {
                valueAsNumber: true,
              })}
              type="number"
              placeholder="0"
              className={inputClass}
            />
            {errors.amount && (
              <p className="mt-1 flex items-center gap-1 font-manrope text-xs text-red-400">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errors.amount.message}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <input
              {...register("description")}
              placeholder="Optional description"
              className={inputClass}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/3 px-4 py-3">
            <div>
              <p className="font-jakarta text-sm font-semibold text-white">
                Recurring
              </p>
              <p className="mt-0.5 font-manrope text-xs text-white/40">
                Charge this fee every month
              </p>
            </div>
            <input
              {...register("isRecurring")}
              type="checkbox"
              className="h-4 w-4 accent-indigo-500"
            />
          </div>

          <div>
            <label className={labelClass}>
              Recurring Month (1–12, optional)
            </label>
            <input
              {...register("recurringMonth", {
                valueAsNumber: true,
              })}
              type="number"
              min={1}
              max={12}
              placeholder="e.g. 6 for June"
              className={inputClass}
            />
            {errors.recurringMonth && (
              <p className="mt-1 flex items-center gap-1 font-manrope text-xs text-red-400">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {errors.recurringMonth.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-white/8 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 flex-1 items-center justify-center rounded-xl border border-white/10 bg-white/5 font-jakarta text-sm font-bold text-white/50 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 font-jakarta text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-colors hover:bg-indigo-500 disabled:opacity-70"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const FeeStructurePage = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);

  const { data: classGroupData, isLoading: isGroupsLoading } =
    useGetAllClassGroup();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const classGroups = classGroupData?.data ?? [];

  const selectedGroupName = useMemo(
    () =>
      classGroups.find((g) => g.classGroupId === selectedGroupId)?.classGroup,
    [classGroups, selectedGroupId],
  );

  const { data: feeData, isLoading: isFeesLoading } =
    useGetFeeStructureForClass(selectedGroupId, page, 10);

  const handleSelectGroup = (classGroupId: string) => {
    setSelectedGroupId(classGroupId);
    setPage(1);
    setGroupDropdownOpen(false);
  };

  const handleClearGroup = () => {
    setSelectedGroupId("");
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-4 py-10 sm:px-8">
      <div
        className="pointer-events-none fixed inset-0 select-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, #1e3a5f18 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, #6366f10a 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/20">
              <Image
                src="/logo.png"
                alt="EduSphere Logo"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="font-jakarta text-2xl font-extrabold leading-tight text-white">
                Fee Structure
              </h1>
              <p className="font-manrope text-sm text-white/40">
                Pick a class group to view its fee structure
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 flex flex-wrap items-center gap-3"
        >
          <div className="relative">
            <button
              onClick={() => setGroupDropdownOpen((v) => !v)}
              className={`flex h-9 items-center gap-2 rounded-xl border px-3.5 font-manrope text-xs font-medium transition-all duration-200 backdrop-blur-sm ${
                selectedGroupId
                  ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                  : "border-white/8 bg-white/4 text-white/40 hover:text-white/70"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              {selectedGroupName ?? "Select class group"}
              {selectedGroupId && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearGroup();
                  }}
                  className="ml-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-500/30 text-indigo-300 hover:bg-indigo-500/50"
                >
                  <X className="h-2.5 w-2.5" />
                </span>
              )}
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${groupDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {groupDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-10 z-30 min-w-52 overflow-hidden rounded-xl border border-white/10 bg-[#0d1525] shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
                >
                  {isGroupsLoading ? (
                    <div className="flex items-center gap-2 px-4 py-3 font-manrope text-xs text-white/30">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading class groups...
                    </div>
                  ) : classGroups.length === 0 ? (
                    <div className="px-4 py-3 font-manrope text-xs text-white/30">
                      No class groups available
                    </div>
                  ) : (
                    <div className="py-1">
                      {classGroups.map((group) => (
                        <button
                          key={group.classGroupId}
                          onClick={() => handleSelectGroup(group.classGroupId)}
                          className={`flex w-full items-center gap-2 px-4 py-2.5 font-manrope text-xs transition-colors duration-150 ${
                            selectedGroupId === group.classGroupId
                              ? "bg-indigo-500/15 text-indigo-300"
                              : "text-white/60 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {selectedGroupId === group.classGroupId && (
                            <CheckCircle2 className="h-3 w-3 text-indigo-400" />
                          )}
                          Class {group.classGroup}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {selectedGroupId && (
            <button
              onClick={handleClearGroup}
              className="font-manrope text-xs text-white/30 underline-offset-2 hover:text-white/60 hover:underline transition-colors"
            >
              Clear selection
            </button>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_60px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />

          {!selectedGroupId ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Layers className="h-6 w-6 text-white/20" />
              </div>
              <div className="text-center">
                <p className="font-jakarta text-sm font-semibold text-white/40">
                  No class group selected
                </p>
                <p className="mt-0.5 font-manrope text-xs text-white/20">
                  Choose a class group above to view its fee structure
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-[2fr_1.3fr_1.3fr_1.4fr_1fr_0.5fr] gap-4 border-b border-white/8 px-6 py-3.5">
                {[
                  "Fee Name",
                  "Amount",
                  "Due Date",
                  "Recurring",
                  "Status",
                  "",
                ].map((h) => (
                  <span
                    key={h}
                    className="font-manrope text-xs font-medium uppercase tracking-widest text-white/30"
                  >
                    {h}
                  </span>
                ))}
              </div>

              {isFeesLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
                    <span className="font-manrope text-sm text-white/30">
                      Loading fee structure...
                    </span>
                  </div>
                </div>
              ) : !feeData?.data?.length ? (
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <Wallet className="h-6 w-6 text-white/20" />
                  </div>
                  <div className="text-center">
                    <p className="font-jakarta text-sm font-semibold text-white/40">
                      No fee structure found
                    </p>
                    <p className="mt-0.5 font-manrope text-xs text-white/20">
                      This class group does not have any fee structure yet
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-white/6">
                  {feeData.data.map((fee, i) => (
                    <motion.div
                      key={fee.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.04 }}
                      className="grid grid-cols-[2fr_1.3fr_1.3fr_1.4fr_1fr_0.5fr] gap-4 px-6 py-4 transition-colors duration-150 hover:bg-white/3 items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10">
                          <Wallet className="h-3.5 w-3.5 text-indigo-400" />
                        </div>
                        <div>
                          <span className="font-jakarta text-sm font-bold text-white">
                            {fee.name}
                          </span>
                          <p className="font-manrope text-xs text-white/30">
                            {fee.description ?? "No description"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="font-manrope text-sm font-semibold text-white/70">
                          {formatAmount(fee.amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5 text-white/20" />
                        <span className="font-manrope text-sm text-white/50">
                          {formatDate(fee.dueDate)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        {fee.isRecurring ? (
                          <span className="flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 font-manrope text-xs font-medium text-sky-400">
                            <Repeat className="h-3 w-3" />
                            Monthly
                            {fee.recurringMonth
                              ? ` · ${MONTH_NAMES[fee.recurringMonth - 1]}`
                              : ""}
                          </span>
                        ) : (
                          <span className="font-manrope text-xs text-white/30">
                            One-time
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        {fee.isActive ? (
                          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 font-manrope text-xs font-medium text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-manrope text-xs font-medium text-white/30">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setEditingFee(fee)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/30 transition-colors hover:border-indigo-500/30 hover:bg-indigo-500/10 hover:text-indigo-400"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {feeData && feeData.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/8 px-6 py-4">
                  <span className="font-manrope text-xs text-white/30">
                    Page {feeData.page} / {feeData.totalPages} · {feeData.total}{" "}
                    total
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70 disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === feeData.totalPages}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/70 disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {editingFee && (
          <UpdateFeeModal
            fee={editingFee}
            onClose={() => setEditingFee(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeeStructurePage;
