import {
  LayoutDashboard,
  School,
  FileCheck,
  UserPlus,
  CalendarRange,
  BookOpen,
  GraduationCap,
  UsersRound,
  UserCog,
  Banknote,
  Settings,
  ClipboardList,
  CalendarDays,
  CalendarHeart,
  Baby,
  type LucideIcon,
  TimerIcon,
  HandCoins,
} from "lucide-react";
import { ModuleKey } from "@/types";

export interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
  module?: ModuleKey;
  adminOnly?: boolean;
}

export type UserRole = "ADMIN" | "STUDENT" | "TEACHER" | "PARENT" | "MODERATOR";

const STAFF_NAV: NavItem[] = [
  {
    labelKey: "dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    labelKey: "Admission Applications",
    href: "/admin/admission-applications",
    icon: FileCheck,
    module: "ADMISSION_APPLICATION",
  },
  {
    labelKey: "Teacher Applications",
    href: "/admin/teacher-applications",
    icon: UserPlus,
    module: "TEACHER_APPLICATION",
  },
  {
    labelKey: "Academic Year",
    href: "/admin/academic-year",
    icon: CalendarRange,
    module: "ACADEMIC_YEAR",
  },
  {
    labelKey: "Subjects",
    href: "/admin/subjects",
    icon: BookOpen,
    module: "SUBJECT",
  },
  {
    labelKey: "Classes",
    href: "/admin/classes",
    icon: School,
    module: "CLASS",
  },
  {
    labelKey: "Students",
    href: "/admin/students",
    icon: GraduationCap,
    module: "STUDENT",
  },
  {
    labelKey: "Teachers",
    href: "/admin/teachers",
    icon: UsersRound,
    module: "TEACHER",
  },
  {
    labelKey: "Moderators",
    href: "/admin/moderators",
    icon: UserCog,
    module: "ADMIN",
  },
  {
    labelKey: "Fees",
    href: "/admin/fees",
    icon: Banknote,
    module: "FEE_STRUCTURE",
  },
  {
    labelKey: "feeCollection",
    href: "/admin/fees/collection",
    icon: HandCoins,
    module: "FEE_PAYMENT",
  },
  {
    labelKey: "Time Table",
    href: "/admin/time-table",
    icon: TimerIcon,
    module: "TIMETABLE",
  },
  {
    labelKey: "Holidays",
    href: "/admin/holidays",
    icon: CalendarHeart,
    module: "HOLIDAY",
  },
  {
    labelKey: "Settings",
    href: "/admin/settings",
    icon: Settings,
    adminOnly: true,
  },
];

export const NAV_CONFIG: Record<UserRole, NavItem[]> = {
  ADMIN: STAFF_NAV,

  MODERATOR: STAFF_NAV.filter((item) => !item.adminOnly),

  STUDENT: [
    {
      labelKey: "Attendance",
      href: "/student/attendance",
      icon: ClipboardList,
    },
    {
      labelKey: "Results",
      href: "/student/results",
      icon: GraduationCap,
    },
    {
      labelKey: "Fees",
      href: "/student/fees",
      icon: Banknote,
    },
    {
      labelKey: "Timetable",
      href: "/student/timetable",
      icon: CalendarDays,
    },
  ],

  TEACHER: [
    {
      labelKey: "Classes",
      href: "/teacher/classes",
      icon: School,
    },
    {
      labelKey: "Assignments",
      href: "/teacher/assignments",
      icon: ClipboardList,
    },
    {
      labelKey: "Attendance",
      href: "/teacher/attendance",
      icon: CalendarDays,
    },
    {
      labelKey: "Results",
      href: "/teacher/results",
      icon: GraduationCap,
    },
  ],

  PARENT: [
    {
      labelKey: "Children",
      href: "/parent/children",
      icon: Baby,
    },
    {
      labelKey: "Fees",
      href: "/parent/fees",
      icon: Banknote,
    },
    {
      labelKey: "Attendance",
      href: "/parent/attendance",
      icon: ClipboardList,
    },
  ],
};

export const filterNavItems = (
  items: NavItem[],
  can: (module: ModuleKey, action?: "canRead") => boolean,
): NavItem[] =>
  items.filter((item) => !item.module || can(item.module, "canRead"));
