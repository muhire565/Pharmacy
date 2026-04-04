import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import { cn } from "@/utils/cn";

type LanguageSwitcherProps = {
  className?: string;
  selectClassName?: string;
};

export function LanguageSwitcher({ className, selectClassName }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="text-xs font-medium text-ink-muted">{t("lang.label")}</span>
      <select
        value={i18n.language.startsWith("rw") ? "rw" : i18n.language.startsWith("fr") ? "fr" : "en"}
        onChange={(e) => void i18n.changeLanguage(e.target.value)}
        className={cn(
          "h-10 rounded-lg border border-ink/12 bg-surface px-3 text-sm font-medium text-ink shadow-sm",
          selectClassName
        )}
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
