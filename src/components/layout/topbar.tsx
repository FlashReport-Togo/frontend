"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, Menu, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { ROLE_LABELS, useAuthStore } from "@/store/auth-store";

import { NotificationsPanel } from "./notifications-panel";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) return null;

  const scopeLabel = user.district_name ?? user.region_name ?? "Portée nationale";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-elevated px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-secondary hover:bg-surface hover:text-primary lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="hidden flex-col sm:flex">
          <span className="text-sm font-medium text-primary">{ROLE_LABELS[user.role]}</span>
          <span className="text-xs text-secondary">{scopeLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationsPanel />

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg border border-border-subtle px-2.5 py-1.5 hover:bg-surface"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-blue/15 text-xs font-semibold text-accent-blue">
                {user.first_name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
              </span>
              <span className="hidden text-sm font-medium text-primary sm:inline">
                {user.first_name} {user.last_name}
              </span>
              <ChevronDown size={14} className="text-secondary" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 w-56 rounded-xl border border-border-subtle bg-surface-elevated p-1.5 shadow-xl"
            >
              <div className="px-2.5 py-2">
                <p className="text-sm font-medium text-primary">
                  {user.first_name} {user.last_name}
                </p>
                <p className="truncate text-xs text-secondary">{user.email}</p>
              </div>
              <DropdownMenu.Separator className="my-1 h-px bg-border-subtle" />
              <DropdownMenu.Item asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-primary outline-none hover:bg-surface"
                >
                  <User size={16} strokeWidth={1.75} /> Mon profil
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-primary outline-none hover:bg-surface"
                >
                  <Settings size={16} strokeWidth={1.75} /> Paramètres
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border-subtle" />
              <DropdownMenu.Item
                onSelect={handleLogout}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-severity-critical outline-none hover:bg-severity-critical/10"
              >
                <LogOut size={16} strokeWidth={1.75} /> Se déconnecter
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
