"use client";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTranslations } from "@/hooks/useTranslations";

const subscribe = () => () => {};

export function ThemeToggle() {
  const t = useTranslations("common");
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <ToggleGroup
      type="single"
      value={mounted ? (resolvedTheme ?? "") : ""}
      onValueChange={(next: string) => {
        if (next === "light" || next === "dark") setTheme(next);
      }}
      aria-label={t("toggleTheme")}
      className="gap-0.5 rounded-full border border-border bg-muted p-0.5"
    >
      <ToggleGroupItem
        value="light"
        aria-label={t("themeLight")}
        className="h-7 w-7 rounded-full! p-0 text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
      >
        <Sun className="size-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dark"
        aria-label={t("themeDark")}
        className="h-7 w-7 rounded-full! p-0 text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
      >
        <Moon className="size-3.5" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
