/** GS1 group separator used in element strings (ASCII 29). */
const GS = "\x1D";

/** GS1 date AI 17 → HTML date input value (YYYY-MM-DD). */
export function gs1YyMmDdToIso(yymmdd: string): string | undefined {
  if (yymmdd.length !== 6 || !/^\d{6}$/.test(yymmdd)) return undefined;
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);
  const yyyy = yy < 50 ? 2000 + yy : 1900 + yy;
  return `${yyyy}-${mm}-${dd}`;
}

function stripSymbologyPrefix(text: string): string {
  return text
    .replace(/^]C1/, "")
    .replace(/^]d2\d/, "")
    .replace(/^]Q3/, "")
    .trim();
}

/**
 * Extract lot/batch (and optional expiry) from camera scans. Handles:
 * - Plain lot codes
 * - GS1 human-readable: (01)…(17)YYMMDD(10)LOT…
 * - GS1 element string with GS separators and AIs 10 / 17
 * - Tight concatenation …17YYMMDD…10LOT…
 * - http(s) URLs with ?lot= / ?batch= / ?bn=
 */
export function parseBatchScanPayload(raw: string): {
  batchNumber: string;
  expiryYymmdd?: string;
} {
  let text = raw
    .trim()
    .replace(/<GS>/gi, GS)
    .replace(/\{GS\}/gi, GS);
  text = stripSymbologyPrefix(text);
  if (!text) return { batchNumber: "" };

  if (/^https?:\/\//i.test(text)) {
    try {
      const u = new URL(text);
      const lot =
        u.searchParams.get("lot") ??
        u.searchParams.get("batch") ??
        u.searchParams.get("bn") ??
        u.searchParams.get("l");
      if (lot) return { batchNumber: lot.trim() };
    } catch {
      /* ignore */
    }
    return { batchNumber: text };
  }

  const p10 = text.match(/\(10\)([^\(\)]+?)(?=\(\d{2}\)|$)/);
  if (p10) {
    const lot = p10[1].trim();
    const p17 = text.match(/\(17\)(\d{6})/);
    return { batchNumber: lot, expiryYymmdd: p17?.[1] };
  }

  if (text.includes(GS)) {
    let lot = "";
    let exp: string | undefined;
    for (const part of text.split(GS)) {
      if (!part) continue;
      if (part.startsWith("17") && part.length >= 8 && /^\d+$/.test(part.slice(2, 8))) {
        exp = part.slice(2, 8);
      } else if (part.startsWith("10")) {
        lot = part.slice(2).trim();
      }
    }
    if (lot) return { batchNumber: lot, expiryYymmdd: exp };
  }

  const tight = text.match(/(?:^|\D)17(\d{6})\D*10([^\x1D\(]+?)(?=\d{2}[^\d]|$)/);
  if (tight) {
    return {
      batchNumber: tight[2].replace(/[^\w\-./].*$/, "").trim(),
      expiryYymmdd: tight[1],
    };
  }

  const only17 = text.match(/(?:^|\D)17(\d{6})(?:\D|$)/);
  const only10 = text.match(/(?:^|\D)10([A-Za-z0-9][^\x1D\(\)]*)/);
  if (only10) {
    return {
      batchNumber: only10[1].trim(),
      expiryYymmdd: only17?.[1],
    };
  }

  return { batchNumber: text };
}
