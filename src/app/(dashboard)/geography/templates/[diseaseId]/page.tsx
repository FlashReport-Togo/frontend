"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Plus, Save, Star, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formTemplatesApi, geographyApi } from "@/lib/endpoints/geography";
import { cn, slugify } from "@/lib/utils";
import type { ColumnDataType, FormColumnDef, FormRowDef, FormValidationRule } from "@/types";

const DATA_TYPES: { value: ColumnDataType; label: string }[] = [
  { value: "integer", label: "Nombre entier" },
  { value: "decimal", label: "Nombre décimal" },
  { value: "text", label: "Texte" },
  { value: "boolean", label: "Oui / Non" },
];

export default function FormTemplateBuilderPage() {
  const { diseaseId } = useParams<{ diseaseId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: disease } = useQuery({
    queryKey: ["diseases", diseaseId],
    queryFn: async () => (await geographyApi.listDiseases()).find((d) => d.id === diseaseId) ?? null,
  });

  const { data: existingTemplate, isLoading } = useQuery({
    queryKey: ["form-templates", diseaseId],
    queryFn: () => formTemplatesApi.getByDisease(diseaseId),
  });

  const [columns, setColumns] = useState<FormColumnDef[]>([]);
  const [rows, setRows] = useState<FormRowDef[]>([]);
  const [rowsEditable, setRowsEditable] = useState(false);
  const [columnsEditable, setColumnsEditable] = useState(false);
  const [rules, setRules] = useState<FormValidationRule[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingTemplate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initialise l'état d'édition local une fois le gabarit chargé depuis le serveur
      setColumns(existingTemplate.columns);
      setRows(existingTemplate.rows);
      setRowsEditable(existingTemplate.rows_editable);
      setColumnsEditable(existingTemplate.columns_editable);
      setRules(existingTemplate.validation_rules);
    }
  }, [existingTemplate]);

  const addColumn = () => {
    setColumns((c) => [
      ...c,
      {
        key: `col_${c.length + 1}_${Date.now().toString(36)}`,
        label: "",
        data_type: "integer",
        allow_zero: true,
        required: false,
        is_primary_metric: c.length === 0 && c.every((col) => !col.is_primary_metric),
      },
    ]);
  };

  const updateColumn = (index: number, patch: Partial<FormColumnDef>) => {
    setColumns((c) => c.map((col, i) => (i === index ? { ...col, ...patch } : col)));
  };

  const setPrimaryMetric = (index: number) => {
    setColumns((c) => c.map((col, i) => ({ ...col, is_primary_metric: i === index })));
  };

  const removeColumn = (index: number) => setColumns((c) => c.filter((_, i) => i !== index));

  const addRow = () => {
    setRows((r) => [...r, { key: `row_${r.length + 1}_${Date.now().toString(36)}`, label: "" }]);
  };

  const updateRow = (index: number, patch: Partial<FormRowDef>) => {
    setRows((r) => r.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeRow = (index: number) => setRows((r) => r.filter((_, i) => i !== index));

  const addRule = () => {
    if (columns.length < 2) {
      toast.error("Il faut au moins deux colonnes pour créer une règle.");
      return;
    }
    setRules((r) => [...r, { type: "lte", column_a: columns[0].key, column_b: columns[1].key, message: "" }]);
  };

  const updateRule = (index: number, patch: Partial<FormValidationRule>) => {
    setRules((r) => r.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));
  };

  const removeRule = (index: number) => setRules((r) => r.filter((_, i) => i !== index));

  const save = async () => {
    if (columns.some((c) => !c.label.trim())) {
      toast.error("Chaque colonne doit avoir un libellé.");
      return;
    }
    if (rows.some((r) => !r.label.trim())) {
      toast.error("Chaque ligne doit avoir un libellé.");
      return;
    }
    if (!rows.length && !rowsEditable) {
      toast.error("Ajoutez au moins une ligne, ou autorisez l'ajout de lignes à la saisie.");
      return;
    }
    if (!columns.length && !columnsEditable) {
      toast.error("Ajoutez au moins une colonne, ou autorisez l'ajout de colonnes à la saisie.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        disease: diseaseId,
        columns: columns.map((c) => ({ ...c, key: c.key || slugify(c.label) })),
        rows: rows.map((r) => ({ ...r, key: r.key || slugify(r.label) })),
        rows_editable: rowsEditable,
        columns_editable: columnsEditable,
        validation_rules: rules,
      };
      if (existingTemplate) {
        await formTemplatesApi.update(existingTemplate.id, payload);
      } else {
        await formTemplatesApi.create(payload);
      }
      toast.success("Formulaire enregistré.");
      queryClient.invalidateQueries({ queryKey: ["form-templates", diseaseId] });
      router.push("/geography");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: Record<string, unknown> } };
      toast.error(
        axiosErr.response?.data ? JSON.stringify(axiosErr.response.data) : "Échec de l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">
          Formulaire — {disease?.name ?? "…"}
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Définit les lignes et colonnes du RMA de cette maladie, comme un jeu de données DHIS2.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Colonnes</CardTitle>
          <Button size="sm" variant="secondary" onClick={addColumn}>
            <Plus size={14} /> Colonne
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {columns.length === 0 && <p className="text-sm text-secondary">Aucune colonne prédéfinie.</p>}
          {columns.map((col, i) => (
            <div key={col.key} className="flex flex-wrap items-end gap-2 rounded-lg border border-border-subtle p-3">
              <div className="w-48">
                <Field
                  label="Libellé"
                  value={col.label}
                  onChange={(e) => updateColumn(i, { label: e.target.value })}
                  placeholder="Cas confirmés"
                />
              </div>
              <div className="w-40">
                <Select
                  label="Type"
                  value={col.data_type}
                  onChange={(e) => updateColumn(i, { data_type: e.target.value as ColumnDataType })}
                >
                  {DATA_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
              <label className="flex items-center gap-1.5 pb-2.5 text-sm text-secondary">
                <input type="checkbox" checked={col.required} onChange={(e) => updateColumn(i, { required: e.target.checked })} />
                Obligatoire
              </label>
              <label className="flex items-center gap-1.5 pb-2.5 text-sm text-secondary">
                <input type="checkbox" checked={col.allow_zero} onChange={(e) => updateColumn(i, { allow_zero: e.target.checked })} />
                Zéro autorisé
              </label>
              <button
                type="button"
                onClick={() => setPrimaryMetric(i)}
                title="Métrique principale (seuils épidémiques, analytique)"
                className={cn("mb-2.5", col.is_primary_metric ? "text-severity-medium" : "text-secondary hover:text-primary")}
              >
                <Star size={16} fill={col.is_primary_metric ? "currentColor" : "none"} />
              </button>
              <div className="w-40">
                <Field
                  label="UID dataElement DHIS2"
                  value={col.dhis2_data_element_uid ?? ""}
                  onChange={(e) => updateColumn(i, { dhis2_data_element_uid: e.target.value || null })}
                  placeholder="optionnel"
                />
              </div>
              <button type="button" onClick={() => removeColumn(i)} className="mb-2.5 text-secondary hover:text-severity-critical">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <label className="mt-2 flex items-center gap-2 text-sm text-primary">
            <input type="checkbox" checked={columnsEditable} onChange={(e) => setColumnsEditable(e.target.checked)} />
            Autoriser l&apos;ajout de colonnes à la saisie
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lignes</CardTitle>
          <Button size="sm" variant="secondary" onClick={addRow}>
            <Plus size={14} /> Ligne
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {rows.length === 0 && <p className="text-sm text-secondary">Aucune ligne prédéfinie.</p>}
          {rows.map((row, i) => (
            <div key={row.key} className="flex flex-wrap items-end gap-2 rounded-lg border border-border-subtle p-3">
              <div className="w-56">
                <Field
                  label="Libellé"
                  value={row.label}
                  onChange={(e) => updateRow(i, { label: e.target.value })}
                  placeholder="0-5 ans"
                />
              </div>
              <div className="w-48">
                <Field
                  label="UID categoryOptionCombo DHIS2"
                  value={row.dhis2_category_option_combo_uid ?? ""}
                  onChange={(e) => updateRow(i, { dhis2_category_option_combo_uid: e.target.value || null })}
                  placeholder="optionnel"
                />
              </div>
              <button type="button" onClick={() => removeRow(i)} className="mb-2.5 text-secondary hover:text-severity-critical">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <label className="mt-2 flex items-center gap-2 text-sm text-primary">
            <input type="checkbox" checked={rowsEditable} onChange={(e) => setRowsEditable(e.target.checked)} />
            Autoriser l&apos;ajout de lignes à la saisie
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Règles entre colonnes</CardTitle>
          <Button size="sm" variant="secondary" onClick={addRule}>
            <Plus size={14} /> Règle
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {rules.length === 0 && <p className="text-sm text-secondary">Aucune règle (ex. décès ≤ cas).</p>}
          {rules.map((rule, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-border-subtle p-3">
              <div className="w-40">
                <Select label="Colonne A" value={rule.column_a} onChange={(e) => updateRule(i, { column_a: e.target.value })}>
                  {columns.map((c) => (
                    <option key={c.key} value={c.key}>{c.label || c.key}</option>
                  ))}
                </Select>
              </div>
              <div className="w-32">
                <Select label="Condition" value={rule.type} onChange={(e) => updateRule(i, { type: e.target.value as FormValidationRule["type"] })}>
                  <option value="lte">≤</option>
                  <option value="gte">≥</option>
                  <option value="eq">=</option>
                </Select>
              </div>
              <div className="w-40">
                <Select label="Colonne B" value={rule.column_b} onChange={(e) => updateRule(i, { column_b: e.target.value })}>
                  {columns.map((c) => (
                    <option key={c.key} value={c.key}>{c.label || c.key}</option>
                  ))}
                </Select>
              </div>
              <div className="w-56">
                <Field
                  label="Message (optionnel)"
                  value={rule.message ?? ""}
                  onChange={(e) => updateRule(i, { message: e.target.value })}
                />
              </div>
              <button type="button" onClick={() => removeRule(i)} className="mb-2.5 text-secondary hover:text-severity-critical">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 rounded-lg border border-accent-blue/25 bg-accent-blue/5 px-4 py-3 text-sm text-secondary">
        <AlertCircle size={16} className="shrink-0 text-accent-blue" />
        Modifier ce formulaire n&apos;affecte jamais les rapports déjà créés (leur structure reste figée).
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => router.push("/geography")}>
          Annuler
        </Button>
        <Button loading={saving} onClick={save}>
          <Save size={16} /> Enregistrer
        </Button>
      </div>
    </div>
  );
}
