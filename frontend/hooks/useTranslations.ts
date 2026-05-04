import { useLocale } from "@/lib/locale-context";
import { getTranslations } from "@/lib/translation";

type Messages = typeof import("@/messages/en.json");
type Namespace = keyof Messages;

export function useTranslations<N extends Namespace>(namespace: N) {
  const { locale } = useLocale();
  return getTranslations(locale, namespace);
}
