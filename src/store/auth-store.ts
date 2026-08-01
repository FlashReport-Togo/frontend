import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "district_agent" | "regional_focal_point" | "national_agent" | "admin";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  district: string | null;
  district_name: string | null;
  region: string | null;
  region_name: string | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setSession: (data: { access: string; refresh: string; user: AuthUser }) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ access, refresh, user }) =>
        set({ accessToken: access, refreshToken: refresh, user }),
      setAccessToken: (token) => set({ accessToken: token }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: "flashreport-auth" }
  )
);

export const ROLE_LABELS: Record<UserRole, string> = {
  district_agent: "Agent de district",
  regional_focal_point: "Point focal régional",
  national_agent: "Agent national",
  admin: "Administrateur",
};
