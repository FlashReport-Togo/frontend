import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "default" | "critical" | "positive";
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-secondary">{label}</span>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            tone === "critical" && "bg-severity-critical/10 text-severity-critical",
            tone === "positive" && "bg-severity-low/10 text-severity-low",
            tone === "default" && "bg-accent-blue/10 text-accent-blue"
          )}
        >
          <Icon size={18} strokeWidth={1.75} />
        </div>
      </div>
      <p className="mt-4 font-mono text-3xl font-semibold tracking-tight text-primary">{value}</p>
    </Card>
  );
}
