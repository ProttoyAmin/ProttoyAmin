import * as React from "react";

import { cn } from "@/lib/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-foreground placeholder:text-muted/70 transition-colors",
      "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-32 w-full resize-y rounded-xl border border-line bg-surface px-3.5 py-3 text-sm text-foreground placeholder:text-muted/70 transition-colors",
      "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted",
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}

export interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("w-full", className)}>
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
