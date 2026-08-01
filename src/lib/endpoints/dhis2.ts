import { api } from "@/lib/api-client";
import type { DHIS2MetadataCacheItem, DHIS2PushLog, Paginated } from "@/types";

export const dhis2Api = {
  push: (reportId: string) => api.post<{ detail: string }>(`/dhis2/push/${reportId}/`).then((r) => r.data),

  sync: (entityType: "org_unit" | "data_element" | "category_option_combo") =>
    api.post<{ detail: string }>(`/dhis2/sync/${entityType}/`).then((r) => r.data),

  metadataCache: (params?: { entity_type?: string; search?: string }) =>
    api
      .get<Paginated<DHIS2MetadataCacheItem>>("/dhis2/metadata-cache/", { params })
      .then((r) => r.data),

  pushLogs: (params?: { status?: string; report?: string; page?: number }) =>
    api.get<Paginated<DHIS2PushLog>>("/dhis2/push-logs/", { params }).then((r) => r.data),
};
