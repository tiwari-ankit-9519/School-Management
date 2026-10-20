"use client";
import { ReactNode, useSyncExternalStore } from "react";
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
import { Separator } from "@/components/ui/separator";
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

type GreetingKey = "greetingMorning" | "greetingAfternoon" | "greetingEvening";

const NAV_BUTTON_CLASS =
  "h-10 gap-3 rounded-xl px-3 font-manrope text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground data-[active=true]:bg-transparent data-[active=true]:font-semibold data-[active=true]:text-foreground [&>svg]:size-[18px]";

const subscribeMinutes = (callback: () => void) => {
  const id = setInterval(callback, 60_000);
  return () => clearInterval(id);
};

const getGreetingKey = (): GreetingKey => {
  const hour = new Date().getHours();
  if (hour < 12) return "greetingMorning";
  if (hour < 17) return "greetingAfternoon";
  return "greetingEvening";
};

const getServerGreetingKey = (): GreetingKey | null => null;

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

const getProfilePhoto = (profile?: MyProfile): string | null => {
  if (!profile) return null;
  if (isTeacherProfile(profile)) return profile.teacher?.photoUrl ?? null;
  if (isStudentProfile(profile) || isParentProfile(profile)) return null;
  return profile.admin?.photoUrl ?? null;
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
    firstName: firstName || fallbackName,
    initials,
    photoUrl: getProfilePhotoUrl(profile),
  };
}

const findActiveHref = (
  pathname: string,
  items: NavItem[],
): string | undefined =>
  items
    .map((item) => item.href)
    .filter(
      (href): href is string =>
        !!href && (pathname === href || pathname.startsWith(`${href}/`)),
    )
    .sort((a, b) => b.length - a.length)[0];

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
  const activeHref = findActiveHref(pathname, navItems);
  const isProfileActive =
    pathname === PROFILE_PATH || pathname.startsWith(`${PROFILE_PATH}/`);

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
  const { role, email, fullName, firstName, initials, photoUrl } =
    useCurrentUserIdentity();
  const handleLogout = useLogoutAction();
  const t = useTranslations("sidebar");
  const tCommon = useTranslations("common");
  const greetingKey = useSyncExternalStore(
    subscribeMinutes,
    getGreetingKey,
    getServerGreetingKey,
  );
  const roleLabel = role ? t(ROLE_LABEL_KEYS[role]) : "";
  const greeting = greetingKey ? t(greetingKey) : t("welcomeBack");

  return (
    <header className="sticky top-0 z-30 px-2 pt-2 md:pr-3">
      <div className="flex h-16 items-center gap-3 rounded-2xl border border-border bg-card/90 px-3 backdrop-blur-xl sm:px-4">
        <SidebarTrigger className="text-muted-foreground hover:bg-accent hover:text-foreground" />
        <Separator orientation="vertical" className="h-5" />
        <div className="min-w-0">
          <p className="truncate font-jakarta text-sm font-semibold text-foreground">
            {firstName ? `${greeting}, ${firstName}` : greeting}
          </p>
          <p className="hidden truncate font-manrope text-xs text-muted-foreground sm:block">
            {SCHOOL_NAME}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <LanguageToggle />
          </div>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-11 gap-2.5 rounded-full py-1 pr-2 pl-1 hover:bg-accent data-[state=open]:bg-accent"
              >
                <Avatar className="h-9 w-9">
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
                <span className="hidden max-w-44 min-w-0 text-left md:block">
                  <span className="block truncate font-jakarta text-sm font-semibold text-foreground">
                    {fullName || "—"}
                  </span>
                  <span className="block truncate font-manrope text-[11px] font-normal text-muted-foreground">
                    {roleLabel || email || "—"}
                  </span>
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
        <main className="flex-1 px-2 pt-4 pb-6 md:pr-3">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
