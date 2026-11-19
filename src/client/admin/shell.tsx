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
import * as React from "react";
import { useRouter } from "next/navigation";

import { useTheme } from "@/client/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { ADMIN_TABS, type AdminTabId } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { AdminData } from "@/client/admin/types";

import { OverviewPanel } from "@/client/admin/overview-panel";
import { ProjectsPanel } from "@/client/admin/projects-panel";
import { ExperiencePanel } from "@/client/admin/experience-panel";
import { SkillsPanel } from "@/client/admin/skills-panel";
import { WritingPanel } from "@/client/admin/writing-panel";
import { MessagesPanel } from "@/client/admin/messages-panel";
import { MediaPanel } from "@/client/admin/media-panel";
import { SettingsPanel } from "@/client/admin/settings-panel";

const ICONS: Record<AdminTabId, React.ElementType> = {
  overview: LayoutDashboard,
  projects: FolderOpen,
  experience: Sparkles,
  skills: Wrench,
  writing: PenLine,
  messages: Inbox,
  media: Sparkles,
  settings: Settings,
};

export function AdminShell({ data }: { data: AdminData }) {
  const [tab, setTab] = React.useState<AdminTabId>("overview");
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const unread = data.messages.filter((message) => !message.read).length;

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/admin/login");
    router.refresh();
  }

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
            <p className="truncate text-xs text-muted">{data.owner.email}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {ADMIN_TABS.map((item) => {
            const Icon = ICONS[item.id];
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  isActive
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
              </button>
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

      {/* Mobile tab bar */}
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
        <div className="flex gap-1 overflow-x-auto px-3 pb-3">
          {ADMIN_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors",
                tab === item.id
                  ? "bg-accent text-white"
                  : "border border-line text-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
          {tab === "overview" ? <OverviewPanel data={data} /> : null}
          {tab === "projects" ? <ProjectsPanel data={data} /> : null}
          {tab === "experience" ? <ExperiencePanel data={data} /> : null}
          {tab === "skills" ? <SkillsPanel data={data} /> : null}
          {tab === "writing" ? <WritingPanel data={data} /> : null}
          {tab === "messages" ? <MessagesPanel data={data} /> : null}
          {tab === "media" ? <MediaPanel data={data} /> : null}
          {tab === "settings" ? <SettingsPanel data={data} /> : null}
        </div>
      </main>
    </div>
  );
}
