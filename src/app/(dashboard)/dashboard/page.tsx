"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ClipboardList,
  FilePlus,
  Gauge,
  ScanLine,
  ShieldCheck,
  Upload,
} from "lucide-react";
import Link from "next/link";

import { StatCard } from "@/components/dashboard/stat-card";
import { ReportStatusBadge, SeverityBadge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/ui/table";
import { alertsApi } from "@/lib/endpoints/alerts";
import { analyticsApi } from "@/lib/endpoints/analytics";
import { reportsApi } from "@/lib/endpoints/reports";
import { useAuthStore } from "@/store/auth-store";

const QUICK_ACTIONS = [
  { href: "/reports/new", label: "Nouveau rapport", icon: FilePlus },
  { href: "/reports/import", label: "Importer Excel/PDF", icon: Upload },
  { href: "/ocr", label: "Scanner un registre", icon: ScanLine },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isDistrictAgent = user?.role === "district_agent";
  const isElevated = user?.role === "regional_focal_point" || user?.role === "national_agent" || user?.role === "admin";

  const { data: reports, isLoading: loadingReports } = useQuery({
    queryKey: ["reports", "dashboard"],
    queryFn: () => reportsApi.list({ page: 1 }),
  });

  const { data: alerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ["alerts", "dashboard"],
    queryFn: () => alertsApi.list({ status: "ouverte", page: 1 }),
  });

  const { data: completeness } = useQuery({
    queryKey: ["analytics", "completeness", "dashboard"],
    queryFn: () => analyticsApi.completeness(),
    enabled: isElevated,
  });

  const { data: quality } = useQuery({
    queryKey: ["analytics", "quality", "dashboard"],
    queryFn: () => analyticsApi.quality(),
    enabled: isElevated,
  });

  const avgCompleteness = completeness?.length
    ? Math.round(
        completeness.filter((r) => r.completeness_pct !== null).reduce((sum, r) => sum + (r.completeness_pct ?? 0), 0) /
          Math.max(1, completeness.filter((r) => r.completeness_pct !== null).length)
      )
    : null;

  const avgQuality = quality?.length
    ? Math.round(
        quality.filter((r) => r.avg_quality_score !== null).reduce((sum, r) => sum + (r.avg_quality_score ?? 0), 0) /
          Math.max(1, quality.filter((r) => r.avg_quality_score !== null).length)
      )
    : null;

  const pendingValidation = reports?.results.filter((r) => r.status === "soumis").length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">
          Bonjour, {user?.first_name ?? ""}
        </h1>
        <p className="mt-1 text-sm text-secondary">Voici un aperçu de l&apos;activité de surveillance.</p>
      </div>

      {isDistrictAgent && (
        <div className="grid gap-3 sm:grid-cols-3">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl border border-border-subtle bg-surface-elevated px-4 py-4 transition-colors hover:border-accent-blue/40 hover:bg-accent-blue/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
                <Icon size={18} strokeWidth={1.75} />
              </div>
              <span className="text-sm font-medium text-primary">{label}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={AlertTriangle}
          label="Alertes ouvertes"
          value={loadingAlerts ? "…" : String(alerts?.count ?? 0)}
          tone={alerts && alerts.count > 0 ? "critical" : "positive"}
        />
        <StatCard
          icon={ClipboardList}
          label={isDistrictAgent ? "Mes rapports" : "En attente de validation"}
          value={loadingReports ? "…" : String(isDistrictAgent ? reports?.count ?? 0 : pendingValidation)}
        />
        {isElevated && (
          <>
            <StatCard
              icon={Gauge}
              label="Complétude moyenne"
              value={avgCompleteness !== null ? `${avgCompleteness}%` : "—"}
            />
            <StatCard
              icon={ShieldCheck}
              label="Score qualité moyen"
              value={avgQuality !== null ? String(avgQuality) : "—"}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rapports récents</CardTitle>
            <Link href="/reports" className="text-sm font-medium text-accent-blue hover:underline">
              Tout voir
            </Link>
          </CardHeader>
          {loadingReports ? (
            <CardContent className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          ) : !reports || reports.results.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Aucun rapport" description="Rien à afficher pour l'instant." />
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>District</Th>
                  <Th>Période</Th>
                  <Th>Statut</Th>
                </tr>
              </Thead>
              <Tbody>
                {reports.results.slice(0, 6).map((r) => (
                  <Tr key={r.id} onClick={() => (window.location.href = `/reports/${r.id}`)}>
                    <Td>{r.district_name}</Td>
                    <Td className="font-mono text-xs text-secondary">{r.period_start}</Td>
                    <Td>
                      <ReportStatusBadge status={r.status} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertes ouvertes</CardTitle>
            <Link href="/alerts" className="text-sm font-medium text-accent-blue hover:underline">
              Tout voir
            </Link>
          </CardHeader>
          {loadingAlerts ? (
            <CardContent className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          ) : !alerts || alerts.results.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="Aucune alerte ouverte" description="Tout est sous contrôle." />
          ) : (
            <ul className="divide-y divide-border-subtle">
              {alerts.results.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                  <SeverityBadge severity={a.severity} />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-primary">{a.message}</p>
                    {a.district_name && <p className="mt-0.5 text-xs text-secondary">{a.district_name}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
