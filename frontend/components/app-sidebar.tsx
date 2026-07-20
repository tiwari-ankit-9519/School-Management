"use client";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User, ChevronDown } from "lucide-react";
import { NAV_CONFIG, UserRole, NavItem } from "@/config/sidebar-config";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLogout } from "@/hooks/useAuth";
import { useTranslations } from "@/hooks/useTranslations";
import { LanguageToggle } from "@/components/LanguageToggle";

const SCHOOL_NAME = "Nageshwari Devi Shree Krishna Girls Inter College";
const SCHOOL_CODE = "N.D.S.K.G.I.C.";

const sidebarCssVars = {
  "--sidebar-background": "#060a14",
  "--sidebar-foreground": "rgba(255,255,255,0.5)",
  "--sidebar-primary": "#6366f1",
  "--sidebar-primary-foreground": "#fff",
  "--sidebar-accent": "rgba(255,255,255,0.05)",
  "--sidebar-accent-foreground": "rgba(255,255,255,0.8)",
  "--sidebar-border": "rgba(255,255,255,0.06)",
  "--sidebar-ring": "#6366f1",
} as React.CSSProperties;

function NavItemRow({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const isActive = item.href ? pathname === item.href : false;
  return (
    <SidebarMenuItem>
      <Link
        href={item.href ?? "#"}
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-manrope text-sm ${
          isActive
            ? "bg-indigo-500/15 text-indigo-300 font-medium"
            : "text-white/50 hover:text-white/80 hover:bg-white/5"
        }`}
      >
        <item.icon
          className={`h-4 w-4 shrink-0 transition-colors ${
            isActive
              ? "text-indigo-400"
              : "text-white/30 group-hover:text-white/60"
          }`}
        />
        <span>{t(item.labelKey as Parameters<typeof t>[0])}</span>
        {isActive && (
          <motion.div
            layoutId="active-indicator"
            className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400"
          />
        )}
      </Link>
    </SidebarMenuItem>
  );
}

function AppSidebarInner() {
  const { user } = useAuthStore();
  const { mutate: logout } = useLogout();
  const router = useRouter();
  const t = useTranslations("common");
  const role = user?.role as UserRole | undefined;
  const navItems = role && NAV_CONFIG[role] ? NAV_CONFIG[role] : [];
  const roleLabel: Record<UserRole, string> = {
    ADMIN: "Admin",
    STUDENT: "Student",
    TEACHER: "Teacher",
    PARENT: "Parent",
    MODERATOR: "Moderator",
  };
  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => router.push("/login"),
    });
  };
  return (
    <Sidebar
      style={sidebarCssVars}
      className="border-r border-white/8 bg-[#060a14]"
    >
      <SidebarHeader className="px-4 py-5 border-b border-white/6 bg-[#060a14]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <Image
              src="/logo.png"
              alt={SCHOOL_NAME}
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="text-white text-sm font-bold font-jakarta tracking-tight block leading-none">
              {SCHOOL_CODE}
            </span>
            <span
              className="text-white/30 text-[10px] font-manrope truncate block max-w-40"
              title={SCHOOL_NAME}
            >
              {SCHOOL_NAME}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 py-4 bg-[#060a14]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.map((item) => (
                <NavItemRow key={item.labelKey} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-3 py-4 border-t border-white/6 bg-[#060a14]">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-white/20 text-[10px] font-manrope">
            Language
          </span>
          <LanguageToggle />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all duration-200 group">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-white/80 text-xs font-jakarta font-semibold truncate">
                  {user?.email ?? "—"}
                </p>
                <p className="text-white/30 text-[10px] font-manrope">
                  {role ? roleLabel[role] : ""}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-white/25 group-hover:text-white/50 transition-colors shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-56 bg-[#0c1220] border border-white/10 rounded-xl shadow-xl mb-1"
          >
            <DropdownMenuItem className="flex items-center gap-2.5 px-3 py-2.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg font-manrope text-xs cursor-pointer">
              <Settings className="h-3.5 w-3.5" />
              {t("settings")}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/8" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2.5 text-red-400/80 hover:text-red-400 hover:bg-red-500/8 rounded-lg font-manrope text-xs cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AppSidebar({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider style={sidebarCssVars}>
      <div className="flex min-h-screen w-full bg-[#050810]">
        <AppSidebarInner />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/6 bg-[#050810] md:hidden">
            <SidebarTrigger className="text-white/50 hover:text-white transition-colors" />
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-bold font-jakarta">
                {SCHOOL_CODE}
              </span>
            </div>
          </div>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
