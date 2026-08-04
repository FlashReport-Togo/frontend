import { api } from "@/lib/api-client";

export interface AnalyticsFilters {
  disease?: string;
  district?: string;
  region?: string;
  date_from?: string;
  date_to?: string;
  period_type?: "jour" | "semaine" | "mois";
}

export interface CasesPoint {
  period: string;
  disease: string;
  cases: number;
  deaths: number;
}

export interface CompletenessRow {
  district_id: string;
  district_name: string;
  region_name: string;
  disease_id: string;
  disease_name: string;
  completeness_pct: number | null;
  promptness_pct: number | null;
}

export interface QualityRow {
  district_id: string;
  district_name: string;
  region_name: string;
  avg_quality_score: number | null;
  report_count: number;
}

export interface MapRow {
  district_id: string;
  district_name: string;
  cases: number;
  deaths: number;
}

export interface DiseaseDetailColumn {
  key: string;
  label: string;
  data_type: string;
  is_primary_metric?: boolean;
}

export interface DiseaseDetailRow {
  key: string;
  label: string;
}

export interface DiseaseDetailRecord {
  period_start: string;
  district_id: string;
  district_name: string;
  row_key: string;
  row_label: string;
  column_key: string;
  column_label: string;
  value: string;
}

export interface DiseaseDetailResponse {
  columns: DiseaseDetailColumn[];
  rows: DiseaseDetailRow[];
  records: DiseaseDetailRecord[];
}

export const analyticsApi = {
  cases: (params?: AnalyticsFilters) => api.get<CasesPoint[]>("/analytics/cases/", { params }).then((r) => r.data),
  completeness: (params?: AnalyticsFilters) =>
    api.get<CompletenessRow[]>("/analytics/completeness/", { params }).then((r) => r.data),
  quality: (params?: AnalyticsFilters) =>
    api.get<QualityRow[]>("/analytics/quality/", { params }).then((r) => r.data),
  map: (params?: AnalyticsFilters) => api.get<MapRow[]>("/analytics/map/", { params }).then((r) => r.data),
  diseaseDetail: (params: AnalyticsFilters & { disease: string }) =>
    api.get<DiseaseDetailResponse>("/analytics/disease-detail/", { params }).then((r) => r.data),
};
