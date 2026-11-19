"use client";

import { Eye, EyeOff, Pencil, Plus, Trash2 } from "@/components/ui/icons";
import * as React from "react";

import { ImagePicker } from "@/client/admin/image-picker";
import { useServerAction } from "@/client/admin/use-server-action";
import type { ProjectsData } from "@/client/admin/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input, Label, Textarea } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  deleteProjectAction,
  saveProjectAction,
  toggleProjectPublishedAction,
} from "@/server/actions/admin";
import type { ImageAsset, Project } from "@/server/types";

interface ProjectFormState {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  tags: string;
  repo: string;
  live: string;
  caseStudy: string;
  featured: boolean;
  published: boolean;
  order: number;
  coverImage?: ImageAsset;
  metrics: { label: string; value: string }[];
  seoTitle: string;
  seoDescription: string;
}

const EMPTY: ProjectFormState = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  tags: "",
  repo: "",
  live: "",
  caseStudy: "",
  featured: false,
  published: true,
  order: 0,
  metrics: [],
  seoTitle: "",
  seoDescription: "",
};

function toFormState(project?: Project): ProjectFormState {
  if (!project) return { ...EMPTY };
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    description: project.description,
    tags: project.tags.join(", "),
    repo: project.links.repo ?? "",
    live: project.links.live ?? "",
    caseStudy: project.links.caseStudy ?? "",
    featured: project.featured,
    published: project.published,
    order: project.order,
    coverImage: project.coverImage,
    metrics: project.metrics,
    seoTitle: project.seo.title,
    seoDescription: project.seo.description,
  };
}

export function ProjectsPanel({ data }: { data: ProjectsData }) {
  const { pending, run } = useServerAction();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Project | undefined>();
  const [form, setForm] = React.useState<ProjectFormState>(EMPTY);

  function openEditor(project?: Project) {
    setEditing(project);
    setForm(toFormState(project));
    setOpen(true);
  }

  function update<K extends keyof ProjectFormState>(key: K, value: ProjectFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    const payload = {
      id: form.id,
      title: form.title,
      slug: form.slug || undefined,
      summary: form.summary,
      description: form.description,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      links: {
        repo: form.repo || undefined,
        live: form.live || undefined,
        caseStudy: form.caseStudy || undefined,
      },
      coverImage: form.coverImage,
      gallery: [],
      featured: form.featured,
      published: form.published,
      order: Number(form.order) || 0,
      metrics: form.metrics.filter((metric) => metric.label && metric.value),
      seo: { title: form.seoTitle, description: form.seoDescription },
    };

    run(async () => {
      const result = await saveProjectAction(payload);
      if (result.ok) setOpen(false);
      return result;
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted">
            {data.projects.length} project{data.projects.length === 1 ? "" : "s"}
            {data.demo.projects ? " · showing demo content" : ""}
          </p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="h-4 w-4" /> New project
        </Button>
      </header>

      {data.projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Add your first project to replace the demo content on the site."
          action={<Button onClick={() => openEditor()}>Create a project</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {data.projects.map((project) => (
            <li key={project.id}>
              <Card className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{project.title}</p>
                    {project.featured ? (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                        Featured
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        project.published
                          ? "bg-success/15 text-success"
                          : "bg-surface-2 text-muted"
                      }`}
                    >
                      {project.published ? "Published" : "Draft"}
                    </span>
                    {project.isDummy ? (
                      <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">
                        Demo
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-sm text-muted">{project.summary}</p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={project.published ? "Unpublish" : "Publish"}
                    disabled={pending}
                    onClick={() => run(() => toggleProjectPublishedAction(project.id))}
                  >
                    {project.published ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit project"
                    onClick={() => openEditor(project)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete project"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`Delete “${project.title}”?`)) {
                        run(() => deleteProjectAction(project.id));
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
        title={editing ? "Edit project" : "New project"}
        description="Everything here appears on the portfolio home page."
        width="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={pending}>
              {editing ? "Save changes" : "Create project"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Field label="Title">
            <Input
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Insight Analytics Studio"
            />
          </Field>

          <Field label="Slug" hint="Leave empty to generate from the title.">
            <Input
              value={form.slug}
              onChange={(event) => update("slug", event.target.value)}
              placeholder="insight-analytics-studio"
            />
          </Field>

          <Field label="Summary">
            <Textarea
              className="min-h-20"
              value={form.summary}
              onChange={(event) => update("summary", event.target.value)}
              placeholder="One sentence shown on the project card."
            />
          </Field>

          <Field label="Description" hint="Markdown is supported.">
            <Textarea
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </Field>

          <ImagePicker
            value={form.coverImage}
            onChange={(value) => update("coverImage", value)}
            library={data.media}
            folder="projects"
          />

          <Field label="Tags" hint="Comma separated.">
            <Input
              value={form.tags}
              onChange={(event) => update("tags", event.target.value)}
              placeholder="Next.js, TypeScript, MongoDB"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Repository">
              <Input
                value={form.repo}
                onChange={(event) => update("repo", event.target.value)}
                placeholder="https://github.com/…"
              />
            </Field>
            <Field label="Live URL">
              <Input
                value={form.live}
                onChange={(event) => update("live", event.target.value)}
                placeholder="https://…"
              />
            </Field>
            <Field label="Case study">
              <Input
                value={form.caseStudy}
                onChange={(event) => update("caseStudy", event.target.value)}
                placeholder="https://…"
              />
            </Field>
          </div>

          <div>
            <Label>Impact metrics</Label>
            <div className="space-y-2">
              {form.metrics.map((metric, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={metric.label}
                    placeholder="Label"
                    onChange={(event) => {
                      const metrics = [...form.metrics];
                      metrics[index] = { ...metric, label: event.target.value };
                      update("metrics", metrics);
                    }}
                  />
                  <Input
                    value={metric.value}
                    placeholder="Value"
                    onChange={(event) => {
                      const metrics = [...form.metrics];
                      metrics[index] = { ...metric, value: event.target.value };
                      update("metrics", metrics);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      update(
                        "metrics",
                        form.metrics.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  update("metrics", [...form.metrics, { label: "", value: "" }])
                }
              >
                <Plus className="h-3.5 w-3.5" /> Add metric
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Order">
              <Input
                type="number"
                value={form.order}
                onChange={(event) => update("order", Number(event.target.value) || 0)}
              />
            </Field>
            <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
              <Label className="mb-0">Published</Label>
              <Switch
                checked={form.published}
                onCheckedChange={(value) => update("published", value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
              <Label className="mb-0">Featured</Label>
              <Switch
                checked={form.featured}
                onCheckedChange={(value) => update("featured", value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="SEO title">
              <Input
                value={form.seoTitle}
                onChange={(event) => update("seoTitle", event.target.value)}
              />
            </Field>
            <Field label="SEO description">
              <Input
                value={form.seoDescription}
                onChange={(event) => update("seoDescription", event.target.value)}
              />
            </Field>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
