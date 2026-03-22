"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useViewApplications } from "@/hooks/useSchoolApplication";
import BasicDropdown, {
  DropdownItem,
} from "@/components/smoothui/basic-dropdown";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  Layers,
  ExternalLink,
} from "lucide-react";
import { SchoolApplication } from "@/types";
import Link from "next/link";

type Status =
  | "ALL"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "MORE_INFO_REQUIRED";

interface StatusConfig {
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}

const STATUS_CONFIG: Record<Exclude<Status, "ALL">, StatusConfig> = {
  PENDING: {
    label: "Pending",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
    icon: <Clock className="h-3 w-3" />,
  },
  APPROVED: {
    label: "Approved",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  REJECTED: {
    label: "Rejected",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
    icon: <XCircle className="h-3 w-3" />,
  },
  MORE_INFO_REQUIRED: {
    label: "More Info Required",
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/20",
    icon: <Info className="h-3 w-3" />,
  },
};

const filterItems: DropdownItem[] = [
  { id: "ALL", label: "All Applications" },
  { id: "PENDING", label: "Pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
  { id: "MORE_INFO_REQUIRED", label: "More Info Required" },
];

function StatusBadge({ status }: { status: Exclude<Status, "ALL"> }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-manrope font-medium border ${cfg.color} ${cfg.bg} ${cfg.border}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function ApplicationCard({
  application,
  index,
}: {
  application: SchoolApplication;
  index: number;
}) {
  const formatted = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative bg-white/3 border border-white/8 rounded-2xl p-5 sm:p-6 hover:bg-white/6 hover:border-white/12 transition-all duration-300"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent rounded-t-2xl" />
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center shrink-0 mt-0.5">
            <Building2 className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-bold font-jakarta text-sm sm:text-base leading-snug group-hover:text-indigo-200 transition-colors">
              {application.schoolName}
            </h3>
            <p className="text-white/40 text-xs font-manrope mt-0.5">
              {application.boardType} · Est. {application.establishedYear}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={application.status} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-4">
        <InfoChip
          icon={<MapPin className="h-3.5 w-3.5" />}
          label={`${application.city}, ${application.state}`}
        />
        <InfoChip
          icon={<Phone className="h-3.5 w-3.5" />}
          label={application.phone}
        />
        <InfoChip
          icon={<Mail className="h-3.5 w-3.5" />}
          label={application.email}
        />
      </div>
      <div className="h-px bg-white/5 mb-4" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <User className="h-3 w-3 text-white/40" />
          </div>
          <span className="text-white/50 text-xs font-manrope">
            {application.adminFirstName} {application.adminLastName}
            <span className="text-white/25 ml-1">· Admin</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-white/30 text-xs font-manrope">
            <Calendar className="h-3 w-3" />
            <span>{formatted(application.appliedAt)}</span>
          </div>
          {(application.documents?.length ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-indigo-400/70 text-xs font-manrope">
              <FileText className="h-3 w-3" />
              <span>
                {application.documents?.length} doc
                {(application.documents?.length ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <button className="flex items-center gap-1 text-xs font-manrope text-indigo-500 hover:text-indigo-300 transition-colors opacity-100 group-hover:opacity-100 cursor-pointer">
            <Link href={`/super-admin/${application.id}`}>View</Link>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>
      {application.rejectionReason && (
        <div className="mt-3 p-3 rounded-xl bg-red-500/5 border border-red-400/15">
          <p className="text-red-400/80 text-xs font-manrope">
            <span className="font-medium text-red-400">Rejection reason: </span>
            {application.rejectionReason}
          </p>
        </div>
      )}
      {application.notes && (
        <div className="mt-3 p-3 rounded-xl bg-white/3 border border-white/8">
          <p className="text-white/40 text-xs font-manrope">
            <span className="font-medium text-white/60">Notes: </span>
            {application.notes}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function InfoChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-white/35 text-xs font-manrope truncate">
      <span className="text-white/25 shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5 sm:p-6 animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/5 rounded-lg w-3/4" />
          <div className="h-3 bg-white/5 rounded-lg w-1/2" />
        </div>
        <div className="h-6 w-20 bg-white/5 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-3 bg-white/5 rounded-lg" />
        ))}
      </div>
      <div className="h-px bg-white/5 mb-4" />
      <div className="flex justify-between">
        <div className="h-3 w-32 bg-white/5 rounded-lg" />
        <div className="h-3 w-24 bg-white/5 rounded-lg" />
      </div>
    </div>
  );
}

function EmptyState({ status }: { status: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mb-4">
        <Layers className="h-7 w-7 text-white/20" />
      </div>
      <h3 className="text-white/50 font-jakarta font-semibold text-sm mb-1">
        No applications found
      </h3>
      <p className="text-white/25 font-manrope text-xs max-w-xs">
        {status === "ALL"
          ? "No school applications have been submitted yet."
          : `No applications with status "${status.replace(/_/g, " ").toLowerCase()}" found.`}
      </p>
    </motion.div>
  );
}

export default function SchoolApplicationsPage() {
  const [status, setStatus] = useState<Status>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useViewApplications(status, page);

  const applications: SchoolApplication[] = data?.data ?? [];
  const totalPages: number = data?.totalPages ?? 1;
  const total: number = data?.total ?? 0;

  const handleFilterChange = (item: DropdownItem) => {
    setStatus(item.id as Status);
    setPage(1);
  };

  const getPaginationRange = (): (number | "ellipsis")[] => {
    const delta = 1;
    const range: (number | "ellipsis")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - delta && i <= page + delta)
      ) {
        range.push(i);
      } else if (range[range.length - 1] !== "ellipsis") {
        range.push("ellipsis");
      }
    }
    return range;
  };

  return (
    <div className="min-h-screen bg-[#050810] px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-indigo-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-jakarta text-white tracking-tight">
              School Applications
            </h1>
          </div>
          <p className="text-white/35 text-sm font-manrope ml-11">
            Review and manage incoming school registration requests
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                "ALL",
                "PENDING",
                "APPROVED",
                "REJECTED",
                "MORE_INFO_REQUIRED",
              ] as Status[]
            ).map((s) => {
              const cfg = s !== "ALL" ? STATUS_CONFIG[s] : null;
              return (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s);
                    setPage(1);
                  }}
                  className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-manrope font-medium border transition-all duration-200 ${
                    status === s
                      ? cfg
                        ? `${cfg.color} ${cfg.bg} ${cfg.border}`
                        : "text-indigo-300 bg-indigo-500/15 border-indigo-400/30"
                      : "text-white/30 bg-white/3 border-white/8 hover:text-white/50 hover:bg-white/6"
                  }`}
                >
                  {cfg?.icon}
                  {s === "ALL" ? "All" : cfg?.label}
                </button>
              );
            })}
            <div className="sm:hidden w-full">
              <BasicDropdown
                label="Filter by Status"
                items={filterItems}
                onChange={handleFilterChange}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/25 text-xs font-manrope shrink-0">
            {!isLoading && (
              <span>
                {total} application{total !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </motion.div>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : isError ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/8 border border-red-400/15 flex items-center justify-center mb-4">
                <XCircle className="h-7 w-7 text-red-400/50" />
              </div>
              <h3 className="text-white/50 font-jakarta font-semibold text-sm mb-1">
                Failed to load applications
              </h3>
              <p className="text-white/25 font-manrope text-xs">
                Please try refreshing the page.
              </p>
            </motion.div>
          ) : applications.length === 0 ? (
            <EmptyState status={status} />
          ) : (
            <AnimatePresence mode="popLayout">
              {applications.map((app: SchoolApplication, i: number) => (
                <ApplicationCard key={app.id} application={app} index={i} />
              ))}
            </AnimatePresence>
          )}
        </div>

        {!isLoading && !isError && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex justify-center"
          >
            <Pagination>
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={`font-manrope text-xs border-white/10 bg-white/3 text-white/50 hover:bg-white/8 hover:text-white hover:border-white/20 transition-all ${
                      page === 1
                        ? "pointer-events-none opacity-30"
                        : "cursor-pointer"
                    }`}
                  />
                </PaginationItem>
                {getPaginationRange().map((item, idx) =>
                  item === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis className="text-white/20" />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        onClick={() => setPage(item)}
                        isActive={page === item}
                        className={`font-manrope text-xs cursor-pointer transition-all ${
                          page === item
                            ? "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500"
                            : "border-white/10 bg-white/3 text-white/50 hover:bg-white/8 hover:text-white hover:border-white/20"
                        }`}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={`font-manrope text-xs border-white/10 bg-white/3 text-white/50 hover:bg-white/8 hover:text-white hover:border-white/20 transition-all ${
                      page === totalPages
                        ? "pointer-events-none opacity-30"
                        : "cursor-pointer"
                    }`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </motion.div>
        )}

        {!isLoading && !isError && total > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-white/20 text-xs font-manrope mt-4"
          >
            Showing {applications.length} of {total} applications · Page {page}{" "}
            of {totalPages}
          </motion.p>
        )}
      </div>
    </div>
  );
}
