import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Bell, LogOut, Menu } from "lucide-react";
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
import { cn } from "@/utils/cn";

type TopbarProps = {
  isDesktop: boolean;
  onMenuClick: () => void;
};

export function Topbar({ isDesktop, onMenuClick }: TopbarProps) {
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
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-ink/10 bg-surface px-3 sm:gap-4 sm:px-4 lg:px-6">
      {!isDesktop ? (
        <Button
          type="button"
          variant="secondary"
          className="size-9 shrink-0 p-0 lg:hidden"
          aria-label="Toggle navigation"
          onClick={onMenuClick}
        >
          <Menu className="size-5" />
        </Button>
      ) : null}

      <div
        className={cn(
          "relative min-w-0 flex-1 sm:max-w-md",
          isDesktop ? "max-w-full" : "max-w-[min(100%,11rem)]"
        )}
      >
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted sm:left-3" />
        <Input
          placeholder="Search catalog…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && debounced.trim()) {
              navigate(`/app/products?q=${encodeURIComponent(debounced.trim())}`);
            }
          }}
          className="min-h-9 pl-8 text-sm sm:pl-9"
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
        <div className="hidden text-right xl:block">
          <p className="text-sm font-semibold text-ink">
            {greeting}, {email?.split("@")[0] ?? "there"}
          </p>
          <p className="text-xs text-ink-muted">{dayTime}</p>
        </div>
        {admin && alertCount > 0 ? (
          <button
            type="button"
            onClick={() => navigate("/app/inventory")}
            className="relative flex items-center gap-1 rounded-lg border border-warning/30 bg-warning/10 px-2 py-1.5 text-xs font-medium text-ink transition hover:bg-warning/20 sm:gap-1.5 sm:px-3 sm:text-sm"
          >
            <Bell className="size-4 shrink-0 text-warning" />
            <span className="hidden sm:inline">Expiry</span>
            <Badge tone="warning" className="min-w-[1.25rem] justify-center px-1">
              {alertCount}
            </Badge>
          </button>
        ) : null}
        <div className="hidden items-center gap-2 text-right md:flex">
          {logoUrl ? (
            <PharmacyLogo className="size-8 shrink-0 rounded-md border border-ink/10 bg-surface object-contain p-0.5" />
          ) : null}
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-ink">{pharmacyName ?? "Pharmacy"}</p>
            <p className="max-w-[10rem] truncate text-xs text-ink-muted">{email}</p>
          </div>
        </div>
        <Button
          variant="secondary"
          className="gap-1.5 px-2 sm:gap-2 sm:px-3"
          onClick={() => {
            queryClient.clear();
            useCartStore.getState().clear();
            logout();
            navigate("/login", { replace: true });
          }}
        >
          <LogOut className="size-4 shrink-0" />
          <span className="hidden sm:inline">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
