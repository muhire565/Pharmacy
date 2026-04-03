import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { reportsApi } from "@/api/queries";
import { useAuthStore } from "@/store/authStore";
import { tenantKey } from "@/utils/tenantQuery";
import { todayLocal, formatMoney } from "@/utils/money";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Table, Th, Td } from "@/components/ui/Table";
import { Spinner } from "@/components/ui/Spinner";

export function ReportsPage() {
  const pharmacyId = useAuthStore((s) => s.pharmacyId);
  const [day, setDay] = useState(todayLocal());
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const daily = useQuery({
    queryKey: tenantKey(pharmacyId, "reports", "daily", day),
    queryFn: () => reportsApi.dailySales(day),
    enabled: pharmacyId != null,
  });

  const monthly = useQuery({
    queryKey: tenantKey(pharmacyId, "reports", "monthly", year, month),
    queryFn: () => reportsApi.monthlySales(year, month),
    enabled: pharmacyId != null,
  });

  const chartData =
    daily.data?.sales.map((s) => ({
      id: String(s.id),
      amount: s.totalAmount,
    })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Reports</h1>
        <p className="text-sm text-ink-muted">Sales and register activity</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Daily sales" />
          <div className="mb-4">
            <Input
              type="date"
              label="Date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </div>
          {daily.isLoading ? (
            <Spinner />
          ) : (
            <>
              <div className="mb-4 rounded-lg bg-muted/60 p-4">
                <p className="text-xs uppercase text-ink-muted">Total</p>
                <p className="text-2xl font-semibold text-primary">
                  {formatMoney(daily.data?.totalAmount ?? 0)}
                </p>
                <p className="text-sm text-ink-muted">
                  {daily.data?.saleCount ?? 0} sales
                </p>
              </div>
              {chartData.length > 0 ? (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="id" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(v: number) => formatMoney(v)}
                        contentStyle={{ borderRadius: 8 }}
                      />
                      <Bar dataKey="amount" fill="#2A9D8F" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-ink-muted">No sales this day.</p>
              )}
            </>
          )}
        </Card>

        <Card>
          <CardHeader title="Monthly summary" />
          <div className="mb-4 grid grid-cols-2 gap-3">
            <Input
              type="number"
              label="Year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
            <Input
              type="number"
              label="Month (1-12)"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            />
          </div>
          {monthly.isLoading ? (
            <Spinner />
          ) : (
            <div className="rounded-lg bg-muted/60 p-4">
              <p className="text-xs uppercase text-ink-muted">Month total</p>
              <p className="text-2xl font-semibold text-primary">
                {formatMoney(monthly.data?.totalAmount ?? 0)}
              </p>
              <p className="text-sm text-ink-muted">
                {monthly.data?.saleCount ?? 0} sales
              </p>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Recent sales (selected day)" />
        <Table>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Time</Th>
              <Th>Cashier</Th>
              <Th className="text-right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {(daily.data?.sales ?? []).map((s) => (
              <tr key={s.id}>
                <Td className="font-mono text-sm">{s.id}</Td>
                <Td className="text-sm">
                  {new Date(s.createdAt).toLocaleString()}
                </Td>
                <Td>{s.cashierUsername}</Td>
                <Td className="text-right font-medium tabular-nums">
                  {formatMoney(s.totalAmount)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
