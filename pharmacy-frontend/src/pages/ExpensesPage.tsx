import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { expensesApi, pharmacyApi } from "@/api/queries";
import { getApiErrorMessage } from "@/api/client";
import type { PharmacyResponse, ReportPharmacyHeader } from "@/api/types";
import { useAuthStore } from "@/store/authStore";
import { tenantKey } from "@/utils/tenantQuery";
import { todayLocal, formatMoney } from "@/utils/money";
import { downloadExpenseReportPdf } from "@/utils/reportPdf";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Table, Th, Td } from "@/components/ui/Table";
import { Spinner } from "@/components/ui/Spinner";

function defaultFrom90(): string {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function profileToHeader(p: PharmacyResponse): ReportPharmacyHeader {
  return {
    name: p.name,
    address: p.address,
    phoneE164: p.phoneE164,
    email: p.email,
    currencyCode: p.currencyCode,
  };
}

export function ExpensesPage() {
  const { t } = useTranslation();
  const pharmacyId = useAuthStore((s) => s.pharmacyId);
  const queryClient = useQueryClient();
  const [from, setFrom] = useState(defaultFrom90);
  const [to, setTo] = useState(todayLocal);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [incurredDate, setIncurredDate] = useState(todayLocal);

  const invalidRange = from > to;

  const { data: profile } = useQuery({
    queryKey: tenantKey(pharmacyId, "pharmacy", "me"),
    queryFn: pharmacyApi.me,
    enabled: pharmacyId != null,
  });

  const listQuery = useQuery({
    queryKey: tenantKey(pharmacyId, "expenses", from, to),
    queryFn: () => expensesApi.list(from, to),
    enabled: pharmacyId != null && !invalidRange,
  });

  const total = useMemo(
    () => (listQuery.data ?? []).reduce((s, e) => s + e.amount, 0),
    [listQuery.data]
  );

  const createMut = useMutation({
    mutationFn: () =>
      expensesApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        amount: Number(amount),
        incurredDate,
      }),
    onSuccess: () => {
      toast.success(t("expenses.added"));
      setTitle("");
      setDescription("");
      setAmount("");
      setIncurredDate(todayLocal());
      queryClient.invalidateQueries({ queryKey: tenantKey(pharmacyId, "expenses") });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: expensesApi.remove,
    onSuccess: () => {
      toast.success(t("expenses.deleted"));
      queryClient.invalidateQueries({ queryKey: tenantKey(pharmacyId, "expenses") });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  function onSubmitAdd(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!title.trim() || Number.isNaN(n) || n <= 0) {
      toast.error(t("expenses.validation"));
      return;
    }
    createMut.mutate();
  }

  function onPdf() {
    if (!profile || !listQuery.data) return;
    downloadExpenseReportPdf(profileToHeader(profile), listQuery.data, {
      fromYmd: from,
      toYmd: to,
      title: t("expenses.pdfTitle"),
      generatedLabel: t("reports.generatedOn", {
        date: new Date().toLocaleString(),
      }),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{t("expenses.title")}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t("expenses.subtitle")}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 gap-2 border-ink/12"
          disabled={!listQuery.data || !profile || listQuery.isFetching}
          onClick={onPdf}
        >
          <Download className="size-4" strokeWidth={2} />
          {t("expenses.downloadPdf")}
        </Button>
      </div>

      <Card>
        <CardHeader title={t("expenses.filterTitle")} />
        <div className="grid gap-4 p-4 pt-0 sm:grid-cols-2">
          <Input type="date" label={t("reports.fromDate")} value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" label={t("reports.toDate")} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        {invalidRange ? (
          <p className="px-4 pb-4 text-sm text-danger">{t("reports.invalidRange")}</p>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("expenses.addTitle")} />
          <form onSubmit={onSubmitAdd} className="space-y-3 p-4 pt-0">
            <Input label={t("expenses.fieldTitle")} value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Input
              label={t("expenses.fieldDescription")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              label={t("expenses.fieldAmount")}
              type="number"
              inputMode="decimal"
              min={0.01}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Input
              type="date"
              label={t("expenses.fieldDate")}
              value={incurredDate}
              onChange={(e) => setIncurredDate(e.target.value)}
            />
            <Button type="submit" loading={createMut.isPending} className="w-full sm:w-auto">
              {t("expenses.submit")}
            </Button>
          </form>
        </Card>

        <Card>
          <CardHeader title={t("expenses.summaryTitle")} />
          <div className="p-4 pt-0">
            <div className="rounded-xl border border-primary/15 bg-primary/[0.06] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {t("expenses.totalInRange")}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-primary">{formatMoney(total)}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {t("expenses.recordCount", { count: listQuery.data?.length ?? 0 })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title={t("expenses.listTitle")} />
        {listQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t("reports.col.date")}</Th>
                <Th>{t("reports.col.title")}</Th>
                <Th className="text-right">{t("reports.col.amount")}</Th>
                <Th className="w-24 text-right">{t("expenses.actions")}</Th>
              </tr>
            </thead>
            <tbody>
              {(listQuery.data ?? []).length === 0 ? (
                <tr>
                  <Td colSpan={4} className="text-ink-muted">
                    {t("expenses.empty")}
                  </Td>
                </tr>
              ) : (
                (listQuery.data ?? []).map((e) => (
                  <tr key={e.id}>
                    <Td className="whitespace-nowrap text-sm">
                      {new Date(e.incurredAt).toLocaleString()}
                    </Td>
                    <Td>
                      <span className="font-medium">{e.title}</span>
                      {e.description ? (
                        <span className="mt-0.5 block text-xs text-ink-muted">{e.description}</span>
                      ) : null}
                      {e.recordedByUsername ? (
                        <span className="mt-0.5 block text-[11px] text-ink-muted">
                          {t("expenses.by", { user: e.recordedByUsername })}
                        </span>
                      ) : null}
                    </Td>
                    <Td className="text-right font-medium tabular-nums">{formatMoney(e.amount)}</Td>
                    <Td className="text-right">
                      <button
                        type="button"
                        title={t("expenses.delete")}
                        className="inline-flex rounded-lg p-2 text-ink-muted transition hover:bg-danger/10 hover:text-danger"
                        onClick={() => {
                          if (confirm(t("expenses.confirmDelete"))) deleteMut.mutate(e.id);
                        }}
                        disabled={deleteMut.isPending}
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
      </Card>
    </div>
  );
}
