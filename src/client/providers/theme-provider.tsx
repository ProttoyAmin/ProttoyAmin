"use client";

import * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "pa-theme";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Reads the persisted preference; falls back to the theme the owner
 * configured in the admin panel.
 */
function getSnapshot(fallback: Theme): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return fallback;
}

/** The server always renders the dark theme; the inline script corrects it. */
function getServerSnapshot(): Theme {
  return "dark";
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  // The snapshot function must keep a stable identity, otherwise React
  // re-subscribes to the store on every render.
  const getClientSnapshot = React.useCallback(
    () => getSnapshot(defaultTheme),
    [defaultTheme],
  );

  const theme = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  // Keep the document in sync with the selected theme.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    emit();
  }, []);

  const toggleTheme = useCallback(() => {
    // Flip the *effective* theme. Reading localStorage directly would be a
    // no-op for a first-time visitor whose theme is already light.
    const next = getSnapshot(defaultTheme) === "dark" ? "light" : "dark";
    setTheme(next);
  }, [defaultTheme, setTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return context;
}
