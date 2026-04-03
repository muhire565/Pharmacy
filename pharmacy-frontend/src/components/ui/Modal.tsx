import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "./Button";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-xl border border-ink/10 bg-surface p-6 shadow-card",
          wide ? "max-w-3xl" : "max-w-lg",
          className
        )}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="modal-title" className="text-lg font-semibold text-ink">
            {title}
          </h2>
          <Button variant="ghost" className="p-2" onClick={onClose} aria-label="Close">
            <X className="size-5" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
