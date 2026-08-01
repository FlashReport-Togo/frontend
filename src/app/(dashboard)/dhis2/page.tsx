"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, RefreshCw, Share2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/table";
import { dhis2Api } from "@/lib/endpoints/dhis2";
import { cn } from "@/lib/utils";
import type { DHIS2PushStatus } from "@/types";

const ENTITY_TYPES = [
  { value: "org_unit", label: "Unités organisationnelles" },
  { value: "data_element", label: "Éléments de données" },
  { value: "category_option_combo", label: "Combinaisons catégorie/option" },
] as const;

const STATUS_STYLE: Record<DHIS2PushStatus, string> = {
  "succès": "text-severity-low",
  "échec_partiel": "text-severity-medium",
  "échec": "text-severity-critical",
};

export default function Dhis2Page() {
  const [syncing, setSyncing] = useState<string | null>(null);

  const { data: pushLogs, isLoading } = useQuery({
    queryKey: ["dhis2", "push-logs"],
    queryFn: () => dhis2Api.pushLogs({ page: 1 }),
  });

  const { data: metadataCache } = useQuery({
    queryKey: ["dhis2", "metadata-cache"],
    queryFn: () => dhis2Api.metadataCache(),
  });

  const sync = async (entityType: (typeof ENTITY_TYPES)[number]["value"]) => {
    setSyncing(entityType);
    try {
      await dhis2Api.sync(entityType);
      toast.success("Synchronisation lancée — cela peut prendre quelques minutes.");
    } catch {
      toast.error("Échec du lancement de la synchronisation.");
    } finally {
      setSyncing(null);
    }
  };

  const countByType = (type: string) => metadataCache?.results.filter((m) => m.entity_type === type).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Intégration DHIS2</h1>
        <p className="mt-1 text-sm text-secondary">Synchronisation des métadonnées et journal des envois.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {ENTITY_TYPES.map((entity) => (
          <Card key={entity.value} className="p-5">
            <p className="text-sm font-medium text-secondary">{entity.label}</p>
            <p className="mt-3 font-mono text-2xl font-semibold text-primary">{countByType(entity.value)}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4 w-full"
              loading={syncing === entity.value}
              onClick={() => sync(entity.value)}
            >
              <RefreshCw size={14} /> Synchroniser
            </Button>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 size={16} /> Journal des envois
          </CardTitle>
        </CardHeader>
        {isLoading ? (
          <CardContent>Chargement…</CardContent>
        ) : !pushLogs || pushLogs.results.length === 0 ? (
          <EmptyState icon={Share2} title="Aucun envoi" description="Les envois vers DHIS2 apparaîtront ici." />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Date</Th>
                <Th>Déclenché via</Th>
                <Th>Statut</Th>
              </tr>
            </Thead>
            <Tbody>
              {pushLogs.results.map((log) => (
                <Tr key={log.id}>
                  <Td className="font-mono text-xs">
                    {format(new Date(log.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                  </Td>
                  <Td>
                    <Badge>{log.triggered_via === "manuel" ? "Manuel" : "Tâche planifiée"}</Badge>
                  </Td>
                  <Td>
                    <span className={cn("flex items-center gap-1.5 text-sm capitalize", STATUS_STYLE[log.status])}>
                      {log.status === "succès" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      {log.status.replace("_", " ")}
                    </span>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
