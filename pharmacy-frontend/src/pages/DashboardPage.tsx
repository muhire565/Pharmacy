import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Package,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  Activity,
  ScanLine,
  BarChart3,
  Boxes,
  Sparkles,
  Receipt,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { tenantKey } from "@/utils/tenantQuery";
import { reportsApi } from "@/api/queries";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatMoney, todayLocal } from "@/utils/money";
import { Table, Td, Th } from "@/components/ui/Table";
import { formatLongDateTime, getGreetingForTime } from "@/utils/greeting";
import { useNow } from "@/hooks/useNow";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";

function StatTile(props: {
  label: string;
  value: ReactNode;
  hint: string;
  icon: ReactNode;
  accent: "emerald" | "amber" | "rose" | "blue";
}) {
  const accents = {
    emerald:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-800 dark:text-amber-400 ring-amber-500/20",
    rose: "bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-rose-500/20",
    blue: "bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-blue-500/20",
  } as const;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-ink/8 bg-surface p-5 shadow-sm",
        "transition duration-200 hover:border-primary/20 hover:shadow-md"
      )}
    >
      <div
        className={cn(
          "mb-4 inline-flex size-11 items-center justify-center rounded-xl ring-1",
          accents[props.accent]
        )}
      >
        {props.icon}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
        {props.label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-ink md:text-[1.65rem]">
        {props.value}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{props.hint}</p>
      <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-primary/[0.04] blur-2xl transition group-hover:bg-primary/[0.07]" />
    </div>
  );
}

function QuickAction(props: {
  to: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link
      to={props.to}
      className={cn(
        "group flex gap-4 rounded-2xl border border-ink/8 bg-surface p-4 shadow-sm",
        "transition duration-200 hover:border-primary/25 hover:bg-primary/[0.03] hover:shadow-md"
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
        {props.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-ink">{props.title}</span>
          <ArrowUpRight className="size-4 shrink-0 text-ink-muted opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
        </div>
        <p className="mt-0.5 text-sm text-ink-muted">{props.description}</p>
      </div>
    </Link>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const admin = useAuthStore((s) => s.role) === "PHARMACY_ADMIN";
  const pharmacyId = useAuthStore((s) => s.pharmacyId);
  const pharmacyName = useAuthStore((s) => s.pharmacyName);
  const now = useNow(1000);
  const date = todayLocal();

  const daily = useQuery({
    queryKey: tenantKey(pharmacyId, "reports", "daily", date),
    queryFn: () => reportsApi.dailySales(date),
    enabled: admin && pharmacyId != null,
  });

  const low = useQuery({
    queryKey: tenantKey(pharmacyId, "reports", "low"),
    queryFn: () => reportsApi.lowStock(10),
    enabled: admin && pharmacyId != null,
  });

  const exp = useQuery({
    queryKey: tenantKey(pharmacyId, "reports", "expiring"),
    queryFn: () => reportsApi.expiringSoon(),
    enabled: admin && pharmacyId != null,
  });

  if (!admin) {
    return (
      <div className="mx-auto max-w-lg px-1">
        <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-surface p-8 shadow-card">
          <div className="absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative">
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <ScanLine className="size-6" strokeWidth={1.75} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              {t("dashboard.cashierWorkspace")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t("dashboard.cashierHint")}</p>
            <Link to="/app/pos" className="mt-6 inline-block">
              <Button className="gap-2 shadow-sm">
                {t("dashboard.openPos")}
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (daily.isLoading || low.isLoading || exp.isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Spinner />
        <p className="text-sm text-ink-muted">{t("dashboard.loading")}</p>
      </div>
    );
  }

  const total = daily.data?.totalAmount ?? 0;
  const salesN = daily.data?.saleCount ?? 0;
  const greeting = getGreetingForTime(now);
  const dayTime = formatLongDateTime(now);
  const avgTicket = salesN > 0 ? total / salesN : 0;
  const latestSales = daily.data?.sales?.slice(0, 8) ?? [];
  const displayName = pharmacyName?.trim() || "your pharmacy";

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-4">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-ink/10 bg-surface shadow-card">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_0%_-20%,rgb(var(--primary)/0.14),transparent),radial-gradient(ellipse_60%_50%_at_100%_0%,rgb(var(--accent)/0.12),transparent)]" />
        <div className="pointer-events-none absolute -right-20 top-0 size-72 rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-surface/80 px-3 py-1 text-xs font-medium text-ink-muted shadow-sm backdrop-blur-sm">
                <Sparkles className="size-3.5 text-primary" strokeWidth={2} />
                <span>{greeting}</span>
                <span className="text-ink/25">·</span>
                <span className="tabular-nums">{dayTime}</span>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl sm:leading-tight">
                {t("dashboard.welcomeBack")}
                <span className="block text-ink-muted sm:inline sm:before:content-['—_'] sm:before:text-ink/20">
                  {displayName}
                </span>
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-ink-muted sm:text-[15px]">
                {t("dashboard.welcomeLead")}
              </p>
            </div>
            <div className="flex flex-shrink-0 flex-wrap gap-3">
              <Link to="/app/pos">
                <Button className="h-11 gap-2 px-5 shadow-sm">
                  <ShoppingBag className="size-4" strokeWidth={2} />
                  New sale
                </Button>
              </Link>
              <Link to="/app/inventory">
                <Button variant="secondary" className="h-11 gap-2 border-ink/12 bg-surface px-5 shadow-sm">
                  <Activity className="size-4" strokeWidth={2} />
                  Inventory
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* KPI grid */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Sales today"
          value={formatMoney(total)}
          hint={`${salesN} transaction${salesN === 1 ? "" : "s"} · resets at midnight`}
          accent="emerald"
          icon={<TrendingUp className="size-5" strokeWidth={2} />}
        />
        <StatTile
          label="Low stock"
          value={low.data?.length ?? 0}
          hint="SKU at or below reorder threshold"
          accent="amber"
          icon={<Package className="size-5" strokeWidth={2} />}
        />
        <StatTile
          label="Expiring soon"
          value={exp.data?.length ?? 0}
          hint="Batches inside your warning window"
          accent="rose"
          icon={<AlertTriangle className="size-5" strokeWidth={2} />}
        />
        <StatTile
          label="Avg. ticket"
          value={formatMoney(avgTicket)}
          hint={salesN > 0 ? "Mean per sale today" : "No sales yet today"}
          accent="blue"
          icon={<Receipt className="size-5" strokeWidth={2} />}
        />
      </section>

      {/* Main row */}
      <section className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-2xl border border-ink/8 bg-surface shadow-sm">
            <div className="flex flex-col gap-3 border-b border-ink/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-base font-semibold text-ink">Recent sales</h2>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Latest checkouts from today
                </p>
              </div>
              <Badge tone="default" className="w-fit shrink-0">
                {salesN} today
              </Badge>
            </div>
            <div className="p-4 sm:p-5">
              {latestSales.length ? (
                <Table
                  minTableWidth="min-w-[520px]"
                  wrapClassName="rounded-lg border-0"
                >
                  <thead>
                    <tr>
                      <Th>Sale</Th>
                      <Th>Cashier</Th>
                      <Th>Time</Th>
                      <Th className="text-right">Amount</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestSales.map((sale) => (
                      <tr key={sale.id}>
                        <Td className="font-medium">#{sale.id}</Td>
                        <Td className="text-ink-muted">{sale.cashierUsername}</Td>
                        <Td className="text-ink-muted">
                          {new Date(sale.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Td>
                        <Td className="text-right font-semibold tabular-nums text-ink">
                          {formatMoney(sale.totalAmount)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink/15 bg-muted/30 px-6 py-14 text-center">
                  <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-surface shadow-sm ring-1 ring-ink/8">
                    <Receipt className="size-7 text-ink-muted" strokeWidth={1.5} />
                  </div>
                  <p className="font-medium text-ink">No sales yet today</p>
                  <p className="mt-1 max-w-sm text-sm text-ink-muted">
                    When you complete sales in POS, they&apos;ll show up here
                    automatically.
                  </p>
                  <Link to="/app/pos" className="mt-5">
                    <Button variant="secondary" className="gap-2">
                      Go to POS
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 lg:col-span-4">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Shortcuts
          </p>
          <div className="space-y-3">
            <QuickAction
              to="/app/pos"
              title="Point of sale"
              description="Scan barcodes, take payment, print receipts"
              icon={<ScanLine className="size-5" strokeWidth={2} />}
            />
            <QuickAction
              to="/app/products"
              title="Products & pricing"
              description="Catalog, barcodes, and supplier links"
              icon={<Boxes className="size-5" strokeWidth={2} />}
            />
            <QuickAction
              to="/app/reports"
              title="Reports & analytics"
              description="Trends, summaries, and export-friendly views"
              icon={<BarChart3 className="size-5" strokeWidth={2} />}
            />
          </div>
        </div>
      </section>

      {/* Alerts row */}
      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-ink/8 p-0 shadow-sm">
          <div className="flex items-center justify-between border-b border-ink/8 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-ink">Low stock</h2>
              <p className="mt-0.5 text-xs text-ink-muted">Needs attention soon</p>
            </div>
            <Link to="/app/inventory">
              <Button variant="ghost" className="text-xs font-semibold text-primary">
                View all
              </Button>
            </Link>
          </div>
          <ul className="max-h-64 space-y-0 divide-y divide-ink/8 overflow-auto px-2 py-2">
            {(low.data ?? []).slice(0, 8).map((p) => (
              <li
                key={p.productId}
                className="flex items-center justify-between gap-3 px-3 py-3 transition hover:bg-muted/50"
              >
                <span className="min-w-0 font-medium text-ink">{p.name}</span>
                <Badge tone="warning" className="shrink-0 tabular-nums">
                  {p.totalQuantity} left
                </Badge>
              </li>
            ))}
            {!low.data?.length ? (
              <li className="px-3 py-10 text-center text-sm text-ink-muted">
                You&apos;re fully stocked at this threshold.
              </li>
            ) : null}
          </ul>
        </Card>

        <Card className="overflow-hidden border-ink/8 p-0 shadow-sm">
          <div className="flex items-center justify-between border-b border-ink/8 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold text-ink">Expiring batches</h2>
              <p className="mt-0.5 text-xs text-ink-muted">Expiry warning window</p>
            </div>
            <Link to="/app/inventory">
              <Button variant="ghost" className="text-xs font-semibold text-primary">
                View all
              </Button>
            </Link>
          </div>
          <div className="px-2 py-2">
            <ul className="max-h-64 space-y-0 divide-y divide-ink/8 overflow-auto">
              {(exp.data ?? []).slice(0, 8).map((b) => (
                <li
                  key={b.batchId}
                  className="flex items-center justify-between gap-3 px-3 py-3 transition hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{b.productName}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {b.batchNumber} · {b.expiryDate}
                    </p>
                  </div>
                  <Badge tone="danger" className="shrink-0 tabular-nums">
                    {b.daysUntilExpiry}d
                  </Badge>
                </li>
              ))}
              {!exp.data?.length ? (
                <li className="px-3 py-10 text-center text-sm text-ink-muted">
                  No batches in the warning window.
                </li>
              ) : null}
            </ul>
          </div>
        </Card>
      </section>
    </div>
  );
}
