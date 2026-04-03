import { cn } from "@/utils/cn";

export type BadgeTone = "default" | "success" | "warning" | "danger" | "accent";

const tones: Record<BadgeTone, string> = {
  default: "bg-muted text-ink-muted",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  accent: "bg-accent/15 text-accent",
};

export function Badge(props: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  const { children, tone = "default", className } = props;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
