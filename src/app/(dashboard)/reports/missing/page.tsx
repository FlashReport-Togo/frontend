"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MapPinOff } from "lucide-react";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/table";
import { geographyApi } from "@/lib/endpoints/geography";
import { reportsApi } from "@/lib/endpoints/reports";
import type { PeriodType } from "@/types";

export default function MissingReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [periodType, setPeriodType] = useState<PeriodType>("journalier");
  const [date, setDate] = useState(today);
  const [diseaseId, setDiseaseId] = useState("");

  const { data: diseases } = useQuery({ queryKey: ["diseases"], queryFn: () => geographyApi.listDiseases({ is_active: true }) });

  const { data, isLoading } = useQuery({
    queryKey: ["reports", "missing", periodType, date, diseaseId],
    queryFn: () => reportsApi.missing({ period_type: periodType, period_start: date, period_end: date, disease: diseaseId }),
    enabled: !!diseaseId,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">Rapports manquants</h1>
        <p className="mt-1 text-sm text-secondary">Districts n&apos;ayant pas soumis, pour une maladie et une période données.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="w-56">
          <Select value={diseaseId} onChange={(e) => setDiseaseId(e.target.value)}>
            <option value="">Choisir une maladie…</option>
            {diseases?.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
        </div>
        <div className="w-44">
          <Select value={periodType} onChange={(e) => setPeriodType(e.target.value as PeriodType)}>
            <option value="journalier">Journalier</option>
            <option value="hebdomadaire">Hebdomadaire</option>
          </Select>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-border-subtle bg-surface-elevated px-3.5 py-2.5 text-[15px] text-primary focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/25"
        />
      </div>

      <Card>
        {!diseaseId ? (
          <p className="p-5 text-sm text-secondary">Choisissez une maladie pour voir les districts en retard.</p>
        ) : isLoading ? (
          <p className="p-5 text-sm text-secondary">Chargement…</p>
        ) : !data || data.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Tous les districts ont soumis" description="Aucun rapport manquant pour cette sélection." />
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>District</Th>
                <Th>Région</Th>
              </tr>
            </Thead>
            <Tbody>
              {data.map((row) => (
                <Tr key={row.district_id}>
                  <Td className="flex items-center gap-2 font-medium">
                    <MapPinOff size={14} className="text-severity-medium" />
                    {row.district_name}
                  </Td>
                  <Td className="text-secondary">{row.region}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
