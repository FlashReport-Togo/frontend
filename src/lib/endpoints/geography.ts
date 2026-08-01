import { api } from "@/lib/api-client";
import type { Disease, District, Region } from "@/types";

export const geographyApi = {
  listRegions: () => api.get<Region[]>("/regions/", { params: {} }).then((r) => r.data),
  createRegion: (payload: Partial<Region>) => api.post<Region>("/regions/", payload).then((r) => r.data),
  updateRegion: (id: string, payload: Partial<Region>) =>
    api.patch<Region>(`/regions/${id}/`, payload).then((r) => r.data),

  listDistricts: (params?: { region?: string; is_active?: boolean }) =>
    api.get<District[]>("/districts/", { params: params }).then((r) => r.data),
  createDistrict: (payload: Partial<District>) => api.post<District>("/districts/", payload).then((r) => r.data),
  updateDistrict: (id: string, payload: Partial<District>) =>
    api.patch<District>(`/districts/${id}/`, payload).then((r) => r.data),
  districtQualityScore: (id: string, params?: { date_from?: string; date_to?: string }) =>
    api
      .get<{ district_id: string; quality_score: number | null }>(`/districts/${id}/quality-score/`, { params })
      .then((r) => r.data),

  listDiseases: (params?: { category?: string; is_active?: boolean }) =>
    api.get<Disease[]>("/diseases/", { params: params }).then((r) => r.data),
  createDisease: (payload: Partial<Disease>) => api.post<Disease>("/diseases/", payload).then((r) => r.data),
  updateDisease: (id: string, payload: Partial<Disease>) =>
    api.patch<Disease>(`/diseases/${id}/`, payload).then((r) => r.data),
  setThreshold: (id: string, payload: { epidemic_threshold: number; threshold_period: string }) =>
    api.patch<Disease>(`/diseases/${id}/threshold/`, payload).then((r) => r.data),
};
