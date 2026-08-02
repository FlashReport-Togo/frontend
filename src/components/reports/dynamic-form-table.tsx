"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Table, Tbody, Td, Th, Thead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { FormColumnDef, ReportDetail } from "@/types";

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

export function DynamicFormTable({
  report,
  editable,
  pendingValues,
  onCellChange,
  onAddRow,
  onAddColumn,
}: {
  report: ReportDetail;
  editable: boolean;
  pendingValues: Record<string, string>;
  onCellChange: (cellId: string, value: string) => void;
  onAddRow?: (label: string) => void;
  onAddColumn?: (label: string) => void;
}) {
  const columns = getDisplayColumns(report);
  const [addingRow, setAddingRow] = useState(false);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newLabel, setNewLabel] = useState("");

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

                return (
                  <Td key={col.key} className={cn(lowConfidence && "bg-severity-medium/8")}>
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
                          className="w-24 rounded-lg border border-border-subtle bg-surface px-2 py-1 font-mono text-sm text-primary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25"
                        />
                      )
                    ) : (
                      <span className="font-mono">{cell.value ?? "—"}</span>
                    )}
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
    </div>
  );
}
