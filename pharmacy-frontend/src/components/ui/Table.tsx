import type { TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export function Table(props: {
  children: React.ReactNode;
  className?: string;
  /** Min width of inner table; lower = less horizontal scroll on small phones */
  minTableWidth?: string;
  /** Outer scroll wrapper (e.g. `border-0` when nested inside a card) */
  wrapClassName?: string;
}) {
  const minW = props.minTableWidth ?? "min-w-[640px]";
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-ink/10 [-webkit-overflow-scrolling:touch]",
        props.wrapClassName
      )}
    >
      <table className={cn("w-full text-left text-sm", minW, props.className)}>
        {props.children}
      </table>
    </div>
  );
}

export function Th({ className, children, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...rest}
      className={cn(
        "border-b border-ink/10 bg-muted/80 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ className, children, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...rest}
      className={cn("border-b border-ink/5 px-3 py-2.5 text-ink", className)}
    >
      {children}
    </td>
  );
}
