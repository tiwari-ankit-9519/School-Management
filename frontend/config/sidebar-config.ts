import {
  LayoutDashboard,
  School,
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
  labelKey: string;
  href: string;
}

export interface NavItem {
  labelKey: string;
  href?: string;
  icon: LucideIcon;
  children?: NavChild[];
}

export type UserRole = "ADMIN" | "STUDENT" | "TEACHER" | "PARENT";

export const NAV_CONFIG: Record<UserRole, NavItem[]> = {
  ADMIN: [
    {
      labelKey: "dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      labelKey: "schools",
      icon: School,
      children: [
        {
          labelKey: "Admission Applications",
          href: "/admin/admission-applications",
        },
        {
          labelKey: "Teacher Applications",
          href: `/admin/teacher-applications`,
        },
        {
          labelKey: "academic year",
          href: `/admin/academic-year`,
        },
        {
          labelKey: "subjects",
          href: `/admin/subjects`,
        },
        {
          labelKey: "classes",
          href: `/admin/classes`,
        },
      ],
    },
    {
      labelKey: "students",
      href: "/admin/students",
      icon: GraduationCap,
    },
    {
      labelKey: "teachers",
      href: "/admin/teachers",
      icon: UsersRound,
    },

    {
      labelKey: "fees",
      href: "/admin/fees",
      icon: Banknote,
    },
    {
      labelKey: "settings",
      href: "/admin/settings",
      icon: ClipboardList,
    },
  ],
  STUDENT: [
    {
      labelKey: "attendance",
      href: "/student/attendance",
      icon: ClipboardList,
    },
    {
      labelKey: "results",
      href: "/student/results",
      icon: GraduationCap,
    },
    {
      labelKey: "fees",
      href: "/student/fees",
      icon: Banknote,
    },
    {
      labelKey: "timetable",
      href: "/student/timetable",
      icon: CalendarDays,
    },
  ],
  TEACHER: [
    {
      labelKey: "classes",
      href: "/teacher/classes",
      icon: BookOpen,
    },
    {
      labelKey: "assignments",
      href: "/teacher/assignments",
      icon: ClipboardList,
    },
    {
      labelKey: "attendance",
      href: "/teacher/attendance",
      icon: CalendarDays,
    },
    {
      labelKey: "results",
      href: "/teacher/results",
      icon: GraduationCap,
    },
  ],
  PARENT: [
    {
      labelKey: "children",
      href: "/parent/children",
      icon: Baby,
    },
    {
      labelKey: "fees",
      href: "/parent/fees",
      icon: Banknote,
    },
    {
      labelKey: "attendance",
      href: "/parent/attendance",
      icon: ClipboardList,
    },
  ],
};
