import * as React from "react";

import { cn } from "@/lib/cn";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "accent" | "success" | "danger" | "outline";
}) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    accent: "bg-accent-soft text-accent",
    success: "bg-success/15 text-success",
    danger: "bg-danger/15 text-danger",
    outline: "border border-line text-muted",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
