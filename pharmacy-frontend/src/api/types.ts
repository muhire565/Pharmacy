export type Role = "SYSTEM_OWNER" | "PHARMACY_ADMIN" | "CASHIER";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresInMs: number;
  email: string;
  role: Role;
  pharmacyId: number | null;
  pharmacyName: string | null;
  logoUrl?: string | null;
}

export interface OwnerPharmacy {
  id: number;
  name: string;
  countryCode: string;
  phoneE164: string;
  email: string;
  address: string;
  locked: boolean;
  lockedReason?: string | null;
  lockedAt?: string | null;
  createdAt?: string | null;
  logoUrl?: string | null;
}

export interface OwnerPharmacyUpdateRequest {
  name: string;
  countryCode: string;
  phoneE164: string;
  email: string;
  address: string;
}

export interface OwnerLockRequest {
  reason?: string;
}

export interface CountryOption {
  code: string;
  name: string;
  dialCode: string;
}

export interface PharmacyResponse {
  id: number;
  name: string;
  countryCode: string;
  phoneE164: string;
  email: string;
  address: string;
  logoUrl?: string | null;
  defaultCashierEmail?: string | null;
  defaultCashierPassword?: string | null;
}

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  message: string;
  path?: string;
}

export interface ProductResponse {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  barcode: string;
  price: number;
  supplierId?: number | null;
  supplierName?: string | null;
  createdAt: string;
}

export interface ProductRequest {
  name: string;
  description?: string;
  category?: string;
  /** Omit or leave empty to let the server generate a unique PH-… code. */
  barcode?: string | null;
  price: number;
  supplierId?: number | null;
}

export interface BatchResponse {
  id: number;
  productId: number;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  costPrice: number;
  createdAt: string;
}

export interface BatchRequest {
  productId: number;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  costPrice: number;
}

/** Per-product stock roll-up for the inventory table. */
export interface ProductInventorySummary {
  productId: number;
  name: string;
  barcode: string;
  category: string | null;
  price: number;
  supplierName: string | null;
  batchCount: number;
  totalQuantity: number;
  nearestExpiry: string | null;
}

export interface SaleLineRequest {
  productId?: number;
  barcode?: string;
  quantity: number;
}

export interface SaleRequest {
  items: SaleLineRequest[];
}

/** Shared POS cart for the pharmacy (multi-device live sync). */
export interface PosDraftLineResponse {
  productId: number;
  name: string;
  barcode: string;
  price: number;
  quantity: number;
}

export interface PosDraftCartResponse {
  items: PosDraftLineResponse[];
}

export interface SaleItemResponse {
  productId: number;
  productName: string;
  batchId: number;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SaleResponse {
  id: number;
  totalAmount: number;
  createdAt: string;
  cashierUsername: string;
  items: SaleItemResponse[];
}

export interface BarcodeLookupResponse {
  product: ProductResponse;
  availableBatches: BatchResponse[];
  totalAvailableQuantity: number;
}

export interface SalesSummaryResponse {
  from: string;
  to: string;
  totalAmount: number;
  saleCount: number;
  sales: SaleResponse[];
}

export interface LowStockProductResponse {
  productId: number;
  name: string;
  barcode: string;
  totalQuantity: number;
}

export interface ExpiringBatchResponse {
  batchId: number;
  productId: number;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  daysUntilExpiry: number;
}

export interface SupplierResponse {
  id: number;
  name: string;
  contact?: string | null;
  phone?: string | null;
  createdAt: string;
}

export interface SupplierRequest {
  name: string;
  contact?: string;
  phone?: string;
}

export interface StockMovementResponse {
  id: number;
  productId: number;
  productName: string;
  type: "IN" | "OUT";
  quantity: number;
  reference: "SALE" | "RESTOCK" | "ADJUSTMENT";
  referenceId?: string | null;
  createdAt: string;
}
