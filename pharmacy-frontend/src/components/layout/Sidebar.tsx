import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ScanLine,
  Package,
  Boxes,
  LineChart,
  Wallet,
  Settings,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Bell,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { PharmacyLogo } from "@/components/layout/PharmacyLogo";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { reportsApi } from "@/api/queries";
import { tenantKey } from "@/utils/tenantQuery";

const linkBase =
  "flex items-center rounded-xl text-sm font-medium transition-all duration-150";

type SidebarProps = {
  mobileExpanded: boolean;
  setMobileExpanded: (v: boolean) => void;
  isDesktop: boolean;
};

export function Sidebar({ mobileExpanded, setMobileExpanded, isDesktop }: SidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.role);
  const pharmacyName = useAuthStore((s) => s.pharmacyName);
  const logoUrl = useAuthStore((s) => s.logoUrl);
  const email = useAuthStore((s) => s.email);
  const pharmacyId = useAuthStore((s) => s.pharmacyId);
  const logout = useAuthStore((s) => s.logout);
  const admin = role === "PHARMACY_ADMIN";

  const { data: expiring } = useQuery({
    queryKey: tenantKey(pharmacyId, "expiring-soon"),
    queryFn: () => reportsApi.expiringSoon(),
    enabled: admin && pharmacyId != null,
    staleTime: 60_000,
  });
  const alertCount = expiring?.length ?? 0;

  const showLabels = isDesktop || mobileExpanded;
  const narrowMobile = !isDesktop && !mobileExpanded;

  function onSignOut() {
    queryClient.clear();
    useCartStore.getState().clear();
    logout();
    navigate("/login", { replace: true });
    if (!isDesktop) setMobileExpanded(false);
  }

  const Item = ({
    to,
    icon: Icon,
    label,
  }: {
    to: string;
    icon: typeof LayoutDashboard;
    label: string;
  }) => (
    <NavLink
      to={to}
      title={label}
      onClick={() => {
        if (!isDesktop) setMobileExpanded(false);
      }}
      className={({ isActive }) =>
        cn(
          linkBase,
          narrowMobile ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
          isActive
            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
            : "text-ink-muted hover:bg-primary/[0.06] hover:text-ink"
        )
      }
    >
      <Icon className="size-[18px] shrink-0 opacity-95" strokeWidth={1.75} />
      {showLabels ? <span className="truncate">{label}</span> : null}
    </NavLink>
  );

  return (
    <>
      {!isDesktop && mobileExpanded ? (
        <button
          type="button"
          className="fixed inset-0 z-[35] bg-ink/40 backdrop-blur-[2px] lg:hidden"
          aria-label={t("nav.closeMenu")}
          onClick={() => setMobileExpanded(false)}
        />
      ) : null}

      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-ink/10 bg-gradient-to-b from-surface via-surface to-muted/40 shadow-[4px_0_32px_-16px_rgb(30_58_95/0.18)] transition-[width,transform] duration-200 ease-out",
          isDesktop && "relative w-[15.5rem]",
          !isDesktop && !mobileExpanded && "relative z-[36] w-[3.25rem]",
          !isDesktop &&
            mobileExpanded &&
            "fixed inset-y-0 left-0 z-[40] w-[min(17.5rem,88vw)] shadow-2xl lg:relative lg:z-auto lg:w-[15.5rem] lg:shadow-none"
        )}
      >
        {!isDesktop && !mobileExpanded ? (
          <button
            type="button"
            className="absolute -right-3 top-1/2 z-[45] flex h-16 w-4 -translate-y-1/2 items-center justify-center rounded-r-xl border border-ink/12 bg-surface shadow-md ring-1 ring-ink/5 transition hover:bg-muted active:scale-95 lg:hidden"
            aria-expanded={mobileExpanded}
            aria-label={t("nav.expandSidebar")}
            onClick={() => setMobileExpanded(true)}
          >
            <ChevronRight className="size-3.5 text-ink-muted" strokeWidth={2} />
          </button>
        ) : null}

        {!isDesktop && mobileExpanded ? (
          <button
            type="button"
            className="absolute right-2.5 top-3.5 z-[46] rounded-xl p-2 text-ink-muted transition hover:bg-muted hover:text-ink lg:hidden"
            aria-label={t("nav.collapseSidebar")}
            onClick={() => setMobileExpanded(false)}
          >
            <ChevronLeft className="size-5" strokeWidth={2} />
          </button>
        ) : null}

        {/* Brand */}
        <div
          className={cn(
            "border-b border-ink/8 bg-primary/[0.04]",
            narrowMobile ? "px-2 py-3.5" : "px-4 py-4"
          )}
        >
          <div
            className={cn(
              "flex items-center",
              narrowMobile ? "justify-center" : "gap-3"
            )}
          >
            <div className="relative flex size-10 shrink-0 overflow-hidden rounded-xl bg-primary shadow-sm ring-2 ring-primary/15 ring-offset-2 ring-offset-surface">
              {logoUrl ? (
                <PharmacyLogo className="size-full bg-surface object-contain p-0.5" />
              ) : (
                <span className="flex size-full items-center justify-center text-sm font-bold text-primary-foreground">
                  Rx
                </span>
              )}
            </div>
            {showLabels ? (
              <div className="min-w-0 flex-1 pr-7 lg:pr-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
                  {t("nav.pharmacy")}
                </p>
                <p className="truncate text-sm font-semibold leading-snug text-ink">
                  {pharmacyName ?? t("nav.operations")}
                </p>
                {email ? (
                  <p className="mt-0.5 truncate text-[11px] text-ink-muted">{email}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2.5 lg:p-3">
          <Item to="/app" icon={LayoutDashboard} label={t("nav.dashboard")} />
          <Item to="/app/pos" icon={ScanLine} label={t("nav.pos")} />
          <Item to="/app/products" icon={Package} label={t("nav.products")} />
          <Item to="/app/inventory" icon={Boxes} label={t("nav.inventory")} />
          {admin ? <Item to="/app/reports" icon={LineChart} label={t("nav.reports")} /> : null}
          {admin ? <Item to="/app/expenses" icon={Wallet} label={t("nav.expenses")} /> : null}
          {admin ? <Item to="/app/settings" icon={Settings} label={t("nav.settings")} /> : null}
        </nav>

        <div
          className={cn(
            "mt-auto space-y-2 border-t border-ink/8 bg-muted/25 p-2.5 lg:p-3",
            narrowMobile && "flex flex-col items-center px-1.5"
          )}
        >
          {admin && alertCount > 0 && showLabels ? (
            <button
              type="button"
              onClick={() => {
                navigate("/app/inventory");
                if (!isDesktop) setMobileExpanded(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl border border-warning/25 bg-warning/10 px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:bg-warning/18"
            >
              <Bell className="size-4 shrink-0 text-warning" strokeWidth={2} />
              <span className="min-w-0 flex-1 truncate">{t("nav.expiryAlerts")}</span>
              <Badge tone="warning" className="shrink-0 tabular-nums">
                {alertCount}
              </Badge>
            </button>
          ) : null}
          {admin && alertCount > 0 && narrowMobile ? (
            <button
              type="button"
              title={`${t("nav.expiryAlerts")} (${alertCount})`}
              onClick={() => {
                navigate("/app/inventory");
                setMobileExpanded(false);
              }}
              className="relative flex size-10 items-center justify-center rounded-xl border border-warning/30 bg-warning/10 text-warning transition hover:bg-warning/20"
            >
              <Bell className="size-[18px]" strokeWidth={2} />
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-white">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            </button>
          ) : null}

          <Button
            type="button"
            variant="secondary"
            className={cn(
              "w-full justify-center gap-2 rounded-xl border-ink/12 font-medium text-ink shadow-sm",
              narrowMobile && "size-10 p-0"
            )}
            title={narrowMobile ? t("nav.signOut") : undefined}
            onClick={onSignOut}
          >
            <LogOut className="size-4 shrink-0" strokeWidth={2} />
            {showLabels ? <span>{t("nav.signOut")}</span> : null}
          </Button>

          {showLabels ? (
            <p className="hidden px-1 text-center text-[10px] leading-relaxed text-ink-muted/90 lg:block">
              {t("nav.scannerHint")}
            </p>
          ) : null}
        </div>
      </aside>
    </>
  );
}
