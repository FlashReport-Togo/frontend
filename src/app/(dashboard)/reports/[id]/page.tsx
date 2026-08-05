"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Bot, Save, Send, Share2, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { DynamicFormTable } from "@/components/reports/dynamic-form-table";
import { QualityCheckList } from "@/components/reports/quality-check-list";
import { ReportTimeline } from "@/components/reports/report-timeline";
import { Button } from "@/components/ui/button";
import { ReportStatusBadge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { dhis2Api } from "@/lib/endpoints/dhis2";
import { ocrApi } from "@/lib/endpoints/ocr";
import { reportsApi } from "@/lib/endpoints/reports";
import { useAuthStore } from "@/store/auth-store";
import type { QualityCheckResult } from "@/types";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: aiHistory } = useQuery({
    queryKey: ["ai-analysis-history", id],
    queryFn: () => ocrApi.analysisHistory(id),
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ["reports", id],
    queryFn: () => reportsApi.get(id),
  });

  const { data: history } = useQuery({
    queryKey: ["reports", id, "history"],
    queryFn: () => reportsApi.history(id),
  });

  const [pendingValues, setPendingValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [blockingErrors, setBlockingErrors] = useState<QualityCheckResult[] | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [activeTab, setActiveTab] = useState("data");
  const [focusedCellId, setFocusedCellId] = useState<string | null>(null);

  if (isLoading || !report) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isOwner = user?.role === "district_agent" && user.district === report.district;
  const canEdit = isOwner && (report.status === "brouillon" || report.status === "rejeté");
  const isElevated = user?.role === "regional_focal_point" || user?.role === "national_agent" || user?.role === "admin";

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["reports", id] });

  const persistPendingCells = async () => {
    const cells = Object.entries(pendingValues).map(([cellId, value]) => ({ id: cellId, value }));
    if (cells.length === 0) return;
    await reportsApi.updateCells(id, cells);
    setPendingValues({});
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      await persistPendingCells();
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
      await persistPendingCells();
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

  const addRow = async (label: string) => {
    setBusyAction(true);
    try {
      await reportsApi.addRow(id, label);
      invalidate();
    } catch {
      toast.error("Échec de l'ajout de la ligne.");
    } finally {
      setBusyAction(false);
    }
  };

  const addColumn = async (label: string) => {
    setBusyAction(true);
    try {
      await reportsApi.addColumn(id, label);
      invalidate();
    } catch {
      toast.error("Échec de l'ajout de la colonne.");
    } finally {
      setBusyAction(false);
    }
  };

  const removeRow = async (rowId: string) => {
    setBusyAction(true);
    try {
      await reportsApi.removeRow(id, rowId);
      invalidate();
    } catch {
      toast.error("Échec de la suppression de la ligne.");
    } finally {
      setBusyAction(false);
    }
  };

  const removeColumn = async (columnKey: string) => {
    setBusyAction(true);
    try {
      await reportsApi.removeColumn(id, columnKey);
      invalidate();
    } catch {
      toast.error("Échec de la suppression de la colonne.");
    } finally {
      setBusyAction(false);
    }
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
      toast.success("Envoi vers DHIS2 lancé — consultez le journal DHIS2 pour le résultat.");
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
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-primary">
              {report.disease_name} — {report.district_name}
            </h1>
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
          <CardContent>
            <p className="mb-3 text-sm font-semibold text-severity-critical">Anomalies bloquantes</p>
            <QualityCheckList
              reportId={id}
              checks={blockingErrors}
              onFocusCheck={(check) => {
                if (!check.report_cell) return;
                setActiveTab("data");
                setFocusedCellId(check.report_cell);
              }}
            />
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="data">Données</TabsTrigger>
          {isOwner && (
            <TabsTrigger value="quality">
              Contrôle qualité
              {report.quality_checks.filter((c) => !c.is_resolved).length > 0
                ? ` (${report.quality_checks.filter((c) => !c.is_resolved).length})`
                : ""}
            </TabsTrigger>
          )}
          <TabsTrigger value="ai">
            Analyse IA{aiHistory && aiHistory.length > 0 ? ` (${aiHistory.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="data">
          <Card>
            <CardContent className={busyAction ? "opacity-60" : ""}>
              <DynamicFormTable
                report={report}
                editable={canEdit}
                pendingValues={pendingValues}
                onCellChange={(cellId, value) => setPendingValues((p) => ({ ...p, [cellId]: value }))}
                onAddRow={canEdit ? addRow : undefined}
                onAddColumn={canEdit ? addColumn : undefined}
                onRemoveRow={canEdit ? removeRow : undefined}
                onRemoveColumn={canEdit ? removeColumn : undefined}
                qualityChecks={report.quality_checks}
                focusedCellId={focusedCellId}
                onFocusHandled={() => setFocusedCellId(null)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {isOwner && (
          <TabsContent value="quality">
            <Card>
              <CardContent>
                <QualityCheckList
                  reportId={id}
                  checks={report.quality_checks}
                  onFocusCheck={(check) => {
                    if (!check.report_cell) return;
                    setActiveTab("data");
                    setFocusedCellId(check.report_cell);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="ai">
          <div className="flex flex-col gap-4">
            {!aiHistory || aiHistory.length === 0 ? (
              <Card>
                <CardContent>
                  <p className="text-sm text-secondary">
                    Aucune analyse IA pour ce rapport. Utilisez le bouton « Analyse IA » ci-dessus pour en lancer une.
                  </p>
                </CardContent>
              </Card>
            ) : (
              aiHistory.map((entry) => (
                <Card key={entry.id} className={entry === aiHistory[0] ? "border-accent-blue/30" : undefined}>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex items-center justify-between text-xs text-secondary">
                      <span className="flex items-center gap-1.5 font-medium text-accent-blue">
                        <Bot size={14} /> {entry.model_used}
                      </span>
                      <span className="font-mono">{new Date(entry.created_at).toLocaleString("fr-FR")}</span>
                    </div>
                    {entry.result?.synthese && <p className="text-sm text-primary">{String(entry.result?.synthese)}</p>}
                    {Array.isArray(entry.result?.tendances) && entry.result?.tendances.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-secondary">Tendances</p>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-primary">
                          {entry.result?.tendances.map((t, i) => <li key={i}>{String(t)}</li>)}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(entry.result?.anomalies) && entry.result?.anomalies.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-secondary">Anomalies</p>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-primary">
                          {entry.result?.anomalies.map((a, i) => <li key={i}>{String(a)}</li>)}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
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
