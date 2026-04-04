export const PHARMACY_CURRENCIES = ["RWF", "UGX", "USD"] as const;

export type PharmacyCurrency = (typeof PHARMACY_CURRENCIES)[number];

export const PHARMACY_CURRENCY_LABELS: Record<PharmacyCurrency, string> = {
  RWF: "RWF — Rwandan Franc",
  UGX: "UGX — Ugandan Shilling",
  USD: "USD — US Dollar",
};

export function parsePharmacyCurrency(raw: string | null | undefined): PharmacyCurrency {
  const u = (raw ?? "").trim().toUpperCase();
  if (u === "RWF" || u === "UGX" || u === "USD") return u;
  return "RWF";
}
