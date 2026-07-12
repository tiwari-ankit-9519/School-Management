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
  Baby,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  labelKey: string;
  href: string;
  icon: LucideIcon;
}

export type UserRole = "ADMIN" | "STUDENT" | "TEACHER" | "PARENT" | "MODERATOR";

export const NAV_CONFIG: Record<UserRole, NavItem[]> = {
  ADMIN: [
    {
      labelKey: "dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      labelKey: "Admission Applications",
      href: "/admin/admission-applications",
      icon: FileCheck,
    },
    {
      labelKey: "Teacher Applications",
      href: "/admin/teacher-applications",
      icon: UserPlus,
    },
    {
      labelKey: "Academic Year",
      href: "/admin/academic-year",
      icon: CalendarRange,
    },
    {
      labelKey: "Subjects",
      href: "/admin/subjects",
      icon: BookOpen,
    },
    {
      labelKey: "Classes",
      href: "/admin/classes",
      icon: School,
    },
    {
      labelKey: "Students",
      href: "/admin/students",
      icon: GraduationCap,
    },
    {
      labelKey: "Teachers",
      href: "/admin/teachers",
      icon: UsersRound,
    },
    {
      labelKey: "Moderators",
      href: "/admin/moderators",
      icon: UserCog,
    },
    {
      labelKey: "Fees",
      href: "/admin/fees",
      icon: Banknote,
    },
    {
      labelKey: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ],

  MODERATOR: [
    {
      labelKey: "dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      labelKey: "Admission Applications",
      href: "/admin/admission-applications",
      icon: FileCheck,
    },
    {
      labelKey: "Teacher Applications",
      href: "/admin/teacher-applications",
      icon: UserPlus,
    },
    {
      labelKey: "Academic Year",
      href: "/admin/academic-year",
      icon: CalendarRange,
    },
    {
      labelKey: "Subjects",
      href: "/admin/subjects",
      icon: BookOpen,
    },
    {
      labelKey: "Classes",
      href: "/admin/classes",
      icon: School,
    },
    {
      labelKey: "Students",
      href: "/admin/students",
      icon: GraduationCap,
    },
    {
      labelKey: "Teachers",
      href: "/admin/teachers",
      icon: UsersRound,
    },
    {
      labelKey: "Moderators",
      href: "/admin/moderators",
      icon: UserCog,
    },
    {
      labelKey: "Fees",
      href: "/admin/fees",
      icon: Banknote,
    },
    {
      labelKey: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ],

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
