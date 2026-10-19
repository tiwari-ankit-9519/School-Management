"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, UserPlus, LogIn, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "@/hooks/useTranslations";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";

const SCHOOL_CODE = "N.D.S.K.G.I.C.";

const NAV_LINKS = [
  { labelKey: "admission", href: "/admission", icon: GraduationCap },
  {
    labelKey: "teacherApplication",
    href: "/teacher-application",
    icon: UserPlus,
  },
] as const;

const isLinkActive = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);

export function FloatingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("navbar");
  const tCommon = useTranslations("common");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2"
    >
      <nav
        className={`flex items-center justify-between gap-3 rounded-full border py-2 pr-2 pl-4 transition-all duration-300 ${
          scrolled
            ? "border-border bg-background/95 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            : "border-border bg-background/80 backdrop-blur-lg"
        }`}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/logo.png"
            alt={SCHOOL_CODE}
            width={18}
            height={18}
            className="object-contain"
          />
          <span className="font-jakarta text-sm font-bold tracking-tight text-foreground">
            {SCHOOL_CODE}
          </span>
        </Link>

        <div className="hidden items-center gap-1.5 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = isLinkActive(pathname, link.href);
            return (
              <Button
                key={link.href}
                asChild
                size="sm"
                className={`h-8 gap-1.5 rounded-full px-3.5 font-manrope text-xs font-medium shadow-none ${
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-foreground/70 hover:bg-accent hover:text-foreground"
                }`}
              >
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                >
                  <link.icon className="size-3.5" />
                  {t(link.labelKey)}
                </Link>
              </Button>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <LanguageToggle />
          <ThemeToggle />
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full border-border bg-transparent px-4 font-manrope text-xs font-medium text-foreground/80 shadow-none hover:bg-accent hover:text-foreground"
          >
            <Link href="/login">
              <LogIn className="size-3.5" />
              {t("signIn")}
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("menu")}
                className="h-8 w-8 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 gap-0 border-border bg-background p-0 text-foreground"
            >
              <SheetHeader className="flex-row items-center gap-2 px-5 pt-5 pb-4">
                <Image
                  src="/logo.png"
                  alt={SCHOOL_CODE}
                  width={20}
                  height={20}
                  className="object-contain"
                />
                <SheetTitle className="font-jakarta text-sm font-bold text-foreground">
                  {SCHOOL_CODE}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  {t("menu")}
                </SheetDescription>
              </SheetHeader>

              <Separator />

              <div className="flex flex-col gap-1 p-3">
                {NAV_LINKS.map((link) => {
                  const isActive = isLinkActive(pathname, link.href);
                  return (
                    <SheetClose key={link.href} asChild>
                      <Button
                        asChild
                        variant="ghost"
                        className={`h-10 justify-start gap-3 rounded-lg px-3 font-manrope text-sm font-normal ${
                          isActive
                            ? "bg-accent font-medium text-foreground hover:bg-accent hover:text-foreground"
                            : "text-foreground/70 hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        <Link
                          href={link.href}
                          aria-current={isActive ? "page" : undefined}
                        >
                          <link.icon className="size-4" />
                          {t(link.labelKey)}
                        </Link>
                      </Button>
                    </SheetClose>
                  );
                })}
              </div>

              <div className="mt-auto space-y-3 p-3">
                <Separator />
                <div className="flex items-center justify-between px-1">
                  <span className="font-manrope text-xs text-muted-foreground">
                    {tCommon("toggleTheme")}
                  </span>
                  <ThemeToggle />
                </div>
                <SheetClose asChild>
                  <Button
                    asChild
                    className="h-10 w-full gap-2 rounded-full bg-primary font-manrope text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <Link href="/login">
                      <LogIn className="size-4" />
                      {t("signIn")}
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  );
}
