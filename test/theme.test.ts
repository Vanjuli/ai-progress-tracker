import { describe, expect, it } from "vitest";
import { applyTheme, getInitialTheme, nextTheme, THEME_STORAGE_KEY } from "../src/lib/theme";

describe("theme helpers", () => {
  it("uses a stored light or dark preference first", () => {
    const storage = new Map([[THEME_STORAGE_KEY, "dark"]]);

    expect(getInitialTheme({ storage, prefersDark: false })).toBe("dark");
  });

  it("falls back to the OS color scheme when no preference is stored", () => {
    expect(getInitialTheme({ storage: new Map(), prefersDark: true })).toBe("dark");
    expect(getInitialTheme({ storage: new Map(), prefersDark: false })).toBe("light");
  });

  it("toggles between light and dark", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("light");
  });

  it("applies the theme to the root element and persists it", () => {
    const root = { dataset: {} } as HTMLElement;
    const storage = new Map<string, string>();

    applyTheme(root, storage, "dark");

    expect(root.dataset.theme).toBe("dark");
    expect(storage.get(THEME_STORAGE_KEY)).toBe("dark");
  });
});
