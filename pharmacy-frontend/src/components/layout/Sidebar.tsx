import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ScanLine,
  Package,
  Boxes,
  LineChart,
  Settings,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/authStore";
import { PharmacyLogo } from "@/components/layout/PharmacyLogo";

const linkBase =
  "flex items-center rounded-lg text-sm font-medium transition-colors";

type SidebarProps = {
  /** lg+ always full width; &lt; lg: narrow icon rail unless expanded */
  mobileExpanded: boolean;
  setMobileExpanded: (v: boolean) => void;
  isDesktop: boolean;
};

export function Sidebar({ mobileExpanded, setMobileExpanded, isDesktop }: SidebarProps) {
  const role = useAuthStore((s) => s.role);
  const pharmacyName = useAuthStore((s) => s.pharmacyName);
  const logoUrl = useAuthStore((s) => s.logoUrl);
  const admin = role === "PHARMACY_ADMIN";

  const showLabels = isDesktop || mobileExpanded;
  const narrowMobile = !isDesktop && !mobileExpanded;

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
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-ink-muted hover:bg-muted hover:text-ink"
        )
      }
    >
      <Icon className="size-[18px] shrink-0 opacity-90" strokeWidth={1.75} />
      {showLabels ? <span className="truncate">{label}</span> : null}
    </NavLink>
  );

  return (
    <>
      {!isDesktop && mobileExpanded ? (
        <button
          type="button"
          className="fixed inset-0 z-[35] bg-primary/40 backdrop-blur-[1px] lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileExpanded(false)}
        />
      ) : null}

      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-ink/10 bg-surface transition-[width,transform] duration-200 ease-out",
          isDesktop && "relative w-56",
          !isDesktop && !mobileExpanded && "relative z-[36] w-[3.25rem]",
          !isDesktop &&
            mobileExpanded &&
            "fixed inset-y-0 left-0 z-[40] w-[min(17.5rem,85vw)] shadow-xl lg:relative lg:z-auto lg:w-56 lg:shadow-none"
        )}
      >
        {!isDesktop && !mobileExpanded ? (
          <button
            type="button"
            className="absolute -right-3 top-1/2 z-[45] flex h-14 w-4 -translate-y-1/2 items-center justify-center rounded-r-lg border border-ink/15 bg-surface shadow-md ring-1 ring-ink/5 hover:bg-muted active:scale-95 lg:hidden"
            aria-expanded={mobileExpanded}
            aria-label="Expand sidebar"
            onClick={() => setMobileExpanded(true)}
          >
            <ChevronRight className="size-3.5 text-ink-muted" strokeWidth={2} />
          </button>
        ) : null}

        {!isDesktop && mobileExpanded ? (
          <button
            type="button"
            className="absolute right-2 top-3 z-[46] rounded-lg p-1.5 text-ink-muted hover:bg-muted hover:text-ink lg:hidden"
            aria-label="Collapse sidebar"
            onClick={() => setMobileExpanded(false)}
          >
            <ChevronLeft className="size-5" strokeWidth={2} />
          </button>
        ) : null}

        <div
          className={cn(
            "flex h-14 items-center border-b border-ink/10",
            narrowMobile ? "justify-center px-2" : "gap-2 px-4"
          )}
        >
          <div className="relative flex size-9 shrink-0 overflow-hidden rounded-lg bg-primary">
            {logoUrl ? (
              <PharmacyLogo className="size-full bg-surface object-contain p-0.5" />
            ) : (
              <span className="flex size-full items-center justify-center text-sm font-bold text-primary-foreground">
                Rx
              </span>
            )}
          </div>
          {showLabels ? (
            <div className="min-w-0 flex-1 pr-6 lg:pr-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Pharmacy
              </p>
              <p className="truncate text-sm font-semibold text-ink">
                {pharmacyName ?? "Operations"}
              </p>
            </div>
          ) : null}
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 lg:p-3">
          <Item to="/app" icon={LayoutDashboard} label="Dashboard" />
          <Item to="/app/pos" icon={ScanLine} label="POS" />
          <Item to="/app/products" icon={Package} label="Products" />
          <Item to="/app/inventory" icon={Boxes} label="Inventory" />
          {admin ? <Item to="/app/reports" icon={LineChart} label="Reports" /> : null}
          {admin ? <Item to="/app/settings" icon={Settings} label="Settings" /> : null}
        </nav>

        {showLabels ? (
          <div className="hidden border-t border-ink/10 p-3 text-[11px] leading-relaxed text-ink-muted lg:block">
            Scanner sends Enter after code — field stays focused for rapid checkout.
          </div>
        ) : null}
      </aside>
    </>
  );
}
