import axios from "axios";

import { useAuthStore } from "@/store/auth-store";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    const refresh = useAuthStore.getState().refreshToken;
    if (!refresh) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    refreshPromise =
      refreshPromise ??
      axios
        .post(`${api.defaults.baseURL}/auth/refresh/`, { refresh })
        .then((res) => {
          useAuthStore.getState().setAccessToken(res.data.access);
          return res.data.access as string;
        })
        .catch(() => {
          useAuthStore.getState().logout();
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });

    const newAccess = await refreshPromise;
    if (!newAccess) return Promise.reject(error);

    original.headers.Authorization = `Bearer ${newAccess}`;
    return api(original);
  }
);
