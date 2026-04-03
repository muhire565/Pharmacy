import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  /** When `type="password"`, shows a reveal/hide control. */
  passwordToggle?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { className, label, error, id, name, passwordToggle, type, ...rest },
    ref
  ) {
    const [pwVisible, setPwVisible] = useState(false);
    const nid = id ?? name ?? "field";
    const usePwToggle = Boolean(passwordToggle && type === "password");
    const effectiveType =
      usePwToggle && pwVisible ? "text" : type;

    const inputClassName = cn(
      "w-full rounded-lg border border-ink/10 bg-surface px-3 py-2 text-sm text-ink shadow-sm placeholder:text-ink-muted/70 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
      error ? "border-danger focus:border-danger focus:ring-danger" : "",
      usePwToggle && "pr-10",
      className
    );

    const field = (
      <input
        ref={ref}
        id={nid}
        name={name}
        type={effectiveType}
        className={inputClassName}
        {...rest}
      />
    );

    return (
      <div className="w-full space-y-1">
        {label ? (
          <label htmlFor={nid} className="text-xs font-medium text-ink-muted">
            {label}
          </label>
        ) : null}
        {usePwToggle ? (
          <div className="relative">
            {field}
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-muted transition hover:bg-muted hover:text-ink focus-visible:outline focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={pwVisible ? "Hide password" : "Show password"}
              aria-pressed={pwVisible}
              tabIndex={-1}
              onClick={() => setPwVisible((v) => !v)}
            >
              {pwVisible ? (
                <EyeOff className="size-4 shrink-0" aria-hidden />
              ) : (
                <Eye className="size-4 shrink-0" aria-hidden />
              )}
            </button>
          </div>
        ) : (
          field
        )}
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
    );
  }
);
