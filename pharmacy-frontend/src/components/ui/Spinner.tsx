import { cn } from "@/utils/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "size-8 animate-spin rounded-full border-2 border-accent border-t-transparent",
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
