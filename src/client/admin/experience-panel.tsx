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
import {
  deleteExperienceAction,
  saveExperienceAction,
} from "@/server/actions/admin";
import { formatDateRange } from "@/lib/format";
import type { Experience, ImageAsset } from "@/server/types";

interface ExperienceForm {
  id?: string;
  company: string;
  role: string;
  employmentType: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  technologies: string;
  published: boolean;
  order: number;
  logo?: ImageAsset;
}

const EMPTY: ExperienceForm = {
  company: "",
  role: "",
  employmentType: "Full-time",
  location: "",
  startDate: "",
  endDate: "",
  description: "",
  technologies: "",
  published: true,
  order: 0,
};

function toForm(experience?: Experience): ExperienceForm {
  if (!experience) return { ...EMPTY };
  return {
    id: experience.id,
    company: experience.company,
    role: experience.role,
    employmentType: experience.employmentType ?? "",
    location: experience.location ?? "",
    startDate: experience.startDate,
    endDate: experience.endDate ?? "",
    description: experience.description.join("\n"),
    technologies: experience.technologies.join(", "),
    published: experience.published,
    order: experience.order,
    logo: experience.logo,
  };
}

export function ExperiencePanel({ data }: { data: AdminData }) {
  const { pending, run } = useServerAction();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<ExperienceForm>(EMPTY);

  function openEditor(experience?: Experience) {
    setForm(toForm(experience));
    setOpen(true);
  }

  function update<K extends keyof ExperienceForm>(
    key: K,
    value: ExperienceForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    run(async () => {
      const result = await saveExperienceAction({
        id: form.id,
        company: form.company,
        role: form.role,
        employmentType: form.employmentType || undefined,
        location: form.location || undefined,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        description: form.description
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        technologies: form.technologies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        logo: form.logo,
        published: form.published,
        order: Number(form.order) || 0,
      });
      if (result.ok) setOpen(false);
      return result;
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Experience</h1>
          <p className="mt-1 text-sm text-muted">
            The timeline on the portfolio home page.
          </p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="h-4 w-4" /> New role
        </Button>
      </header>

      {data.experiences.length === 0 ? (
        <EmptyState
          title="No experience entries"
          description="Add the roles you want to show on the timeline."
          action={<Button onClick={() => openEditor()}>Add a role</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {data.experiences.map((experience) => (
            <li key={experience.id}>
              <Card className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {experience.role} · {experience.company}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {formatDateRange(experience.startDate, experience.endDate)}
                    {experience.location ? ` · ${experience.location}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit role"
                    onClick={() => openEditor(experience)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete role"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`Delete the ${experience.role} entry?`)) {
                        run(() => deleteExperienceAction(experience.id));
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
        title={form.id ? "Edit role" : "New role"}
        width="max-w-xl"
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company">
              <Input
                value={form.company}
                onChange={(event) => update("company", event.target.value)}
              />
            </Field>
            <Field label="Role">
              <Input
                value={form.role}
                onChange={(event) => update("role", event.target.value)}
              />
            </Field>
            <Field label="Employment type">
              <Input
                value={form.employmentType}
                onChange={(event) =>
                  update("employmentType", event.target.value)
                }
                placeholder="Full-time"
              />
            </Field>
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(event) => update("location", event.target.value)}
              />
            </Field>
            <Field label="Start date">
              <Input
                type="month"
                value={form.startDate}
                onChange={(event) => update("startDate", event.target.value)}
              />
            </Field>
            <Field label="End date" hint="Leave empty for the current role.">
              <Input
                type="month"
                value={form.endDate}
                onChange={(event) => update("endDate", event.target.value)}
              />
            </Field>
          </div>

          <Field label="Highlights" hint="One bullet per line.">
            <Textarea
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </Field>

          <Field label="Technologies" hint="Comma separated.">
            <Input
              value={form.technologies}
              onChange={(event) => update("technologies", event.target.value)}
              placeholder="React, TypeScript, MongoDB"
            />
          </Field>

          <ImagePicker
            value={form.logo}
            onChange={(value) => update("logo", value)}
            library={data.media}
            folder="profile"
            label="Logo"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Order">
              <Input
                type="number"
                value={form.order}
                onChange={(event) =>
                  update("order", Number(event.target.value) || 0)
                }
              />
            </Field>
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
        </div>
      </Sheet>
    </div>
  );
}
