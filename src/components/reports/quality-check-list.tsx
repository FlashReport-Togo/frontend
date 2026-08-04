"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Info, ShieldCheck, XCircle } from "lucide-react";
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

export function QualityCheckList({
  reportId,
  checks,
  onFocusCheck,
}: {
  reportId: string;
  checks: QualityCheckResult[];
  onFocusCheck?: (check: QualityCheckResult) => void;
}) {
  const queryClient = useQueryClient();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Une anomalie résolue ne doit plus s'afficher (évite les doublons de signalement).
  const unresolved = checks.filter((c) => !c.is_resolved);

  if (unresolved.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Aucune anomalie en cours"
        description="Ce rapport ne présente aucune anomalie non résolue."
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
      {unresolved.map((check) => {
        const Icon = SEVERITY_ICON[check.severity];
        const clickable = !!check.report_cell && !!onFocusCheck;
        return (
          <li
            key={check.id}
            onClick={() => clickable && onFocusCheck!(check)}
            className={cn(
              "flex items-start justify-between gap-4 rounded-lg border-l-[3px] bg-surface px-4 py-3",
              SEVERITY_COLOR[check.severity],
              clickable && "cursor-pointer hover:bg-surface-elevated"
            )}
          >
            <div className="flex items-start gap-3">
              <Icon size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-primary">{check.message}</p>
                {check.row_label && check.column_label && (
                  <p className="mt-0.5 text-xs text-secondary">
                    {check.row_label} / {check.column_label}
                    {clickable && " — cliquer pour localiser"}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={resolvingId === check.id}
              onClick={(e) => {
                e.stopPropagation();
                resolve(check.id);
              }}
            >
              Résoudre
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
