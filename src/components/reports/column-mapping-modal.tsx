"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { columnMappingsApi } from "@/lib/endpoints/reports";
import type { FormColumnDef, MappingContext } from "@/types";

export function ColumnMappingModal({
  open,
  onOpenChange,
  unmappedColumns,
  targetColumns,
  diseaseId,
  context,
  existingMapping,
  existingMappingId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unmappedColumns: string[];
  targetColumns: FormColumnDef[];
  diseaseId: string;
  context: MappingContext;
  existingMapping: Record<string, string>;
  existingMappingId?: string;
  onSaved?: () => void;
}) {
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      // mapping stocké comme { colonne_formulaire: colonne_source }
      const merged = { ...existingMapping };
      for (const [sourceKey, targetKey] of Object.entries(choices)) {
        if (targetKey) merged[targetKey] = sourceKey;
      }
      await columnMappingsApi.save(diseaseId, context, merged, existingMappingId);
      toast.success("Correspondance enregistrée — elle sera réutilisée pour les prochains documents.");
      onOpenChange(false);
      onSaved?.();
    } catch {
      toast.error("Échec de l'enregistrement de la correspondance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Colonnes non reconnues"
      description="Ce document a des colonnes que le formulaire ne reconnaît pas. Associez-les (ou ignorez-les) — la correspondance sera réutilisée automatiquement la prochaine fois."
    >
      <div className="flex flex-col gap-3">
        {unmappedColumns.map((sourceKey) => (
          <div key={sourceKey} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate rounded-lg bg-surface px-2.5 py-2 font-mono text-xs text-secondary">
              {sourceKey}
            </span>
            <span className="text-secondary">→</span>
            <div className="flex-1">
              <Select
                value={choices[sourceKey] ?? ""}
                onChange={(e) => setChoices((c) => ({ ...c, [sourceKey]: e.target.value }))}
              >
                <option value="">Ignorer</option>
                {targetColumns.map((col) => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </Select>
            </div>
          </div>
        ))}

        <div className="mt-2 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Plus tard
          </Button>
          <Button loading={saving} onClick={save}>
            Enregistrer la correspondance
          </Button>
        </div>
      </div>
    </Modal>
  );
}
