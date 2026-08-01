import { api } from "@/lib/api-client";
import type { Paginated, ReportExportItem } from "@/types";

export const exportsApi = {
  history: () => api.get<Paginated<ReportExportItem>>("/exports/history/").then((r) => r.data),

  triggerReportsPdf: (params?: Record<string, string>) =>
    api.get<ReportExportItem>("/exports/reports/pdf/", { params }).then((r) => r.data),
  triggerReportsExcel: (params?: Record<string, string>) =>
    api.get<ReportExportItem>("/exports/reports/excel/", { params }).then((r) => r.data),
  triggerAnalyticsPdf: (params?: Record<string, string>) =>
    api.get<ReportExportItem>("/exports/analytics/pdf/", { params }).then((r) => r.data),
  get: (id: string) => api.get<ReportExportItem>(`/exports/${id}/download/`).then((r) => r.data),
};
