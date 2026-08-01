"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Clock, Download, FileSpreadsheet, FileText, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/table";
import { exportsApi } from "@/lib/endpoints/exports";
import { cn } from "@/lib/utils";
import type { ExportStatus } from "@/types";

const STATUS_META: Record<ExportStatus, { label: string; icon: typeof Clock; className: string }> = {
  en_cours: { label: "En cours", icon: Clock, className: "text-secondary" },
  "prêt": { label: "Prêt", icon: CheckCircle2, className: "text-severity-low" },
  "échec": { label: "Échec", icon: XCircle, className: "text-severity-critical" },
};

const EXPORT_TYPE_LABELS: Record<string, string> = {
  reports_pdf: "Rapports (PDF)",
  reports_excel: "Rapports (Excel)",
  analytics_pdf: "Synthèse analytique (PDF)",
};

export default function ExportsPage() {
  const queryClient = useQueryClient();
  const [triggering, setTriggering] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["exports", "history"],
    queryFn: exportsApi.history,
    refetchInterval: 6000,
  });

  const trigger = async (kind: "reports_pdf" | "reports_excel" | "analytics_pdf") => {
    setTriggering(kind);
    try {
      if (kind === "reports_pdf") await exportsApi.triggerReportsPdf();
      else if (kind === "reports_excel") await exportsApi.triggerReportsExcel();
      else await exportsApi.triggerAnalyticsPdf();
      toast.success("Génération lancée — vous serez notifié quand le fichier sera prêt.");
      queryClient.invalidateQueries({ queryKey: ["exports"] });
    } catch {
      toast.error("Échec du lancement de l'export.");
    } finally {
      setTriggering(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Exports</h1>
        <p className="mt-1 text-sm text-secondary">Génération de documents PDF/Excel, exécutée en arrière-plan.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex flex-col items-start gap-3 p-5">
          <FileText size={20} strokeWidth={1.75} className="text-accent-blue" />
          <div>
            <p className="text-sm font-medium text-primary">Rapports — PDF</p>
            <p className="mt-0.5 text-xs text-secondary">Export mis en forme, prêt à imprimer.</p>
          </div>
          <Button size="sm" loading={triggering === "reports_pdf"} onClick={() => trigger("reports_pdf")}>
            Générer
          </Button>
        </Card>
        <Card className="flex flex-col items-start gap-3 p-5">
          <FileSpreadsheet size={20} strokeWidth={1.75} className="text-accent-blue" />
          <div>
            <p className="text-sm font-medium text-primary">Rapports — Excel</p>
            <p className="mt-0.5 text-xs text-secondary">Une ligne par maladie, pour analyse.</p>
          </div>
          <Button size="sm" loading={triggering === "reports_excel"} onClick={() => trigger("reports_excel")}>
            Générer
          </Button>
        </Card>
        <Card className="flex flex-col items-start gap-3 p-5">
          <FileText size={20} strokeWidth={1.75} className="text-accent-blue" />
          <div>
            <p className="text-sm font-medium text-primary">Synthèse analytique</p>
            <p className="mt-0.5 text-xs text-secondary">Complétude et qualité par district.</p>
          </div>
          <Button size="sm" loading={triggering === "analytics_pdf"} onClick={() => trigger("analytics_pdf")}>
            Générer
          </Button>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
        </CardHeader>
        {isLoading ? (
          <CardContent>Chargement…</CardContent>
        ) : !data || data.results.length === 0 ? (
          <EmptyState icon={Download} title="Aucun export" description="Vos exports générés apparaîtront ici." />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Type</Th>
                <Th>Date</Th>
                <Th>Statut</Th>
                <Th />
              </tr>
            </Thead>
            <Tbody>
              {data.results.map((exp) => {
                const meta = STATUS_META[exp.status];
                const Icon = meta.icon;
                return (
                  <Tr key={exp.id}>
                    <Td className="font-medium">{EXPORT_TYPE_LABELS[exp.export_type]}</Td>
                    <Td className="font-mono text-xs text-secondary">
                      {format(new Date(exp.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    </Td>
                    <Td>
                      <span className={cn("flex items-center gap-1.5 text-sm", meta.className)}>
                        <Icon size={14} /> {meta.label}
                      </span>
                    </Td>
                    <Td>
                      {exp.file_url && (
                        <a
                          href={exp.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-sm font-medium text-accent-blue hover:underline"
                        >
                          <Download size={14} /> Télécharger
                        </a>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
