"use client";

import { Database, Images, Inbox, Layers, PenLine, Wrench } from "lucide-react";
import * as React from "react";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import type { AdminData } from "@/client/admin/types";
import { formatRelativeTime } from "@/lib/format";

export function OverviewPanel({ data }: { data: AdminData }) {
  const stats = [
    { label: "Projects", value: data.projects.length, icon: Layers },
    { label: "Experience", value: data.experiences.length, icon: Wrench },
    { label: "Skills", value: data.skills.length, icon: Layers },
    { label: "Posts", value: data.posts.length, icon: PenLine },
    {
      label: "Unread messages",
      value: data.messages.filter((message) => !message.read).length,
      icon: Inbox,
    },
    { label: "Media", value: data.media.length, icon: Images },
  ];

  const demoCollections = [
    { key: "projects", label: "Projects", demo: data.demo.projects },
    { key: "experiences", label: "Experience", demo: data.demo.experiences },
    { key: "skills", label: "Skills", demo: data.demo.skills },
    { key: "posts", label: "Writing", demo: data.demo.posts },
  ].filter((entry) => entry.demo);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          Signed in as {data.owner.email} — you have full control over the site
          content.
        </p>
      </header>

      {data.runtime.issues.length > 0 ? (
        <Alert tone="danger" title="Configuration required">
          <ul className="list-disc space-y-1 pl-4">
            {data.runtime.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {data.runtime.db.error ? (
        <Alert tone="danger" title="The database is unreachable">
          {data.runtime.db.error}
          <span className="mt-1 block text-xs">
            The site is serving demo content from the local driver. Add valid
            Atlas credentials to <code>MONGODB_URI</code> and restart to connect.
          </span>
        </Alert>
      ) : null}

      {!data.runtime.configured.mongo ? (
        <Alert tone="warning" title="Running in demo mode">
          <code>MONGODB_URI</code> is not set, so content is stored in a local
          JSON file (<code>.data/db.json</code>). Everything else works exactly
          the same.
        </Alert>
      ) : null}

      {demoCollections.length > 0 ? (
        <Alert tone="info" title="Showing demo content">
          {demoCollections.map((entry) => entry.label).join(", ")} still use
          placeholder content. Publish your own to replace it — the demo entries
          disappear automatically.
        </Alert>
      ) : null}

      {!data.runtime.configured.cloudinary ? (
        <Alert tone="info" title="Local media storage">
          Cloudinary credentials are missing, so uploads are stored on the
          local disk. Add <code>CLOUDINARY_*</code> variables to switch to the
          cloud.
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="flex items-center gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs uppercase tracking-wider text-muted">
                  {stat.label}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Recent activity
        </h2>
        {data.audit.length === 0 ? (
          <Card className="mt-3 text-sm text-muted">
            No admin activity recorded yet. Every change you make is logged
            here.
          </Card>
        ) : (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line">
            {data.audit.slice(0, 12).map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-4 bg-surface/50 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate">
                    <span className="font-medium">{entry.action}</span>{" "}
                    <span className="text-muted">on {entry.entity}</span>
                  </p>
                  <p className="truncate text-xs text-muted">
                    {entry.actorEmail}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {formatRelativeTime(entry.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex items-start gap-3 rounded-2xl border border-line bg-surface/40 p-4 text-sm text-muted">
        <Database className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Driver: <strong className="text-foreground">{data.runtime.db.driver}</strong>
          {" · "}
          Media: <strong className="text-foreground">{data.runtime.media.driver}</strong>
          {" · "}
          Session secret:{" "}
          <strong className="text-foreground">
            {data.runtime.configured.sessionSecret ? "configured" : "development default"}
          </strong>
        </p>
      </section>
    </div>
  );
}
