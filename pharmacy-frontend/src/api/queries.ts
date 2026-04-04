import { api } from "./client";
import type {
  BarcodeLookupResponse,
  BatchRequest,
  BatchResponse,
  CountryOption,
  ExpiringBatchResponse,
  LoginRequest,
  LoginResponse,
  MfaSetupResponse,
  LowStockProductResponse,
  OwnerLockRequest,
  OwnerPharmacy,
  OwnerPharmacyUpdateRequest,
  PharmacyResponse,
  ProductInventorySummary,
  ProductRequest,
  ProductResponse,
  SaleRequest,
  SaleResponse,
  PosDraftCartResponse,
  SalesSummaryResponse,
  StockMovementResponse,
  SupplierRequest,
  SupplierResponse,
} from "./types";

export const authApi = {
  login: (body: LoginRequest) =>
    api.post<LoginResponse>("/auth/login", body).then((r) => r.data),
  verifyMfa: (body: { mfaChallengeToken: string; code: string }) =>
    api.post<LoginResponse>("/auth/mfa/verify", body).then((r) => r.data),
  verifyEmail: (token: string) =>
    api.post<{ verified: boolean }>("/auth/verify-email", { token }).then((r) => r.data),
  resendVerification: (email: string) =>
    api.post<{ ok: boolean }>("/auth/resend-verification", { email }).then((r) => r.data),
  forgotPassword: (email: string) =>
    api.post<{ ok: boolean }>("/auth/forgot-password", { email }).then((r) => r.data),
  resetPassword: (token: string, newPassword: string) =>
    api.post<{ ok: boolean }>("/auth/reset-password", { token, newPassword }).then((r) => r.data),
  mfaSetup: () => api.get<MfaSetupResponse>("/auth/mfa/setup").then((r) => r.data),
  mfaEnable: (code: string) =>
    api.post<{ enabled: boolean }>("/auth/mfa/enable", { code }).then((r) => r.data),
  mfaDisable: (password: string) =>
    api.post<{ disabled: boolean }>("/auth/mfa/disable", { password }).then((r) => r.data),
};

export const publicApi = {
  countries: () =>
    api.get<CountryOption[]>("/public/countries").then((r) => r.data),
  registerPharmacy: (fd: FormData) =>
    api.post<PharmacyResponse>("/pharmacies/register", fd).then((r) => r.data),
};

export const pharmacyApi = {
  me: () => api.get<PharmacyResponse>("/pharmacies/me").then((r) => r.data),
  updateMe: (fd: FormData) =>
    api.put<PharmacyResponse>("/pharmacies/me", fd).then((r) => r.data),
};

export const ownerApi = {
  listPharmacies: (page = 0, size = 20) =>
    api
      .get<{ content: OwnerPharmacy[]; totalElements: number; totalPages: number }>(
        "/owner/pharmacies",
        { params: { page, size, sort: "createdAt,desc" } }
      )
      .then((r) => r.data),
  updatePharmacy: (id: number, body: OwnerPharmacyUpdateRequest) =>
    api.put<OwnerPharmacy>(`/owner/pharmacies/${id}`, body).then((r) => r.data),
  deletePharmacy: (id: number) => api.delete(`/owner/pharmacies/${id}`),
  lockPharmacy: (id: number, body?: OwnerLockRequest) =>
    api.post<OwnerPharmacy>(`/owner/pharmacies/${id}/lock`, body ?? {}).then((r) => r.data),
  unlockPharmacy: (id: number) =>
    api.post<OwnerPharmacy>(`/owner/pharmacies/${id}/unlock`).then((r) => r.data),
};

export const productsApi = {
  list: (q?: string) =>
    api
      .get<ProductResponse[]>("/products", { params: q ? { q } : {} })
      .then((r) => r.data),
  get: (id: number) =>
    api.get<ProductResponse>(`/products/${id}`).then((r) => r.data),
  create: (body: ProductRequest) =>
    api.post<ProductResponse>("/products", body).then((r) => r.data),
  update: (id: number, body: ProductRequest) =>
    api.put<ProductResponse>(`/products/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/products/${id}`),
  suggestBarcode: () =>
    api.get<{ barcode: string }>("/products/barcode/suggest").then((r) => r.data),
  regenerateBarcode: (id: number) =>
    api.post<ProductResponse>(`/products/${id}/regenerate-barcode`).then((r) => r.data),
};

export const inventoryApi = {
  summary: () =>
    api.get<ProductInventorySummary[]>("/inventory/summary").then((r) => r.data),
};

export const batchesApi = {
  byProduct: (productId: number) =>
    api
      .get<BatchResponse[]>(`/products/${productId}/batches`)
      .then((r) => r.data),
  available: (productId: number) =>
    api
      .get<BatchResponse[]>(`/products/${productId}/batches/available`)
      .then((r) => r.data),
  create: (body: BatchRequest) =>
    api.post<BatchResponse>("/batches", body).then((r) => r.data),
};

export const barcodesApi = {
  lookup: (code: string) =>
    api
      .get<BarcodeLookupResponse>("/barcodes/lookup", { params: { code } })
      .then((r) => r.data),
  images: (productId: number) =>
    api
      .get<Record<string, string>>(`/barcodes/product/${productId}/images`)
      .then((r) => r.data),
};

export const salesApi = {
  create: (body: SaleRequest) =>
    api.post<SaleResponse>("/sales", body).then((r) => r.data),
};

export const posDraftApi = {
  get: () => api.get<PosDraftCartResponse>("/pos/draft").then((r) => r.data),
  sync: (items: { productId: number; quantity: number }[]) =>
    api
      .put<PosDraftCartResponse>("/pos/draft", { items })
      .then((r) => r.data),
};

export const reportsApi = {
  dailySales: (date: string, zone?: string) =>
    api
      .get<SalesSummaryResponse>("/reports/sales/daily", {
        params: { date, ...(zone ? { zone } : {}) },
      })
      .then((r) => r.data),
  monthlySales: (year: number, month: number, zone?: string) =>
    api
      .get<SalesSummaryResponse>("/reports/sales/monthly", {
        params: { year, month, ...(zone ? { zone } : {}) },
      })
      .then((r) => r.data),
  lowStock: (threshold = 10) =>
    api
      .get<LowStockProductResponse[]>("/reports/inventory/low-stock", {
        params: { threshold },
      })
      .then((r) => r.data),
  expiringSoon: () =>
    api
      .get<ExpiringBatchResponse[]>("/reports/inventory/expiring-soon")
      .then((r) => r.data),
};

export const suppliersApi = {
  list: () => api.get<SupplierResponse[]>("/suppliers").then((r) => r.data),
  get: (id: number) =>
    api.get<SupplierResponse>(`/suppliers/${id}`).then((r) => r.data),
  create: (body: SupplierRequest) =>
    api.post<SupplierResponse>("/suppliers", body).then((r) => r.data),
  update: (id: number, body: SupplierRequest) =>
    api.put<SupplierResponse>(`/suppliers/${id}`, body).then((r) => r.data),
  remove: (id: number) => api.delete(`/suppliers/${id}`),
};

export const stockApi = {
  movementsByProduct: (productId: number) =>
    api
      .get<StockMovementResponse[]>(`/stock-movements/product/${productId}`)
      .then((r) => r.data),
};
