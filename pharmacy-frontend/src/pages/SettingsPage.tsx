import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Keyboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { suppliersApi } from "@/api/queries";
import { getApiErrorMessage } from "@/api/client";
import { useAuthStore } from "@/store/authStore";
import { tenantKey } from "@/utils/tenantQuery";
import { PharmacyProfileSettings } from "@/features/settings/PharmacyProfileSettings";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, Th, Td } from "@/components/ui/Table";
import { MfaSettingsCard } from "@/features/settings/MfaSettingsCard";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const supSchema = z.object({
  name: z.string().min(1),
  contact: z.string().optional(),
  phone: z.string().optional(),
});

type SupForm = z.infer<typeof supSchema>;

export function SettingsPage() {
  const { t } = useTranslation();
  const isPharmacyAdmin = useAuthStore((s) => s.role === "PHARMACY_ADMIN");
  const pharmacyId = useAuthStore((s) => s.pharmacyId);
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: tenantKey(pharmacyId, "suppliers"),
    queryFn: () => suppliersApi.list(),
    enabled: pharmacyId != null,
  });

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<SupForm>({
    resolver: zodResolver(supSchema),
    defaultValues: { name: "", contact: "", phone: "" },
  });

  const saveMut = useMutation({
    mutationFn: async (v: SupForm) => {
      if (editingId != null) {
        return suppliersApi.update(editingId, v);
      }
      return suppliersApi.create(v);
    },
    onSuccess: () => {
      toast.success(editingId ? "Supplier updated" : "Supplier created");
      setOpen(false);
      setEditingId(null);
      form.reset();
      void qc.invalidateQueries({
        queryKey: tenantKey(useAuthStore.getState().pharmacyId, "suppliers"),
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => suppliersApi.remove(id),
    onSuccess: () => {
      toast.success("Removed");
      void qc.invalidateQueries({
        queryKey: tenantKey(useAuthStore.getState().pharmacyId, "suppliers"),
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{t("settings.title")}</h1>
          <p className="text-sm text-ink-muted">{t("settings.subtitle")}</p>
        </div>
        <div className="w-full max-w-[12rem]">
          <LanguageSwitcher />
        </div>
      </div>

      {isPharmacyAdmin ? (
        <>
          <MfaSettingsCard />
          <PharmacyProfileSettings />
        </>
      ) : null}

      <Card>
        <CardHeader
          title={t("settings.suppliers")}
          action={
            <Button
              className="gap-2"
              onClick={() => {
                setEditingId(null);
                form.reset({ name: "", contact: "", phone: "" });
                setOpen(true);
              }}
            >
              <Plus className="size-4" /> {t("settings.add")}
            </Button>
          }
        />
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Contact</Th>
              <Th>Phone</Th>
              <Th className="w-28" />
            </tr>
          </thead>
          <tbody>
            {data.map((s) => (
              <tr key={s.id}>
                <Td className="font-medium">{s.name}</Td>
                <Td className="text-ink-muted">{s.contact ?? "—"}</Td>
                <Td className="font-mono text-sm">{s.phone ?? "—"}</Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      className="size-8 p-0"
                      onClick={() => {
                        setEditingId(s.id);
                        form.reset({
                          name: s.name,
                          contact: s.contact ?? "",
                          phone: s.phone ?? "",
                        });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="size-8 p-0 text-danger"
                      onClick={() => {
                        if (confirm(`Delete ${s.name}?`)) delMut.mutate(s.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card>
        <CardHeader title="Keyboard" action={<Keyboard className="size-5 text-ink-muted" />} />
        <ul className="space-y-2 text-sm text-ink-muted">
          <li>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">F2</kbd>{" "}
            Focus POS scan field
          </li>
          <li>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Enter</kbd>{" "}
            Submit scan (hardware scanners send Enter)
          </li>
          <li>Top search jumps to product catalog with your query</li>
        </ul>
      </Card>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit supplier" : "New supplier"}
      >
        <form
          className="space-y-3"
          onSubmit={form.handleSubmit((v) => saveMut.mutate(v))}
        >
          <Input label="Name" {...form.register("name")} />
          <Input label="Contact" {...form.register("contact")} />
          <Input label="Phone" {...form.register("phone")} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMut.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
