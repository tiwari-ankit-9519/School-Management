"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type Locale = "en" | "hi";

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
} | null>(null);

function getInitialLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const saved = document.cookie.match(/locale=([^;]+)/)?.[1];
  return saved === "en" || saved === "hi" ? saved : "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = (l: Locale) => {
    document.cookie = `locale=${l};path=/;max-age=31536000`;
    setLocaleState(l);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
