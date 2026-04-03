export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

export function getStoredTheme(): Theme | null {
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" ? v : null;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
}

export function getInitialTheme(): Theme {
  // Default must be light unless user explicitly chose otherwise.
  return getStoredTheme() ?? "light";
}

