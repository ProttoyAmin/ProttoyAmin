import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/manrope";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/space-grotesk";
import "./globals.css";

import { AppProviders } from "@/client/providers/app-providers";
import { themeScript } from "@/lib/theme-script";
import { normalizeAccent } from "@/lib/theme";
import { getCachedSiteContent } from "@/server/services/site-content-cache";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Prottoy Amin — Software Engineer",
    template: "%s · Prottoy Amin",
  },
  description:
    "Full-stack engineer building fast, resilient products across product, platform and applied machine learning.",
  keywords: [
    "Prottoy Amin",
    "full stack engineer",
    "react",
    "next.js",
    "mongodb",
    "golang",
  ],
  authors: [{ name: "Prottoy Amin" }],
  creator: "Prottoy Amin",
  openGraph: {
    type: "website",
    title: "Prottoy Amin — Software Engineer",
    description:
      "Full-stack engineer building fast, resilient products across product, platform and applied machine learning.",
    siteName: "Prottoy Amin",
    images: [{ url: "/demo/og.svg", width: 1200, height: 630, alt: "Prottoy Amin" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prottoy Amin — Software Engineer",
    description:
      "Full-stack engineer building fast, resilient products across product, platform and applied machine learning.",
    images: ["/demo/og.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Reads the appearance the owner configured. A database problem must never
 * stop the site from rendering, so any failure falls back to the defaults.
 */
async function loadAppearance(): Promise<{
  accent: string;
  defaultTheme: "dark" | "light";
  fontFamily: "inter" | "manrope" | "dm-sans" | "space-grotesk";
  fontScale: "compact" | "comfortable" | "spacious";
  bubbleStyle: "rounded" | "pill" | "soft-square";
}> {
  try {
    const { settings } = await getCachedSiteContent();
    const fontFamilies = ["inter", "manrope", "dm-sans", "space-grotesk"] as const;
    const fontScales = ["compact", "comfortable", "spacious"] as const;
    const bubbleStyles = ["rounded", "pill", "soft-square"] as const;
    return {
      accent: normalizeAccent(settings.theme?.accent),
      defaultTheme: settings.theme?.default === "light" ? "light" : "dark",
      fontFamily: fontFamilies.includes(
        settings.theme?.fontFamily as (typeof fontFamilies)[number],
      )
        ? settings.theme!.fontFamily!
        : "manrope",
      fontScale: fontScales.includes(
        settings.theme?.fontScale as (typeof fontScales)[number],
      )
        ? settings.theme!.fontScale!
        : "comfortable",
      bubbleStyle: bubbleStyles.includes(
        settings.theme?.bubbleStyle as (typeof bubbleStyles)[number],
      )
        ? settings.theme!.bubbleStyle!
        : "pill",
    };
  } catch {
    return {
      accent: normalizeAccent(undefined),
      defaultTheme: "dark",
      fontFamily: "manrope",
      fontScale: "comfortable",
      bubbleStyle: "pill",
    };
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#08080b" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // The nonce is generated per request by the proxy; the inline theme
  // script must carry it or the browser blocks it.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  // The accent colour the owner picked in Admin → Settings. It is applied
  // as a CSS variable so the same colour drives the site *and* the admin
  // panel, in both the light and the dark theme.
  const { accent, defaultTheme, fontFamily, fontScale, bubbleStyle } =
    await loadAppearance();
  const fontStacks = {
    inter: '"Inter Variable", ui-sans-serif, system-ui, sans-serif',
    manrope: '"Manrope Variable", ui-sans-serif, system-ui, sans-serif',
    "dm-sans": '"DM Sans Variable", ui-sans-serif, system-ui, sans-serif',
    "space-grotesk": '"Space Grotesk Variable", ui-sans-serif, system-ui, sans-serif',
  } as const;
  const typeScale =
    fontScale === "compact" ? "0.96" : fontScale === "spacious" ? "1.05" : "1";
  const bubbleRadius =
    bubbleStyle === "pill" ? "24px" : bubbleStyle === "rounded" ? "18px" : "10px";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: themeScript(defaultTheme) }}
        />
        {/* The accent the owner picked. A style rule (rather than an inline
            style attribute) lets the admin preview override it live. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--accent-base:${accent};--site-font:${fontStacks[fontFamily]};--type-scale:${typeScale};--radius:${bubbleRadius}}`,
          }}
        />
      </head>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <AppProviders defaultTheme={defaultTheme}>{children}</AppProviders>
      </body>
    </html>
  );
}
