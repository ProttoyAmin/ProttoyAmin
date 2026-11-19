"use client";

import * as React from "react";

import { formatDate, formatRelativeTime } from "@/lib/format";

/**
 * Renders a relative timestamp ("3m ago").
 *
 * The server cannot know how much time will pass before the client
 * hydrates, so rendering `Date.now()` on both sides produced a hydration
 * mismatch whenever the two disagreed. The absolute date is rendered first
 * — identical on both sides — and the relative label is swapped in after
 * mount. It then refreshes itself every 30 seconds.
 */
export function RelativeTime({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [label, setLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    const update = () => setLabel(formatRelativeTime(value));
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, [value]);

  return (
    <span className={className} suppressHydrationWarning>
      {label ?? formatDate(value)}
    </span>
  );
}
