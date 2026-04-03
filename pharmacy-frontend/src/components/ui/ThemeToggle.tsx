import { useEffect, useMemo, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/utils/cn";
import { applyTheme, getInitialTheme, type Theme } from "@/utils/theme";

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const Icon = useMemo(() => (theme === "dark" ? Sun : Moon), [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg border border-ink/10 bg-surface text-ink transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className
      )}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <Icon className="size-4" />
    </button>
  );
}

