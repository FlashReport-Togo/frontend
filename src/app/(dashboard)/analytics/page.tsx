"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/table";
import { analyticsApi } from "@/lib/endpoints/analytics";
import { geographyApi } from "@/lib/endpoints/geography";

const SERIES_COLORS = ["var(--accent-blue)", "var(--accent-cyan)", "var(--severity-medium)", "var(--severity-low)", "var(--severity-critical)"];

export default function AnalyticsPage() {
  const [diseaseId, setDiseaseId] = useState("");
  const [periodType, setPeriodType] = useState<"jour" | "semaine" | "mois">("semaine");

  const { data: diseases } = useQuery({ queryKey: ["diseases"], queryFn: () => geographyApi.listDiseases() });

  const { data: cases, isLoading: loadingCases } = useQuery({
    queryKey: ["analytics", "cases", diseaseId, periodType],
    queryFn: () => analyticsApi.cases({ disease: diseaseId || undefined, period_type: periodType }),
  });

  const { data: completeness, isLoading: loadingCompleteness } = useQuery({
    queryKey: ["analytics", "completeness", diseaseId],
    queryFn: () => analyticsApi.completeness({ disease: diseaseId || undefined }),
  });

  const { data: quality, isLoading: loadingQuality } = useQuery({
    queryKey: ["analytics", "quality"],
    queryFn: () => analyticsApi.quality(),
  });

  const { data: map, isLoading: loadingMap } = useQuery({
    queryKey: ["analytics", "map", diseaseId],
    queryFn: () => analyticsApi.map({ disease: diseaseId || undefined }),
  });

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ["analytics", "disease-detail", diseaseId],
    queryFn: () => analyticsApi.diseaseDetail({ disease: diseaseId }),
    enabled: !!diseaseId,
  });

  // Agrège les séries par période (toutes maladies confondues si aucune sélection)
  const chartData = (() => {
    if (!cases) return [];
    const byPeriod = new Map<string, number>();
    for (const point of cases) {
      byPeriod.set(point.period, (byPeriod.get(point.period) ?? 0) + point.cases);
    }
    return Array.from(byPeriod.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, total]) => ({ period: period.slice(0, 10), cas: total }));
  })();

  const maxMapCases = Math.max(1, ...(map?.map((r) => r.cases) ?? [0]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">Analytique</h1>
          <p className="mt-1 text-sm text-secondary">Tendances, complétude, qualité et répartition géographique.</p>
        </div>
        <div className="w-56">
          <Select label="Maladie" value={diseaseId} onChange={(e) => setDiseaseId(e.target.value)}>
            <option value="">Toutes les maladies</option>
            {diseases?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Tabs defaultValue="cases">
        <TabsList>
          <TabsTrigger value="cases">Cas</TabsTrigger>
          <TabsTrigger value="detail">Détail formulaire</TabsTrigger>
          <TabsTrigger value="completeness">Complétude</TabsTrigger>
          <TabsTrigger value="quality">Qualité</TabsTrigger>
          <TabsTrigger value="map">Répartition</TabsTrigger>
        </TabsList>

        <TabsContent value="cases">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des cas (métrique principale)</CardTitle>
              <div className="w-40">
                <Select value={periodType} onChange={(e) => setPeriodType(e.target.value as typeof periodType)}>
                  <option value="jour">Par jour</option>
                  <option value="semaine">Par semaine</option>
                  <option value="mois">Par mois</option>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCases ? (
                <Skeleton className="h-72 w-full" />
              ) : chartData.length === 0 ? (
                <p className="py-16 text-center text-sm text-secondary">Aucune donnée pour cette sélection.</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 11, fill: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
                      tickLine={false}
                      axisLine={{ stroke: "var(--border-subtle)" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--surface-elevated)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    />
                    <Line type="monotone" dataKey="cas" stroke="var(--accent-blue)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail">
          {!diseaseId ? (
            <Card>
              <CardContent>
                <p className="py-8 text-center text-sm text-secondary">
                  Choisissez une maladie ci-dessus pour explorer son formulaire (colonnes/lignes) en graphique et en tableau.
                </p>
              </CardContent>
            </Card>
          ) : loadingDetail ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <DiseaseDetailExplorer
              columns={detail?.columns ?? []}
              rows={detail?.rows ?? []}
              records={detail?.records ?? []}
            />
          )}
        </TabsContent>

        <TabsContent value="completeness">
          <Card>
            {loadingCompleteness ? (
              <div className="p-5">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <Table>
                <Thead>
                  <tr>
                    <Th>District</Th>
                    <Th>Région</Th>
                    <Th>Maladie</Th>
                    <Th>Complétude</Th>
                    <Th>Promptitude</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {completeness?.map((row) => (
                    <Tr key={`${row.district_id}-${row.disease_id}`}>
                      <Td className="font-medium">{row.district_name}</Td>
                      <Td className="text-secondary">{row.region_name}</Td>
                      <Td className="text-secondary">{row.disease_name}</Td>
                      <Td className="font-mono">{row.completeness_pct !== null ? `${row.completeness_pct}%` : "—"}</Td>
                      <Td className="font-mono">{row.promptness_pct !== null ? `${row.promptness_pct}%` : "—"}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="quality">
          <Card>
            {loadingQuality ? (
              <div className="p-5">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <Table>
                <Thead>
                  <tr>
                    <Th>District</Th>
                    <Th>Région</Th>
                    <Th>Score moyen</Th>
                    <Th>Rapports</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {quality?.map((row) => (
                    <Tr key={row.district_id}>
                      <Td className="font-medium">{row.district_name}</Td>
                      <Td className="text-secondary">{row.region_name}</Td>
                      <Td className="font-mono">{row.avg_quality_score ?? "—"}</Td>
                      <Td className="font-mono">{row.report_count}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Cas cumulés par district</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {loadingMap ? (
                <Skeleton className="h-64 w-full" />
              ) : !map || map.length === 0 ? (
                <p className="py-8 text-center text-sm text-secondary">Aucune donnée disponible.</p>
              ) : (
                [...map]
                  .sort((a, b) => b.cases - a.cases)
                  .map((row) => (
                    <div key={row.district_id} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 truncate text-sm text-primary">{row.district_name}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface">
                        <div
                          className="h-full rounded-full bg-accent-cyan"
                          style={{ width: `${Math.max(4, (row.cases / maxMapCases) * 100)}%` }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right font-mono text-sm text-primary">{row.cases}</span>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Explorateur du formulaire d'une maladie : choix libre de la colonne (Y) et de
// l'axe X (période ou ligne du formulaire) — graphique + tableau pivot ------------

function DiseaseDetailExplorer({
  columns,
  rows,
  records,
}: {
  columns: { key: string; label: string; data_type: string }[];
  rows: { key: string; label: string }[];
  records: { period_start: string; row_key: string; row_label: string; column_key: string; value: string }[];
}) {
  const numericColumns = columns.filter((c) => c.data_type === "integer" || c.data_type === "decimal");
  const [columnKey, setColumnKey] = useState(numericColumns[0]?.key ?? "");
  const [xAxis, setXAxis] = useState<"period" | "row">("period");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialise la colonne sélectionnée dès que le formulaire est chargé
    if (!columnKey && numericColumns.length > 0) setColumnKey(numericColumns[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericColumns.length]);

  if (numericColumns.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="py-8 text-center text-sm text-secondary">Ce formulaire n&apos;a aucune colonne numérique à visualiser.</p>
        </CardContent>
      </Card>
    );
  }

  const filtered = records.filter((r) => r.column_key === columnKey);
  const rowLabels = Array.from(new Set(filtered.map((r) => r.row_label)));
  const periods = Array.from(new Set(filtered.map((r) => r.period_start))).sort();

  // Graphique : par période (une série par ligne du formulaire) ou par ligne (une barre par ligne, valeur cumulée)
  const chartData =
    xAxis === "period"
      ? periods.map((period) => {
          const point: Record<string, string | number> = { period };
          for (const label of rowLabels) {
            point[label] = filtered
              .filter((r) => r.period_start === period && r.row_label === label)
              .reduce((sum, r) => sum + (Number(r.value) || 0), 0);
          }
          return point;
        })
      : rowLabels.map((label) => ({
          row: label,
          valeur: filtered.filter((r) => r.row_label === label).reduce((sum, r) => sum + (Number(r.value) || 0), 0),
        }));

  // Tableau pivot : lignes du formulaire × périodes
  const pivot = rowLabels.map((label) => {
    const values: Record<string, number> = {};
    for (const period of periods) {
      values[period] = filtered
        .filter((r) => r.row_label === label && r.period_start === period)
        .reduce((sum, r) => sum + (Number(r.value) || 0), 0);
    }
    return { label, values };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <div className="w-56">
          <Select label="Colonne (valeur)" value={columnKey} onChange={(e) => setColumnKey(e.target.value)}>
            {numericColumns.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </Select>
        </div>
        <div className="w-56">
          <Select label="Axe X" value={xAxis} onChange={(e) => setXAxis(e.target.value as "period" | "row")}>
            <option value="period">Période (une courbe par ligne)</option>
            <option value="row">Ligne du formulaire (barres)</option>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Graphique</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-secondary">Aucune donnée pour cette sélection.</p>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              {xAxis === "period" ? (
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 13 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {rowLabels.map((label, i) => (
                    <Line key={label} type="monotone" dataKey={label} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="row" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "var(--surface-elevated)", border: "1px solid var(--border-subtle)", borderRadius: 8, fontSize: 13 }} />
                  <Bar dataKey="valeur" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tableau</CardTitle>
        </CardHeader>
        {pivot.length === 0 ? (
          <CardContent>
            <p className="py-8 text-center text-sm text-secondary">Aucune donnée.</p>
          </CardContent>
        ) : (
          <Table>
            <Thead>
              <tr>
                <Th>Ligne</Th>
                {periods.map((p) => <Th key={p}>{p}</Th>)}
              </tr>
            </Thead>
            <Tbody>
              {pivot.map((row) => (
                <Tr key={row.label}>
                  <Td className="font-medium">{row.label}</Td>
                  {periods.map((p) => <Td key={p} className="font-mono">{row.values[p]}</Td>)}
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
