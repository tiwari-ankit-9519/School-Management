"use client";
import { useLocale } from "@/lib/locale-context";

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <button
      onClick={() => setLocale(locale === "en" ? "hi" : "en")}
      className="flex items-center gap-1.5 text-xs font-manrope text-white/40 hover:text-white/70 
                 border border-white/10 rounded-full px-3 py-1.5 transition-colors"
    >
      {locale === "en" ? "हिंदी में बदलें" : "Change to English"}
    </button>
  );
}
