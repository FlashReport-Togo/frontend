"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Info, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { QualityCheckResult } from "@/types";

const SEVERITY_ICON = { info: Info, avertissement: AlertTriangle, bloquant: XCircle } as const;
const SEVERITY_COLOR = {
  info: "border-l-accent-blue text-accent-blue",
  avertissement: "border-l-severity-medium text-severity-medium",
  bloquant: "border-l-severity-critical text-severity-critical",
} as const;

export function QualityCheckList({ reportId, checks }: { reportId: string; checks: QualityCheckResult[] }) {
  const queryClient = useQueryClient();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  if (checks.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Aucune anomalie détectée"
        description="Ce rapport n'a déclenché aucun contrôle qualité."
      />
    );
  }

  const resolve = async (checkId: string) => {
    setResolvingId(checkId);
    try {
      await api.patch(`/quality-checks/${checkId}/resolve/`, {});
      toast.success("Anomalie marquée comme résolue.");
      queryClient.invalidateQueries({ queryKey: ["reports", reportId] });
    } catch {
      toast.error("Impossible de résoudre cette anomalie.");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <ul className="flex flex-col gap-2.5">
      {checks.map((check) => {
        const Icon = SEVERITY_ICON[check.severity];
        return (
          <li
            key={check.id}
            className={cn(
              "flex items-start justify-between gap-4 rounded-lg border-l-[3px] bg-surface px-4 py-3",
              SEVERITY_COLOR[check.severity]
            )}
          >
            <div className="flex items-start gap-3">
              <Icon size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-primary">{check.message}</p>
                {check.is_resolved && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-severity-low">
                    <CheckCircle2 size={12} /> Résolue
                    {check.resolution_note ? ` — ${check.resolution_note}` : ""}
                  </p>
                )}
              </div>
            </div>
            {!check.is_resolved && (
              <Button
                variant="secondary"
                size="sm"
                loading={resolvingId === check.id}
                onClick={() => resolve(check.id)}
              >
                Résoudre
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
