import { create } from "zustand";
import type { BarcodeLookupResponse, ProductResponse } from "@/api/types";

export interface CartLine {
  uid: string;
  productId: number;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  lastAddedUid: string | null;
  addFromLookup: (lookup: BarcodeLookupResponse) => void;
  addManualProduct: (product: ProductResponse) => void;
  setQty: (uid: string, quantity: number) => void;
  increment: (uid: string) => void;
  decrement: (uid: string) => void;
  remove: (uid: string) => void;
  clear: () => void;
  clearHighlight: () => void;
  /** Replace cart from shared POS draft (multi-device sync). */
  replaceFromServer: (
    items: {
      productId: number;
      quantity: number;
      name: string;
      barcode: string;
      price: number;
    }[]
  ) => void;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  lastAddedUid: null,
  addFromLookup: (lookup) => {
    const { product } = lookup;
    const existing = get().lines.find((l) => l.productId === product.id);
    if (existing) {
      set({
        lines: get().lines.map((l) =>
          l.productId === product.id
            ? { ...l, quantity: l.quantity + 1 }
            : l
        ),
        lastAddedUid: existing.uid,
      });
      return;
    }
    const line: CartLine = {
      uid: uid(),
      productId: product.id,
      barcode: product.barcode,
      name: product.name,
      price: product.price,
      quantity: 1,
    };
    set({ lines: [...get().lines, line], lastAddedUid: line.uid });
  },
  addManualProduct: (product) => {
    const existing = get().lines.find((l) => l.productId === product.id);
    if (existing) {
      set({
        lines: get().lines.map((l) =>
          l.productId === product.id
            ? { ...l, quantity: l.quantity + 1 }
            : l
        ),
        lastAddedUid: existing.uid,
      });
      return;
    }
    const line: CartLine = {
      uid: uid(),
      productId: product.id,
      barcode: product.barcode,
      name: product.name,
      price: product.price,
      quantity: 1,
    };
    set({ lines: [...get().lines, line], lastAddedUid: line.uid });
  },
  setQty: (uid, quantity) => {
    const q = Math.max(1, Math.floor(quantity));
    set({
      lines: get().lines.map((l) => (l.uid === uid ? { ...l, quantity: q } : l)),
    });
  },
  increment: (uid) =>
    set({
      lines: get().lines.map((l) =>
        l.uid === uid ? { ...l, quantity: l.quantity + 1 } : l
      ),
    }),
  decrement: (uid) =>
    set({
      lines: get().lines
        .map((l) =>
          l.uid === uid ? { ...l, quantity: Math.max(1, l.quantity - 1) } : l
        )
        .filter((l) => l.quantity > 0),
    }),
  remove: (uid) =>
    set({ lines: get().lines.filter((l) => l.uid !== uid) }),
  clear: () => set({ lines: [], lastAddedUid: null }),
  clearHighlight: () => set({ lastAddedUid: null }),
  replaceFromServer: (items) =>
    set({
      lines: items.map((it) => ({
        uid: uid(),
        productId: it.productId,
        barcode: it.barcode,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
      })),
      lastAddedUid: null,
    }),
}));

export function cartTotal(lines: CartLine[]) {
  return lines.reduce((s, l) => s + l.price * l.quantity, 0);
}
