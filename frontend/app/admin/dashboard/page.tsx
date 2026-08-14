"use client";
import { useMemo } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import {
  Users,
  GraduationCap,
  ShieldCheck,
  Contact,
  School,
  Loader2,
  RefreshCw,
  IndianRupee,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useGetDashboardSummary } from "@/hooks/useDashboard";
import { useTranslations } from "@/hooks/useTranslations";

const ENROLLMENT_COLORS: Record<string, string> = {
  ACTIVE: "#34d399",
  INACTIVE: "#64748b",
  SUSPENDED: "#f87171",
  GRADUATED: "#6366f1",
  TRANSFERRED: "#fbbf24",
  EXPELLED: "#ef4444",
  WITHDRAWN: "#a78bfa",
};

const ADMISSION_COLORS: Record<string, string> = {
  PENDING: "#fbbf24",
  WAITLISTED: "#a78bfa",
  APPROVED: "#34d399",
  REJECTED: "#f87171",
  SLOT_OFFERED: "#6366f1",
  OFFER_EXPIRED: "#64748b",
  OFFER_DECLINED: "#f97316",
};

const TEACHER_APPLICATION_COLORS: Record<string, string> = {
  PENDING: "#fbbf24",
  SHORTLISTED: "#6366f1",
  SELECTED: "#34d399",
  REJECTED: "#f87171",
};

const FEE_COLORS = ["#6366f1", "#f59e0b"];

const formatStatusLabel = (status: string) =>
  status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const cardClass =
  "relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 p-5 sm:p-6 backdrop-blur-xl";
const cardTopLine =
  "absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/15 to-transparent";

const ChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1424] px-3 py-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
      {label && (
        <p className="mb-1 font-manrope text-xs font-semibold text-white/70">
          {formatStatusLabel(label)}
        </p>
      )}
      {payload.map((entry) => (
        <p
          key={entry.name}
          className="flex items-center gap-1.5 font-manrope text-xs text-white/60"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

const DashboardPage = () => {
  const t = useTranslations("dashboard");
  const {
    data: summary,
    isLoading,
    isFetching,
    refetch,
  } = useGetDashboardSummary();

  const studentEnrollmentData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.students.byStatus).map(([status, count]) => ({
      status,
      count,
    }));
  }, [summary]);

  const staffStatusData = useMemo(() => {
    if (!summary) return [];
    const statuses = Object.keys(summary.teachers.byStatus);
    return statuses.map((status) => ({
      status,
      Teachers:
        summary.teachers.byStatus[
          status as keyof typeof summary.teachers.byStatus
        ],
      Admins:
        summary.admins.byStatus[status as keyof typeof summary.admins.byStatus],
    }));
  }, [summary]);

  const admissionPipelineData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.admissionApplications.byStatus)
      .filter(([, value]) => value > 0)
      .map(([status, value]) => ({ name: status, value }));
  }, [summary]);

  const teacherApplicationData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.teacherApplications.byStatus)
      .filter(([, value]) => value > 0)
      .map(([status, value]) => ({ name: status, value }));
  }, [summary]);

  const feeRevenueData = useMemo(() => {
    if (!summary) return [];
    const pending = Math.max(
      summary.feeRevenue.expected - summary.feeRevenue.collected,
      0,
    );
    return [
      { name: t("feeCollected"), value: summary.feeRevenue.collected },
      { name: t("feePending"), value: pending },
    ];
  }, [summary, t]);

  const attendanceData = useMemo(() => {
    if (!summary) return [];
    return Object.keys(summary.todayAttendance.students).map((status) => ({
      status,
      Students:
        summary.todayAttendance.students[
          status as keyof typeof summary.todayAttendance.students
        ],
      Teachers:
        summary.todayAttendance.teachers[
          status as keyof typeof summary.todayAttendance.teachers
        ],
    }));
  }, [summary]);

  const leaveData = useMemo(() => {
    if (!summary) return [];
    return Object.keys(summary.studentLeaveRequests.byStatus).map((status) => ({
      status,
      Students:
        summary.studentLeaveRequests.byStatus[
          status as keyof typeof summary.studentLeaveRequests.byStatus
        ],
      Teachers:
        summary.teacherLeaveRequests.byStatus[
          status as keyof typeof summary.teacherLeaveRequests.byStatus
        ],
    }));
  }, [summary]);

  const statCards = summary
    ? [
        {
          label: t("statStudents"),
          value: summary.students.total,
          icon: <Users className="h-4 w-4" />,
        },
        {
          label: t("statTeachers"),
          value: summary.teachers.total,
          icon: <GraduationCap className="h-4 w-4" />,
        },
        {
          label: t("statAdmins"),
          value: summary.admins.total,
          icon: <ShieldCheck className="h-4 w-4" />,
        },
        {
          label: t("statParents"),
          value: summary.parentCount,
          icon: <Contact className="h-4 w-4" />,
        },
        {
          label: t("statClasses"),
          value: summary.classCount,
          icon: <School className="h-4 w-4" />,
        },
        {
          label: t("statFeeCollected"),
          value: formatCurrency(summary.feeRevenue.collected),
          icon: <IndianRupee className="h-4 w-4" />,
        },
      ]
    : [];
  if (isLoading) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center bg-[#050810]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
          <span className="font-manrope text-sm text-white/30">
            {t("loading")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#050810] px-3 py-6 sm:px-8 sm:py-10">
      <div
        className="pointer-events-none fixed inset-0 select-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, #1e3a5f18 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, #6366f10a 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 sm:mb-10 flex items-start justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/20 shrink-0">
              <Image
                src="/logo.png"
                alt="EduSphere Logo"
                width={22}
                height={22}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="font-jakarta text-xl sm:text-2xl font-extrabold leading-tight text-white">
                {t("pageTitle")}
              </h1>
              <p className="font-manrope text-xs sm:text-sm text-white/40 mt-0.5">
                {summary?.academicYear
                  ? `${t("pageSubtitle")} · ${summary.academicYear.name}`
                  : t("pageSubtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-xl border border-white/10 bg-white/5 px-3 sm:px-4 font-manrope text-xs sm:text-sm text-white/60 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-indigo-400" : ""}`}
            />
            <span className="hidden sm:inline">{t("refresh")}</span>
          </button>
        </motion.div>

        <div className="mb-5 sm:mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4 p-4 backdrop-blur-xl"
            >
              <div className={cardTopLine} />
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                {card.icon}
              </div>
              <p className="mt-3 font-jakarta text-xl sm:text-2xl font-extrabold text-white truncate">
                {card.value}
              </p>
              <p className="mt-0.5 font-manrope text-[11px] uppercase tracking-wide text-white/30">
                {card.label}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={cardClass}
          >
            <div className={cardTopLine} />
            <h2 className="mb-4 font-jakarta text-sm font-bold uppercase tracking-widest text-white/30">
              {t("chartStudentEnrollment")}
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={studentEnrollmentData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="status"
                  tickFormatter={formatStatusLabel}
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="count" name={t("students")} radius={[6, 6, 0, 0]}>
                  {studentEnrollmentData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={ENROLLMENT_COLORS[entry.status] ?? "#6366f1"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className={cardClass}
          >
            <div className={cardTopLine} />
            <h2 className="mb-4 font-jakarta text-sm font-bold uppercase tracking-widest text-white/30">
              {t("chartStaffStatus")}
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={staffStatusData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="status"
                  tickFormatter={formatStatusLabel}
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: "Manrope",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                  }}
                />
                <Bar dataKey="Teachers" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Admins" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className={cardClass}
          >
            <div className={cardTopLine} />
            <h2 className="mb-4 font-jakarta text-sm font-bold uppercase tracking-widest text-white/30">
              {t("chartAdmissionPipeline")}
            </h2>
            {admissionPipelineData.length === 0 ? (
              <div className="flex h-70 items-center justify-center">
                <p className="font-manrope text-sm text-white/20">
                  {t("noData")}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={admissionPipelineData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {admissionPipelineData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={ADMISSION_COLORS[entry.name] ?? "#6366f1"}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    formatter={(value: string) => formatStatusLabel(value)}
                    wrapperStyle={{
                      fontFamily: "Manrope",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.5)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className={cardClass}
          >
            <div className={cardTopLine} />
            <h2 className="mb-4 font-jakarta text-sm font-bold uppercase tracking-widest text-white/30">
              {t("chartFeeRevenue")}
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={feeRevenueData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {feeRevenueData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={FEE_COLORS[index]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0)
                      return null;
                    const entry = payload[0];
                    return (
                      <div className="rounded-xl border border-white/10 bg-[#0d1424] px-3 py-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
                        <p className="font-manrope text-xs text-white/60">
                          {entry.name}: {formatCurrency(entry.value as number)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: "Manrope",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className={cardClass}
          >
            <div className={cardTopLine} />
            <h2 className="mb-4 font-jakarta text-sm font-bold uppercase tracking-widest text-white/30">
              {t("chartTodayAttendance")}
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={attendanceData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="status"
                  tickFormatter={formatStatusLabel}
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: "Manrope",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                  }}
                />
                <Bar dataKey="Students" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Teachers" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className={cardClass}
          >
            <div className={cardTopLine} />
            <h2 className="mb-4 font-jakarta text-sm font-bold uppercase tracking-widest text-white/30">
              {t("chartLeaveRequests")}
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={leaveData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="status"
                  tickFormatter={formatStatusLabel}
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: "Manrope",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.5)",
                  }}
                />
                <Bar dataKey="Students" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Teachers" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className={cardClass}
          >
            <div className={cardTopLine} />
            <h2 className="mb-4 font-jakarta text-sm font-bold uppercase tracking-widest text-white/30">
              {t("chartTeacherApplications")}
            </h2>
            {teacherApplicationData.length === 0 ? (
              <div className="flex h-70 items-center justify-center">
                <p className="font-manrope text-sm text-white/20">
                  {t("noData")}
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={teacherApplicationData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {teacherApplicationData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          TEACHER_APPLICATION_COLORS[entry.name] ?? "#6366f1"
                        }
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    formatter={(value: string) => formatStatusLabel(value)}
                    wrapperStyle={{
                      fontFamily: "Manrope",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.5)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
