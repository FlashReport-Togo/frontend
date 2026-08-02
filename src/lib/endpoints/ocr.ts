import { api } from "@/lib/api-client";
import type { OCRScan, Paginated } from "@/types";

export const ocrApi = {
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
