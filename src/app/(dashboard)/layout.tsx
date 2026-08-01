"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { NAV_ITEMS } from "@/components/layout/nav-config";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { accountsApi } from "@/lib/endpoints/accounts";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useRealtimeNotifications();

  // zustand/persist réhydrate après le premier rendu (localStorage) : on attend un tick
  // pour éviter une redirection prématurée vers /login au rafraîchissement de page.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- détection de montage (réhydratation localStorage)
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !accessToken) router.replace("/login");
  }, [hydrated, accessToken, router]);

  useEffect(() => {
    if (!user) return;
    const matched = NAV_ITEMS.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );
    if (matched && !matched.roles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, pathname, router]);

  // Garde le profil à jour (rôle/périmètre) en tâche de fond
  const { data: freshUser } = useQuery({
    queryKey: ["me"],
    queryFn: accountsApi.me,
    enabled: !!accessToken,
  });

  useEffect(() => {
    if (freshUser && accessToken && refreshToken) {
      setSession({ access: accessToken, refresh: refreshToken, user: freshUser });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshUser]);

  if (!hydrated || !accessToken || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-accent-blue" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
