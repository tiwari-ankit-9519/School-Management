import en from "@/messages/en.json";
import hi from "@/messages/hi.json";

const messages = { en, hi } as const;

type Messages = typeof en;
type Namespace = keyof Messages;
type Key<N extends Namespace> = keyof Messages[N] & string;

export function getTranslations<N extends Namespace>(
  locale: "en" | "hi",
  namespace: N,
) {
  const ns = messages[locale][namespace] as Record<string, string>;
  const fallback = messages["en"][namespace] as Record<string, string>;
  return (key: Key<N>): string => ns[key] ?? fallback[key] ?? key;
}
