import * as React from "react";

import { cn } from "@/lib/cn";

export function Alert({
  className,
  tone = "info",
  title,
  children,
  action,
}: {
  className?: string;
  tone?: "info" | "warning" | "danger" | "success";
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const tones = {
    info: "border-line bg-surface-2/60 text-foreground",
    warning: "border-warning/40 bg-warning/10 text-foreground",
    danger: "border-danger/40 bg-danger/10 text-foreground",
    success: "border-success/40 bg-success/10 text-foreground",
  } as const;

  return (
    <div
      role="status"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
        tones[tone],
        className,
      )}
    >
      <div className="min-w-0">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className="text-muted">{children}</div> : null}
      </div>
      {action}
    </div>
  );
}
