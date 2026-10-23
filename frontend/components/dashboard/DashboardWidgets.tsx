export const EASE = [0.16, 1, 0.3, 1] as const;

export const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: EASE },
});

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN").format(value);

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const CARD_CLASS =
  "gap-0 rounded-2xl border-border bg-card py-0 text-foreground shadow-none";

export const TONE_CLASSES = {
  amber:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  emerald:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  red: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
  indigo:
    "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  violet:
    "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
} as const;

export type Tone = keyof typeof TONE_CLASSES;
