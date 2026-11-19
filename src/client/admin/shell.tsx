"use client";

import {
  ExternalLink,
  FolderOpen,
  Inbox,
  LayoutDashboard,
  LogOut,
  Moon,
  PenLine,
  Settings,
  Sparkles,
  Sun,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";

import { useTheme } from "@/client/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { ADMIN_NAV, type AdminNavId } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { AdminUser } from "@/server/types";

const ICONS: Record<AdminNavId, React.ElementType> = {
  overview: LayoutDashboard,
  projects: FolderOpen,
  experience: Sparkles,
  skills: Wrench,
  writing: PenLine,
  messages: Inbox,
  media: Sparkles,
  settings: Settings,
};

/**
 * The admin chrome.
 *
 * Every section is its own route — the shell only renders the navigation
 * and hands the page through.
 */
export function AdminShell({
  owner,
  unread,
  children,
}: {
  owner: AdminUser;
  unread: number;
  children: React.ReactNode;
}) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-line bg-surface/40 lg:flex lg:flex-col">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-xs font-bold text-white">
            PA
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Portfolio admin</p>
            <p className="truncate text-xs text-muted">{owner.email}</p>
          </div>
        </div>

        <nav
          aria-label="Admin sections"
          className="flex-1 space-y-1 overflow-y-auto px-3"
        >
          {ADMIN_NAV.map((item) => {
            const Icon = ICONS[item.id];
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-surface-2 font-medium text-foreground"
                    : "text-muted hover:bg-surface-2/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {item.id === "messages" && unread > 0 ? (
                  <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unread}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-line p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => window.open("/", "_blank")}
          >
            <ExternalLink className="h-4 w-4" /> View site
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="sticky top-0 z-30 border-b border-line bg-background/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold">Portfolio admin</p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <nav
          aria-label="Admin sections"
          className="flex gap-1 overflow-x-auto px-3 pb-3"
        >
          {ADMIN_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors",
                  active
                    ? "bg-accent text-white"
                    : "border border-line text-muted",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
