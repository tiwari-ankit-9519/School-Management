"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { fadeUp } from "@/components/dashboard/DashboardWidgets";
import { useTranslations } from "@/hooks/useTranslations";

export interface BannerChip {
  key: string;
  label: string;
  count: number;
  href: string;
}

interface DashboardBannerProps {
  name: string;
  headline: string;
  email: string | null;
  phone: string | null;
  chips: BannerChip[];
  delay: number;
}

const BannerIllustration = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 300 180"
    className={className}
    fill="none"
    aria-hidden="true"
  >
    <ellipse
      cx="160"
      cy="168"
      rx="120"
      ry="8"
      fill="#0c4a6e"
      fillOpacity="0.18"
    />
    <g>
      <rect
        x="112"
        y="34"
        width="86"
        height="122"
        rx="14"
        fill="#e0f2fe"
        stroke="#0284c7"
        strokeWidth="3"
      />
      <rect x="122" y="46" width="66" height="96" rx="8" fill="#ffffff" />
      <rect x="132" y="58" width="46" height="6" rx="3" fill="#bae6fd" />
      <rect x="132" y="72" width="34" height="6" rx="3" fill="#e0f2fe" />
      <rect x="132" y="86" width="40" height="6" rx="3" fill="#e0f2fe" />
      <circle cx="155" cy="149" r="3" fill="#7dd3fc" />
    </g>
    <g>
      <path
        d="M108 30 L155 10 L202 30 L155 50 Z"
        fill="#38bdf8"
        stroke="#0369a1"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M128 39 V54 C128 60 182 60 182 54 V39 L155 50 Z"
        fill="#0ea5e9"
        stroke="#0369a1"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M155 30 L196 36 V60"
        stroke="#facc15"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx="196"
        cy="64"
        r="5"
        fill="#facc15"
        stroke="#ca8a04"
        strokeWidth="1.5"
      />
    </g>
    <g>
      <path
        d="M52 132 C70 122 88 122 104 130 V160 C88 152 70 152 52 162 Z"
        fill="#ffffff"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M104 130 C120 122 138 122 156 132 V162 C138 152 120 152 104 160 Z"
        fill="#f0f9ff"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M62 138 C74 133 86 133 96 137 M62 146 C74 141 86 141 96 145 M112 137 C122 133 134 133 146 138 M112 145 C122 141 134 141 146 146"
        stroke="#bae6fd"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
    <g>
      <rect
        x="214"
        y="44"
        width="58"
        height="76"
        rx="8"
        fill="#fef3c7"
        stroke="#f59e0b"
        strokeWidth="2.5"
        transform="rotate(8 243 82)"
      />
      {[0, 1, 2, 3].map((index) => (
        <circle
          key={index}
          cx={226 + index * 12}
          cy={46}
          r="4"
          fill="#ffffff"
          stroke="#f59e0b"
          strokeWidth="2"
          transform="rotate(8 243 82)"
        />
      ))}
      <path
        d="M226 66 H260 M226 78 H254 M226 90 H258 M226 102 H248"
        stroke="#fcd34d"
        strokeWidth="3"
        strokeLinecap="round"
        transform="rotate(8 243 82)"
      />
    </g>
    <g transform="rotate(-38 238 140)">
      <rect
        x="196"
        y="132"
        width="68"
        height="16"
        rx="3"
        fill="#facc15"
        stroke="#ca8a04"
        strokeWidth="2"
      />
      <rect
        x="196"
        y="132"
        width="12"
        height="16"
        rx="3"
        fill="#f9a8d4"
        stroke="#db2777"
        strokeWidth="2"
      />
      <rect x="206" y="132" width="5" height="16" fill="#cbd5e1" />
      <path
        d="M264 132 L282 140 L264 148 Z"
        fill="#fde68a"
        stroke="#ca8a04"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M276 137.5 L282 140 L276 142.5 Z" fill="#334155" />
    </g>
    <circle cx="40" cy="40" r="4" fill="#ffffff" fillOpacity="0.7" />
    <circle cx="282" cy="24" r="3" fill="#ffffff" fillOpacity="0.7" />
    <circle cx="96" cy="96" r="2.5" fill="#fde68a" />
  </svg>
);

export const DashboardBanner = ({
  name,
  headline,
  email,
  phone,
  chips,
  delay,
}: DashboardBannerProps) => {
  const t = useTranslations("adminDashboard");
  const visibleChips = chips.filter((chip) => chip.count > 0);

  return (
    <motion.div {...fadeUp(delay)}>
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-sky-400 via-sky-500 to-cyan-400 px-6 py-6 text-white sm:px-8 sm:py-7 dark:from-sky-700 dark:via-sky-800 dark:to-cyan-800">
        <span
          className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-white/10"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-full md:max-w-[58%]">
          <p className="font-manrope text-sm text-white/85">
            {t("welcomeBack")}, {name}
          </p>
          <h2 className="mt-1.5 font-jakarta text-xl leading-snug font-bold sm:text-2xl">
            {headline}
          </h2>

          {(email || phone) && (
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1.5 font-manrope text-xs text-white/90">
              {email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {email}
                </span>
              )}
              {phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" />
                  {phone}
                </span>
              )}
            </div>
          )}

          {visibleChips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {visibleChips.map((chip) => (
                <Link
                  key={chip.key}
                  href={chip.href}
                  className="group flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 font-manrope text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                >
                  <span className="font-jakarta font-bold">{chip.count}</span>
                  {chip.label}
                  <ArrowUpRight className="size-3 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <BannerIllustration className="pointer-events-none absolute right-2 bottom-0 hidden h-[170px] w-auto md:block lg:right-6" />
      </div>
    </motion.div>
  );
};
