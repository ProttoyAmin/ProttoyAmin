"use client";

import { KeyRound, Plus, Shield, Trash2 } from "lucide-react";
import * as React from "react";

import { useServerAction } from "@/client/admin/use-server-action";
import type { AdminData } from "@/client/admin/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Label, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  changePasswordAction,
  saveSettingsAction,
  transferOwnershipAction,
} from "@/server/actions/admin";
import type { SocialLink } from "@/server/types";

export function SettingsPanel({ data }: { data: AdminData }) {
  const { pending, run } = useServerAction();
  const settings = data.settings;

  const [form, setForm] = React.useState({
    siteTitle: settings.siteTitle,
    tagline: settings.tagline,
    description: settings.description,
    hero: { ...settings.hero },
    socials: [...settings.socials] as SocialLink[],
    theme: { ...settings.theme },
    features: { ...settings.features },
    seo: { ...settings.seo, keywords: settings.seo.keywords.join(", ") },
  });

  const [passwords, setPasswords] = React.useState({
    currentPassword: "",
    newPassword: "",
  });

  const [transfer, setTransfer] = React.useState({
    email: "",
    currentPassword: "",
  });

  function setHero<K extends keyof typeof form.hero>(
    key: K,
    value: (typeof form.hero)[K],
  ) {
    setForm((current) => ({ ...current, hero: { ...current.hero, [key]: value } }));
  }

  function setSeo<K extends keyof typeof form.seo>(
    key: K,
    value: (typeof form.seo)[K],
  ) {
    setForm((current) => ({ ...current, seo: { ...current.seo, [key]: value } }));
  }

  function save() {
    run(async () => {
      const result = await saveSettingsAction({
        siteTitle: form.siteTitle,
        tagline: form.tagline,
        description: form.description,
        hero: form.hero,
        socials: form.socials.filter((social) => social.platform && social.url),
        theme: form.theme,
        features: form.features,
        seo: {
          ogImageUrl: form.seo.ogImageUrl,
          keywords: form.seo.keywords
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean),
          author: form.seo.author,
          location: form.seo.location,
        },
      });
      return result;
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted">
            Site copy, links, theme and account security.
          </p>
        </div>
        <Button onClick={save} disabled={pending}>
          Save settings
        </Button>
      </header>

      <Card className="space-y-4">
        <Label>General</Label>
        <Field label="Site title">
          <Input
            value={form.siteTitle}
            onChange={(event) =>
              setForm((current) => ({ ...current, siteTitle: event.target.value }))
            }
          />
        </Field>
        <Field label="Tagline">
          <Input
            value={form.tagline}
            onChange={(event) =>
              setForm((current) => ({ ...current, tagline: event.target.value }))
            }
          />
        </Field>
        <Field label="Description" hint="Used for SEO and the About section.">
          <Textarea
            className="min-h-20"
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
        </Field>
      </Card>

      <Card className="space-y-4">
        <Label>Hero</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Greeting">
            <Input
              value={form.hero.greeting}
              onChange={(event) => setHero("greeting", event.target.value)}
            />
          </Field>
          <Field label="Headline">
            <Input
              value={form.hero.headline}
              onChange={(event) => setHero("headline", event.target.value)}
            />
          </Field>
        </div>
        <Field label="Subheadline">
          <Textarea
            className="min-h-20"
            value={form.hero.subheadline}
            onChange={(event) => setHero("subheadline", event.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Primary button label">
            <Input
              value={form.hero.ctaLabel}
              onChange={(event) => setHero("ctaLabel", event.target.value)}
            />
          </Field>
          <Field label="Primary button link">
            <Input
              value={form.hero.ctaHref}
              onChange={(event) => setHero("ctaHref", event.target.value)}
            />
          </Field>
          <Field label="Secondary button label">
            <Input
              value={form.hero.secondaryCtaLabel}
              onChange={(event) =>
                setHero("secondaryCtaLabel", event.target.value)
              }
            />
          </Field>
          <Field label="Secondary button link">
            <Input
              value={form.hero.secondaryCtaHref}
              onChange={(event) =>
                setHero("secondaryCtaHref", event.target.value)
              }
            />
          </Field>
        </div>
        <Field label="Portrait URL">
          <Input
            value={form.hero.portraitUrl}
            onChange={(event) => setHero("portraitUrl", event.target.value)}
          />
        </Field>
        <Field label="Portrait alt text">
          <Input
            value={form.hero.portraitAlt}
            onChange={(event) => setHero("portraitAlt", event.target.value)}
          />
        </Field>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Social links</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setForm((current) => ({
                ...current,
                socials: [
                  ...current.socials,
                  { platform: "github", label: "GitHub", url: "" },
                ],
              }))
            }
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>

        {form.socials.map((social, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
            <Input
              value={social.platform}
              placeholder="platform"
              onChange={(event) => {
                const socials = [...form.socials];
                socials[index] = { ...social, platform: event.target.value };
                setForm((current) => ({ ...current, socials }));
              }}
            />
            <Input
              value={social.label}
              placeholder="label"
              onChange={(event) => {
                const socials = [...form.socials];
                socials[index] = { ...social, label: event.target.value };
                setForm((current) => ({ ...current, socials }));
              }}
            />
            <Input
              value={social.url}
              placeholder="https://"
              onChange={(event) => {
                const socials = [...form.socials];
                socials[index] = { ...social, url: event.target.value };
                setForm((current) => ({ ...current, socials }));
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove link"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  socials: current.socials.filter((_, i) => i !== index),
                }))
              }
            >
              <Trash2 className="h-4 w-4 text-danger" />
            </Button>
          </div>
        ))}
      </Card>

      <Card className="space-y-4">
        <Label>Theme &amp; features</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Default theme">
            <Input
              value={form.theme.default}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  theme: { ...current.theme, default: event.target.value as "dark" | "light" },
                }))
              }
            />
          </Field>
          <Field label="Accent colour">
            <Input
              value={form.theme.accent}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  theme: { ...current.theme, accent: event.target.value },
                }))
              }
            />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
          <span className="text-sm">Contact form enabled</span>
          <Switch
            checked={form.features.contactEnabled}
            onCheckedChange={(value) =>
              setForm((current) => ({
                ...current,
                features: { ...current.features, contactEnabled: value },
              }))
            }
          />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-line px-4 py-3">
          <span className="text-sm">Writing section enabled</span>
          <Switch
            checked={form.features.writingEnabled}
            onCheckedChange={(value) =>
              setForm((current) => ({
                ...current,
                features: { ...current.features, writingEnabled: value },
              }))
            }
          />
        </div>

        <Field label="Keywords" hint="Comma separated.">
          <Input
            value={form.seo.keywords}
            onChange={(event) => setSeo("keywords", event.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Author name">
            <Input
              value={form.seo.author}
              onChange={(event) => setSeo("author", event.target.value)}
            />
          </Field>
          <Field label="Location">
            <Input
              value={form.seo.location}
              onChange={(event) => setSeo("location", event.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-accent" />
          <Label className="mb-0">Change password</Label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Current password">
            <Input
              type="password"
              autoComplete="current-password"
              value={passwords.currentPassword}
              onChange={(event) =>
                setPasswords((current) => ({
                  ...current,
                  currentPassword: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="New password" hint="10+ characters, mixed case and a number.">
            <Input
              type="password"
              autoComplete="new-password"
              value={passwords.newPassword}
              onChange={(event) =>
                setPasswords((current) => ({
                  ...current,
                  newPassword: event.target.value,
                }))
              }
            />
          </Field>
        </div>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const result = await changePasswordAction(passwords);
              if (result.ok) setPasswords({ currentPassword: "", newPassword: "" });
              return result;
            })
          }
        >
          Update password
        </Button>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent" />
          <Label className="mb-0">Ownership</Label>
        </div>
        <p className="text-sm text-muted">
          The owner email is the only account allowed into this panel. Current
          owner: <strong className="text-foreground">{data.owner.email}</strong>.
          Transferring ownership signs you out.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New owner email">
            <Input
              type="email"
              value={transfer.email}
              onChange={(event) =>
                setTransfer((current) => ({ ...current, email: event.target.value }))
              }
            />
          </Field>
          <Field label="Confirm with your password">
            <Input
              type="password"
              autoComplete="current-password"
              value={transfer.currentPassword}
              onChange={(event) =>
                setTransfer((current) => ({
                  ...current,
                  currentPassword: event.target.value,
                }))
              }
            />
          </Field>
        </div>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const result = await transferOwnershipAction(transfer);
              if (result.ok) setTransfer({ email: "", currentPassword: "" });
              return result;
            })
          }
        >
          Transfer ownership
        </Button>
      </Card>
    </div>
  );
}
