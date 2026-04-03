import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ScanLine,
  Package,
  Boxes,
  LineChart,
  Settings,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/authStore";
import { PharmacyLogo } from "@/components/layout/PharmacyLogo";

const linkBase =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";

export function Sidebar() {
  const role = useAuthStore((s) => s.role);
  const pharmacyName = useAuthStore((s) => s.pharmacyName);
  const logoUrl = useAuthStore((s) => s.logoUrl);
  const admin = role === "PHARMACY_ADMIN";

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
      className={({ isActive }) =>
        cn(
          linkBase,
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-ink-muted hover:bg-muted hover:text-ink"
        )
      }
    >
      <Icon className="size-[18px] shrink-0 opacity-90" strokeWidth={1.75} />
      {label}
    </NavLink>
  );

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-ink/10 bg-surface">
      <div className="flex h-14 items-center gap-2 border-b border-ink/10 px-4">
        <div className="relative flex size-9 shrink-0 overflow-hidden rounded-lg bg-primary">
          {logoUrl ? (
            <PharmacyLogo className="size-full bg-surface object-contain p-0.5" />
          ) : (
            <span className="flex size-full items-center justify-center text-sm font-bold text-primary-foreground">
              Rx
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Pharmacy
          </p>
          <p className="truncate text-sm font-semibold text-ink">
            {pharmacyName ?? "Operations"}
          </p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        <Item to="/app" icon={LayoutDashboard} label="Dashboard" />
        <Item to="/app/pos" icon={ScanLine} label="POS" />
        <Item to="/app/products" icon={Package} label="Products" />
        <Item to="/app/inventory" icon={Boxes} label="Inventory" />
        {admin ? (
          <Item to="/app/reports" icon={LineChart} label="Reports" />
        ) : null}
        {admin ? (
          <Item to="/app/settings" icon={Settings} label="Settings" />
        ) : null}
      </nav>
      <div className="border-t border-ink/10 p-3 text-[11px] leading-relaxed text-ink-muted">
        Scanner sends Enter after code — field stays focused for rapid checkout.
      </div>
    </aside>
  );
}
