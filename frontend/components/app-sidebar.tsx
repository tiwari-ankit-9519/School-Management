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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, ChevronDown, Sparkles } from "lucide-react";
import { NAV_CONFIG, UserRole, NavItem } from "@/config/sidebar-config";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLogout } from "@/hooks/useAuth";
import { useTranslations } from "@/hooks/useTranslations";
import { LanguageToggle } from "@/components/LanguageToggle";

const SCHOOL_NAME = "Nageshwari Devi Shree Krishna Girls Inter College";
const SCHOOL_CODE = "N.D.S.K.G.I.C.";

const sidebarCssVars = {
  "--sidebar-background": "#030712",
  "--sidebar-foreground": "rgba(255,255,255,0.5)",
  "--sidebar-primary": "#6366f1",
  "--sidebar-primary-foreground": "#fff",
  "--sidebar-accent": "rgba(255,255,255,0.04)",
  "--sidebar-accent-foreground": "rgba(255,255,255,0.9)",
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
        className={`group relative flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 font-manrope text-sm overflow-hidden ${
          isActive
            ? "bg-linear-to-r from-indigo-500/20 via-indigo-500/10 to-transparent text-indigo-200 font-semibold shadow-inner shadow-indigo-500/10"
            : "text-zinc-400 hover:text-zinc-200 hover:bg-white/3"
        }`}
      >
        {/* Active subtle left border accent line */}
        {isActive && (
          <motion.div
            layoutId="active-pill"
            className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-linear-to-b from-indigo-400 to-indigo-600 rounded-r-full shadow-lg shadow-indigo-500/50"
          />
        )}

        <div
          className={`p-1.5 rounded-lg transition-colors duration-200 ${
            isActive
              ? "bg-indigo-500/20 text-indigo-400 shadow-sm"
              : "bg-white/2 text-zinc-400 group-hover:text-zinc-200 group-hover:bg-white/5"
          }`}
        >
          <item.icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
        </div>

        <span className="tracking-wide text-xs">
          {t(item.labelKey as Parameters<typeof t>[0])}
        </span>

        {isActive && (
          <motion.div
            layoutId="active-indicator"
            className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"
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
    ADMIN: "Administrator",
    STUDENT: "Student Portal",
    TEACHER: "Faculty Member",
    PARENT: "Parent Account",
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
      className="border-r border-white/[0.07] bg-[#030712] shadow-2xl"
    >
      {/* Brand Header */}
      <SidebarHeader className="px-5 py-6 border-b border-white/6 bg-[#030712]/80 backdrop-blur-xl relative">
        <div className="absolute inset-0 bg-linear-to-b from-indigo-500/3 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-indigo-500/30 to-purple-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/10 group-hover:scale-105 transition-transform">
            <Image
              src="/logo.png"
              alt={SCHOOL_NAME}
              width={22}
              height={22}
              className="object-contain drop-shadow"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-white text-sm font-bold font-jakarta tracking-wide block leading-none">
                {SCHOOL_CODE}
              </span>
              <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
            </div>
            <span
              className="text-zinc-500 text-[10px] font-manrope truncate block max-w-40 mt-1"
              title={SCHOOL_NAME}
            >
              {SCHOOL_NAME}
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation Links */}
      <SidebarContent className="px-3 py-5 bg-[#030712] scrollbar-thin scrollbar-thumb-white/10">
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-zinc-600 uppercase font-jakarta">
              Menu
            </div>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <NavItemRow key={item.labelKey} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer Profile & Controls */}
      <SidebarFooter className="px-3 py-4 border-t border-white/6 bg-[#030712]/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-2 mb-3">
          <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider font-jakarta">
            Preferences
          </span>
          <div className="bg-white/3 border border-white/6 rounded-lg p-0.5">
            <LanguageToggle />
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/2 border border-white/6 hover:bg-white/5 hover:border-white/10 transition-all duration-200 group text-left shadow-sm">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
                  <User className="h-4 w-4 text-indigo-400" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#030712]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-200 text-xs font-jakarta font-semibold truncate group-hover:text-white transition-colors">
                  {user?.email ?? "—"}
                </p>
                <p className="text-indigo-400/80 text-[10px] font-medium font-manrope">
                  {role ? roleLabel[role] : ""}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-56 bg-[#090d16] border border-white/10 rounded-2xl shadow-2xl p-1.5 mb-2 backdrop-blur-2xl"
          >
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl font-manrope text-xs cursor-pointer transition-colors font-medium"
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
      <div className="flex min-h-screen w-full bg-[#02040a]">
        <AppSidebarInner />
        <div className="flex-1 flex flex-col min-w-0 bg-[#030712]">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/6 bg-[#030712]/80 backdrop-blur-md md:hidden sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-zinc-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5" />
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-bold font-jakarta tracking-wide">
                  {SCHOOL_CODE}
                </span>
              </div>
            </div>
          </div>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
