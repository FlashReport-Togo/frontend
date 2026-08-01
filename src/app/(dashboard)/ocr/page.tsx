"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Clock, ScanLine, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ocrApi } from "@/lib/endpoints/ocr";
import type { OCRScanStatus } from "@/types";

const STATUS_META: Record<OCRScanStatus, { label: string; icon: typeof Clock; className: string }> = {
  en_attente: { label: "En attente", icon: Clock, className: "text-secondary" },
  "traité": { label: "Traité", icon: CheckCircle2, className: "text-severity-low" },
  "échec": { label: "Échec", icon: XCircle, className: "text-severity-critical" },
};

export default function OcrPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ocr-scans"],
    queryFn: () => ocrApi.listScans({ page: 1 }),
    refetchInterval: 8000,
  });

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const scan = await ocrApi.uploadScan(file);
      toast.success("Scan envoyé — traitement en cours.");
      queryClient.invalidateQueries({ queryKey: ["ocr-scans"] });
      router.push(`/ocr/${scan.id}`);
    } catch {
      toast.error("Échec de l'envoi du scan.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Scan OCR</h1>
        <p className="mt-1 text-sm text-secondary">
          Photographiez un registre papier : la lecture automatique crée un brouillon à relire.
        </p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-subtle bg-surface-elevated px-6 py-12 text-center transition-colors",
          "hover:border-accent-blue/50 hover:bg-accent-blue/5 disabled:opacity-60"
        )}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-blue/10 text-accent-blue">
          <ScanLine size={24} strokeWidth={1.75} className={uploading ? "animate-pulse" : ""} />
        </div>
        <div>
          <p className="text-sm font-medium text-primary">
            {uploading ? "Envoi en cours…" : "Cliquez pour sélectionner une photo du registre"}
          </p>
          <p className="mt-1 text-xs text-secondary">JPG, PNG — un tableau lisible par prise de vue</p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />

      <Card>
        {isLoading ? (
          <p className="p-5 text-sm text-secondary">Chargement…</p>
        ) : !data || data.results.length === 0 ? (
          <EmptyState icon={ScanLine} title="Aucun scan" description="Vos scans envoyés apparaîtront ici." />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Date</Th>
                <Th>Statut</Th>
                <Th>Modèle</Th>
              </tr>
            </Thead>
            <Tbody>
              {data.results.map((scan) => {
                const meta = STATUS_META[scan.status];
                const Icon = meta.icon;
                return (
                  <Tr key={scan.id} onClick={() => router.push(`/ocr/${scan.id}`)}>
                    <Td className="font-mono text-xs">
                      {format(new Date(scan.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    </Td>
                    <Td>
                      <span className={cn("flex items-center gap-1.5 text-sm", meta.className)}>
                        <Icon size={14} /> {meta.label}
                      </span>
                    </Td>
                    <Td>
                      <Badge>{scan.model_used || "—"}</Badge>
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
