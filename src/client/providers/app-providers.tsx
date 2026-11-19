"use client";

import { Toaster } from "sonner";

import { ThemeProvider } from "@/client/providers/theme-provider";

export function AppProviders({
  children,
  defaultTheme = "dark",
}: {
  children: React.ReactNode;
  defaultTheme?: "dark" | "light";
}) {
  return (
    <ThemeProvider defaultTheme={defaultTheme}>
      {children}
      <Toaster
        position="bottom-right"
        closeButton
        toastOptions={{
          classNames: {
            toast:
              "border border-line bg-surface text-foreground shadow-lg rounded-xl",
            description: "text-muted",
          },
        }}
      />
    </ThemeProvider>
  );
}
