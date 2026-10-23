"use client";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "@/hooks/useTranslations";

export const ROUND_ICON_BUTTON_CLASS =
  "relative h-10 w-10 rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground dark:border-border dark:bg-card dark:hover:bg-accent";

interface NotificationBellProps {
  unreadCount?: number;
}

export const NotificationBell = ({
  unreadCount = 0,
}: NotificationBellProps) => {
  const t = useTranslations("sidebar");
  const hasUnread = unreadCount > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={
            hasUnread
              ? `${t("notifications")} (${unreadCount} ${t("unread")})`
              : t("notifications")
          }
          className={ROUND_ICON_BUTTON_CLASS}
        >
          <Bell className="size-4.5" />
          {hasUnread && (
            <span
              className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card"
              aria-hidden="true"
            />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 rounded-xl p-1.5"
      >
        <DropdownMenuLabel className="flex items-center justify-between px-2.5 py-2">
          <span className="font-jakarta text-sm font-semibold text-foreground">
            {t("notifications")}
          </span>
          {hasUnread && (
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 font-manrope text-[10px] font-semibold text-red-600 dark:text-red-400">
              {unreadCount} {t("unread")}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <BellOff className="size-4 text-muted-foreground" />
          </span>
          <p className="font-jakarta text-sm font-semibold text-foreground">
            {t("noNotificationsTitle")}
          </p>
          <p className="font-manrope text-xs text-muted-foreground">
            {t("noNotificationsSub")}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
