"use client";

import { FileSpreadsheet, FileText, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ColumnMappingModal } from "@/components/reports/column-mapping-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formTemplatesApi } from "@/lib/endpoints/geography";
import { columnMappingsApi, reportsApi } from "@/lib/endpoints/reports";
import { cn } from "@/lib/utils";
import type { FormColumnDef, ReportDetail } from "@/types";

type Kind = "excel" | "pdf";

export default function ImportReportPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState<Kind | null>(null);
  const excelRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const [createdReport, setCreatedReport] = useState<ReportDetail | null>(null);
  const [unmapped, setUnmapped] = useState<string[]>([]);
  const [targetColumns, setTargetColumns] = useState<FormColumnDef[]>([]);
  const [existingMapping, setExistingMapping] = useState<Record<string, string>>({});
  const [existingMappingId, setExistingMappingId] = useState<string | undefined>();
  const [mappingOpen, setMappingOpen] = useState(false);

  const upload = async (kind: Kind, file: File) => {
    setUploading(kind);
    try {
      const report = kind === "excel" ? await reportsApi.importExcel(file) : await reportsApi.importPdf(file);

      if (report.unmapped_columns?.length) {
        const [template, mapping] = await Promise.all([
          formTemplatesApi.getByDisease(report.disease),
          columnMappingsApi.getOne(report.disease, "import"),
        ]);
        setCreatedReport(report);
        setUnmapped(report.unmapped_columns);
        setTargetColumns(template?.columns ?? []);
        setExistingMapping(mapping?.mapping ?? {});
        setExistingMappingId(mapping?.id);
        setMappingOpen(true);
        toast.warning(`${report.unmapped_columns.length} colonne(s) non reconnue(s) — à associer.`);
      } else {
        toast.success("Rapport importé en brouillon.");
        router.push(`/reports/${report.id}`);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosErr.response?.data?.detail ?? "Échec de l'import.");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Importer un rapport</h1>
        <p className="mt-1 text-sm text-secondary">
          Utilisez le gabarit standard (District / Maladie / Période / tableau).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <UploadCard
          icon={FileSpreadsheet}
          title="Fichier Excel"
          description="Formats acceptés : .xlsx"
          loading={uploading === "excel"}
          onClick={() => excelRef.current?.click()}
        />
        <UploadCard
          icon={FileText}
          title="Fichier PDF"
          description="Le tableau doit rester dans la page 1"
          loading={uploading === "pdf"}
          onClick={() => pdfRef.current?.click()}
        />
      </div>

      <input
        ref={excelRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload("excel", e.target.files[0])}
      />
      <input
        ref={pdfRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload("pdf", e.target.files[0])}
      />

      <Card>
        <CardHeader>
          <CardTitle>Format attendu</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-secondary">
          <p>Ligne 1 : <code className="font-mono text-primary">District: &lt;code_district&gt;</code></p>
          <p>Ligne 2 : <code className="font-mono text-primary">Maladie: &lt;nom_maladie&gt;</code></p>
          <p>
            Ligne 3 : <code className="font-mono text-primary">Période: AAAA-MM-JJ au AAAA-MM-JJ</code>
          </p>
          <p>Puis un tableau : première colonne = libellé de ligne, colonnes suivantes libres.</p>
          <p className="text-xs">
            Si les colonnes du document ne correspondent pas au formulaire, une correspondance vous sera
            demandée une fois — elle sera ensuite réutilisée automatiquement.
          </p>
        </CardContent>
      </Card>

      {createdReport && (
        <ColumnMappingModal
          open={mappingOpen}
          onOpenChange={(open) => {
            setMappingOpen(open);
            if (!open) router.push(`/reports/${createdReport.id}`);
          }}
          unmappedColumns={unmapped}
          targetColumns={targetColumns}
          diseaseId={createdReport.disease}
          context="import"
          existingMapping={existingMapping}
          existingMappingId={existingMappingId}
          onSaved={() => router.push(`/reports/${createdReport.id}`)}
        />
      )}
    </div>
  );
}

function UploadCard({
  icon: Icon,
  title,
  description,
  loading,
  onClick,
}: {
  icon: typeof FileSpreadsheet;
  title: string;
  description: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border-subtle bg-surface-elevated px-6 py-10 text-center transition-colors",
        "hover:border-accent-blue/50 hover:bg-accent-blue/5 disabled:opacity-60"
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-blue/10 text-accent-blue">
        {loading ? <Upload size={20} className="animate-pulse" /> : <Icon size={20} strokeWidth={1.75} />}
      </div>
      <div>
        <p className="text-sm font-medium text-primary">{title}</p>
        <p className="mt-1 text-xs text-secondary">{description}</p>
      </div>
    </button>
  );
}
