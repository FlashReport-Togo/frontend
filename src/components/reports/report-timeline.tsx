import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { EmptyState } from "@/components/ui/empty-state";
import { History } from "lucide-react";
import type { ReportHistoryEntry } from "@/types";

const ACTION_LABELS: Record<string, string> = {
  "création": "Création",
  modification: "Modification",
  soumission: "Soumission",
  validation: "Validation",
  rejet: "Rejet",
  export_dhis2: "Export DHIS2",
};

export function ReportTimeline({ history }: { history: ReportHistoryEntry[] }) {
  if (history.length === 0) {
    return <EmptyState icon={History} title="Aucun historique" />;
  }

  return (
    <ol className="flex flex-col gap-0">
      {history.map((entry, i) => (
        <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
          {i !== history.length - 1 && (
            <span className="absolute left-[7px] top-3 h-full w-px bg-border-subtle" aria-hidden />
          )}
          <span className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-accent-blue bg-surface-elevated" />
          <div>
            <p className="text-sm font-medium text-primary">
              {ACTION_LABELS[entry.action] ?? entry.action}
              <span className="ml-1.5 font-normal text-secondary">— {entry.user_name}</span>
            </p>
            <p className="mt-0.5 font-mono text-xs text-secondary">
              {format(new Date(entry.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
