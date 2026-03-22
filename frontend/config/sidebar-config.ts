import {
  LayoutDashboard,
  School,
  Users,
  BookOpen,
  ClipboardList,
  CalendarDays,
  Banknote,
  GraduationCap,
  UsersRound,
  Baby,
  type LucideIcon,
} from "lucide-react";

export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  children?: NavChild[];
}

export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "STUDENT"
  | "TEACHER"
  | "PARENT";

export const NAV_CONFIG: Record<UserRole, NavItem[]> = {
  SUPER_ADMIN: [
    {
      label: "Dashboard",
      href: "/super-admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Schools",
      icon: School,
      children: [
        { label: "Applications", href: "/super-admin/view-applications" },
      ],
    },
    {
      label: "Users",
      href: "/super-admin/users",
      icon: Users,
    },
  ],
  ADMIN: [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Students",
      href: "/admin/students",
      icon: GraduationCap,
    },
    {
      label: "Teachers",
      href: "/admin/teachers",
      icon: UsersRound,
    },
    {
      label: "Classes",
      href: "/admin/classes",
      icon: BookOpen,
    },
    {
      label: "Fees",
      href: "/admin/fees",
      icon: Banknote,
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: ClipboardList,
    },
  ],
  STUDENT: [
    {
      label: "Attendance",
      href: "/student/attendance",
      icon: ClipboardList,
    },
    {
      label: "Results",
      href: "/student/results",
      icon: GraduationCap,
    },
    {
      label: "Fees",
      href: "/student/fees",
      icon: Banknote,
    },
    {
      label: "Timetable",
      href: "/student/timetable",
      icon: CalendarDays,
    },
  ],
  TEACHER: [
    {
      label: "Classes",
      href: "/teacher/classes",
      icon: BookOpen,
    },
    {
      label: "Assignments",
      href: "/teacher/assignments",
      icon: ClipboardList,
    },
    {
      label: "Attendance",
      href: "/teacher/attendance",
      icon: CalendarDays,
    },
    {
      label: "Results",
      href: "/teacher/results",
      icon: GraduationCap,
    },
  ],
  PARENT: [
    {
      label: "Children",
      href: "/parent/children",
      icon: Baby,
    },
    {
      label: "Fees",
      href: "/parent/fees",
      icon: Banknote,
    },
    {
      label: "Attendance",
      href: "/parent/attendance",
      icon: ClipboardList,
    },
  ],
};
