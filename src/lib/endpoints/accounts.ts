import { api } from "@/lib/api-client";
import type { AppUser, Paginated, UserRole } from "@/types";

export const accountsApi = {
  me: () => api.get<AppUser>("/auth/me/").then((r) => r.data),

  changePassword: (payload: { old_password: string; new_password: string }) =>
    api.post("/auth/change-password/", payload).then((r) => r.data),

  setFcmToken: (fcm_token: string) => api.post("/auth/fcm-token/", { fcm_token }).then((r) => r.data),

  listUsers: (params?: { role?: UserRole; district?: string; region?: string; search?: string; page?: number }) =>
    api.get<Paginated<AppUser>>("/users/", { params }).then((r) => r.data),

  createUser: (payload: Partial<AppUser> & { password: string }) =>
    api.post<AppUser>("/users/", payload).then((r) => r.data),

  updateUser: (id: string, payload: Partial<AppUser>) =>
    api.patch<AppUser>(`/users/${id}/`, payload).then((r) => r.data),

  deactivateUser: (id: string) => api.delete(`/users/${id}/`).then((r) => r.data),

  resetPassword: (id: string, new_password: string) =>
    api.post(`/users/${id}/resetpassword/`, { new_password }).then((r) => r.data),
};
