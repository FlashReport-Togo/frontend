"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";

import { alertsApi } from "@/lib/endpoints/alerts";
import { cn } from "@/lib/utils";

export function NotificationsPanel() {
  const queryClient = useQueryClient();

  const { data: unread } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: alertsApi.unreadCount,
    refetchInterval: 60_000,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => alertsApi.notifications({ page: 1 }),
  });

  const markAllRead = async () => {
    await alertsApi.markAllRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const count = unread?.unread_count ?? 0;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle text-secondary hover:bg-surface hover:text-primary"
        >
          <Bell size={18} strokeWidth={1.75} />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-severity-critical px-1 font-mono text-[10px] font-medium text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-xl border border-border-subtle bg-surface-elevated shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <span className="text-sm font-semibold text-primary">Notifications</span>
            {count > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-accent-blue hover:underline"
              >
                <CheckCheck size={14} /> Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {!notifications || notifications.results.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-secondary">Aucune notification.</p>
            ) : (
              notifications.results.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "border-b border-border-subtle px-4 py-3 last:border-b-0",
                    !n.is_read && "bg-accent-blue/5"
                  )}
                >
                  <p className="text-sm text-primary">{n.message}</p>
                  <p className="mt-1 font-mono text-xs text-secondary">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              ))
            )}
          </div>

          <Link
            href="/alerts"
            className="block border-t border-border-subtle px-4 py-2.5 text-center text-sm font-medium text-accent-blue hover:underline"
          >
            Voir toutes les alertes
          </Link>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
