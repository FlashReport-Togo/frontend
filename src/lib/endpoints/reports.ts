import { api } from "@/lib/api-client";
import type {
  MappingContext,
  Paginated,
  PeriodType,
  QualityCheckResult,
  ReportColumnMapping,
  ReportDetail,
  ReportHistoryEntry,
  ReportListItem,
  ReportStatus,
} from "@/types";

export interface ReportFilters {
  district?: string;
  district__region?: string;
  disease?: string;
  period_type?: PeriodType;
  status?: ReportStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export const reportsApi = {
  list: (params?: ReportFilters) =>
    api.get<Paginated<ReportListItem>>("/reports/", { params }).then((r) => r.data),

  get: (id: string) => api.get<ReportDetail>(`/reports/${id}/`).then((r) => r.data),

  create: (payload: {
    district: string;
    disease: string;
    period_type: PeriodType;
    period_start: string;
    period_end: string;
    source_channel?: string;
  }) => api.post<ReportDetail>("/reports/", { source_channel: "manuel", ...payload }).then((r) => r.data),

  updateCells: (id: string, cells: { id: string; value: string | null }[]) =>
    api.put<ReportDetail>(`/reports/${id}/cells/`, { cells }).then((r) => r.data),

  addRow: (id: string, label: string) =>
    api.post<ReportDetail>(`/reports/${id}/add-row/`, { label }).then((r) => r.data),

  addColumn: (id: string, label: string) =>
    api.post<ReportDetail>(`/reports/${id}/add-column/`, { label }).then((r) => r.data),

  submit: (id: string) => api.post<ReportDetail>(`/reports/${id}/submit/`).then((r) => r.data),

  validate: (id: string) => api.post<ReportDetail>(`/reports/${id}/validate/`).then((r) => r.data),

  reject: (id: string, reason: string) =>
    api.post<ReportDetail>(`/reports/${id}/reject/`, { reason }).then((r) => r.data),

  quality: (id: string) => api.get<QualityCheckResult[]>(`/reports/${id}/quality/`).then((r) => r.data),

  qualityRecheck: (id: string) =>
    api
      .post<{ has_blocking: boolean; results: QualityCheckResult[] }>(`/reports/${id}/quality/recheck/`)
      .then((r) => r.data),

  history: (id: string) => api.get<ReportHistoryEntry[]>(`/reports/${id}/history/`).then((r) => r.data),

  missing: (params: { period_start: string; period_end: string; period_type: PeriodType; disease: string }) =>
    api
      .get<{ district_id: string; district_name: string; region: string }[]>("/reports/missing/", { params })
      .then((r) => r.data),

  importExcel: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post<ReportDetail & { unmapped_columns: string[] }>("/reports/import/excel/", formData)
      .then((r) => r.data);
  },

  importPdf: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post<ReportDetail & { unmapped_columns: string[] }>("/reports/import/pdf/", formData)
      .then((r) => r.data);
  },
};

export const columnMappingsApi = {
  list: (params?: { disease?: string; context?: MappingContext }) =>
    api.get<ReportColumnMapping[]>("/report-column-mappings/", { params }).then((r) => r.data),

  getOne: async (diseaseId: string, context: MappingContext) => {
    const list = await api.get<ReportColumnMapping[]>("/report-column-mappings/", {
      params: { disease: diseaseId, context },
    });
    return list.data[0] ?? null;
  },

  save: (diseaseId: string, context: MappingContext, mapping: Record<string, string>, existingId?: string) =>
    existingId
      ? api.patch<ReportColumnMapping>(`/report-column-mappings/${existingId}/`, { mapping }).then((r) => r.data)
      : api
          .post<ReportColumnMapping>("/report-column-mappings/", { disease: diseaseId, context, mapping })
          .then((r) => r.data),
};
