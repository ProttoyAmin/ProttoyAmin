"use client";

import { Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import * as React from "react";

import { useServerAction } from "@/client/admin/use-server-action";
import type { MessagesData } from "@/client/admin/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RelativeTime } from "@/client/admin/relative-time";
import {
  deleteMessageAction,
  markMessageReadAction,
} from "@/server/actions/admin";

export function MessagesPanel({ data }: { data: MessagesData }) {
  const { pending, run } = useServerAction();
  const [filter, setFilter] = React.useState<"all" | "unread">("all");

  const messages =
    filter === "unread"
      ? data.messages.filter((message) => !message.read)
      : data.messages;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          <p className="mt-1 text-sm text-muted">
            {data.messages.length} message
            {data.messages.length === 1 ? "" : "s"} from the contact form.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "unread" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread
          </Button>
        </div>
      </header>

      {messages.length === 0 ? (
        <EmptyState
          title="No messages"
          description="Messages sent through the contact form land here."
        />
      ) : (
        <ul className="space-y-3">
          {messages.map((message) => (
            <li key={message.id}>
              <Card
                className={
                  message.read ? "" : "border-accent/40 bg-accent-soft/40"
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{message.name}</p>
                      <a
                        href={`mailto:${message.email}`}
                        className="text-sm text-accent hover:underline"
                      >
                        {message.email}
                      </a>
                      {!message.read ? (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                          New
                        </span>
                      ) : null}
                    </div>
                    {message.subject ? (
                      <p className="mt-1 text-sm font-medium">{message.subject}</p>
                    ) : null}
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
                      {message.body}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      <RelativeTime value={message.createdAt} />
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={message.read ? "Mark unread" : "Mark read"}
                      disabled={pending}
                      onClick={() =>
                        run(() => markMessageReadAction(message.id, !message.read))
                      }
                    >
                      {message.read ? (
                        <Mail className="h-4 w-4" />
                      ) : (
                        <MailOpen className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Reply"
                      onClick={() => {
                        window.location.href = `mailto:${message.email}?subject=${encodeURIComponent(
                          message.subject || "Re: your message",
                        )}`;
                      }}
                    >
                      <Reply className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Delete message"
                      disabled={pending}
                      onClick={() => {
                        if (confirm("Delete this message?")) {
                          run(() => deleteMessageAction(message.id));
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-danger" />
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
