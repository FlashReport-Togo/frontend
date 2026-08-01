import { api } from "@/lib/api-client";
import type {
  Paginated,
  PeriodType,
  QualityCheckResult,
  ReportDetail,
  ReportHistoryEntry,
  ReportListItem,
  ReportStatus,
} from "@/types";

export interface ReportFilters {
  district?: string;
  district__region?: string;
  period_type?: PeriodType;
  status?: ReportStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export interface DataValueInput {
  disease: string;
  cases: number;
  deaths: number;
  notes?: string;
}

export const reportsApi = {
  list: (params?: ReportFilters) =>
    api.get<Paginated<ReportListItem>>("/reports/", { params }).then((r) => r.data),

  get: (id: string) => api.get<ReportDetail>(`/reports/${id}/`).then((r) => r.data),

  create: (payload: {
    district: string;
    period_type: PeriodType;
    period_start: string;
    period_end: string;
    data_values: DataValueInput[];
  }) => api.post<ReportDetail>("/reports/", payload).then((r) => r.data),

  update: (id: string, payload: Partial<{ data_values: DataValueInput[] }>) =>
    api.patch<ReportDetail>(`/reports/${id}/`, payload).then((r) => r.data),

  submit: (id: string) => api.post<ReportDetail>(`/reports/${id}/submit/`).then((r) => r.data),

  validate: (id: string) => api.post<ReportDetail>(`/reports/${id}/validate/`).then((r) => r.data),

  reject: (id: string, reason: string) =>
    api.post<ReportDetail>(`/reports/${id}/reject/`, { reason }).then((r) => r.data),

  quality: (id: string) =>
    api.get<QualityCheckResult[]>(`/reports/${id}/quality/`).then((r) => r.data),

  qualityRecheck: (id: string) =>
    api
      .post<{ has_blocking: boolean; results: QualityCheckResult[] }>(`/reports/${id}/quality/recheck/`)
      .then((r) => r.data),

  history: (id: string) => api.get<ReportHistoryEntry[]>(`/reports/${id}/history/`).then((r) => r.data),

  missing: (params: { period_start: string; period_end: string; period_type: PeriodType }) =>
    api
      .get<{ district_id: string; district_name: string; region: string }[]>("/reports/missing/", { params })
      .then((r) => r.data),

  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post<ReportDetail & { unmatched_diseases: string[] }>("/reports/import/excel/", formData)
      .then((r) => r.data);
  },

  importPdf: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post<ReportDetail & { unmatched_diseases: string[] }>("/reports/import/pdf/", formData)
      .then((r) => r.data);
  },
};
