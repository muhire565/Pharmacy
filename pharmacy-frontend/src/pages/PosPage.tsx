import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Minus,
  Plus,
  Trash2,
  CreditCard,
  ScanBarcode,
  Camera,
  Search,
  Package,
  ShoppingCart,
} from "lucide-react";
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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, Th, Td } from "@/components/ui/Table";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/utils/cn";
import { canUseBarcodeCamera } from "@/utils/camera";
import { BarcodeCameraModal } from "@/components/pos/BarcodeCameraModal";
import { useAuthStore } from "@/store/authStore";
import { tenantKey } from "@/utils/tenantQuery";

const MAX_VISIBLE_PRODUCTS = 500;

function formatProductDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function PosPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const pharmacyId = useAuthStore((s) => s.pharmacyId);
  const hydratedRef = useRef(false);
  const lastDraftFingerprintRef = useRef<string>("");
  const scanRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [productFilter, setProductFilter] = useState("");
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

  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: tenantKey(pharmacyId, "products", "pos-catalog"),
    queryFn: () => productsApi.list(),
    enabled: pharmacyId != null,
    staleTime: 30_000,
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

  const filteredProducts = useMemo(() => {
    const q = productFilter.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter((p) => {
      const desc = (p.description ?? "").toLowerCase();
      const sup = (p.supplierName ?? "").toLowerCase();
      return (
        String(p.id).includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q) ||
        desc.includes(q) ||
        sup.includes(q)
      );
    });
  }, [allProducts, productFilter]);

  const visibleProducts = filteredProducts.slice(0, MAX_VISIBLE_PRODUCTS);
  const truncated =
    filteredProducts.length > MAX_VISIBLE_PRODUCTS
      ? filteredProducts.length - MAX_VISIBLE_PRODUCTS
      : 0;

  const onAddManual = (product: ProductResponse) => {
    addManualProduct(product);
  };

  const onScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim();
    if (!c) return;
    lookupMut.mutate(c);
  };

  const total = cartTotal(lines);
  const lineCount = lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 pb-24 xl:space-y-6 xl:pb-6">
      {/* Page intro */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {t("pos.title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{t("pos.subtitle")}</p>
        </div>
        <p className="hidden text-xs text-ink-muted sm:block">{t("pos.f2Hint")}</p>
      </div>

      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[1fr_min(22rem,32vw)] xl:items-start xl:gap-6 2xl:grid-cols-[1fr_26rem]">
        {/* Scanner — first on all breakpoints */}
        <section className="order-1 overflow-hidden rounded-2xl border border-ink/10 bg-surface shadow-sm xl:col-start-1 xl:row-start-1">
          <div className="border-b border-ink/8 bg-primary/[0.06] px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ScanBarcode className="size-5 text-primary" strokeWidth={2} />
              {t("pos.scanTitle")}
            </div>
            <p className="mt-0.5 text-xs text-ink-muted">{t("pos.scanHint")}</p>
          </div>
          <form
            onSubmit={onScanSubmit}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:gap-3 sm:p-5"
          >
            <div className="min-w-0 flex-1">
              <Input
                ref={scanRef}
                name="scan"
                autoComplete="off"
                placeholder={t("pos.scanPlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-11 font-mono text-base"
              />
            </div>
            <div className="flex gap-2 sm:shrink-0">
              <Button
                type="submit"
                className="h-11 flex-1 sm:min-w-[8.5rem]"
                loading={lookupMut.isPending}
              >
                {t("pos.add")}
              </Button>
              {canUseBarcodeCamera() ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 gap-2 px-3 sm:px-4"
                  disabled={lookupMut.isPending}
                  onClick={() => setCameraOpen(true)}
                >
                  <Camera className="size-4 shrink-0" />
                  <span className="hidden sm:inline">{t("pos.camera")}</span>
                </Button>
              ) : null}
            </div>
          </form>
        </section>

        {/* Cart — between scan and catalog on small screens; sticky right column on xl+ */}
        <aside
          className={cn(
            "order-2 flex w-full flex-col xl:order-none xl:col-start-2 xl:row-start-1 xl:row-span-2 xl:max-h-[calc(100vh-5.5rem)] xl:sticky xl:top-4 xl:w-full xl:min-w-0 xl:self-start"
          )}
        >
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-primary/15 bg-surface shadow-[0_12px_40px_-16px_rgb(30_58_95/0.35)] ring-1 ring-ink/5">
            <div className="relative overflow-hidden border-b border-ink/8 bg-gradient-to-br from-primary/[0.12] via-surface to-surface px-4 py-4 sm:px-5">
              <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner">
                    <ShoppingCart className="size-5" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-ink">{t("pos.cartTitle")}</h2>
                    <p className="text-xs text-ink-muted">
                      {lines.length === 0
                        ? t("pos.cartEmptyHint")
                        : t("pos.cartSummary", { units: lineCount, lines: lines.length })}
                    </p>
                  </div>
                </div>
                {lines.length ? (
                  <Button
                    variant="ghost"
                    className="h-9 shrink-0 text-xs text-ink-muted hover:text-danger"
                    onClick={() => clear()}
                  >
                    {t("pos.clearAll")}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 [scrollbar-gutter:stable]">
              {lines.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/12 bg-muted/15 py-12 text-center">
                  <Package className="size-9 text-ink-muted/40" strokeWidth={1.25} />
                  <p className="text-sm font-medium text-ink-muted">{t("pos.cartEmpty")}</p>
                  <p className="max-w-[14rem] text-xs leading-relaxed text-ink-muted">{t("pos.cartEmptyHelp")}</p>
                </div>
              ) : (
                <>
                  <div className="hidden sm:block">
                    <Table wrapClassName="rounded-2xl border-0" minTableWidth="min-w-0">
                      <thead>
                        <tr>
                          <Th>{t("pos.itemCol")}</Th>
                          <Th className="w-[6.5rem]">{t("pos.qtyCol")}</Th>
                          <Th className="w-24 text-right">{t("pos.lineCol")}</Th>
                          <Th className="w-10 p-0" />
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
                  </div>
                  <ul className="space-y-2.5 sm:hidden">
                    {lines.map((l) => (
                      <CartRowMobile
                        key={l.uid}
                        line={l}
                        highlight={l.uid === lastAdded}
                        onInc={() => increment(l.uid)}
                        onDec={() => decrement(l.uid)}
                        onRemove={() => remove(l.uid)}
                        onQty={(q) => setQty(l.uid, q)}
                      />
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="border-t border-ink/8 bg-muted/20 px-4 py-4 sm:px-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                    {t("pos.totalDue")}
                  </p>
                  <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-primary sm:text-3xl">
                    {formatMoney(total)}
                  </p>
                  <p className="mt-1 text-[11px] text-ink-muted">{t("pos.fifoNote")}</p>
                </div>
              </div>
              <Button
                className="mt-4 h-12 w-full gap-2 rounded-xl text-base font-semibold shadow-lg shadow-primary/20"
                disabled={!lines.length}
                loading={checkoutMut.isPending}
                onClick={() => checkoutMut.mutate()}
              >
                <CreditCard className="size-5" />
                {t("pos.completeSale")}
              </Button>
            </div>
          </div>
        </aside>

        {/* Product catalog table */}
        <section className="order-3 min-w-0 overflow-hidden rounded-2xl border border-ink/10 bg-surface shadow-sm xl:col-start-1 xl:row-start-2">
          <div className="flex flex-col gap-3 border-b border-ink/8 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <div className="flex items-center gap-2">
              <Package className="size-5 text-primary" strokeWidth={2} />
              <div>
                <h2 className="text-sm font-semibold text-ink">{t("pos.catalogTitle")}</h2>
                <p className="text-xs text-ink-muted">{t("pos.catalogHint")}</p>
              </div>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
              <Input
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                placeholder={t("pos.filterPlaceholder")}
                className="h-10 pl-9"
                aria-label={t("pos.filterPlaceholder")}
              />
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {productsLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Spinner />
                <p className="text-sm text-ink-muted">{t("pos.loadingCatalog")}</p>
              </div>
            ) : allProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                <Package className="size-10 text-ink-muted/50" strokeWidth={1.25} />
                  <p className="font-medium text-ink">{t("pos.noProductsTitle")}</p>
                  <p className="max-w-sm text-sm text-ink-muted">{t("pos.noProductsBody")}</p>
              </div>
            ) : (
              <>
                <p className="mb-3 text-xs text-ink-muted">
                  Showing{" "}
                  <span className="font-medium text-ink">{visibleProducts.length}</span>
                  {filteredProducts.length !== allProducts.length ? (
                    <>
                      {" "}
                      of <span className="font-medium text-ink">{filteredProducts.length}</span> matches
                    </>
                  ) : (
                    <>
                      {" "}
                      of <span className="font-medium text-ink">{allProducts.length}</span>
                    </>
                  )}
                  {truncated > 0 ? (
                    <span className="text-warning"> · narrow search to show {truncated} more rows</span>
                  ) : null}
                </p>
                <div className="max-h-[min(52vh,22rem)] overflow-auto rounded-xl border border-ink/8 sm:max-h-[min(60vh,28rem)] md:max-h-[min(65vh,32rem)] [scrollbar-gutter:stable]">
                  <Table wrapClassName="rounded-none border-0" minTableWidth="min-w-[920px]">
                    <thead>
                      <tr>
                        <Th className="w-14 whitespace-nowrap">ID</Th>
                        <Th className="min-w-[9rem]">Product</Th>
                        <Th className="min-w-[10rem]">Description</Th>
                        <Th className="min-w-[6rem]">Category</Th>
                        <Th className="min-w-[7rem] whitespace-nowrap">Barcode</Th>
                        <Th className="min-w-[7rem]">Supplier</Th>
                        <Th className="w-28 text-right whitespace-nowrap">Price</Th>
                        <Th className="w-28 whitespace-nowrap">Created</Th>
                        <Th className="w-[5.5rem] text-right"> </Th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleProducts.map((p) => (
                        <ProductCatalogRow key={p.id} product={p} onAdd={() => onAddManual(p)} />
                      ))}
                    </tbody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Sticky checkout bar when cart is stacked (below xl) */}
      {lines.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-surface/95 p-3 shadow-[0_-8px_30px_-12px_rgb(30_58_95/0.2)] backdrop-blur-md xl:hidden">
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                {t("pos.totalMobile")}
              </p>
              <p className="truncate text-lg font-semibold tabular-nums text-primary">
                {formatMoney(total)}
              </p>
            </div>
            <Button
              className="h-11 shrink-0 gap-2 px-5"
              disabled={!lines.length}
              loading={checkoutMut.isPending}
              onClick={() => checkoutMut.mutate()}
            >
              <CreditCard className="size-4" />
              {t("pos.pay")}
            </Button>
          </div>
        </div>
      ) : null}

      <BarcodeCameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onDetected={(c) => lookupMut.mutate(c)}
      />
    </div>
  );
}

function ProductCatalogRow(props: { product: ProductResponse; onAdd: () => void }) {
  const { t } = useTranslation();
  const { product: p, onAdd } = props;
  const desc = (p.description ?? "").trim();
  const descDisplay = desc || "—";
  return (
    <tr className="border-b border-ink/6 transition-colors hover:bg-primary/[0.04]">
      <Td className="align-middle tabular-nums text-ink-muted">{p.id}</Td>
      <Td className="align-middle">
        <p className="font-semibold text-ink">{p.name}</p>
      </Td>
      <Td className="align-middle">
        <p className="max-w-[14rem] truncate text-sm text-ink-muted" title={desc || undefined}>
          {descDisplay}
        </p>
      </Td>
      <Td className="align-middle text-sm text-ink-muted">{p.category?.trim() || "—"}</Td>
      <Td className="align-middle font-mono text-xs text-ink-muted">{p.barcode}</Td>
      <Td className="align-middle text-sm text-ink-muted">
        <span className="block">{p.supplierName?.trim() || "—"}</span>
        {p.supplierId != null ? (
          <span className="mt-0.5 block font-mono text-[10px] text-ink-muted/80">
            Supplier #{p.supplierId}
          </span>
        ) : null}
      </Td>
      <Td className="align-middle text-right font-semibold tabular-nums text-primary">
        {formatMoney(p.price)}
      </Td>
      <Td className="align-middle whitespace-nowrap text-xs text-ink-muted">
        {formatProductDate(p.createdAt)}
      </Td>
      <Td className="align-middle text-right">
        <Button type="button" className="h-8 px-3 py-0 text-xs font-semibold" onClick={onAdd}>
          {t("pos.add")}
        </Button>
      </Td>
    </tr>
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
        highlight && "bg-primary/[0.08] ring-1 ring-primary/15"
      )}
    >
      <Td>
        <p className="font-medium text-ink">{line.name}</p>
        <p className="font-mono text-xs text-ink-muted">{line.barcode}</p>
      </Td>
      <Td>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="secondary"
            className="size-8 p-0"
            onClick={onDec}
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" />
          </Button>
          <input
            type="number"
            min={1}
            value={line.quantity}
            onChange={(e) => onQty(Number(e.target.value))}
            className="w-10 rounded-md border border-ink/10 bg-surface px-1 py-1 text-center text-sm tabular-nums"
            aria-label="Quantity"
          />
          <Button
            type="button"
            variant="secondary"
            className="size-8 p-0"
            onClick={onInc}
            aria-label="Increase quantity"
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </Td>
      <Td className="text-right font-semibold tabular-nums">{formatMoney(lineTotal)}</Td>
      <Td className="p-1">
        <Button
          type="button"
          variant="ghost"
          className="size-8 p-0 text-danger hover:bg-danger/10"
          onClick={onRemove}
          aria-label="Remove line"
        >
          <Trash2 className="size-4" />
        </Button>
      </Td>
    </tr>
  );
}

function CartRowMobile(props: {
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
    <li
      className={cn(
        "rounded-2xl border border-ink/8 bg-surface p-3 shadow-sm",
        highlight && "border-primary/25 bg-primary/[0.06] ring-1 ring-primary/15"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium leading-snug text-ink">{line.name}</p>
          <p className="mt-0.5 font-mono text-[10px] text-ink-muted">{line.barcode}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="size-8 shrink-0 p-0 text-danger"
          onClick={onRemove}
          aria-label="Remove"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button type="button" variant="secondary" className="size-9 p-0" onClick={onDec}>
            <Minus className="size-4" />
          </Button>
          <input
            type="number"
            min={1}
            value={line.quantity}
            onChange={(e) => onQty(Number(e.target.value))}
            className="w-11 rounded-lg border border-ink/10 bg-surface py-1.5 text-center text-sm font-semibold tabular-nums"
          />
          <Button type="button" variant="secondary" className="size-9 p-0" onClick={onInc}>
            <Plus className="size-4" />
          </Button>
        </div>
        <p className="text-sm font-bold tabular-nums text-primary">{formatMoney(lineTotal)}</p>
      </div>
    </li>
  );
}
