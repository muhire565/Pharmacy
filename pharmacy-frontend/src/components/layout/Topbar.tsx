import { Search, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

type TopbarProps = {
  isDesktop: boolean;
  onMenuClick: () => void;
};

export function Topbar({ isDesktop, onMenuClick }: TopbarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const debounced = useDebounce(q, 350);

  return (
    <header className="relative z-10 shrink-0 border-b border-ink/10 bg-surface/95 shadow-[0_1px_0_rgb(var(--surface))] backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
      {!isDesktop ? (
        <Button
          type="button"
          variant="secondary"
          className="absolute left-3 top-1/2 z-10 size-10 -translate-y-1/2 rounded-xl border-ink/10 p-0 shadow-sm lg:hidden"
          aria-label={t("nav.openMenu")}
          onClick={onMenuClick}
        >
          <Menu className="size-5" strokeWidth={2} />
        </Button>
      ) : null}

      <div
        className={cn(
          "mx-auto flex min-h-[3.25rem] max-w-3xl items-center justify-center px-3 py-2.5 sm:px-6",
          !isDesktop && "pl-14"
        )}
      >
        <div className="relative w-full max-w-xl">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-ink-muted"
            strokeWidth={2}
          />
          <Input
            placeholder={t("topbar.searchPlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && debounced.trim()) {
                navigate(`/app/products?q=${encodeURIComponent(debounced.trim())}`);
              }
            }}
            className={cn(
              "h-10 rounded-full border-ink/12 bg-muted/50 pl-10 pr-4 text-sm shadow-inner",
              "placeholder:text-ink-muted/80",
              "ring-primary/20 focus:border-primary/25 focus:bg-surface focus:ring-2"
            )}
            aria-label={t("topbar.searchCatalog")}
          />
        </div>
      </div>
    </header>
  );
}
