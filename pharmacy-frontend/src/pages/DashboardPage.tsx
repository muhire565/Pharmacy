import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Package,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  Activity,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { tenantKey } from "@/utils/tenantQuery";
import { reportsApi } from "@/api/queries";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatMoney, todayLocal } from "@/utils/money";
import { Table, Td, Th } from "@/components/ui/Table";
import { formatLongDateTime, getGreetingForTime } from "@/utils/greeting";
import { useNow } from "@/hooks/useNow";

export function DashboardPage() {
  const admin = useAuthStore((s) => s.role) === "PHARMACY_ADMIN";
  const pharmacyId = useAuthStore((s) => s.pharmacyId);
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
      <div className="mx-auto max-w-xl space-y-6">
        <Card>
          <CardHeader title="Cashier workspace" />
          <p className="text-sm text-ink-muted">
            Use <strong>POS</strong> for scanning and checkout. Product search is
            available under Products.
          </p>
          <Link to="/app/pos" className="mt-4 inline-block">
            <Button className="gap-2">
              Open POS <ArrowRight className="size-4" />
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (daily.isLoading || low.isLoading || exp.isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const total = daily.data?.totalAmount ?? 0;
  const salesN = daily.data?.saleCount ?? 0;
  const greeting = getGreetingForTime(now);
  const dayTime = formatLongDateTime(now);
  const avgTicket = salesN > 0 ? total / salesN : 0;
  const latestSales = daily.data?.sales?.slice(0, 8) ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ink/10 bg-gradient-to-r from-primary/15 via-accent/10 to-transparent p-6 shadow-card">
        <p className="text-sm font-medium text-ink-muted">{greeting}</p>
        <h1 className="mt-1 text-2xl font-semibold text-ink">Welcome back to your pharmacy dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">{dayTime}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link to="/app/pos">
            <Button className="gap-2">
              Create sale <ShoppingBag className="size-4" />
            </Button>
          </Link>
          <Link to="/app/inventory">
            <Button variant="secondary" className="gap-2">
              Monitor inventory <Activity className="size-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Sales today
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
                {formatMoney(total)}
              </p>
              <p className="text-xs text-ink-muted">{salesN} transactions</p>
            </div>
            <TrendingUp className="size-8 text-accent" strokeWidth={1.5} />
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Low stock
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
                {low.data?.length ?? 0}
              </p>
              <p className="text-xs text-ink-muted">SKU at or below threshold</p>
            </div>
            <Package className="size-8 text-warning" strokeWidth={1.5} />
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Expiring soon
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
                {exp.data?.length ?? 0}
              </p>
              <p className="text-xs text-ink-muted">Batches in warning window</p>
            </div>
            <AlertTriangle className="size-8 text-danger" strokeWidth={1.5} />
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Average ticket
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">
                {formatMoney(avgTicket)}
              </p>
              <p className="text-xs text-ink-muted">Per sale today</p>
            </div>
            <TrendingUp className="size-8 text-primary" strokeWidth={1.5} />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader
            title="Recent sales"
            action={
              <Badge tone="default">
                {salesN} transactions today
              </Badge>
            }
          />
          {latestSales.length ? (
            <Table>
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
                    <Td className="text-right font-semibold tabular-nums">
                      {formatMoney(sale.totalAmount)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-sm text-ink-muted">No sales yet today.</p>
          )}
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader title="Quick links" />
          <div className="space-y-2">
            <Link to="/app/pos" className="block">
              <div className="rounded-xl border border-ink/10 bg-muted/40 px-4 py-3 text-sm font-medium text-ink transition hover:bg-muted">
                Open POS for checkout
              </div>
            </Link>
            <Link to="/app/products" className="block">
              <div className="rounded-xl border border-ink/10 bg-muted/40 px-4 py-3 text-sm font-medium text-ink transition hover:bg-muted">
                Manage products and prices
              </div>
            </Link>
            <Link to="/app/reports" className="block">
              <div className="rounded-xl border border-ink/10 bg-muted/40 px-4 py-3 text-sm font-medium text-ink transition hover:bg-muted">
                View analytics and trends
              </div>
            </Link>
          </div>
        </Card>

      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Low stock"
            action={
              <Link to="/app/inventory">
                <Button variant="ghost" className="text-xs">
                  Inventory
                </Button>
              </Link>
            }
          />
          <ul className="max-h-56 space-y-2 overflow-auto text-sm">
            {(low.data ?? []).slice(0, 8).map((p) => (
              <li
                key={p.productId}
                className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2"
              >
                <span className="font-medium text-ink">{p.name}</span>
                <Badge tone="warning">{p.totalQuantity} left</Badge>
              </li>
            ))}
            {!low.data?.length ? (
              <li className="text-ink-muted">All clear.</li>
            ) : null}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Expiring batches" />
          <ul className="max-h-56 space-y-2 overflow-auto text-sm">
            {(exp.data ?? []).slice(0, 8).map((b) => (
              <li
                key={b.batchId}
                className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-ink">{b.productName}</p>
                  <p className="text-xs text-ink-muted">
                    {b.batchNumber} · {b.expiryDate}
                  </p>
                </div>
                <Badge tone="danger">{b.daysUntilExpiry}d</Badge>
              </li>
            ))}
            {!exp.data?.length ? (
              <li className="text-ink-muted">No batches in warning window.</li>
            ) : null}
          </ul>
        </Card>
      </div>
    </div>
  );
}
