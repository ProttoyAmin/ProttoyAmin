/**
 * Presentation helpers shared by server and client components.
 */

export function formatDateRange(
  start?: string | null,
  end?: string | null,
): string {
  const startLabel = start ? formatMonthYear(start) : "";
  const endLabel = end ? formatMonthYear(end) : "Present";
  if (!startLabel) return endLabel;
  return `${startLabel} — ${endLabel}`;
}

export function formatMonthYear(value: string): string {
  const date = parseFlexibleDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? parseFlexibleDate(value) : value;
  if (!date) return String(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatRelativeTime(value: string | Date): string {
  const date = typeof value === "string" ? parseFlexibleDate(value) : value;
  if (!date) return "";

  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;

  return formatDate(date);
}

/** Parses "YYYY-MM", ISO strings and Date instances into a Date. */
export function parseFlexibleDate(value: string | Date): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    const [year, month] = trimmed.split("-");
    const y = Number(year);
    const m = Number(month);
    if (!y || !m) return null;
    return new Date(Date.UTC(y, m - 1, 1));
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Rough reading time in minutes for markdown-ish text. */
export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
