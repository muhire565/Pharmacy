import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Bell, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useNow } from "@/hooks/useNow";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { tenantKey } from "@/utils/tenantQuery";
import { PharmacyLogo } from "@/components/layout/PharmacyLogo";
import { reportsApi } from "@/api/queries";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatLongDateTime, getGreetingForTime } from "@/utils/greeting";

export function Topbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { email, pharmacyName, logoUrl, role, logout, pharmacyId } = useAuthStore();
  const admin = role === "PHARMACY_ADMIN";
  const [q, setQ] = useState("");

  const debounced = useDebounce(q, 350);

  const { data: expiring } = useQuery({
    queryKey: tenantKey(pharmacyId, "expiring-soon"),
    queryFn: () => reportsApi.expiringSoon(),
    enabled: admin && pharmacyId != null,
    staleTime: 60_000,
  });

  const alertCount = expiring?.length ?? 0;
  const now = useNow(1000);
  const greeting = getGreetingForTime(now);
  const dayTime = formatLongDateTime(now);

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-ink/10 bg-surface px-6">
      <div className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
        <Input
          placeholder="Search products… (goes to catalog)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && debounced.trim()) {
              navigate(`/app/products?q=${encodeURIComponent(debounced.trim())}`);
            }
          }}
          className="pl-9"
        />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden text-right lg:block">
          <p className="text-sm font-semibold text-ink">
            {greeting}, {email?.split("@")[0] ?? "there"}
          </p>
          <p className="text-xs text-ink-muted">{dayTime}</p>
        </div>
        {admin && alertCount > 0 ? (
          <button
            type="button"
            onClick={() => navigate("/app/inventory")}
            className="relative flex items-center gap-1.5 rounded-lg border border-warning/30 bg-warning/10 px-3 py-1.5 text-sm font-medium text-ink transition hover:bg-warning/20"
          >
            <Bell className="size-4 text-warning" />
            Expiry
            <Badge tone="warning">{alertCount}</Badge>
          </button>
        ) : null}
        <div className="hidden items-center gap-2 text-right sm:flex">
          {logoUrl ? (
            <PharmacyLogo className="size-8 shrink-0 rounded-md border border-ink/10 bg-surface object-contain p-0.5" />
          ) : null}
          <div>
            <p className="text-sm font-medium text-ink">
              {pharmacyName ?? "Pharmacy"}
            </p>
            <p className="text-xs text-ink-muted">{email}</p>
          </div>
        </div>
        <Button
          variant="secondary"
          className="gap-2 px-3"
          onClick={() => {
            queryClient.clear();
            useCartStore.getState().clear();
            logout();
            navigate("/login", { replace: true });
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
