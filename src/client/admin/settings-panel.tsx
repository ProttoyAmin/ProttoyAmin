"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppearancePicker } from "@/client/admin/appearance-picker";
import { ImagePicker } from "@/client/admin/image-picker";
import { useUnsavedChanges } from "@/client/admin/unsaved-changes";
import type { SettingsData } from "@/client/admin/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Label, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import {
  saveSettingsAction,
  changePasswordAction,
  transferOwnershipAction,
} from "@/server/actions/admin";
import type { ImageAsset, SiteSettings, SocialLink } from "@/server/types";

export type SettingsSection = "general" | "theme" | "hero" | "security" | "ownership";

type SettingsForm = Omit<
  SiteSettings,
  "id" | "ownerEmail" | "createdAt" | "updatedAt" | "seo"
> & {
  seo: Omit<SiteSettings["seo"], "keywords"> & { keywords: string };
};

function makeForm(settings: SiteSettings): SettingsForm {
  return {
    siteTitle: settings.siteTitle,
    tagline: settings.tagline,
    description: settings.description,
    hero: {
      ...settings.hero,
      primaryBadge: {
        enabled: settings.hero.primaryBadge?.enabled ?? true,
        label: settings.hero.primaryBadge?.label ?? "Currently",
        value: settings.hero.primaryBadge?.value ?? "Building products",
      },
      secondaryBadge: {
        enabled: settings.hero.secondaryBadge?.enabled ?? true,
        label: settings.hero.secondaryBadge?.label ?? "Stack",
        value: settings.hero.secondaryBadge?.value ?? "React · Go · MongoDB",
      },
    },
    socials: settings.socials.map((link) => ({ ...link })) as SocialLink[],
    theme: {
      ...settings.theme,
      fontFamily: settings.theme.fontFamily ?? "manrope",
      fontScale: settings.theme.fontScale ?? "comfortable",
      bubbleStyle: settings.theme.bubbleStyle ?? "pill",
    },
    features: { ...settings.features },
    seo: { ...settings.seo, keywords: settings.seo.keywords.join(", ") },
  };
}

function sectionSnapshot(form: SettingsForm, section: SettingsSection) {
  if (section === "general")
    return {
      siteTitle: form.siteTitle,
      tagline: form.tagline,
      description: form.description,
      socials: form.socials,
      features: form.features,
      seo: form.seo,
    };
  if (section === "theme") return form.theme;
  if (section === "hero") return form.hero;
  return {};
}

const FONT_OPTIONS = [
  { value: "manrope", label: "Manrope", detail: "Clean, modern, humanist" },
  { value: "dm-sans", label: "DM Sans", detail: "Friendly and compact" },
  { value: "space-grotesk", label: "Space Grotesk", detail: "Distinct, technical edge" },
  { value: "inter", label: "Inter", detail: "Neutral and familiar" },
] as const;

const FONT_STACKS: Record<NonNullable<SiteSettings["theme"]["fontFamily"]>, string> = {
  manrope: '"Manrope Variable", ui-sans-serif, system-ui, sans-serif',
  "dm-sans": '"DM Sans Variable", ui-sans-serif, system-ui, sans-serif',
  "space-grotesk": '"Space Grotesk Variable", ui-sans-serif, system-ui, sans-serif',
  inter: '"Inter Variable", ui-sans-serif, system-ui, sans-serif',
};

export function SettingsPanel({
  data,
  section = "general",
}: {
  data: SettingsData;
  section?: SettingsSection;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [form, setForm] = React.useState(() => makeForm(data.settings));
  const [baseline, setBaseline] = React.useState(() => makeForm(data.settings));
  const [pending, setPending] = React.useState(false);
  const [passwords, setPasswords] = React.useState({
    currentPassword: "",
    newPassword: "",
  });
  const [transfer, setTransfer] = React.useState({ email: "", currentPassword: "" });

  const dirty = React.useMemo(
    () =>
      JSON.stringify(sectionSnapshot(form, section)) !==
      JSON.stringify(sectionSnapshot(baseline, section)),
    [form, baseline, section],
  );

  // Apply typography/rounding live in the theme editor; the stored values
  // are still only committed by that page's Save action.
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--site-font",
      FONT_STACKS[form.theme.fontFamily ?? "manrope"],
    );
    root.style.setProperty(
      "--type-scale",
      form.theme.fontScale === "compact"
        ? "0.96"
        : form.theme.fontScale === "spacious"
          ? "1.05"
          : "1",
    );
    root.style.setProperty(
      "--radius",
      form.theme.bubbleStyle === "soft-square"
        ? "10px"
        : form.theme.bubbleStyle === "rounded"
          ? "18px"
          : "24px",
    );
    return () => {
      root.style.removeProperty("--site-font");
      root.style.removeProperty("--type-scale");
      root.style.removeProperty("--radius");
    };
  }, [form.theme.fontFamily, form.theme.fontScale, form.theme.bubbleStyle]);

  const discard = React.useCallback(
    () =>
      setForm({
        ...baseline,
        hero: { ...baseline.hero },
        theme: { ...baseline.theme },
        features: { ...baseline.features },
        socials: baseline.socials.map((item) => ({ ...item })),
        seo: { ...baseline.seo },
      }),
    [baseline],
  );

  const saveSettings = React.useCallback(async () => {
    setPending(true);
    try {
      const result = await saveSettingsAction({
        ...form,
        socials: form.socials.filter((social) => social.platform && social.url),
        seo: {
          ...form.seo,
          keywords: form.seo.keywords
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean),
        },
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not save settings");
        return false;
      }
      // The server action revalidates the cached public content. Use the
      // just-saved local values as baseline while the route refreshes.
      setBaseline({
        ...form,
        hero: { ...form.hero },
        theme: { ...form.theme },
        features: { ...form.features },
        socials: form.socials.map((item) => ({ ...item })),
        seo: { ...form.seo },
      });
      toast.success(result.message ?? "Settings saved");
      router.refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings");
      return false;
    } finally {
      setPending(false);
    }
  }, [form, router]);

  useUnsavedChanges(
    section === "general" || section === "theme" || section === "hero"
      ? { dirty, save: saveSettings, discard }
      : null,
  );

  function setFormValue<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function setHero<K extends keyof SettingsForm["hero"]>(
    key: K,
    value: SettingsForm["hero"][K],
  ) {
    setForm((current) => ({ ...current, hero: { ...current.hero, [key]: value } }));
  }
  function setBadge(
    which: "primaryBadge" | "secondaryBadge",
    key: "enabled" | "label" | "value",
    value: boolean | string,
  ) {
    const badge = form.hero[which]!;
    setHero(which, { ...badge, [key]: value } as NonNullable<
      SettingsForm["hero"][typeof which]
    >);
  }
  function setTheme<K extends keyof SettingsForm["theme"]>(
    key: K,
    value: SettingsForm["theme"][K],
  ) {
    setForm((current) => ({ ...current, theme: { ...current.theme, [key]: value } }));
  }
  function setSeo<K extends keyof SettingsForm["seo"]>(
    key: K,
    value: SettingsForm["seo"][K],
  ) {
    setForm((current) => ({ ...current, seo: { ...current.seo, [key]: value } }));
  }
  function setPortrait(value: ImageAsset | undefined) {
    setHero("portraitUrl", value?.url ?? "");
    if (value?.alt) setHero("portraitAlt", value.alt);
  }

  const title =
    section === "general"
      ? "General settings"
      : section === "theme"
        ? "Appearance · Theme"
        : section === "hero"
          ? "Appearance · Hero"
          : section === "security"
            ? "Password & security"
            : "Ownership";
  const description =
    section === "general"
      ? "Site identity, links, features and search details."
      : section === "theme"
        ? "Set the visual voice: colour, typography and the hero-bubble shape."
        : section === "hero"
          ? "Shape the first impression: words, portrait and floating detail cards."
          : section === "security"
            ? "Update the password that protects your admin account."
            : "Manage who owns and can access this portfolio.";

  return (
    <div className="space-y-6 pb-24">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">{description}</p>
      </header>
      <nav
        aria-label="Settings pages"
        className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-line bg-surface/50 p-1.5"
      >
        <SettingsNavLink href="/admin/settings" active={pathname === "/admin/settings"}>
          General
        </SettingsNavLink>
        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-line/70 px-1 py-1">
          <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Appearance
          </span>
          <SettingsNavLink
            href="/admin/settings/appearance/theme"
            active={pathname.startsWith("/admin/settings/appearance/theme")}
          >
            Theme
          </SettingsNavLink>
          <SettingsNavLink
            href="/admin/settings/appearance/hero"
            active={pathname.startsWith("/admin/settings/appearance/hero")}
          >
            Hero
          </SettingsNavLink>
        </div>
        <SettingsNavLink
          href="/admin/settings/security"
          active={pathname.startsWith("/admin/settings/security")}
        >
          Password &amp; security
        </SettingsNavLink>
        <SettingsNavLink
          href="/admin/settings/ownership"
          active={pathname.startsWith("/admin/settings/ownership")}
        >
          Ownership
        </SettingsNavLink>
      </nav>

      {section === "general" ? (
        <>
          <Card className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Site identity</h2>
              <p className="mt-1 text-sm text-muted">
                The name and short introduction visitors see.
              </p>
            </div>
            <Field label="Site title">
              <Input
                value={form.siteTitle}
                onChange={(e) => setFormValue("siteTitle", e.target.value)}
              />
            </Field>
            <Field label="Tagline">
              <Input
                value={form.tagline}
                onChange={(e) => setFormValue("tagline", e.target.value)}
              />
            </Field>
            <Field
              label="Description"
              hint="Used for search previews and the About section."
            >
              <Textarea
                className="min-h-24"
                value={form.description}
                onChange={(e) => setFormValue("description", e.target.value)}
              />
            </Field>
          </Card>
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Social links</h2>
                <p className="mt-1 text-sm text-muted">
                  Show the links that help people find you.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormValue("socials", [
                    ...form.socials,
                    { platform: "github", label: "GitHub", url: "" },
                  ])
                }
              >
                <span aria-hidden>＋</span> Add link
              </Button>
            </div>
            {form.socials.map((social, index) => (
              <div
                key={`${social.platform}-${index}`}
                className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[1fr_1fr_2fr_auto]"
              >
                <Input
                  aria-label="Platform"
                  value={social.platform}
                  placeholder="Platform"
                  onChange={(e) => {
                    const socials = [...form.socials];
                    socials[index] = { ...social, platform: e.target.value };
                    setFormValue("socials", socials);
                  }}
                />
                <Input
                  aria-label="Link label"
                  value={social.label}
                  placeholder="Label"
                  onChange={(e) => {
                    const socials = [...form.socials];
                    socials[index] = { ...social, label: e.target.value };
                    setFormValue("socials", socials);
                  }}
                />
                <Input
                  aria-label="Link URL"
                  value={social.url}
                  placeholder="https:// or mailto:"
                  onChange={(e) => {
                    const socials = [...form.socials];
                    socials[index] = { ...social, url: e.target.value };
                    setFormValue("socials", socials);
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Remove link"
                  onClick={() =>
                    setFormValue(
                      "socials",
                      form.socials.filter((_, i) => i !== index),
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            ))}
          </Card>
          <Card className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Features & search</h2>
              <p className="mt-1 text-sm text-muted">
                Control sections and basic search metadata.
              </p>
            </div>
            {(
              [
                ["contactEnabled", "Contact form enabled"],
                ["writingEnabled", "Writing section enabled"],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-line px-4 py-3"
              >
                <span className="text-sm">{label}</span>
                <Switch
                  checked={form.features[key]}
                  onCheckedChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      features: { ...current.features, [key]: value },
                    }))
                  }
                />
              </div>
            ))}
            <Field label="Keywords" hint="Comma separated.">
              <Input
                value={form.seo.keywords}
                onChange={(e) => setSeo("keywords", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Author name">
                <Input
                  value={form.seo.author}
                  onChange={(e) => setSeo("author", e.target.value)}
                />
              </Field>
              <Field label="Location">
                <Input
                  value={form.seo.location}
                  onChange={(e) => setSeo("location", e.target.value)}
                />
              </Field>
            </div>
          </Card>
          <SaveButton pending={pending} onClick={saveSettings} />
        </>
      ) : null}

      {section === "theme" ? (
        <>
          <Card className="space-y-6">
            <div>
              <h2 className="text-base font-semibold">Typography</h2>
              <p className="mt-1 text-sm text-muted">
                Choose a font with a better personality and set the overall reading size.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {FONT_OPTIONS.map((font) => (
                <button
                  type="button"
                  key={font.value}
                  aria-pressed={form.theme.fontFamily === font.value}
                  onClick={() => setTheme("fontFamily", font.value)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-colors",
                    form.theme.fontFamily === font.value
                      ? "border-accent bg-accent-soft"
                      : "border-line hover:bg-surface-2",
                  )}
                >
                  <span
                    className="block text-base font-semibold"
                    style={{ fontFamily: FONT_STACKS[font.value] }}
                  >
                    {font.label}
                  </span>
                  <span className="mt-1 block text-xs text-muted">{font.detail}</span>
                  <span
                    className="mt-3 block text-xl"
                    style={{ fontFamily: FONT_STACKS[font.value] }}
                  >
                    Aa Bb Cc 123
                  </span>
                </button>
              ))}
            </div>
            <Field
              label="Reading size"
              hint="Affects body copy and most text across the public site."
            >
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["compact", "Compact"],
                    ["comfortable", "Comfortable"],
                    ["spacious", "Spacious"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={form.theme.fontScale === value}
                    onClick={() => setTheme("fontScale", value)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-sm",
                      form.theme.fontScale === value
                        ? "border-accent bg-accent-soft"
                        : "border-line text-muted",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Field>
          </Card>
          <Card className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">Colour & shape</h2>
              <p className="mt-1 text-sm text-muted">
                Accent colour applies in both light and dark modes. Roundedness controls
                the floating hero cards and the site&apos;s shape language.
              </p>
            </div>
            <Field label="Default colour mode">
              <div className="flex gap-2">
                {(["dark", "light"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={form.theme.default === mode}
                    onClick={() => setTheme("default", mode)}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-sm capitalize",
                      form.theme.default === mode
                        ? "border-accent bg-accent-soft"
                        : "border-line text-muted",
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </Field>
            <AppearancePicker
              accent={form.theme.accent}
              onChange={(accent) => setTheme("accent", accent)}
            />
            <Field
              label="Floating card shape"
              hint="This controls the two information bubbles on the hero image."
            >
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ["rounded", "Rounded", "rounded-2xl"],
                    ["pill", "Pill", "rounded-full"],
                    ["soft-square", "Soft square", "rounded-lg"],
                  ] as const
                ).map(([value, label, shape]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={form.theme.bubbleStyle === value}
                    onClick={() => setTheme("bubbleStyle", value)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-sm",
                      form.theme.bubbleStyle === value
                        ? "border-accent bg-accent-soft"
                        : "border-line text-muted",
                    )}
                  >
                    <span
                      className={cn("h-8 w-12 border border-current bg-surface-2", shape)}
                    />
                    {label}
                  </button>
                ))}
              </div>
            </Field>
          </Card>
          <SaveButton pending={pending} onClick={saveSettings} />
        </>
      ) : null}

      {section === "hero" ? (
        <>
          <Card className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">First impression</h2>
              <p className="mt-1 text-sm text-muted">
                Keep the message clear, specific and easy to scan.
              </p>
            </div>
            <Field label="Greeting">
              <Input
                value={form.hero.greeting}
                onChange={(e) => setHero("greeting", e.target.value)}
              />
            </Field>
            <Field label="Headline" hint="A concise statement of what you do.">
              <Textarea
                className="min-h-24 text-lg"
                value={form.hero.headline}
                onChange={(e) => setHero("headline", e.target.value)}
              />
            </Field>
            <Field label="Supporting text">
              <Textarea
                className="min-h-24"
                value={form.hero.subheadline}
                onChange={(e) => setHero("subheadline", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Primary button label">
                <Input
                  value={form.hero.ctaLabel}
                  onChange={(e) => setHero("ctaLabel", e.target.value)}
                />
              </Field>
              <Field label="Primary button link">
                <Input
                  value={form.hero.ctaHref}
                  onChange={(e) => setHero("ctaHref", e.target.value)}
                />
              </Field>
              <Field label="Secondary button label">
                <Input
                  value={form.hero.secondaryCtaLabel}
                  onChange={(e) => setHero("secondaryCtaLabel", e.target.value)}
                />
              </Field>
              <Field label="Secondary button link">
                <Input
                  value={form.hero.secondaryCtaHref}
                  onChange={(e) => setHero("secondaryCtaHref", e.target.value)}
                />
              </Field>
            </div>
          </Card>
          <Card className="space-y-4">
            <div>
              <h2 className="text-base font-semibold">Portrait</h2>
              <p className="mt-1 text-sm text-muted">
                Upload a new profile image or choose one from the media library.
              </p>
            </div>
            <ImagePicker
              label="Profile picture"
              value={
                form.hero.portraitUrl
                  ? { url: form.hero.portraitUrl, alt: form.hero.portraitAlt }
                  : undefined
              }
              onChange={setPortrait}
              library={data.media}
              folder="profile"
            />
            <Field label="Image description">
              <Input
                value={form.hero.portraitAlt}
                onChange={(e) => setHero("portraitAlt", e.target.value)}
              />
            </Field>
          </Card>
          <Card className="space-y-5">
            <div>
              <h2 className="text-base font-semibold">Floating information cards</h2>
              <p className="mt-1 text-sm text-muted">
                These rounded cards sit over the portrait. Edit their copy or turn either
                off.
              </p>
            </div>
            {(
              [
                ["primaryBadge", "Card one"],
                ["secondaryBadge", "Card two"],
              ] as const
            ).map(([which, label]) => {
              const badge = form.hero[which]!;
              return (
                <div key={which} className="space-y-3 rounded-2xl border border-line p-4">
                  <div className="flex items-center justify-between">
                    <Label className="mb-0">{label}</Label>
                    <Switch
                      checked={badge.enabled}
                      onCheckedChange={(value) => setBadge(which, "enabled", value)}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Small label">
                      <Input
                        value={badge.label}
                        onChange={(e) => setBadge(which, "label", e.target.value)}
                      />
                    </Field>
                    <Field label="Main text">
                      <Input
                        value={badge.value}
                        onChange={(e) => setBadge(which, "value", e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              );
            })}
          </Card>
          <SaveButton pending={pending} onClick={saveSettings} />
        </>
      ) : null}

      {section === "security" ? (
        <Card className="space-y-5">
          <div>
            <h2 className="text-base font-semibold">Change password</h2>
            <p className="mt-1 text-sm text-muted">
              Use a unique password with at least 10 characters, mixed case and a number.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Current password">
              <Input
                type="password"
                autoComplete="current-password"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords((current) => ({
                    ...current,
                    currentPassword: e.target.value,
                  }))
                }
              />
            </Field>
            <Field label="New password">
              <Input
                type="password"
                autoComplete="new-password"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords((current) => ({ ...current, newPassword: e.target.value }))
                }
              />
            </Field>
          </div>
          <Button
            disabled={pending || !passwords.currentPassword || !passwords.newPassword}
            onClick={async () => {
              setPending(true);
              const result = await changePasswordAction(passwords);
              setPending(false);
              if (result.ok) {
                setPasswords({ currentPassword: "", newPassword: "" });
                toast.success(result.message ?? "Password updated");
              } else toast.error(result.error ?? "Could not update password");
            }}
          >
            {pending ? "Updating…" : "Update password"}
          </Button>
        </Card>
      ) : null}

      {section === "ownership" ? (
        <Card className="space-y-5">
          <div>
            <h2 className="text-base font-semibold">Transfer ownership</h2>
            <p className="mt-1 text-sm text-muted">
              The owner email is the only account allowed into this panel. Current owner:{" "}
              <strong className="text-foreground">{data.owner.email}</strong>.
              Transferring ownership signs you out.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New owner email">
              <Input
                type="email"
                value={transfer.email}
                onChange={(e) =>
                  setTransfer((current) => ({ ...current, email: e.target.value }))
                }
              />
            </Field>
            <Field label="Confirm with your password">
              <Input
                type="password"
                autoComplete="current-password"
                value={transfer.currentPassword}
                onChange={(e) =>
                  setTransfer((current) => ({
                    ...current,
                    currentPassword: e.target.value,
                  }))
                }
              />
            </Field>
          </div>
          <Button
            variant="outline"
            disabled={pending || !transfer.email || !transfer.currentPassword}
            onClick={async () => {
              setPending(true);
              const result = await transferOwnershipAction(transfer);
              setPending(false);
              if (result.ok) {
                toast.success(result.message ?? "Ownership transferred");
                router.replace("/admin/login");
              } else toast.error(result.error ?? "Could not transfer ownership");
            }}
          >
            {pending ? "Transferring…" : "Transfer ownership"}
          </Button>
        </Card>
      ) : null}
    </div>
  );
}

function SettingsNavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
        active
          ? "bg-accent text-white"
          : "text-muted hover:bg-surface-2 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function SaveButton({
  pending,
  onClick,
}: {
  pending: boolean;
  onClick: () => Promise<boolean>;
}) {
  return (
    <div className="flex justify-end">
      <Button disabled={pending} onClick={() => void onClick()}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}
