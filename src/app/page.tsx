"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/store/auth-store";

export default function RootPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [hydrated, setHydrated] = useState(false);

  // zustand/persist réhydrate depuis localStorage après le premier rendu : on attend
  // ce tick avant de décider où rediriger, sinon on renvoie toujours vers /login même
  // pour un utilisateur déjà connecté (le token n'est pas encore lu).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- détection de montage (réhydratation localStorage)
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(accessToken ? "/dashboard" : "/login");
  }, [hydrated, accessToken, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-accent-blue" />
    </div>
  );
}
