"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { GraduationCap, School, UserPlus, LogIn, Menu, X } from "lucide-react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Admission", href: "/admission", icon: GraduationCap },
  {
    label: "School Application",
    href: "/school-application/apply",
    icon: School,
  },
  {
    label: "Teacher Application",
    href: "/teacher-application",
    icon: UserPlus,
  },
];

export function FloatingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMobileOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl"
      >
        <div
          className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border transition-all duration-300 ${
            scrolled
              ? "bg-[#060a14]/95 border-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl"
              : "bg-[#060a14]/80 border-white/8 backdrop-blur-lg"
          }`}
        >
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="EduSphere"
                width={16}
                height={16}
                className="object-contain"
              />
            </div>
            <span className="text-white text-sm font-bold font-jakarta tracking-tight">
              EduSphere
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-manrope font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-500/15 text-indigo-300 border border-indigo-400/20"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }`}
                >
                  <link.icon className="h-3.5 w-3.5" />
                  {link.label}
                </a>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <a
              href="/login"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-manrope font-medium text-white/60 hover:text-white hover:bg-white/5 border border-white/8 hover:border-white/15 transition-all duration-200"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </a>
          </div>

          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/8 transition-all"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 bg-[#060a14]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            >
              <div className="p-2 space-y-0.5">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-manrope transition-all duration-200 ${
                        isActive
                          ? "bg-indigo-500/15 text-indigo-300"
                          : "text-white/50 hover:text-white/80 hover:bg-white/5"
                      }`}
                    >
                      <link.icon className="h-4 w-4 shrink-0" />
                      {link.label}
                    </a>
                  );
                })}
              </div>
              <div className="px-2 pb-2">
                <div className="h-px bg-white/6 mb-2" />
                <a
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-manrope font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-200"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
