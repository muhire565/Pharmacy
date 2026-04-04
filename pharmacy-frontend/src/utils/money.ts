import { useAuthStore } from "@/store/authStore";
import type { PharmacyCurrency } from "@/constants/currency";

function fractionDigits(currency: PharmacyCurrency): number {
  return currency === "USD" ? 2 : 0;
}

/** Format using the signed-in pharmacy currency (default RWF). Pass override for rare cases. */
export function formatMoney(n: number, currencyOverride?: PharmacyCurrency) {
  const fromStore = useAuthStore.getState().currencyCode;
  const c: PharmacyCurrency =
    currencyOverride ??
    (fromStore === "RWF" || fromStore === "UGX" || fromStore === "USD" ? fromStore : "RWF");
  const fd = fractionDigits(c);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: c,
    minimumFractionDigits: fd,
    maximumFractionDigits: fd,
  }).format(n);
}

export function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
