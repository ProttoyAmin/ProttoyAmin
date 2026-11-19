"use client";

import { Check } from "lucide-react";
import * as React from "react";

import { Field, Input } from "@/components/ui/input";
import { ACCENT_PRESETS, isValidAccent } from "@/lib/theme";
import { cn } from "@/lib/cn";

/**
 * Picks the accent colour used across the whole site.
 *
 * Three presets are offered as shortcuts; the owner can also type any hex
 * value. The chosen colour is applied as a CSS variable, so it drives the
 * light *and* the dark theme (the shades are derived automatically).
 */
export function AppearancePicker({
  accent,
  onChange,
}: {
  accent: string;
  onChange: (value: string) => void;
}) {
  const [custom, setCustom] = React.useState(accent);
  const [lastAccent, setLastAccent] = React.useState(accent);
  const active = accent.trim().toLowerCase();

  // Keep the text field in sync when the value changes elsewhere (e.g. a
  // preset was clicked). Adjusting during render avoids an extra pass.
  if (accent !== lastAccent) {
    setLastAccent(accent);
    setCustom(accent);
  }

  const customValid = isValidAccent(custom);

  // Apply the colour to the live document so the owner sees the result
  // immediately, before saving. The server-rendered value wins once the
  // page is reloaded or the settings are saved.
  React.useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.getPropertyValue("--accent-base");
    root.style.setProperty("--accent-base", accent);

    return () => {
      if (previous) root.style.setProperty("--accent-base", previous);
      else root.style.removeProperty("--accent-base");
    };
  }, [accent]);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted">
          Theme
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {ACCENT_PRESETS.map((preset) => {
            const selected = active === preset.accent.toLowerCase();
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onChange(preset.accent)}
                aria-pressed={selected}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                  selected
                    ? "border-accent bg-accent-soft"
                    : "border-line hover:border-accent/50",
                )}
              >
                <span
                  aria-hidden
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                  style={{ backgroundColor: preset.accent }}
                >
                  {selected ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {preset.label}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {preset.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Field
        label="Custom accent"
        hint={
          customValid
            ? "Any hex colour — used in both the light and the dark theme."
            : "Use a hex colour like #6d4aff."
        }
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-11 w-11 shrink-0 rounded-xl border border-line"
            style={{ backgroundColor: customValid ? custom : "transparent" }}
          />
          <Input
            value={custom}
            placeholder="#6d4aff"
            onChange={(event) => {
              setCustom(event.target.value);
              if (isValidAccent(event.target.value)) {
                onChange(event.target.value.trim().toLowerCase());
              }
            }}
            onBlur={() => {
              if (!customValid) setCustom(accent);
            }}
            aria-invalid={!customValid}
          />
        </div>
      </Field>

      <div className="rounded-xl border border-line p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
          Preview
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="inline-flex h-9 items-center rounded-xl px-4 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Accent button
          </span>
          <span className="text-sm" style={{ color: "var(--accent)" }}>
            Accent text
          </span>
          <span
            className="inline-flex h-9 items-center rounded-xl border px-4 text-sm"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
          >
            Accent outline
          </span>
        </div>
      </div>
    </div>
  );
}
