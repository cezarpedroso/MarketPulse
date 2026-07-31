import { useLayoutEffect, useState } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "marketpulse-theme";

const isTheme = (value: string | null): value is Theme =>
  value === "light" || value === "dark";

const getInitialTheme = (): Theme => {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (isTheme(storedTheme)) {
      return storedTheme;
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === "light" ? "dark" : "light";

      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // The active theme still works for this session without persistence.
      }

      return nextTheme;
    });
  };

  return { theme, toggleTheme };
}
