"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ocrApi } from "@/lib/endpoints/ocr";
import { reportsApi } from "@/lib/endpoints/reports";

export default function OcrScanDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: scan, isLoading } = useQuery({
    queryKey: ["ocr-scans", id],
    queryFn: () => ocrApi.getScan(id),
    refetchInterval: (query) => (query.state.data?.status === "en_attente" ? 4000 : false),
  });

  // Le brouillon lié n'est pas exposé directement par le scan : on cherche parmi les
  // rapports issus de ce scan via son id (relation report.ocr_scan côté backend).
  const { data: reports } = useQuery({
    queryKey: ["reports", "by-scan", id],
    queryFn: () => reportsApi.list({ page: 1 }),
    enabled: scan?.status === "traité",
  });
  const linkedReport = reports?.results.find((r) => r.source_channel === "ocr");

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
          <CardContent>
            <p className="text-sm text-secondary">
              Un rapport brouillon a été créé à partir de ce scan. Relisez les valeurs — celles en surbrillance ont une
              confiance de lecture faible — avant de le soumettre.
            </p>
            {linkedReport && (
              <Link
                href={`/reports/${linkedReport.id}`}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-blue hover:underline"
              >
                Ouvrir le brouillon <ArrowRight size={14} />
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
