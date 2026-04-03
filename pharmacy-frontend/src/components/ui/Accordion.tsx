import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

export function AccordionItem({
  title,
  children,
  defaultOpen,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const id = useId();
  return (
    <div className="rounded-xl border border-ink/10 bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
        aria-expanded={open}
        aria-controls={id}
      >
        <span className="text-sm font-semibold text-ink">{title}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-ink-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? (
        <div
          id={id}
          className="border-t border-ink/10 px-4 pb-4 pt-3 text-sm leading-relaxed text-ink-muted"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

