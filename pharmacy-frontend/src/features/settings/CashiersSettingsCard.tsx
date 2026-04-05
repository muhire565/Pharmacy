import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Trash2, Users } from "lucide-react";
import { cashiersApi } from "@/api/queries";
import { getApiErrorMessage } from "@/api/client";
import { useAuthStore } from "@/store/authStore";
import { tenantKey } from "@/utils/tenantQuery";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, Th, Td } from "@/components/ui/Table";
import { Spinner } from "@/components/ui/Spinner";

const cashierSchema = z.object({
  email: z
    .string()
    .min(1, { message: "settings.cashiers.emailRequired" })
    .email({ message: "settings.cashiers.invalidEmail" }),
  username: z
    .string()
    .min(2, { message: "settings.cashiers.usernameShort" })
    .max(64, { message: "settings.cashiers.usernameLong" })
    .regex(/^[a-zA-Z0-9._-]+$/, { message: "settings.cashiers.usernamePattern" }),
  password: z
    .string()
    .min(8, { message: "settings.cashiers.passwordShort" })
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, { message: "settings.cashiers.passwordPattern" }),
});

type CashierForm = z.infer<typeof cashierSchema>;

export function CashiersSettingsCard() {
  const { t } = useTranslation();
  const pharmacyId = useAuthStore((s) => s.pharmacyId);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const listQ = useQuery({
    queryKey: tenantKey(pharmacyId, "cashiers"),
    queryFn: cashiersApi.list,
    enabled: pharmacyId != null,
  });

  const form = useForm<CashierForm>({
    resolver: zodResolver(cashierSchema),
    defaultValues: { email: "", username: "", password: "" },
  });

  const createMut = useMutation({
    mutationFn: cashiersApi.create,
    onSuccess: () => {
      toast.success(t("settings.cashiers.created"));
      setOpen(false);
      form.reset();
      void qc.invalidateQueries({ queryKey: tenantKey(pharmacyId, "cashiers") });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const delMut = useMutation({
    mutationFn: cashiersApi.remove,
    onSuccess: () => {
      toast.success(t("settings.cashiers.removed"));
      void qc.invalidateQueries({ queryKey: tenantKey(pharmacyId, "cashiers") });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Card>
      <CardHeader
        title={t("settings.cashiers.title")}
        action={
          <Button
            type="button"
            className="gap-2"
            onClick={() => {
              form.reset({ email: "", username: "", password: "" });
              setOpen(true);
            }}
          >
            <Plus className="size-4" strokeWidth={2} />
            {t("settings.cashiers.add")}
          </Button>
        }
      />
      <div className="flex items-start gap-3 border-b border-ink/8 px-4 pb-4 pt-0 sm:px-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <Users className="size-5" strokeWidth={2} />
        </div>
        <p className="text-sm leading-relaxed text-ink-muted">{t("settings.cashiers.lead")}</p>
      </div>

      {listQ.isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{t("settings.cashiers.colUsername")}</Th>
              <Th>{t("settings.cashiers.colEmail")}</Th>
              <Th>{t("settings.cashiers.colAdded")}</Th>
              <Th className="w-24 text-right">{t("settings.cashiers.colActions")}</Th>
            </tr>
          </thead>
          <tbody>
            {(listQ.data ?? []).length === 0 ? (
              <tr>
                <Td colSpan={4} className="text-ink-muted">
                  {t("settings.cashiers.empty")}
                </Td>
              </tr>
            ) : (
              (listQ.data ?? []).map((c) => (
                <tr key={c.id}>
                  <Td className="font-medium text-ink">{c.username}</Td>
                  <Td className="font-mono text-sm text-ink-muted">{c.email}</Td>
                  <Td className="text-sm text-ink-muted">
                    {new Date(c.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Td>
                  <Td className="text-right">
                    <button
                      type="button"
                      title={t("settings.cashiers.remove")}
                      className="inline-flex rounded-lg p-2 text-ink-muted transition hover:bg-danger/10 hover:text-danger"
                      onClick={() => {
                        if (confirm(t("settings.cashiers.confirmRemove", { name: c.username }))) {
                          delMut.mutate(c.id);
                        }
                      }}
                      disabled={delMut.isPending}
                    >
                      <Trash2 className="size-4" strokeWidth={2} />
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={t("settings.cashiers.modalTitle")}>
        <form className="space-y-3" onSubmit={form.handleSubmit((v) => createMut.mutate(v))}>
          <Input
            label={t("settings.cashiers.fieldEmail")}
            type="email"
            autoComplete="off"
            {...form.register("email")}
            error={
              form.formState.errors.email?.message
                ? t(form.formState.errors.email.message)
                : undefined
            }
          />
          <Input
            label={t("settings.cashiers.fieldUsername")}
            autoComplete="off"
            {...form.register("username")}
            error={
              form.formState.errors.username?.message
                ? t(form.formState.errors.username.message)
                : undefined
            }
          />
          <Input
            label={t("settings.cashiers.fieldPassword")}
            type="password"
            passwordToggle
            autoComplete="new-password"
            {...form.register("password")}
            error={
              form.formState.errors.password?.message
                ? t(form.formState.errors.password.message)
                : undefined
            }
          />
          <p className="text-xs text-ink-muted">{t("settings.cashiers.passwordHint")}</p>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              {t("settings.cashiers.cancel")}
            </Button>
            <Button type="submit" loading={createMut.isPending}>
              {t("settings.cashiers.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
