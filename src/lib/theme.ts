export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "ai-progress-tracker-theme";

type ThemeStorage = Pick<Storage, "getItem" | "setItem"> | Map<string, string>;

interface InitialThemeOptions {
  storage?: ThemeStorage;
  prefersDark: boolean;
}

function isTheme(value: string | null | undefined): value is Theme {
  return value === "light" || value === "dark";
}

function readStoredTheme(storage?: ThemeStorage): Theme | null {
  if (!storage) return null;
  const value = "getItem" in storage ? storage.getItem(THEME_STORAGE_KEY) : storage.get(THEME_STORAGE_KEY);
  return isTheme(value) ? value : null;
}

function writeStoredTheme(storage: ThemeStorage | undefined, theme: Theme) {
  if (!storage) return;
  if ("setItem" in storage) {
    storage.setItem(THEME_STORAGE_KEY, theme);
  } else {
    storage.set(THEME_STORAGE_KEY, theme);
  }
}

export function getInitialTheme({ storage, prefersDark }: InitialThemeOptions): Theme {
  return readStoredTheme(storage) ?? (prefersDark ? "dark" : "light");
}

export function getSystemPrefersDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function applyTheme(root: HTMLElement, storage: ThemeStorage | undefined, theme: Theme) {
  root.dataset.theme = theme;
  writeStoredTheme(storage, theme);
}

export function nextTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}
