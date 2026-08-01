"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Bot, Save, Send, Share2, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { QualityCheckList } from "@/components/reports/quality-check-list";
import { ReportTimeline } from "@/components/reports/report-timeline";
import { Button } from "@/components/ui/button";
import { ReportStatusBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, Tbody, Td, Th, Thead } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import { dhis2Api } from "@/lib/endpoints/dhis2";
import { ocrApi } from "@/lib/endpoints/ocr";
import { reportsApi } from "@/lib/endpoints/reports";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { QualityCheckResult } from "@/types";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: report, isLoading } = useQuery({
    queryKey: ["reports", id],
    queryFn: () => reportsApi.get(id),
  });

  const { data: history } = useQuery({
    queryKey: ["reports", id, "history"],
    queryFn: () => reportsApi.history(id),
  });

  const [rows, setRows] = useState<Record<string, { cases: number; deaths: number }>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [blockingErrors, setBlockingErrors] = useState<QualityCheckResult[] | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (report) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronise l'état d'édition local avec les données serveur à chaque refetch
      setRows(Object.fromEntries(report.data_values.map((dv) => [dv.id, { cases: dv.cases, deaths: dv.deaths }])));
    }
  }, [report]);

  if (isLoading || !report) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isOwner = user?.role === "district_agent" && user.district === report.district;
  const canEdit = isOwner && report.status === "brouillon";
  const isElevated = user?.role === "regional_focal_point" || user?.role === "national_agent" || user?.role === "admin";

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["reports", id] });

  const saveChanges = async () => {
    setSaving(true);
    try {
      await api.put(`/reports/${id}/data-values/`, {
        data_values: Object.entries(rows).map(([rowId, v]) => ({ id: rowId, ...v })),
      });
      toast.success("Modifications enregistrées.");
      invalidate();
    } catch {
      toast.error("Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    setSubmitting(true);
    setBlockingErrors(null);
    try {
      if (Object.keys(rows).length) await saveChangesSilently();
      await reportsApi.submit(id);
      toast.success("Rapport soumis pour validation.");
      invalidate();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: QualityCheckResult[]; detail?: string } } };
      if (axiosErr.response?.data?.errors) {
        setBlockingErrors(axiosErr.response.data.errors);
        toast.error("Anomalies bloquantes à corriger avant soumission.");
      } else {
        toast.error(axiosErr.response?.data?.detail ?? "Échec de la soumission.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const saveChangesSilently = async () => {
    await api.put(`/reports/${id}/data-values/`, {
      data_values: Object.entries(rows).map(([rowId, v]) => ({ id: rowId, ...v })),
    });
  };

  const validate = async () => {
    setValidating(true);
    try {
      await reportsApi.validate(id);
      toast.success("Rapport validé.");
      invalidate();
    } catch {
      toast.error("Échec de la validation.");
    } finally {
      setValidating(false);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) return;
    setRejecting(true);
    try {
      await reportsApi.reject(id, rejectReason);
      toast.success("Rapport rejeté.");
      setRejectOpen(false);
      invalidate();
    } catch {
      toast.error("Échec du rejet.");
    } finally {
      setRejecting(false);
    }
  };

  const pushToDhis2 = async () => {
    setPushing(true);
    try {
      await dhis2Api.push(id);
      toast.success("Envoi vers DHIS2 lancé — le statut sera visible dans le journal DHIS2.");
    } catch {
      toast.error("Échec du déclenchement de l'envoi DHIS2.");
    } finally {
      setPushing(false);
    }
  };

  const analyze = async () => {
    setAnalyzing(true);
    try {
      await ocrApi.analyzeReport(id);
      toast.success("Analyse IA lancée — vous serez notifié à la fin.");
    } catch {
      toast.error("Échec du lancement de l'analyse IA.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-primary">{report.district_name}</h1>
            <ReportStatusBadge status={report.status} />
          </div>
          <p className="mt-1 font-mono text-sm text-secondary">
            {report.period_start}
            {report.period_start !== report.period_end ? ` → ${report.period_end}` : ""} · {report.period_type}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button variant="secondary" loading={saving} onClick={saveChanges}>
              <Save size={16} /> Enregistrer
            </Button>
          )}
          {canEdit && (
            <Button loading={submitting} onClick={submit}>
              <Send size={16} /> Soumettre
            </Button>
          )}
          {isElevated && report.status === "soumis" && (
            <>
              <Button variant="secondary" onClick={() => setRejectOpen(true)}>
                <XCircle size={16} /> Rejeter
              </Button>
              <Button loading={validating} onClick={validate}>
                Valider
              </Button>
            </>
          )}
          {isElevated && report.status === "validé" && (
            <Button variant="secondary" loading={pushing} onClick={pushToDhis2}>
              <Share2 size={16} /> Envoyer vers DHIS2
            </Button>
          )}
          {isElevated && (report.status === "soumis" || report.status === "validé") && (
            <Button variant="secondary" loading={analyzing} onClick={analyze}>
              <Bot size={16} /> Analyse IA
            </Button>
          )}
        </div>
      </div>

      {report.status === "rejeté" && report.rejection_reason && (
        <div className="flex items-start gap-3 rounded-lg border border-severity-critical/30 bg-severity-critical/10 px-4 py-3 text-sm text-severity-critical">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Motif du rejet</p>
            <p className="mt-0.5">{report.rejection_reason}</p>
          </div>
        </div>
      )}

      {blockingErrors && (
        <Card className="border-severity-critical/30">
          <CardHeader>
            <CardTitle className="text-severity-critical">Anomalies bloquantes</CardTitle>
          </CardHeader>
          <CardContent>
            <QualityCheckList reportId={id} checks={blockingErrors} />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="data">
        <TabsList>
          <TabsTrigger value="data">Données</TabsTrigger>
          <TabsTrigger value="quality">
            Contrôle qualité{report.quality_checks.length > 0 ? ` (${report.quality_checks.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="data">
          <Card>
            <Table>
              <Thead>
                <tr>
                  <Th>Maladie</Th>
                  <Th>Cas</Th>
                  <Th>Décès</Th>
                  <Th>Confiance OCR</Th>
                </tr>
              </Thead>
              <Tbody>
                {report.data_values.map((dv) => {
                  const lowConfidence = dv.confidence_score !== null && dv.confidence_score < 90;
                  return (
                    <tr key={dv.id} className={cn(lowConfidence && "bg-severity-medium/5")}>
                      <Td className="font-medium">{dv.disease_name}</Td>
                      <Td>
                        {canEdit ? (
                          <input
                            type="number"
                            min={0}
                            className="w-20 rounded-lg border border-border-subtle bg-surface px-2 py-1 font-mono text-sm text-primary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25"
                            value={rows[dv.id]?.cases ?? dv.cases}
                            onChange={(e) =>
                              setRows((r) => ({ ...r, [dv.id]: { ...r[dv.id], cases: Number(e.target.value) } }))
                            }
                          />
                        ) : (
                          <span className="font-mono">{dv.cases}</span>
                        )}
                      </Td>
                      <Td>
                        {canEdit ? (
                          <input
                            type="number"
                            min={0}
                            className="w-20 rounded-lg border border-border-subtle bg-surface px-2 py-1 font-mono text-sm text-primary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25"
                            value={rows[dv.id]?.deaths ?? dv.deaths}
                            onChange={(e) =>
                              setRows((r) => ({ ...r, [dv.id]: { ...r[dv.id], deaths: Number(e.target.value) } }))
                            }
                          />
                        ) : (
                          <span className="font-mono">{dv.deaths}</span>
                        )}
                      </Td>
                      <Td>
                        {dv.confidence_score !== null ? (
                          <span
                            className={cn(
                              "font-mono text-xs",
                              lowConfidence ? "text-severity-medium" : "text-severity-low"
                            )}
                          >
                            {dv.confidence_score}%{dv.confidence_note ? ` · ${dv.confidence_note}` : ""}
                          </span>
                        ) : (
                          <span className="text-secondary">—</span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </Tbody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="quality">
          <Card>
            <CardContent>
              <QualityCheckList reportId={id} checks={report.quality_checks} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent>
              <ReportTimeline history={history ?? []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Modal open={rejectOpen} onOpenChange={setRejectOpen} title="Rejeter le rapport" description="Le motif sera visible par l'agent de district.">
        <div className="flex flex-col gap-4">
          <Textarea
            label="Motif du rejet"
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Expliquez pourquoi ce rapport est rejeté…"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" loading={rejecting} disabled={!rejectReason.trim()} onClick={reject}>
              Confirmer le rejet
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
