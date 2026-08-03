"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Link2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { ColumnMappingModal } from "@/components/reports/column-mapping-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formTemplatesApi } from "@/lib/endpoints/geography";
import { columnMappingsApi } from "@/lib/endpoints/reports";
import { ocrApi } from "@/lib/endpoints/ocr";
import { reportsApi } from "@/lib/endpoints/reports";
import { slugify } from "@/lib/utils";

export default function OcrScanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [mappingOpen, setMappingOpen] = useState(false);

  const { data: scan, isLoading } = useQuery({
    queryKey: ["ocr-scans", id],
    queryFn: () => ocrApi.getScan(id),
    refetchInterval: (query) => (query.state.data?.status === "en_attente" ? 4000 : false),
  });

  const { data: reports } = useQuery({
    queryKey: ["reports", "by-scan", id],
    queryFn: () => reportsApi.list({ page: 1 }),
    enabled: scan?.status === "traité",
  });
  const linkedReport = reports?.results.find((r) => r.ocr_scan === id);

  const { data: template } = useQuery({
    queryKey: ["form-templates", scan?.disease],
    queryFn: () => formTemplatesApi.getByDisease(scan!.disease),
    enabled: !!scan && scan.status === "traité",
  });

  const { data: mapping } = useQuery({
    queryKey: ["column-mappings", scan?.disease, "ocr"],
    queryFn: () => columnMappingsApi.getOne(scan!.disease, "ocr"),
    enabled: !!scan && scan.status === "traité",
  });

  const rawHeaders =
    scan?.raw_ai_response && typeof scan.raw_ai_response === "object" && "headers" in scan.raw_ai_response
      ? ((scan.raw_ai_response as { headers?: string[] }).headers ?? [])
      : [];
  const templateKeys = new Set(template?.columns.map((c) => c.key) ?? []);
  const mappedSourceKeys = new Set(Object.values(mapping?.mapping ?? {}));
  const unmapped = rawHeaders
    .map((h) => slugify(h))
    .filter((key) => key && !templateKeys.has(key) && !mappedSourceKeys.has(key));

  if (isLoading || !scan) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Scan OCR</h1>
        <p className="mt-1 text-sm text-secondary">Résultat du traitement automatique du registre.</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface">
            <Image src={scan.image_url} alt="Registre scanné" fill className="object-contain" unoptimized />
          </div>
        </CardContent>
      </Card>

      {scan.status === "en_attente" && (
        <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-elevated px-4 py-3 text-sm text-secondary">
          <Clock size={16} className="animate-pulse text-accent-blue" />
          Traitement en cours — cette page se met à jour automatiquement.
        </div>
      )}

      {scan.status === "échec" && (
        <div className="flex items-start gap-3 rounded-lg border border-severity-critical/30 bg-severity-critical/10 px-4 py-3 text-sm text-severity-critical">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Échec du traitement</p>
            <p className="mt-0.5">{scan.error_message ?? "Erreur inconnue."}</p>
          </div>
        </div>
      )}

      {scan.status === "traité" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-severity-low">
              <CheckCircle2 size={16} /> Traitement terminé
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-secondary">
              Un rapport brouillon a été créé à partir de ce scan. Relisez les valeurs — celles en surbrillance ont une
              confiance de lecture faible — avant de le soumettre.
            </p>

            {unmapped.length > 0 && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-severity-medium/30 bg-severity-medium/10 px-4 py-3 text-sm text-severity-medium">
                <span>{unmapped.length} colonne(s) lue(s) ne correspondent à aucune colonne du formulaire.</span>
                <Button size="sm" variant="secondary" onClick={() => setMappingOpen(true)}>
                  <Link2 size={14} /> Associer
                </Button>
              </div>
            )}

            {linkedReport && (
              <Link
                href={`/reports/${linkedReport.id}`}
                className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent-blue hover:underline"
              >
                Ouvrir le brouillon <ArrowRight size={14} />
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {scan && template && (
        <ColumnMappingModal
          open={mappingOpen}
          onOpenChange={setMappingOpen}
          unmappedColumns={unmapped}
          targetColumns={template.columns}
          diseaseId={scan.disease}
          context="ocr"
          existingMapping={mapping?.mapping ?? {}}
          existingMappingId={mapping?.id}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["column-mappings", scan.disease, "ocr"] })}
        />
      )}
    </div>
  );
}
