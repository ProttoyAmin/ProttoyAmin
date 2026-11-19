/**
 * Accent-colour presets and helpers.
 *
 * Isomorphic: the admin panel uses the presets to build the picker, the
 * server uses them to normalise whatever the owner saved.
 */

export interface AccentPreset {
  id: string;
  label: string;
  /** Base accent applied in both the light and the dark theme. */
  accent: string;
  /** Short description shown under the swatch. */
  hint: string;
}

/**
 * The three themes offered in the admin panel. The owner can also type any
 * hex value — the presets are only shortcuts.
 */
export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: "violet",
    label: "Violet",
    accent: "#6d4aff",
    hint: "The original purple",
  },
  {
    id: "maroon",
    label: "Maroon",
    accent: "#9b1c31",
    hint: "Deep and editorial",
  },
  {
    id: "emerald",
    label: "Emerald",
    accent: "#0f9d58",
    hint: "Calm and technical",
  },
];

export const DEFAULT_ACCENT = ACCENT_PRESETS[0]?.accent ?? "#6d4aff";

const HEX_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** True when the value is a hex colour the browser can parse. */
export function isValidAccent(value: string): boolean {
  return HEX_PATTERN.test(value.trim());
}

/**
 * Returns a usable hex accent.
 *
 * Anything that is not a hex colour falls back to the default, so a bad
 * value in the database can never break the styling of the site.
 */
export function normalizeAccent(value: string | null | undefined): string {
  if (!value) return DEFAULT_ACCENT;
  const trimmed = value.trim();
  if (!isValidAccent(trimmed)) return DEFAULT_ACCENT;
  // Expand the shorthand form so the colour-mix expressions stay consistent.
  if (trimmed.length === 4) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase();
  }
  return trimmed.toLowerCase();
}

/** Finds the preset that matches an accent, if any. */
export function presetForAccent(
  accent: string | null | undefined,
): AccentPreset | undefined {
  const normalized = normalizeAccent(accent);
  return ACCENT_PRESETS.find(
    (preset) => normalizeAccent(preset.accent) === normalized,
  );
}
