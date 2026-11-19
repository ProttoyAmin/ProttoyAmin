import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

import { AppProviders } from "@/client/providers/app-providers";
import { themeScript } from "@/lib/theme-script";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
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

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
