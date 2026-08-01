"use client";

import { LogOut, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/logo";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

import { NAV_ITEMS } from "./nav-config";

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);
  const logout = useAuthStore((s) => s.logout);

  if (!role) return null;
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <Logo size={30} />
        <span className="text-[15px] font-semibold tracking-tight text-primary">FlashReport</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-lg p-1.5 text-secondary hover:text-primary lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent-blue/10 text-accent-blue"
                      : "text-secondary hover:bg-surface hover:text-primary"
                  )}
                >
                  <Icon size={18} strokeWidth={1.75} className="shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border-subtle p-3">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-surface hover:text-severity-critical"
        >
          <LogOut size={18} strokeWidth={1.75} />
          Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-border-subtle bg-surface-elevated lg:block">
        {content}
      </aside>

      {/* Mobile (tiroir) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-surface-elevated shadow-xl">{content}</aside>
        </div>
      )}
    </>
  );
}
