"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Table, Tbody, Td, Th, Thead } from "@/components/ui/table";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { FormColumnDef, QualityCheckResult, ReportDetail } from "@/types";

type DisplayColumn = Omit<FormColumnDef, "dhis2_data_element_uid">;

function getDisplayColumns(report: ReportDetail): DisplayColumn[] {
  const map = new Map<string, DisplayColumn>();
  for (const col of report.form_snapshot.columns) map.set(col.key, col);
  for (const row of report.rows) {
    for (const cell of row.cells) {
      if (!map.has(cell.column_key)) {
        map.set(cell.column_key, {
          key: cell.column_key,
          label: cell.column_label,
          data_type: "text",
          allow_zero: true,
          required: false,
          is_primary_metric: false,
        });
      }
    }
  }
  return Array.from(map.values());
}

const SEVERITY_RING = {
  info: "ring-2 ring-inset ring-accent-blue/60 bg-accent-blue/5",
  avertissement: "ring-2 ring-inset ring-severity-medium/60 bg-severity-medium/8",
  bloquant: "ring-2 ring-inset ring-severity-critical/60 bg-severity-critical/8",
} as const;

export function DynamicFormTable({
  report,
  editable,
  pendingValues,
  onCellChange,
  onAddRow,
  onAddColumn,
  qualityChecks = [],
  focusedCellId,
  onFocusHandled,
}: {
  report: ReportDetail;
  editable: boolean;
  pendingValues: Record<string, string>;
  onCellChange: (cellId: string, value: string) => void;
  onAddRow?: (label: string) => void;
  onAddColumn?: (label: string) => void;
  qualityChecks?: QualityCheckResult[];
  focusedCellId?: string | null;
  onFocusHandled?: () => void;
}) {
  const queryClient = useQueryClient();
  const columns = getDisplayColumns(report);
  const [addingRow, setAddingRow] = useState(false);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [activeCell, setActiveCell] = useState<{ cellId: string; checks: QualityCheckResult[] } | null>(null);
  const [resolving, setResolving] = useState(false);
  const cellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});

  const checksByCell = new Map<string, QualityCheckResult[]>();
  for (const check of qualityChecks) {
    if (!check.report_cell || check.is_resolved) continue;
    const list = checksByCell.get(check.report_cell) ?? [];
    list.push(check);
    checksByCell.set(check.report_cell, list);
  }

  const worstSeverity = (checks: QualityCheckResult[]) =>
    checks.some((c) => c.severity === "bloquant")
      ? "bloquant"
      : checks.some((c) => c.severity === "avertissement")
        ? "avertissement"
        : "info";

  // Navigation depuis la liste des anomalies (onglet Contrôle qualité) : scroll + ouvre
  // directement la mini-fenêtre sur la cellule concernée.
  useEffect(() => {
    if (!focusedCellId) return;
    const checks = checksByCell.get(focusedCellId);
    cellRefs.current[focusedCellId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ouvre la mini-fenêtre suite à un clic externe (liste des anomalies)
    if (checks?.length) setActiveCell({ cellId: focusedCellId, checks });
    onFocusHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedCellId]);

  const submitNewRow = () => {
    if (newLabel.trim() && onAddRow) onAddRow(newLabel.trim());
    setNewLabel("");
    setAddingRow(false);
  };

  const submitNewColumn = () => {
    if (newLabel.trim() && onAddColumn) onAddColumn(newLabel.trim());
    setNewLabel("");
    setAddingColumn(false);
  };

  const resolveActiveChecks = async () => {
    if (!activeCell) return;
    setResolving(true);
    try {
      await Promise.all(activeCell.checks.map((c) => api.patch(`/quality-checks/${c.id}/resolve/`, {})));
      toast.success("Anomalie marquée comme résolue.");
      queryClient.invalidateQueries({ queryKey: ["reports", report.id] });
      setActiveCell(null);
    } catch {
      toast.error("Impossible de résoudre cette anomalie.");
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <Thead>
          <tr>
            <Th>Ligne</Th>
            {columns.map((col) => (
              <Th key={col.key}>
                {col.label}
                {col.is_primary_metric && <span className="ml-1 text-severity-medium">★</span>}
                {col.required && <span className="ml-0.5 text-severity-critical">*</span>}
              </Th>
            ))}
          </tr>
        </Thead>
        <Tbody>
          {report.rows.map((row) => (
            <tr key={row.id}>
              <Td className="font-medium">{row.row_label}</Td>
              {columns.map((col) => {
                const cell = row.cells.find((c) => c.column_key === col.key);
                if (!cell) return <Td key={col.key}>—</Td>;

                const lowConfidence = cell.confidence_score !== null && cell.confidence_score < 90;
                const currentValue = pendingValues[cell.id] ?? cell.value ?? "";
                const cellChecks = checksByCell.get(cell.id);
                const hasIssue = !!cellChecks?.length;
                const issueMessage = cellChecks?.map((c) => c.message).join(" · ");

                return (
                  <Td
                    key={col.key}
                    ref={(el) => { cellRefs.current[cell.id] = el; }}
                    title={issueMessage}
                    onClick={() => hasIssue && setActiveCell({ cellId: cell.id, checks: cellChecks! })}
                    className={cn(
                      "transition-colors",
                      lowConfidence && "bg-severity-medium/8",
                      hasIssue && SEVERITY_RING[worstSeverity(cellChecks!)],
                      hasIssue && "cursor-pointer"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {editable ? (
                        col.data_type === "boolean" ? (
                          <input
                            type="checkbox"
                            checked={currentValue === "true"}
                            onChange={(e) => onCellChange(cell.id, e.target.checked ? "true" : "false")}
                          />
                        ) : (
                          <input
                            type={col.data_type === "integer" || col.data_type === "decimal" ? "number" : "text"}
                            step={col.data_type === "decimal" ? "0.01" : undefined}
                            value={currentValue}
                            onChange={(e) => onCellChange(cell.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-24 rounded-lg border border-border-subtle bg-surface px-2 py-1 font-mono text-sm text-primary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25"
                          />
                        )
                      ) : (
                        <span className="font-mono">{cell.value ?? "—"}</span>
                      )}
                      {hasIssue && <AlertTriangle size={13} className="shrink-0 text-severity-critical" />}
                    </div>
                    {lowConfidence && (
                      <span className="ml-1.5 text-xs text-severity-medium">{cell.confidence_score}%</span>
                    )}
                  </Td>
                );
              })}
            </tr>
          ))}
        </Tbody>
      </Table>

      {editable && (report.form_snapshot.rows_editable || report.form_snapshot.columns_editable) && (
        <div className="flex flex-wrap items-center gap-2 px-2">
          {report.form_snapshot.rows_editable && !addingRow && (
            <Button size="sm" variant="secondary" onClick={() => setAddingRow(true)}>
              <Plus size={14} /> Ligne
            </Button>
          )}
          {report.form_snapshot.columns_editable && !addingColumn && (
            <Button size="sm" variant="secondary" onClick={() => setAddingColumn(true)}>
              <Plus size={14} /> Colonne
            </Button>
          )}
          {(addingRow || addingColumn) && (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (addingRow ? submitNewRow() : submitNewColumn())}
                placeholder={addingRow ? "Libellé de la ligne" : "Libellé de la colonne"}
                className="rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-sm text-primary focus:border-accent-blue focus:outline-none"
              />
              <Button size="sm" onClick={addingRow ? submitNewRow : submitNewColumn}>
                Ajouter
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingRow(false); setAddingColumn(false); setNewLabel(""); }}>
                Annuler
              </Button>
            </div>
          )}
        </div>
      )}

      <Modal
        open={!!activeCell}
        onOpenChange={(open) => !open && setActiveCell(null)}
        title="Anomalie sur cette cellule"
      >
        <div className="flex flex-col gap-3">
          {activeCell?.checks.map((c) => (
            <p key={c.id} className="rounded-lg bg-surface px-3.5 py-2.5 text-sm text-primary">
              {c.message}
            </p>
          ))}
          {editable && (
            <div className="mt-1 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setActiveCell(null)}>Fermer</Button>
              <Button loading={resolving} onClick={resolveActiveChecks}>Marquer résolu</Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
