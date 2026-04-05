import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Activity, Plus, Camera, Eye, Search } from "lucide-react";
import { inventoryApi, batchesApi, stockApi } from "@/api/queries";
import { getApiErrorMessage } from "@/api/client";
import type { ProductInventorySummary } from "@/api/types";
import { useAuthStore } from "@/store/authStore";
import { formatMoney } from "@/utils/money";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, Th, Td } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Boxes } from "lucide-react";
import { BarcodeCameraModal } from "@/components/pos/BarcodeCameraModal";
import { canUseBarcodeCamera } from "@/utils/camera";
import { tenantKey } from "@/utils/tenantQuery";
import { playScanBeep } from "@/utils/beep";
import { gs1YyMmDdToIso, parseBatchScanPayload } from "@/utils/parseBatchScan";
import { cn } from "@/utils/cn";

const batchSchema = z.object({
  batchNumber: z.string().min(1),
  expiryDate: z.string().min(1),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  costPrice: z.coerce.number().min(0),
});

type BatchForm = z.infer<typeof batchSchema>;

const quickRestockSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  costPrice: z.coerce.number().min(0),
});

type QuickRestockForm = z.infer<typeof quickRestockSchema>;

/** YYYY-MM-DD well in the future; satisfies server @Future on batch expiry. */
function autoRestockExpiryYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setFullYear(d.getFullYear() + 5);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function invQueryKeys(pharmacyId: number | null) {
  return {
    summary: tenantKey(pharmacyId, "inventory", "summary"),
    batches: (productId: number) => tenantKey(pharmacyId, "batches", productId),
    stock: (productId: number) => tenantKey(pharmacyId, "stock", productId),
  };
}

export function InventoryPage() {
  const qc = useQueryClient();
  const pharmacyId = useAuthStore((s) => s.pharmacyId);
  const admin = useAuthStore((s) => s.role) === "PHARMACY_ADMIN";
  const keys = invQueryKeys(pharmacyId);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ProductInventorySummary | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [batchScanOpen, setBatchScanOpen] = useState(false);
  const [movOpen, setMovOpen] = useState(false);

  const activeProductId = selected?.productId ?? null;

  const { data: rows = [], isLoading } = useQuery({
    queryKey: keys.summary,
    queryFn: inventoryApi.summary,
    enabled: pharmacyId != null,
  });

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(t) ||
        r.barcode.toLowerCase().includes(t) ||
        (r.category?.toLowerCase().includes(t) ?? false) ||
        (r.supplierName?.toLowerCase().includes(t) ?? false)
    );
  }, [rows, search]);

  const { data: batches = [], isLoading: batchesLoading } = useQuery({
    queryKey: keys.batches(activeProductId ?? 0),
    queryFn: () => batchesApi.byProduct(activeProductId!),
    enabled: pharmacyId != null && activeProductId != null && detailOpen,
  });

  const { data: movements = [] } = useQuery({
    queryKey: keys.stock(activeProductId ?? 0),
    queryFn: () => stockApi.movementsByProduct(activeProductId!),
    enabled: admin && movOpen && pharmacyId != null && activeProductId != null,
  });

  const emptyBatchForm = (): BatchForm => ({
    batchNumber: "",
    expiryDate: "",
    quantity: 1,
    costPrice: 0,
  });

  const form = useForm<BatchForm>({
    resolver: zodResolver(batchSchema),
    defaultValues: emptyBatchForm(),
  });

  const emptyQuickForm = (): QuickRestockForm => ({ quantity: 1, costPrice: 0 });

  const quickForm = useForm<QuickRestockForm>({
    resolver: zodResolver(quickRestockSchema),
    defaultValues: emptyQuickForm(),
  });

  const invalidateProductQueries = (productId: number) => {
    const pid = useAuthStore.getState().pharmacyId;
    void qc.invalidateQueries({ queryKey: keys.summary });
    void qc.invalidateQueries({ queryKey: tenantKey(pid, "batches", productId) });
  };

  const createBatch = useMutation({
    mutationFn: (v: BatchForm) =>
      batchesApi.create({
        productId: activeProductId!,
        batchNumber: v.batchNumber,
        expiryDate: v.expiryDate,
        quantity: v.quantity,
        costPrice: v.costPrice,
      }),
    onSuccess: () => {
      toast.success("Batch added");
      setBatchOpen(false);
      form.reset(emptyBatchForm());
      if (activeProductId != null) invalidateProductQueries(activeProductId);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const quickRestock = useMutation({
    mutationFn: (v: QuickRestockForm & { productId: number }) =>
      batchesApi.create({
        productId: v.productId,
        batchNumber: `RS-${v.productId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        expiryDate: autoRestockExpiryYmd(),
        quantity: v.quantity,
        costPrice: v.costPrice,
      }),
    onSuccess: (_data, vars) => {
      toast.success("Stock added");
      setQuickOpen(false);
      quickForm.reset(emptyQuickForm());
      invalidateProductQueries(vars.productId);
      if (!detailOpen && !batchOpen && !movOpen) setSelected(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  const minExp = tmr.toISOString().slice(0, 10);

  const openDetail = (row: ProductInventorySummary) => {
    setSelected(row);
    setDetailOpen(true);
  };

  const openQuickRestock = (row: ProductInventorySummary) => {
    setSelected(row);
    quickForm.reset(emptyQuickForm());
    setQuickOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    if (!batchOpen && !movOpen && !quickOpen) setSelected(null);
  };

  const closeBatchForm = () => {
    setBatchOpen(false);
    form.reset(emptyBatchForm());
    if (!detailOpen && !movOpen && !quickOpen) setSelected(null);
  };

  const closeQuickRestock = () => {
    setQuickOpen(false);
    quickForm.reset(emptyQuickForm());
    if (!detailOpen && !batchOpen && !movOpen) setSelected(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Inventory</h1>
          <p className="text-sm text-ink-muted">
            Admins: <Plus className="inline-block size-3.5 align-text-bottom" strokeWidth={2} /> quick
            add (qty + optional cost). Open a row for batches, movements, or full batch / scan.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader title="Products" />
        <div className="relative mb-4 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-[1] size-4 -translate-y-1/2 text-ink-muted" />
          <Input
            placeholder="Search name, barcode, category, supplier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {isLoading ? (
          <p className="text-sm text-ink-muted">Loading inventory…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title={rows.length === 0 ? "No products yet" : "No matches"}
            description={
              rows.length === 0
                ? "Add products under Catalog, then record batches here."
                : "Try a different search term."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-ink/10">
            <Table>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>Barcode</Th>
                  <Th>Category</Th>
                  <Th className="text-right">Price</Th>
                  <Th>Supplier</Th>
                  <Th className="text-right">Batches</Th>
                  <Th className="text-right">Total qty</Th>
                  <Th>Next expiry</Th>
                  <Th className="w-16 text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.productId}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-muted/50",
                      row.totalQuantity === 0 && "bg-warning/5"
                    )}
                    onClick={() => openDetail(row)}
                  >
                    <Td>
                      <p className="font-medium text-ink">{row.name}</p>
                      {row.totalQuantity === 0 ? (
                        <p className="text-xs text-warning">No stock on hand</p>
                      ) : null}
                    </Td>
                    <Td className="max-w-[12rem] truncate font-mono text-sm">{row.barcode}</Td>
                    <Td className="text-ink-muted">{row.category ?? "—"}</Td>
                    <Td className="text-right font-medium tabular-nums">
                      {formatMoney(row.price)}
                    </Td>
                    <Td className="max-w-[10rem] truncate text-sm text-ink-muted">
                      {row.supplierName ?? "—"}
                    </Td>
                    <Td className="text-right tabular-nums">{row.batchCount}</Td>
                    <Td className="text-right tabular-nums font-medium">
                      <div className="inline-flex items-center justify-end gap-1">
                        <span>{row.totalQuantity}</span>
                        {admin ? (
                          <Button
                            type="button"
                            variant="secondary"
                            className="size-8 shrink-0 gap-0 p-0"
                            aria-label={`Quick restock ${row.name}`}
                            title="Quick restock"
                            onClick={(e) => {
                              e.stopPropagation();
                              openQuickRestock(row);
                            }}
                          >
                            <Plus className="size-4" strokeWidth={2} />
                          </Button>
                        ) : null}
                      </div>
                    </Td>
                    <Td className="text-sm tabular-nums text-ink-muted">
                      {row.nearestExpiry ?? "—"}
                    </Td>
                    <Td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          className="size-8 gap-0 p-0"
                          aria-label="View batches"
                          onClick={() => openDetail(row)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      <Modal
        open={detailOpen && selected != null}
        onClose={closeDetail}
        title={selected ? `Batches — ${selected.name}` : "Batches"}
        wide
      >
        {selected ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
              <span className="font-mono">{selected.barcode}</span>
              <span>
                On hand:{" "}
                <strong className="text-ink tabular-nums">{selected.totalQuantity}</strong>
              </span>
            </div>
            {admin ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className="gap-2" onClick={() => setMovOpen(true)}>
                  <Activity className="size-4" /> Movements
                </Button>
                <Button
                  variant="secondary"
                  className="gap-2"
                  onClick={() => {
                    quickForm.reset(emptyQuickForm());
                    setQuickOpen(true);
                  }}
                >
                  <Plus className="size-4" /> Quick add
                </Button>
                <Button
                  className="gap-2"
                  onClick={() => {
                    form.reset(emptyBatchForm());
                    setBatchOpen(true);
                  }}
                >
                  <Plus className="size-4" /> Full batch
                </Button>
              </div>
            ) : null}
            {batchesLoading ? (
              <p className="text-sm text-ink-muted">Loading batches…</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Batch</Th>
                    <Th>Expiry</Th>
                    <Th className="text-right">Qty</Th>
                    <Th className="text-right">Cost</Th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b) => {
                    const exp = new Date(b.expiryDate);
                    const soon =
                      (exp.getTime() - Date.now()) / 86400000 <= 30 && b.quantity > 0;
                    const expired = exp < new Date(new Date().setHours(0, 0, 0, 0));
                    return (
                      <tr key={b.id}>
                        <Td className="font-medium">{b.batchNumber}</Td>
                        <Td>
                          <span className="flex flex-wrap items-center gap-2">
                            {b.expiryDate}
                            {expired && b.quantity > 0 ? (
                              <Badge tone="danger">Expired</Badge>
                            ) : soon ? (
                              <Badge tone="warning">Soon</Badge>
                            ) : null}
                          </span>
                        </Td>
                        <Td className="text-right tabular-nums">{b.quantity}</Td>
                        <Td className="text-right tabular-nums">
                          {formatMoney(b.costPrice)}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
            {batches.length === 0 && !batchesLoading ? (
              <p className="text-sm text-ink-muted">No batches recorded for this product.</p>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={quickOpen && selected != null}
        onClose={closeQuickRestock}
        title={selected ? `Quick restock — ${selected.name}` : "Quick restock"}
      >
        <form
          className="space-y-3"
          onSubmit={quickForm.handleSubmit((v) =>
            quickRestock.mutate({ ...v, productId: selected!.productId })
          )}
        >
          <p className="text-sm text-ink-muted">
            Adds stock immediately with an auto batch code and long-dated expiry. Use{" "}
            <strong>Full batch</strong> when you need a real lot number, exact expiry, or barcode
            scan.
          </p>
          <Input
            label="Quantity"
            type="number"
            autoFocus
            {...quickForm.register("quantity")}
            error={quickForm.formState.errors.quantity?.message}
          />
          <Input
            label="Unit cost (optional)"
            type="number"
            step="0.01"
            {...quickForm.register("costPrice")}
            error={quickForm.formState.errors.costPrice?.message}
          />
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <button
              type="button"
              className="text-left text-sm font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => {
                setQuickOpen(false);
                quickForm.reset(emptyQuickForm());
                form.reset(emptyBatchForm());
                setBatchOpen(true);
              }}
            >
              Use full form (batch no., expiry, scan)…
            </button>
            <div className="flex justify-end gap-2 sm:ml-auto">
              <Button type="button" variant="secondary" onClick={closeQuickRestock}>
                Cancel
              </Button>
              <Button type="submit" loading={quickRestock.isPending}>
                Add stock
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={batchOpen && selected != null}
        onClose={closeBatchForm}
        title={selected ? `New batch — ${selected.name}` : "New batch"}
      >
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit((v) => createBatch.mutate(v))}
        >
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <Input
                label="Batch number"
                error={form.formState.errors.batchNumber?.message}
                className="font-mono"
                {...form.register("batchNumber")}
              />
            </div>
            {canUseBarcodeCamera() ? (
              <Button
                type="button"
                variant="secondary"
                className="gap-2 shrink-0"
                onClick={() => setBatchScanOpen(true)}
              >
                <Camera className="size-4" />
                Scan batch code
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-ink-muted">
            GS1-style codes (QR / Data Matrix) are parsed when possible: lot AI{" "}
            <strong>(10)</strong> fills batch number and <strong>(17)</strong> fills expiry.
            Otherwise the full scan is stored as the batch number so you can edit it.
          </p>
          <Input
            label="Expiry date"
            type="date"
            min={minExp}
            {...form.register("expiryDate")}
          />
          <Input label="Quantity" type="number" {...form.register("quantity")} />
          <Input
            label="Cost price"
            type="number"
            step="0.01"
            {...form.register("costPrice")}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeBatchForm}>
              Cancel
            </Button>
            <Button type="submit" loading={createBatch.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <BarcodeCameraModal
        open={batchScanOpen}
        onClose={() => setBatchScanOpen(false)}
        title="Scan batch / lot code"
        description="Use good light and hold the code steady. If nothing happens, close and tap Scan again so the camera can attach. GS1 packs often fill batch and expiry automatically."
        onDetected={(code) => {
          const { batchNumber, expiryYymmdd } = parseBatchScanPayload(code);
          const lot = batchNumber.trim();
          if (!lot) {
            toast.error("Could not read a batch/lot from this code");
            return;
          }
          playScanBeep();
          form.setValue("batchNumber", lot, {
            shouldValidate: true,
            shouldDirty: true,
          });
          const iso = expiryYymmdd ? gs1YyMmDdToIso(expiryYymmdd) : undefined;
          if (iso) {
            form.setValue("expiryDate", iso, {
              shouldValidate: true,
              shouldDirty: true,
            });
            toast.success("Batch and expiry date filled from scan");
          } else {
            toast.success("Batch number filled from scan");
          }
        }}
      />

      <Modal
        open={movOpen && selected != null}
        onClose={() => {
          setMovOpen(false);
          if (!detailOpen && !batchOpen && !quickOpen) setSelected(null);
        }}
        title={selected ? `Stock movements — ${selected.name}` : "Stock movements"}
        wide
      >
        <Table>
          <thead>
            <tr>
              <Th>When</Th>
              <Th>Type</Th>
              <Th>Qty</Th>
              <Th>Ref</Th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id}>
                <Td className="text-xs text-ink-muted">
                  {new Date(m.createdAt).toLocaleString()}
                </Td>
                <Td>
                  <Badge tone={m.type === "IN" ? "success" : "default"}>{m.type}</Badge>
                </Td>
                <Td className="tabular-nums">{m.quantity}</Td>
                <Td className="text-xs">
                  {m.reference}
                  {m.referenceId ? ` #${m.referenceId}` : ""}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal>
    </div>
  );
}
