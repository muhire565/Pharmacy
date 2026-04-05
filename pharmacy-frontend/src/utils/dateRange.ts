export type PeriodPreset = "daily" | "monthly" | "yearly" | "custom";

function parseLocalYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** Inclusive local-date range for reporting. */
export function rangeForPreset(
  preset: PeriodPreset,
  anchorYmd: string,
  customFrom: string,
  customTo: string
): { from: string; to: string } {
  switch (preset) {
    case "daily":
      return { from: anchorYmd, to: anchorYmd };
    case "monthly": {
      const d = parseLocalYmd(anchorYmd);
      const first = new Date(d.getFullYear(), d.getMonth(), 1);
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return { from: toYmd(first), to: toYmd(last) };
    }
    case "yearly": {
      const y = parseLocalYmd(anchorYmd).getFullYear();
      return { from: `${y}-01-01`, to: `${y}-12-31` };
    }
    case "custom":
      return { from: customFrom, to: customTo };
    default:
      return { from: anchorYmd, to: anchorYmd };
  }
}
