import { cn } from "@/lib/utils";
import type { AlertSeverity, QualitySeverity, ReportStatus } from "@/types";

const REPORT_STATUS_STYLES: Record<ReportStatus, string> = {
  brouillon: "bg-status-draft/12 text-status-draft",
  soumis: "bg-status-submitted/12 text-status-submitted",
  "validé": "bg-status-validated/12 text-status-validated",
  "rejeté": "bg-status-rejected/12 text-status-rejected",
};

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  brouillon: "Brouillon",
  soumis: "Soumis",
  "validé": "Validé",
  "rejeté": "Rejeté",
};

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", REPORT_STATUS_STYLES[status])}>
      {REPORT_STATUS_LABELS[status]}
    </span>
  );
}

const ALERT_SEVERITY_STYLES: Record<AlertSeverity, string> = {
  faible: "bg-severity-low/12 text-severity-low",
  moyenne: "bg-severity-medium/12 text-severity-medium",
  critique: "bg-severity-critical/12 text-severity-critical",
};

const ALERT_SEVERITY_LABELS: Record<AlertSeverity, string> = {
  faible: "Faible",
  moyenne: "Moyenne",
  critique: "Critique",
};

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", ALERT_SEVERITY_STYLES[severity])}>
      {ALERT_SEVERITY_LABELS[severity]}
    </span>
  );
}

const QUALITY_SEVERITY_STYLES: Record<QualitySeverity, string> = {
  info: "bg-accent-blue/12 text-accent-blue",
  avertissement: "bg-severity-medium/12 text-severity-medium",
  bloquant: "bg-severity-critical/12 text-severity-critical",
};

const QUALITY_SEVERITY_LABELS: Record<QualitySeverity, string> = {
  info: "Info",
  avertissement: "Avertissement",
  bloquant: "Bloquant",
};

export function QualitySeverityBadge({ severity }: { severity: QualitySeverity }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", QUALITY_SEVERITY_STYLES[severity])}>
      {QUALITY_SEVERITY_LABELS[severity]}
    </span>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-secondary", className)}>
      {children}
    </span>
  );
}
