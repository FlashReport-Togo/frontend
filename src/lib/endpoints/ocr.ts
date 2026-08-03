import { api } from "@/lib/api-client";
import type { OCRScan, Paginated } from "@/types";

export interface AIAnalysisHistoryEntry {
  id: string;
  result: { tendances?: string[]; anomalies?: string[]; synthese?: string; [key: string]: unknown };
  model_used: string;
  requested_by_name: string | null;
  created_at: string;
}

interface AIAnalysisHistoryResponse {count	: number ,next : 	null | number,previous: number |	null,results: AIAnalysisHistoryEntry[]}

const resultToString = (response : AIAnalysisHistoryResponse) => {
  return response.results;
}

export const ocrApi = {
  analysisHistory: (reportId: string) =>
    api.get<AIAnalysisHistoryResponse>(`/ai/analyzereport/${reportId}/history/`).then((r) => { return resultToString(r.data) }),

  uploadScan: (file: File, diseaseId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("disease", diseaseId);
    return api.post<OCRScan>("/ocr/scan/", formData).then((r) => r.data);
  },

  listScans: (params?: { district?: string; page?: number }) =>
    api.get<Paginated<OCRScan>>("/ocr/scans/", { params }).then((r) => r.data),

  getScan: (id: string) => api.get<OCRScan>(`/ocr/scans/${id}/`).then((r) => r.data),

  analyzeReport: (reportId: string) =>
    api.post<{ detail: string }>(`/ai/analyzereport/${reportId}/`).then((r) => r.data),
};
