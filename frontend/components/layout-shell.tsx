"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { AppSidebar } from "@/components/app-sidebar";
import { FloatingNavbar } from "@/components/floating-navbar";

const PUBLIC_PATHS = [
  "/login",
  "/admission",
  "/school-application",
  "/teacher-application",
];

const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const pathname = usePathname();

  if (!isAuthenticated || isPublicPath(pathname)) {
    return (
      <>
        <FloatingNavbar />
        {children}
      </>
    );
  }

  return <AppSidebar>{children}</AppSidebar>;
}
