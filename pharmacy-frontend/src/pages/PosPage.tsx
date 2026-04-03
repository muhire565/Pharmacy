import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Minus, Plus, Trash2, CreditCard, Search, Camera } from "lucide-react";
import { barcodesApi, posDraftApi, productsApi, salesApi } from "@/api/queries";
import { getApiErrorMessage } from "@/api/client";
import {
  useCartStore,
  cartTotal,
  type CartLine,
} from "@/store/cartStore";
import { playScanBeep, playSaleCompleteBeep } from "@/utils/beep";
import { formatMoney } from "@/utils/money";
import type { ProductResponse } from "@/api/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, Th, Td } from "@/components/ui/Table";
import { cn } from "@/utils/cn";
import { canUseBarcodeCamera } from "@/utils/camera";
import { BarcodeCameraModal } from "@/components/pos/BarcodeCameraModal";
import { useAuthStore } from "@/store/authStore";
import { tenantKey } from "@/utils/tenantQuery";

export function PosPage() {
  const queryClient = useQueryClient();
  const pharmacyId = useAuthStore((s) => s.pharmacyId);
  const hydratedRef = useRef(false);
  const lastDraftFingerprintRef = useRef<string>("");
  const scanRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const lines = useCartStore((s) => s.lines);
  const replaceFromServer = useCartStore((s) => s.replaceFromServer);
  const lastAdded = useCartStore((s) => s.lastAddedUid);
  const addFromLookup = useCartStore((s) => s.addFromLookup);
  const addManualProduct = useCartStore((s) => s.addManualProduct);
  const setQty = useCartStore((s) => s.setQty);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const clearHighlight = useCartStore((s) => s.clearHighlight);

  const { data: draft, isSuccess: draftLoaded } = useQuery({
    queryKey: tenantKey(pharmacyId, "pos", "draft"),
    queryFn: posDraftApi.get,
    enabled: pharmacyId != null,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const draftFingerprint = draft ? JSON.stringify(draft.items) : "";

  useEffect(() => {
    return () => {
      hydratedRef.current = false;
      lastDraftFingerprintRef.current = "";
    };
  }, [pharmacyId]);

  useEffect(() => {
    if (!draftLoaded || !draft) return;
    if (draftFingerprint === lastDraftFingerprintRef.current) return;
    lastDraftFingerprintRef.current = draftFingerprint;
    replaceFromServer(
      draft.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        name: it.name,
        barcode: it.barcode,
        price: it.price,
      }))
    );
    hydratedRef.current = true;
  }, [draftLoaded, draftFingerprint, draft, replaceFromServer]);

  const syncDraftMut = useMutation({
    mutationFn: () =>
      posDraftApi.sync(
        useCartStore.getState().lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
        }))
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(tenantKey(useAuthStore.getState().pharmacyId, "pos", "draft"), data);
    },
  });

  useEffect(() => {
    if (!hydratedRef.current) return;
    const t = window.setTimeout(() => {
      syncDraftMut.mutate();
    }, 450);
    return () => window.clearTimeout(t);
  }, [lines, syncDraftMut]);

  const focusScan = useCallback(() => {
    scanRef.current?.focus();
  }, []);

  useEffect(() => {
    focusScan();
  }, [focusScan]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        focusScan();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusScan]);

  useEffect(() => {
    if (!lastAdded) return;
    const t = setTimeout(() => clearHighlight(), 900);
    return () => clearTimeout(t);
  }, [lastAdded, clearHighlight]);

  const lookupMut = useMutation({
    mutationFn: (c: string) => barcodesApi.lookup(c.trim()),
    onSuccess: (data) => {
      if (data.totalAvailableQuantity <= 0) {
        toast.error("No sellable stock for this product");
        return;
      }
      addFromLookup(data);
      playScanBeep();
      toast.success(`${data.product.name} added`);
      setCode("");
      focusScan();
    },
    onError: (e) => {
      toast.error(getApiErrorMessage(e, "Product not found"));
    },
  });

  const checkoutMut = useMutation({
    mutationFn: () =>
      salesApi.create({
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
        })),
      }),
    onSuccess: (sale) => {
      playSaleCompleteBeep();
      toast.success(`Sale #${sale.id} — ${formatMoney(sale.totalAmount)}`);
      clear();
      focusScan();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Checkout failed")),
  });

  const { data: manualResults = [], isFetching: searchingManual } = useQuery({
    queryKey: tenantKey(pharmacyId, "products", "manual", manualQuery),
    queryFn: () => productsApi.list(manualQuery.trim()),
    enabled: pharmacyId != null && manualQuery.trim().length >= 2,
    staleTime: 15_000,
  });

  const onAddManual = (product: ProductResponse) => {
    addManualProduct(product);
    playScanBeep();
    toast.success(`${product.name} added`);
  };

  const onScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    lookupMut.mutate(c);
  };

  const total = cartTotal(lines);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Point of sale</h1>
        <p className="text-sm text-ink-muted">
          Cart syncs live for this pharmacy — scan on phone and it appears here on desktop (and vice
          versa) when both are signed in.
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          USB scanner or keyboard — <kbd className="rounded bg-muted px-1 font-mono text-xs">Enter</kbd>{" "}
          adds line · <kbd className="rounded bg-muted px-1 font-mono text-xs">F2</kbd> focuses scan
          {canUseBarcodeCamera() ? (
            <> · use <strong className="text-ink">Scan with camera</strong> on phone</>
          ) : (
            <>
              {" "}
              · camera scan needs <strong className="text-ink">HTTPS</strong> (or localhost)
            </>
          )}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <CardHeader title="Scan / search code" />
          <form onSubmit={onScanSubmit} className="space-y-3">
            <Input
              ref={scanRef}
              name="scan"
              autoComplete="off"
              placeholder="Barcode — field stays hot after each add"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-base"
            />
            <Button
              type="submit"
              className="w-full"
              loading={lookupMut.isPending}
            >
              Add to cart
            </Button>
            {canUseBarcodeCamera() ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full gap-2"
                disabled={lookupMut.isPending}
                onClick={() => setCameraOpen(true)}
              >
                <Camera className="size-4" />
                Scan with camera
              </Button>
            ) : null}
          </form>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader title="Manual sale (no scanner)" />
          <div className="space-y-3">
            <Input
              name="manualSearch"
              placeholder="Type product name or barcode"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
            />
            {manualQuery.trim().length < 2 ? (
              <p className="text-xs text-ink-muted">
                Enter at least 2 characters to search products.
              </p>
            ) : searchingManual ? (
              <p className="text-xs text-ink-muted">Searching products...</p>
            ) : manualResults.length === 0 ? (
              <p className="text-xs text-ink-muted">No products found.</p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-auto pr-1">
                {manualResults.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onAddManual(p)}
                    className="flex w-full items-center justify-between rounded-lg border border-ink/10 bg-surface px-3 py-2 text-left transition hover:border-primary/30 hover:bg-muted/60"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{p.name}</p>
                      <p className="font-mono text-xs text-ink-muted">{p.barcode}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">
                        {formatMoney(p.price)}
                      </span>
                      <Search className="size-4 text-ink-muted" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader
            title="Cart"
            action={
              lines.length ? (
                <Button variant="ghost" className="text-xs" onClick={() => clear()}>
                  Clear
                </Button>
              ) : null
            }
          />
          {lines.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              No items — scan to begin.
            </p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th className="w-28">Qty</Th>
                  <Th className="w-24 text-right">Each</Th>
                  <Th className="w-28 text-right">Line</Th>
                  <Th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <CartRow
                    key={l.uid}
                    line={l}
                    highlight={l.uid === lastAdded}
                    onInc={() => increment(l.uid)}
                    onDec={() => decrement(l.uid)}
                    onRemove={() => remove(l.uid)}
                    onQty={(q) => setQty(l.uid, q)}
                  />
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader title="Checkout" />
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/80 p-4">
              <p className="text-xs font-medium uppercase text-ink-muted">Total</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-primary">
                {formatMoney(total)}
              </p>
              <p className="mt-2 text-xs text-ink-muted">
                FIFO batches applied on the server
              </p>
            </div>
            <Button
              className="w-full gap-2"
              disabled={!lines.length}
              loading={checkoutMut.isPending}
              onClick={() => checkoutMut.mutate()}
            >
              <CreditCard className="size-4" />
              Complete sale
            </Button>
          </div>
        </Card>
      </div>

      <BarcodeCameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onDetected={(c) => lookupMut.mutate(c)}
      />
    </div>
  );
}

function CartRow(props: {
  line: CartLine;
  highlight: boolean;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
  onQty: (q: number) => void;
}) {
  const { line, highlight, onInc, onDec, onRemove, onQty } = props;
  const lineTotal = line.price * line.quantity;
  return (
    <tr
      className={cn(
        "transition-colors",
        highlight && "bg-accent/10 ring-1 ring-accent/30"
      )}
    >
      <Td>
        <p className="font-medium text-ink">{line.name}</p>
        <p className="font-mono text-xs text-ink-muted">{line.barcode}</p>
      </Td>
      <Td>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            className="size-8 p-0"
            onClick={onDec}
            aria-label="Decrease"
          >
            <Minus className="size-4" />
          </Button>
          <input
            type="number"
            min={1}
            value={line.quantity}
            onChange={(e) => onQty(Number(e.target.value))}
            className="w-12 rounded border border-ink/10 bg-surface px-1 py-1 text-center text-sm tabular-nums"
          />
          <Button
            type="button"
            variant="secondary"
            className="size-8 p-0"
            onClick={onInc}
            aria-label="Increase"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </Td>
      <Td className="text-right tabular-nums">{formatMoney(line.price)}</Td>
      <Td className="text-right font-medium tabular-nums">
        {formatMoney(lineTotal)}
      </Td>
      <Td>
        <Button
          type="button"
          variant="ghost"
          className="size-8 p-0 text-danger hover:bg-danger/10"
          onClick={onRemove}
          aria-label="Remove"
        >
          <Trash2 className="size-4" />
        </Button>
      </Td>
    </tr>
  );
}
