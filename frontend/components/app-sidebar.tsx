"use client";
import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NAV_CONFIG, UserRole, NavItem } from "@/config/sidebar-config";
import { useAuthStore } from "@/stores/useAuthStore";
import { useLogout } from "@/hooks/useAuth";
import {
  getProfilePhotoUrl,
  isParentProfile,
  isStudentProfile,
  isTeacherProfile,
  useGetMyProfile,
} from "@/hooks/useProfile";
import { useTranslations } from "@/hooks/useTranslations";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  NotificationBell,
  ROUND_ICON_BUTTON_CLASS,
} from "@/components/NotificationBell";
import { MyProfile } from "@/types";

const SCHOOL_NAME = "Nageshwari Devi Shree Krishna Girls Inter College";
const SCHOOL_CODE = "N.D.S.K.G.I.C.";
const PROFILE_PATH = "/profile";

const ROLE_LABEL_KEYS = {
  ADMIN: "roleAdmin",
  STUDENT: "roleStudent",
  TEACHER: "roleTeacher",
  PARENT: "roleParent",
  MODERATOR: "roleModerator",
} as const satisfies Record<UserRole, string>;

const NAV_BUTTON_CLASS =
  "h-10 gap-3 rounded-xl px-3 font-manrope text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground data-[active=true]:bg-transparent data-[active=true]:font-semibold data-[active=true]:text-foreground [&>svg]:size-[18px]";

const getEmailName = (email?: string | null): string => {
  if (!email) return "";
  const local = email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();
  return local.charAt(0).toUpperCase() + local.slice(1);
};

const getProfileRecord = (profile?: MyProfile) => {
  if (!profile) return null;
  if (isStudentProfile(profile)) return profile.student;
  if (isTeacherProfile(profile)) return profile.teacher;
  if (isParentProfile(profile)) return profile.parent;
  return profile.admin;
};

function useCurrentUserIdentity() {
  const { user } = useAuthStore();
  const { data: profile } = useGetMyProfile();
  const record = getProfileRecord(profile);
  const firstName = record?.firstName?.trim() ?? "";
  const lastName = record?.lastName?.trim() ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const email = profile?.email ?? user?.email ?? null;
  const fallbackName = getEmailName(email);
  const initials = fullName
    ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    : email
      ? email.slice(0, 2).toUpperCase()
      : "—";

  return {
    role: user?.role as UserRole | undefined,
    email,
    fullName: fullName || fallbackName,
    initials,
    photoUrl: getProfilePhotoUrl(profile),
  };
}

const findActiveItem = (
  pathname: string,
  items: NavItem[],
): NavItem | undefined =>
  items
    .filter(
      (item) =>
        !!item.href &&
        (pathname === item.href || pathname.startsWith(`${item.href}/`)),
    )
    .sort((a, b) => (b.href?.length ?? 0) - (a.href?.length ?? 0))[0];

const isProfilePath = (pathname: string) =>
  pathname === PROFILE_PATH || pathname.startsWith(`${PROFILE_PATH}/`);

const ActiveBar = () => (
  <span
    aria-hidden="true"
    className="absolute top-1.5 bottom-1.5 -left-2 w-1 rounded-r-full bg-indigo-600 dark:bg-indigo-400"
  />
);

function NavItemRow({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const t = useTranslations("sidebar");
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      {isActive && <ActiveBar />}
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={NAV_BUTTON_CLASS}
      >
        <Link href={item.href ?? "#"} onClick={() => setOpenMobile(false)}>
          <item.icon
            className={isActive ? "text-indigo-600 dark:text-indigo-400" : ""}
          />
          <span>{t(item.labelKey as Parameters<typeof t>[0])}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function useLogoutAction() {
  const router = useRouter();
  const { mutate: logout } = useLogout();
  return () =>
    logout(undefined, {
      onSuccess: () => router.push("/login"),
    });
}

function AppSidebarInner() {
  const pathname = usePathname();
  const { role } = useCurrentUserIdentity();
  const handleLogout = useLogoutAction();
  const { setOpenMobile } = useSidebar();
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const navItems = role && NAV_CONFIG[role] ? NAV_CONFIG[role] : [];
  const isProfileActive = isProfilePath(pathname);
  const activeHref = findActiveItem(pathname, navItems)?.href;

  return (
    <Sidebar
      variant="floating"
      className="**:data-[sidebar=sidebar]:rounded-2xl **:data-[sidebar=sidebar]:border-sidebar-border **:data-[sidebar=sidebar]:shadow-none"
    >
      <SidebarHeader className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
            <Image
              src="/logo.png"
              alt={SCHOOL_NAME}
              width={22}
              height={22}
              className="object-contain"
            />
          </span>
          <div className="min-w-0">
            <p className="font-jakarta text-base font-bold tracking-tight text-foreground">
              {SCHOOL_CODE}
            </p>
            <p
              className="truncate font-manrope text-[10px] text-muted-foreground"
              title={SCHOOL_NAME}
            >
              {SCHOOL_NAME}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-2 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 font-manrope text-[10px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
            {t("menu")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => (
                <NavItemRow
                  key={item.labelKey}
                  item={item}
                  isActive={!isProfileActive && item.href === activeHref}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 font-manrope text-[10px] font-semibold tracking-widest text-muted-foreground/70 uppercase">
            {t("general")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                {isProfileActive && <ActiveBar />}
                <SidebarMenuButton
                  asChild
                  isActive={isProfileActive}
                  className={NAV_BUTTON_CLASS}
                >
                  <Link
                    href={PROFILE_PATH}
                    onClick={() => setOpenMobile(false)}
                  >
                    <UserRound
                      className={
                        isProfileActive
                          ? "text-indigo-600 dark:text-indigo-400"
                          : ""
                      }
                    />
                    <span>{t("myProfile")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className={`${NAV_BUTTON_CLASS} hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400`}
                >
                  <LogOut />
                  <span>{tCommon("logout")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function TopBar() {
  const pathname = usePathname();
  const { role, email, fullName, initials, photoUrl } =
    useCurrentUserIdentity();
  const handleLogout = useLogoutAction();
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const roleLabel = role ? t(ROLE_LABEL_KEYS[role]) : "";
  const navItems = role && NAV_CONFIG[role] ? NAV_CONFIG[role] : [];
  const activeItem = findActiveItem(pathname, navItems);
  const pageTitle = isProfilePath(pathname)
    ? t("myProfile")
    : activeItem
      ? t(activeItem.labelKey as Parameters<typeof t>[0])
      : "";

  return (
    <header className="sticky top-0 z-30 bg-background/80 px-2 backdrop-blur-xl supports-backdrop-filter:bg-background/60 md:pr-3">
      <div className="flex h-16 items-center gap-3 px-1 sm:px-2">
        <SidebarTrigger
          className={`${ROUND_ICON_BUTTON_CLASS} [&>svg]:size-4.5`}
          aria-label={t("toggleSidebar")}
        />
        {pageTitle && (
          <h2 className="truncate font-jakarta text-base font-semibold text-foreground sm:text-lg">
            {pageTitle}
          </h2>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          <div className="hidden sm:block">
            <LanguageToggle />
          </div>
          <ThemeToggle />
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="ml-1 h-12 gap-3 rounded-full py-1 pr-1 pl-1 hover:bg-accent data-[state=open]:bg-accent sm:pl-3"
              >
                <span className="hidden max-w-44 min-w-0 text-right md:block">
                  <span className="block truncate font-jakarta text-sm font-semibold text-foreground">
                    {fullName || "—"}
                  </span>
                  <span className="block truncate font-manrope text-[11px] font-normal text-muted-foreground">
                    {roleLabel || email || "—"}
                  </span>
                </span>
                <span className="relative">
                  <Avatar className="h-10 w-10 ring-2 ring-card">
                    {photoUrl && (
                      <AvatarImage
                        src={photoUrl}
                        alt={fullName}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-indigo-500/15 font-jakarta text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    aria-label={t("online")}
                    className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-background"
                  />
                </span>
                <ChevronDown className="hidden size-3.5 text-muted-foreground md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-64 rounded-xl p-1.5"
            >
              <DropdownMenuLabel className="flex items-center gap-2.5 px-2.5 py-2 font-normal">
                <Avatar className="h-9 w-9">
                  {photoUrl && (
                    <AvatarImage
                      src={photoUrl}
                      alt={fullName}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-indigo-500/15 font-jakarta text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate font-jakarta text-sm font-semibold text-foreground">
                    {fullName || "—"}
                  </span>
                  <span className="block truncate font-manrope text-[11px] text-muted-foreground">
                    {email ?? "—"}
                  </span>
                  {roleLabel && (
                    <span className="mt-0.5 block font-manrope text-[10px] font-medium text-indigo-600 dark:text-indigo-400">
                      {roleLabel}
                    </span>
                  )}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                asChild
                className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 font-manrope text-xs font-medium"
              >
                <Link href={PROFILE_PATH}>
                  <UserRound className="size-3.5" />
                  {t("myProfile")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleLogout}
                className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 font-manrope text-xs font-medium text-red-600 focus:bg-red-500/10 focus:text-red-700 dark:text-red-400 dark:focus:text-red-300"
              >
                <LogOut className="size-3.5 text-current" />
                {tCommon("logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export function AppSidebar({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebarInner />
      <SidebarInset className="min-w-0 bg-background">
        <TopBar />
        <main className="flex-1 px-2 pt-2 pb-6 md:pr-3">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
