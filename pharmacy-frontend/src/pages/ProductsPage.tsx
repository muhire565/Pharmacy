import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Wand2, RefreshCw, Camera, Printer } from "lucide-react";
import { barcodesApi, productsApi } from "@/api/queries";
import { getApiErrorMessage } from "@/api/client";
import type { ProductResponse } from "@/api/types";
import { useAuthStore } from "@/store/authStore";
import { useDebounce } from "@/hooks/useDebounce";
import { formatMoney } from "@/utils/money";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, Th, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Package } from "lucide-react";
import { BarcodeCameraModal } from "@/components/pos/BarcodeCameraModal";
import { canUseBarcodeCamera } from "@/utils/camera";
import { playScanBeep } from "@/utils/beep";
import { tenantKey } from "@/utils/tenantQuery";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (ch) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[ch] ?? ch;
  });
}

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  barcode: z.string().optional().default(""),
  price: z.coerce.number().positive(),
  supplierId: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === "" || v === undefined || v === null) return undefined;
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : undefined;
    }),
});

type ProductForm = z.infer<typeof productSchema>;

export function ProductsPage() {
  const qc = useQueryClient();
  const pharmacyId = useAuthStore((s) => s.pharmacyId);
  const admin = useAuthStore((s) => s.role) === "PHARMACY_ADMIN";
  const [params] = useSearchParams();
  const [q, setQ] = useState(() => params.get("q") ?? "");
  const debounced = useDebounce(q, 300);

  useEffect(() => {
    const pq = params.get("q");
    if (pq != null) setQ(pq);
  }, [params]);

  const { data = [], isLoading } = useQuery({
    queryKey: tenantKey(pharmacyId, "products", debounced),
    queryFn: () => productsApi.list(debounced || undefined),
    enabled: pharmacyId != null,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProductResponse | null>(null);
  const [barcodeCameraOpen, setBarcodeCameraOpen] = useState(false);
  const [printingId, setPrintingId] = useState<number | null>(null);

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      barcode: "",
      price: 0,
      supplierId: undefined,
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      name: "",
      description: "",
      category: "",
      barcode: "",
      price: 0,
      supplierId: undefined,
    });
    setModalOpen(true);
  };

  const openEdit = (p: ProductResponse) => {
    setEditing(p);
    form.reset({
      name: p.name,
      description: p.description ?? "",
      category: p.category ?? "",
      barcode: p.barcode,
      price: p.price,
      supplierId: p.supplierId ?? undefined,
    });
    setModalOpen(true);
  };

  const saveMut = useMutation({
    mutationFn: async (v: ProductForm) => {
      const bc = v.barcode?.trim();
      const barcodePayload = bc ? bc : undefined;
      if (editing) {
        return productsApi.update(editing.id, {
          name: v.name,
          description: v.description,
          category: v.category,
          barcode: barcodePayload,
          price: v.price,
          supplierId: v.supplierId ?? undefined,
        });
      }
      return productsApi.create({
        name: v.name,
        description: v.description,
        category: v.category,
        barcode: barcodePayload,
        price: v.price,
        supplierId: v.supplierId ?? undefined,
      });
    },
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product created");
      setModalOpen(false);
      void qc.invalidateQueries({
        queryKey: tenantKey(useAuthStore.getState().pharmacyId, "products"),
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => productsApi.remove(id),
    onSuccess: () => {
      toast.success("Deleted");
      void qc.invalidateQueries({
        queryKey: tenantKey(useAuthStore.getState().pharmacyId, "products"),
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const suggestMut = useMutation({
    mutationFn: () => productsApi.suggestBarcode(),
    onSuccess: (r) => {
      form.setValue("barcode", r.barcode);
      toast.message("Barcode generated");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const regenMut = useMutation({
    mutationFn: (id: number) => productsApi.regenerateBarcode(id),
    onSuccess: () => {
      toast.success("Barcode regenerated");
      void qc.invalidateQueries({
        queryKey: tenantKey(useAuthStore.getState().pharmacyId, "products"),
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const printLabel = async (p: ProductResponse) => {
    setPrintingId(p.id);
    try {
      const imgs = await barcodesApi.images(p.id);
      const w = window.open("", "_blank", "width=420,height=720");
      if (!w) {
        toast.error("Allow pop-ups to open the print window");
        return;
      }
      const title = escapeHtml(p.name);
      const priceStr = escapeHtml(formatMoney(p.price));
      const codeTxt = escapeHtml(imgs.barcodeText);
      w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Label</title>
<style>
  @page { size: 58mm auto; margin: 2mm; }
  body { font-family: system-ui, sans-serif; margin: 0; padding: 2mm; width: 54mm; text-align: center; color: #000; }
  h1 { font-size: 11px; margin: 0 0 2mm; font-weight: 600; line-height: 1.2; word-break: break-word; }
  .price { font-size: 12px; margin: 1mm 0 2mm; font-weight: 600; }
  .mono { font-size: 9px; font-family: ui-monospace, monospace; margin-top: 2mm; }
  img { display: block; margin: 2mm auto 0; max-width: 48mm; height: auto; image-rendering: pixelated; }
  .code128 { max-width: 52mm; }
</style></head><body>
  <h1>${title}</h1>
  <p class="price">${priceStr}</p>
  <img class="code128" src="data:image/png;base64,${imgs.code128PngBase64}" alt="" />
  <img src="data:image/png;base64,${imgs.qrPngBase64}" alt="" />
  <p class="mono">${codeTxt}</p>
  <script>window.onload=function(){window.print();setTimeout(function(){window.close();},400);};</script>
</body></html>`);
      w.document.close();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Could not load label images"));
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Products</h1>
          <p className="text-sm text-ink-muted">Catalog and pricing</p>
        </div>
        {admin ? (
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="size-4" /> New product
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader title="Catalog" />
        <div className="mb-4 max-w-md">
          <Input
            placeholder="Search name or barcode…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {isLoading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : data.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products"
            description="Adjust search or add a product."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Barcode</Th>
                <Th>Category</Th>
                <Th className="text-right">Price</Th>
                <Th className="w-14">Label</Th>
                {admin ? <Th className="w-36" /> : null}
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <p className="font-medium text-ink">{p.name}</p>
                    {p.supplierName ? (
                      <p className="text-xs text-ink-muted">{p.supplierName}</p>
                    ) : null}
                  </Td>
                  <Td className="font-mono text-sm">{p.barcode}</Td>
                  <Td className="text-ink-muted">{p.category ?? "—"}</Td>
                  <Td className="text-right font-medium tabular-nums">
                    {formatMoney(p.price)}
                  </Td>
                  <Td>
                    <Button
                      type="button"
                      variant="ghost"
                      className="size-8 p-0"
                      onClick={() => void printLabel(p)}
                      loading={printingId === p.id}
                      aria-label="Print thermal label"
                    >
                      {printingId === p.id ? null : <Printer className="size-4" />}
                    </Button>
                  </Td>
                  {admin ? (
                    <Td>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          className="size-8 p-0"
                          onClick={() => openEdit(p)}
                          aria-label="Edit"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="size-8 p-0"
                          onClick={() => regenMut.mutate(p.id)}
                          aria-label="Regenerate barcode"
                        >
                          <RefreshCw className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="size-8 p-0 text-danger"
                          onClick={() => {
                            if (confirm(`Delete ${p.name}?`)) delMut.mutate(p.id);
                          }}
                          aria-label="Delete"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </Td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit product" : "New product"}
        wide
      >
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={form.handleSubmit((v: ProductForm) => saveMut.mutate(v))}
        >
          <Input label="Name" error={form.formState.errors.name?.message} {...form.register("name")} />
          <Input label="Category" {...form.register("category")} />
          <div className="sm:col-span-2 flex flex-wrap items-end gap-2">
            <div className="min-w-0 flex-1">
              <Input
                label="Barcode (optional — auto-generated if empty)"
                className="font-mono"
                placeholder="Scan, type, or leave blank"
                error={form.formState.errors.barcode?.message}
                {...form.register("barcode")}
              />
            </div>
            {admin ? (
              <div className="flex flex-wrap gap-2">
                {!editing ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2"
                    onClick={() => suggestMut.mutate()}
                    loading={suggestMut.isPending}
                  >
                    <Wand2 className="size-4" /> Generate
                  </Button>
                ) : null}
                {canUseBarcodeCamera() ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2"
                    onClick={() => setBarcodeCameraOpen(true)}
                  >
                    <Camera className="size-4" />
                    Scan code
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
          <Input
            label="Price"
            type="number"
            step="0.01"
            error={form.formState.errors.price?.message}
            {...form.register("price")}
          />
          <Input
            label="Supplier ID (optional)"
            type="number"
            {...form.register("supplierId")}
          />
          <div className="sm:col-span-2">
            <Input label="Description" {...form.register("description")} />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMut.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <BarcodeCameraModal
        open={barcodeCameraOpen}
        onClose={() => setBarcodeCameraOpen(false)}
        description="Supports printed barcodes (EAN, UPC, Code 128, etc.) and QR codes whose payload is the barcode value you want to store."
        onDetected={(code) => {
          form.setValue("barcode", code, { shouldValidate: true, shouldDirty: true });
          playScanBeep();
          toast.success("Barcode filled from camera");
        }}
      />
    </div>
  );
}
