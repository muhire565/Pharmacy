import { cn } from "@/utils/cn";

export function Card(props: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ink/8 bg-surface p-5 shadow-card",
        props.className
      )}
    >
      {props.children}
    </div>
  );
}

export function CardHeader(props: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <h2 className="text-base font-semibold text-ink">{props.title}</h2>
      {props.action}
    </div>
  );
}
