import { cn } from "@/utils/cn";

export function Table(props: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-ink/10">
      <table className={cn("w-full min-w-[640px] text-left text-sm", props.className)}>
        {props.children}
      </table>
    </div>
  );
}

export function Th(props: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "border-b border-ink/10 bg-muted/80 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted",
        props.className
      )}
    >
      {props.children}
    </th>
  );
}

export function Td(props: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td
      colSpan={props.colSpan}
      className={cn("border-b border-ink/5 px-3 py-2.5 text-ink", props.className)}
    >
      {props.children}
    </td>
  );
}
