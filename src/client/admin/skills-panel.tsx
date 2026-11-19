"use client";

import { Pencil, Plus, Trash2 } from "@/components/ui/icons";
import * as React from "react";

import { useServerAction } from "@/client/admin/use-server-action";
import type { SkillsData } from "@/client/admin/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { deleteSkillAction, saveSkillAction } from "@/server/actions/admin";
import type { Skill } from "@/server/types";

interface SkillForm {
  id?: string;
  name: string;
  category: string;
  icon: string;
  proficiency: number;
  published: boolean;
  order: number;
}

const EMPTY: SkillForm = {
  name: "",
  category: "Frontend",
  icon: "",
  proficiency: 4,
  published: true,
  order: 0,
};

export function SkillsPanel({ data }: { data: SkillsData }) {
  const { pending, run } = useServerAction();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<SkillForm>(EMPTY);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    data.skills.forEach((skill) => set.add(skill.category));
    return [...set];
  }, [data.skills]);

  function openEditor(skill?: Skill) {
    setForm(
      skill
        ? {
            id: skill.id,
            name: skill.name,
            category: skill.category,
            icon: skill.icon ?? "",
            proficiency: skill.proficiency ?? 4,
            published: skill.published,
            order: skill.order,
          }
        : { ...EMPTY, category: categories[0] ?? "Frontend" },
    );
    setOpen(true);
  }

  function update<K extends keyof SkillForm>(key: K, value: SkillForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    run(async () => {
      const result = await saveSkillAction({
        id: form.id,
        name: form.name,
        category: form.category,
        icon: form.icon || undefined,
        proficiency: form.proficiency,
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
          <h1 className="text-2xl font-semibold tracking-tight">Skills</h1>
          <p className="mt-1 text-sm text-muted">
            Grouped by category on the portfolio home page.
          </p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="h-4 w-4" /> New skill
        </Button>
      </header>

      {data.skills.length === 0 ? (
        <EmptyState
          title="No skills yet"
          description="Add the tools you want to highlight."
          action={<Button onClick={() => openEditor()}>Add a skill</Button>}
        />
      ) : (
        <ul className="space-y-2">
          {data.skills.map((skill) => (
            <li key={skill.id}>
              <Card className="flex items-center gap-3 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-base">
                  {skill.icon ?? "•"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{skill.name}</p>
                  <p className="truncate text-xs text-muted">{skill.category}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit skill"
                    onClick={() => openEditor(skill)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete skill"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`Remove ${skill.name}?`)) {
                        run(() => deleteSkillAction(skill.id));
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
        title={form.id ? "Edit skill" : "New skill"}
        width="max-w-md"
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
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="TypeScript"
            />
          </Field>
          <Field label="Category">
            <Input
              value={form.category}
              list="skill-categories"
              onChange={(event) => update("category", event.target.value)}
            />
            <datalist id="skill-categories">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </Field>
          <Field label="Icon" hint="An emoji works nicely.">
            <Input
              value={form.icon}
              onChange={(event) => update("icon", event.target.value)}
              placeholder="⚛️"
            />
          </Field>
          <Field label="Proficiency">
            <Input
              type="number"
              min={1}
              max={5}
              value={form.proficiency}
              onChange={(event) => update("proficiency", Number(event.target.value) || 1)}
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
      </Sheet>
    </div>
  );
}
