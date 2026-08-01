import { api } from "@/lib/api-client";
import type { AlertItem, AlertSeverity, AlertStatus, AlertType, NotificationItem, Paginated } from "@/types";

export const alertsApi = {
  list: (params?: { status?: AlertStatus; type?: AlertType; severity?: AlertSeverity; district?: string; page?: number }) =>
    api.get<Paginated<AlertItem>>("/alerts/", { params }).then((r) => r.data),

  get: (id: string) => api.get<AlertItem>(`/alerts/${id}/`).then((r) => r.data),

  acknowledge: (id: string) => api.patch<AlertItem>(`/alerts/${id}/acknowledge/`).then((r) => r.data),

  resolve: (id: string, resolution_comment: string) =>
    api.patch<AlertItem>(`/alerts/${id}/resolve/`, { resolution_comment }).then((r) => r.data),

  notifications: (params?: { is_read?: boolean; page?: number }) =>
    api.get<Paginated<NotificationItem>>("/notifications/", { params }).then((r) => r.data),

  unreadCount: () => api.get<{ unread_count: number }>("/notifications/unread-count/").then((r) => r.data),

  markRead: (id: string) => api.patch<NotificationItem>(`/notifications/${id}/read/`).then((r) => r.data),

  markAllRead: () => api.patch<{ updated: number }>("/notifications/mark-all-read/").then((r) => r.data),
};
