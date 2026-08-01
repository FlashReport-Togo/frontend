"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, Check, MapPin, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SeverityBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { alertsApi } from "@/lib/endpoints/alerts";
import { cn } from "@/lib/utils";
import type { AlertItem, AlertSeverity, AlertStatus, AlertType } from "@/types";

const TYPE_LABELS: Record<AlertType, string> = {
  rapport_manquant: "Rapport manquant",
  seuil_epidemique: "Seuil épidémique",
  anomalie_donnees: "Anomalie de données",
};

const SEVERITY_BORDER: Record<AlertSeverity, string> = {
  faible: "border-l-severity-low",
  moyenne: "border-l-severity-medium",
  critique: "border-l-severity-critical",
};

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AlertStatus | "">("ouverte");
  const [severity, setSeverity] = useState<AlertSeverity | "">("");
  const [page, setPage] = useState(1);
  const [resolveTarget, setResolveTarget] = useState<AlertItem | null>(null);
  const [comment, setComment] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["alerts", { status, severity, page }],
    queryFn: () => alertsApi.list({ status: status || undefined, severity: severity || undefined, page }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["alerts"] });

  const acknowledge = async (alert: AlertItem) => {
    setBusyId(alert.id);
    try {
      await alertsApi.acknowledge(alert.id);
      toast.success("Alerte acquittée.");
      invalidate();
    } catch {
      toast.error("Échec de l'acquittement.");
    } finally {
      setBusyId(null);
    }
  };

  const resolve = async () => {
    if (!resolveTarget || !comment.trim()) return;
    setBusyId(resolveTarget.id);
    try {
      await alertsApi.resolve(resolveTarget.id, comment);
      toast.success("Alerte résolue.");
      setResolveTarget(null);
      setComment("");
      invalidate();
    } catch {
      toast.error("Échec de la résolution.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Alertes</h1>
        <p className="mt-1 text-sm text-secondary">Seuils épidémiques, anomalies de données et rapports manquants.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-48">
          <Select value={status} onChange={(e) => { setStatus(e.target.value as AlertStatus | ""); setPage(1); }}>
            <option value="ouverte">Ouvertes</option>
            <option value="acquittée">Acquittées</option>
            <option value="résolue">Résolues</option>
            <option value="">Toutes</option>
          </Select>
        </div>
        <div className="w-44">
          <Select value={severity} onChange={(e) => { setSeverity(e.target.value as AlertSeverity | ""); setPage(1); }}>
            <option value="">Toute sévérité</option>
            <option value="critique">Critique</option>
            <option value="moyenne">Moyenne</option>
            <option value="faible">Faible</option>
          </Select>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <p className="p-5 text-sm text-secondary">Chargement…</p>
        ) : !data || data.results.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Aucune alerte" description="Rien à signaler pour ces filtres." />
        ) : (
          <>
            <ul className="divide-y divide-border-subtle">
              {data.results.map((alert) => (
                <li
                  key={alert.id}
                  className={cn("flex flex-wrap items-start justify-between gap-3 border-l-[3px] px-5 py-4", SEVERITY_BORDER[alert.severity])}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-secondary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={alert.severity} />
                        <span className="text-xs font-medium text-secondary">{TYPE_LABELS[alert.type]}</span>
                      </div>
                      <p className="mt-1.5 text-sm text-primary">{alert.message}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-secondary">
                        {alert.district_name && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {alert.district_name}
                          </span>
                        )}
                        <span className="font-mono">
                          {format(new Date(alert.triggered_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                        </span>
                      </div>
                      {alert.status === "résolue" && alert.resolution_comment && (
                        <p className="mt-1.5 text-xs text-severity-low">Résolue : {alert.resolution_comment}</p>
                      )}
                    </div>
                  </div>

                  {alert.status !== "résolue" && (
                    <div className="flex shrink-0 gap-2">
                      {alert.status === "ouverte" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={busyId === alert.id}
                          onClick={() => acknowledge(alert)}
                        >
                          <Check size={14} /> Acquitter
                        </Button>
                      )}
                      <Button size="sm" onClick={() => setResolveTarget(alert)}>
                        Résoudre
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <Pagination page={page} count={data.count} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal
        open={!!resolveTarget}
        onOpenChange={(open) => !open && setResolveTarget(null)}
        title="Résoudre l'alerte"
        description="Décrivez l'action prise pour clore cette alerte."
      >
        <div className="flex flex-col gap-4">
          <Textarea
            label="Commentaire de résolution"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ex : investigation menée sur le terrain, situation confirmée non-épidémique…"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setResolveTarget(null)}>
              Annuler
            </Button>
            <Button loading={!!busyId} disabled={!comment.trim()} onClick={resolve}>
              Confirmer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
