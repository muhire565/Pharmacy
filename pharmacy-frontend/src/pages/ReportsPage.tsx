import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Download, FileText } from "lucide-react";
import { reportsApi } from "@/api/queries";
import { useAuthStore } from "@/store/authStore";
import { tenantKey } from "@/utils/tenantQuery";
import { todayLocal, formatMoney } from "@/utils/money";
import { rangeForPreset, type PeriodPreset } from "@/utils/dateRange";
import { downloadFinancialReportPdf } from "@/utils/reportPdf";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Table, Th, Td } from "@/components/ui/Table";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/utils/cn";

const PRESETS: PeriodPreset[] = ["daily", "monthly", "yearly", "custom"];

export function ReportsPage() {
  const { t } = useTranslation();
  const pharmacyId = useAuthStore((s) => s.pharmacyId);
  const [preset, setPreset] = useState<PeriodPreset>("daily");
  const [anchorYmd, setAnchorYmd] = useState(todayLocal());
  const [customFrom, setCustomFrom] = useState(todayLocal());
  const [customTo, setCustomTo] = useState(todayLocal());

  const { from, to } = useMemo(
    () => rangeForPreset(preset, anchorYmd, customFrom, customTo),
    [preset, anchorYmd, customFrom, customTo]
  );
  const invalidRange = from > to;

  const financial = useQuery({
    queryKey: tenantKey(pharmacyId, "reports", "financial", from, to),
    queryFn: () => reportsApi.financial(from, to),
    enabled: pharmacyId != null && !invalidRange,
  });

  const chartData =
    financial.data?.sales.map((s) => ({
      id: String(s.id),
      amount: s.totalAmount,
    })) ?? [];

  const periodPdfTitle = useMemo(() => {
    switch (preset) {
      case "daily":
        return t("reports.presetDaily");
      case "monthly":
        return t("reports.presetMonthly");
      case "yearly":
        return t("reports.presetYearly");
      default:
        return t("reports.presetCustom");
    }
  }, [preset, t]);

  function onDownloadPdf() {
    if (!financial.data) return;
    downloadFinancialReportPdf(financial.data, {
      fromYmd: from,
      toYmd: to,
      periodTitle: periodPdfTitle,
      generatedLabel: t("reports.generatedOn", {
        date: new Date().toLocaleString(),
      }),
    });
  }

  const r = financial.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {t("reports.title")}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">{t("reports.subtitle")}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 gap-2 border-ink/12"
          disabled={!r || financial.isFetching}
          onClick={onDownloadPdf}
        >
          <Download className="size-4" strokeWidth={2} />
          {t("reports.downloadPdf")}
        </Button>
      </div>

      <Card className="overflow-hidden border-ink/10 shadow-sm">
        <div className="flex flex-wrap items-center gap-1 border-b border-ink/8 bg-muted/30 p-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition",
                preset === p
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-ink-muted hover:bg-surface hover:text-ink"
              )}
            >
              {t(`reports.preset.${p}`)}
            </button>
          ))}
        </div>
        <div className="space-y-4 p-4">
          {preset !== "custom" ? (
            <Input
              type="date"
              label={
                preset === "daily"
                  ? t("reports.anchorDay")
                  : preset === "monthly"
                    ? t("reports.anchorMonth")
                    : t("reports.anchorYear")
              }
              value={anchorYmd}
              onChange={(e) => setAnchorYmd(e.target.value)}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                type="date"
                label={t("reports.fromDate")}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <Input
                type="date"
                label={t("reports.toDate")}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/15 bg-primary/[0.06] px-4 py-3 text-sm">
            <FileText className="size-4 shrink-0 text-primary" strokeWidth={2} />
            <span className="font-medium text-ink">{t("reports.activeRange")}</span>
            <span className="tabular-nums text-ink-muted">
              {from} → {to}
            </span>
            {invalidRange ? (
              <span className="text-sm text-danger">{t("reports.invalidRange")}</span>
            ) : null}
          </div>
        </div>
      </Card>

      {financial.isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : financial.isError ? (
        <p className="text-sm text-danger">{t("reports.loadError")}</p>
      ) : r ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label={t("reports.kpi.sales")}
              value={formatMoney(r.totalSales)}
              hint={t("reports.kpi.saleCount", { count: r.saleCount })}
            />
            <KpiCard
              label={t("reports.kpi.expenses")}
              value={formatMoney(r.totalExpenses)}
            />
            <KpiCard
              label={t("reports.kpi.net")}
              value={formatMoney(r.netAmount)}
              accent={r.netAmount >= 0 ? "positive" : "negative"}
            />
            <KpiCard
              label={t("reports.kpi.inventoryIn")}
              value={String(r.inventoryUnitsAdded)}
              hint={t("reports.kpi.inventoryHint")}
            />
          </div>

          <Card className="border-primary/12 bg-gradient-to-br from-primary/[0.04] to-surface">
            <CardHeader title={t("reports.paymentsTreasuryTitle")} />
            <div className="grid gap-4 p-4 pt-0 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-ink/8 bg-surface/80 p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                  {t("reports.periodPayments")}
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex justify-between gap-2">
                    <span className="text-ink-muted">{t("reports.pay.cash")}</span>
                    <span className="font-semibold tabular-nums text-ink">
                      {formatMoney(r.salesCash)}
                    </span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-ink-muted">{t("reports.pay.momoCode")}</span>
                    <span className="font-semibold tabular-nums text-ink">
                      {formatMoney(r.salesMomoCode)}
                    </span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-ink-muted">{t("reports.pay.momoPhone")}</span>
                    <span className="font-semibold tabular-nums text-ink">
                      {formatMoney(r.salesMomoPhone)}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="rounded-xl border border-ink/8 bg-surface/80 p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
                  {t("reports.treasuryMovements")}
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex justify-between gap-2">
                    <span className="text-ink-muted">{t("reports.treasury.cashIn")}</span>
                    <span className="font-semibold tabular-nums text-primary">
                      {formatMoney(r.treasuryCashIn)}
                    </span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-ink-muted">{t("reports.treasury.bankDeposit")}</span>
                    <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                      {formatMoney(r.treasuryBankDeposits)}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/[0.07] p-4 shadow-sm sm:col-span-2 lg:col-span-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {t("reports.estimatedDrawer")}
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-ink">
                  {formatMoney(r.estimatedCashDrawer)}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                  {t("reports.estimatedDrawerHint")}
                </p>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title={t("reports.chartTitle")} />
              {chartData.length > 0 ? (
                <div className="h-56 w-full px-2 pb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="id" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(v: number) => formatMoney(v)}
                        contentStyle={{ borderRadius: 8 }}
                      />
                      <Bar dataKey="amount" fill="#2A9D8F" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="px-4 pb-4 text-sm text-ink-muted">{t("reports.noSalesInRange")}</p>
              )}
            </Card>

            <Card>
              <CardHeader title={t("reports.pharmacySnapshot")} />
              <div className="space-y-2 px-4 pb-4 text-sm">
                <p className="font-semibold text-ink">{r.pharmacy.name}</p>
                <p className="leading-relaxed text-ink-muted">{r.pharmacy.address}</p>
                <p className="tabular-nums text-ink">{r.pharmacy.phoneE164}</p>
                <p className="text-ink-muted">{r.pharmacy.email}</p>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title={t("reports.medicinesSold")} />
            <Table>
              <thead>
                <tr>
                  <Th>{t("reports.col.product")}</Th>
                  <Th className="text-right">{t("reports.col.qty")}</Th>
                  <Th className="text-right">{t("reports.col.lineTotal")}</Th>
                </tr>
              </thead>
              <tbody>
                {r.medicinesSold.length === 0 ? (
                  <tr>
                    <Td colSpan={3} className="text-ink-muted">
                      {t("reports.empty.medicines")}
                    </Td>
                  </tr>
                ) : (
                  r.medicinesSold.map((m) => (
                    <tr key={m.productId}>
                      <Td className="font-medium">{m.productName}</Td>
                      <Td className="text-right tabular-nums">{m.quantitySold}</Td>
                      <Td className="text-right font-medium tabular-nums">
                        {formatMoney(m.lineTotal)}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card>

          <Card>
            <CardHeader title={t("reports.expensesSection")} />
            <Table>
              <thead>
                <tr>
                  <Th>{t("reports.col.date")}</Th>
                  <Th>{t("reports.col.title")}</Th>
                  <Th className="text-right">{t("reports.col.amount")}</Th>
                </tr>
              </thead>
              <tbody>
                {r.expenses.length === 0 ? (
                  <tr>
                    <Td colSpan={3} className="text-ink-muted">
                      {t("reports.empty.expenses")}
                    </Td>
                  </tr>
                ) : (
                  r.expenses.map((e) => (
                    <tr key={e.id}>
                      <Td className="whitespace-nowrap text-sm">
                        {new Date(e.incurredAt).toLocaleString()}
                      </Td>
                      <Td>
                        <span className="font-medium">{e.title}</span>
                        {e.description ? (
                          <span className="block text-xs text-ink-muted">{e.description}</span>
                        ) : null}
                      </Td>
                      <Td className="text-right font-medium tabular-nums">
                        {formatMoney(e.amount)}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title={t("reports.inventoryAdded")} />
              <Table>
                <thead>
                  <tr>
                    <Th>{t("reports.col.product")}</Th>
                    <Th className="text-right">{t("reports.col.units")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {r.inventoryAdded.length === 0 ? (
                    <tr>
                      <Td colSpan={2} className="text-ink-muted">
                        {t("reports.empty.inventory")}
                      </Td>
                    </tr>
                  ) : (
                    r.inventoryAdded.map((row) => (
                      <tr key={row.productId}>
                        <Td>{row.productName}</Td>
                        <Td className="text-right tabular-nums">{row.quantityAdded}</Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card>

            <Card>
              <CardHeader title={t("reports.lowStock")} />
              <Table>
                <thead>
                  <tr>
                    <Th>{t("reports.col.product")}</Th>
                    <Th>{t("reports.col.barcode")}</Th>
                    <Th className="text-right">{t("reports.col.qty")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {r.lowStock.length === 0 ? (
                    <tr>
                      <Td colSpan={3} className="text-ink-muted">
                        {t("reports.empty.lowStock")}
                      </Td>
                    </tr>
                  ) : (
                    r.lowStock.map((p) => (
                      <tr key={p.productId}>
                        <Td className="font-medium">{p.name}</Td>
                        <Td className="font-mono text-xs">{p.barcode}</Td>
                        <Td className="text-right tabular-nums">{p.totalQuantity}</Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card>
          </div>

          <Card>
            <CardHeader title={t("reports.salesRegister")} />
            <Table>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>{t("reports.col.payment")}</Th>
                  <Th>{t("reports.col.time")}</Th>
                  <Th>{t("reports.col.cashier")}</Th>
                  <Th className="text-right">{t("reports.col.total")}</Th>
                </tr>
              </thead>
              <tbody>
                {r.sales.map((s) => (
                  <tr key={s.id}>
                    <Td className="font-mono text-sm">{s.id}</Td>
                    <Td>
                      <span className="inline-flex rounded-lg bg-muted/80 px-2 py-0.5 text-xs font-semibold text-ink">
                        {t(`reports.payMethodLabel.${s.paymentMethod ?? "CASH"}`)}
                      </span>
                    </Td>
                    <Td className="text-sm">{new Date(s.createdAt).toLocaleString()}</Td>
                    <Td>{s.cashierUsername}</Td>
                    <Td className="text-right font-medium tabular-nums">
                      {formatMoney(s.totalAmount)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "positive" | "negative";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink/10 bg-surface p-4 shadow-sm",
        accent === "positive" && "border-primary/20 bg-primary/[0.04]",
        accent === "negative" && "border-danger/20 bg-danger/[0.04]"
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums text-ink",
          accent === "positive" && "text-primary",
          accent === "negative" && "text-danger"
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}
