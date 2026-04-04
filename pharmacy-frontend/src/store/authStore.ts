import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LoginResponse, Role } from "@/api/types";
import type { PharmacyCurrency } from "@/constants/currency";
import { parsePharmacyCurrency } from "@/constants/currency";

interface AuthState {
  token: string | null;
  email: string | null;
  role: Role | null;
  pharmacyId: number | null;
  pharmacyName: string | null;
  logoUrl: string | null;
  /** ISO 4217 display currency for pharmacy users */
  currencyCode: PharmacyCurrency;
  /** Bumps when branding changes so logo blob refetches */
  brandingVersion: number;
  setAuth: (data: LoginResponse) => void;
  setBranding: (p: {
    pharmacyName?: string;
    logoUrl?: string | null;
    currencyCode?: PharmacyCurrency;
  }) => void;
  /** Refetch logo blob when the file changed but URL path stayed the same */
  bumpLogo: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      email: null,
      role: null,
      pharmacyId: null,
      pharmacyName: null,
      logoUrl: null,
      currencyCode: "RWF",
      brandingVersion: 0,
      setAuth: (data) =>
        set({
          token: data.token,
          email: data.email,
          role: data.role,
          pharmacyId: data.pharmacyId,
          pharmacyName: data.pharmacyName,
          logoUrl: data.logoUrl ?? null,
          currencyCode: parsePharmacyCurrency(data.currencyCode),
          brandingVersion: 0,
        }),
      setBranding: (p) =>
        set((s) => {
          const nextName = p.pharmacyName ?? s.pharmacyName;
          const nextLogo = p.logoUrl !== undefined ? p.logoUrl : s.logoUrl;
          const nextCurrency =
            p.currencyCode !== undefined ? p.currencyCode : s.currencyCode;
          const logoChanged = nextLogo !== s.logoUrl;
          return {
            pharmacyName: nextName,
            logoUrl: nextLogo,
            currencyCode: nextCurrency,
            brandingVersion: logoChanged ? s.brandingVersion + 1 : s.brandingVersion,
          };
        }),
      bumpLogo: () =>
        set((s) => ({
          brandingVersion: s.brandingVersion + 1,
        })),
      logout: () =>
        set({
          token: null,
          email: null,
          role: null,
          pharmacyId: null,
          pharmacyName: null,
          logoUrl: null,
          currencyCode: "RWF",
          brandingVersion: 0,
        }),
    }),
    {
      name: "pharmacy-auth-v3",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        token: s.token,
        email: s.email,
        role: s.role,
        pharmacyId: s.pharmacyId,
        pharmacyName: s.pharmacyName,
        logoUrl: s.logoUrl,
        currencyCode: s.currencyCode,
      }),
    }
  )
);

export function isAdmin() {
  return useAuthStore.getState().role === "PHARMACY_ADMIN";
}
