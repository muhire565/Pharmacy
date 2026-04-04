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
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <h2 className="shrink-0 text-base font-semibold text-ink">{props.title}</h2>
      {props.action ? <div className="min-w-0 sm:shrink-0">{props.action}</div> : null}
    </div>
  );
}
