"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ReportStatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/table";
import { geographyApi } from "@/lib/endpoints/geography";
import { reportsApi } from "@/lib/endpoints/reports";
import { useAuthStore } from "@/store/auth-store";
import type { PeriodType, ReportStatus } from "@/types";

export default function ReportsListPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [status, setStatus] = useState<ReportStatus | "">("");
  const [periodType, setPeriodType] = useState<PeriodType | "">("");
  const [district, setDistrict] = useState("");
  const [page, setPage] = useState(1);

  const { data: districts } = useQuery({ queryKey: ["districts"], queryFn: () => geographyApi.listDistricts() });

  const { data, isLoading } = useQuery({
    queryKey: ["reports", { status, periodType, district, page }],
    queryFn: () =>
      reportsApi.list({
        status: status || undefined,
        period_type: periodType || undefined,
        district: district || undefined,
        page,
      }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">Rapports</h1>
          <p className="mt-1 text-sm text-secondary">Suivi des rapports de surveillance épidémiologique.</p>
        </div>
        {user?.role === "district_agent" && (
          <Button onClick={() => router.push("/reports/new")}>
            <Plus size={16} /> Nouveau rapport
          </Button>
        )}
      </div>

      <Card>
        <div className="flex flex-wrap gap-3 border-b border-border-subtle p-4">
          <div className="w-44">
            <Select value={status} onChange={(e) => { setStatus(e.target.value as ReportStatus | ""); setPage(1); }}>
              <option value="">Tous les statuts</option>
              <option value="brouillon">Brouillon</option>
              <option value="soumis">Soumis</option>
              <option value="validé">Validé</option>
              <option value="rejeté">Rejeté</option>
            </Select>
          </div>
          <div className="w-44">
            <Select value={periodType} onChange={(e) => { setPeriodType(e.target.value as PeriodType | ""); setPage(1); }}>
              <option value="">Toute périodicité</option>
              <option value="journalier">Journalier</option>
              <option value="hebdomadaire">Hebdomadaire</option>
            </Select>
          </div>
          {user?.role !== "district_agent" && (
            <div className="w-52">
              <Select value={district} onChange={(e) => { setDistrict(e.target.value); setPage(1); }}>
                <option value="">Tous les districts</option>
                {(districts?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !data || data.results.length === 0 ? (
          <EmptyState icon={FileText} title="Aucun rapport" description="Aucun rapport ne correspond à ces filtres." />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>District</Th>
                  <Th>Région</Th>
                  <Th>Période</Th>
                  <Th>Canal</Th>
                  <Th>Score qualité</Th>
                  <Th>Statut</Th>
                </tr>
              </Thead>
              <Tbody>
                {data.results.map((r) => (
                  <Tr key={r.id} onClick={() => router.push(`/reports/${r.id}`)}>
                    <Td className="font-medium">{r.district_name}</Td>
                    <Td className="text-secondary">{r.region_name}</Td>
                    <Td className="font-mono text-xs">
                      {r.period_start}
                      {r.period_start !== r.period_end ? ` → ${r.period_end}` : ""}
                    </Td>
                    <Td className="text-secondary capitalize">{r.source_channel.replace("_", " ")}</Td>
                    <Td className="font-mono">{r.quality_score ?? "—"}</Td>
                    <Td>
                      <ReportStatusBadge status={r.status} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination page={page} count={data.count} onPageChange={setPage} />
          </>
        )}
      </Card>

      {user?.role !== "district_agent" && (
        <Link href="/reports/missing" className="text-sm font-medium text-accent-blue hover:underline">
          Voir les rapports manquants →
        </Link>
      )}
    </div>
  );
}
