"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";

import { ImagePicker } from "@/client/admin/image-picker";
import { useServerAction } from "@/client/admin/use-server-action";
import type { AdminData } from "@/client/admin/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { deletePostAction, savePostAction } from "@/server/actions/admin";
import { formatDate } from "@/lib/format";
import type { ImageAsset, Post } from "@/server/types";

interface PostForm {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string;
  published: boolean;
  coverImage?: ImageAsset;
}

const EMPTY: PostForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  tags: "",
  published: false,
};

function toForm(post?: Post): PostForm {
  if (!post) return { ...EMPTY };
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    tags: post.tags.join(", "),
    published: post.published,
    coverImage: post.coverImage,
  };
}

export function WritingPanel({ data }: { data: AdminData }) {
  const { pending, run } = useServerAction();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<PostForm>(EMPTY);

  function openEditor(post?: Post) {
    setForm(toForm(post));
    setOpen(true);
  }

  function update<K extends keyof PostForm>(key: K, value: PostForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    run(async () => {
      const result = await savePostAction({
        id: form.id,
        title: form.title,
        slug: form.slug || undefined,
        excerpt: form.excerpt,
        content: form.content,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        coverImage: form.coverImage,
        published: form.published,
        seo: { title: "", description: "" },
      });
      if (result.ok) setOpen(false);
      return result;
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Writing</h1>
          <p className="mt-1 text-sm text-muted">
            Long-form notes kept for the future.
          </p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="h-4 w-4" /> New post
        </Button>
      </header>

      {data.posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="Write something worth reading later."
          action={<Button onClick={() => openEditor()}>Write a post</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {data.posts.map((post) => (
            <li key={post.id}>
              <Card className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{post.title}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        post.published
                          ? "bg-success/15 text-success"
                          : "bg-surface-2 text-muted"
                      }`}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">
                    {post.excerpt}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {post.readingTimeMinutes} min read
                    {post.publishedAt ? ` · ${formatDate(post.publishedAt)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit post"
                    onClick={() => openEditor(post)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete post"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`Delete “${post.title}”?`)) {
                        run(() => deletePostAction(post.id));
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Edit post" : "New post"}
        width="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={pending}>
              Save
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
            />
          </Field>
          <Field label="Slug" hint="Leave empty to generate from the title.">
            <Input
              value={form.slug}
              onChange={(event) => update("slug", event.target.value)}
            />
          </Field>
          <Field label="Excerpt">
            <Textarea
              className="min-h-20"
              value={form.excerpt}
              onChange={(event) => update("excerpt", event.target.value)}
            />
          </Field>
          <Field label="Content" hint="Markdown supported.">
            <Textarea
              className="min-h-64 font-mono text-[13px]"
              value={form.content}
              onChange={(event) => update("content", event.target.value)}
            />
          </Field>
          <Field label="Tags" hint="Comma separated.">
            <Input
              value={form.tags}
              onChange={(event) => update("tags", event.target.value)}
            />
          </Field>
          <ImagePicker
            value={form.coverImage}
            onChange={(value) => update("coverImage", value)}
            library={data.media}
            folder="posts"
          />
          <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Published
            </span>
            <Switch
              checked={form.published}
              onCheckedChange={(value) => update("published", value)}
            />
          </div>
        </div>
      </Sheet>
    </div>
  );
}
