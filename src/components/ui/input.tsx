import * as React from "react";

import { cn } from "@/lib/cn";

/**
 * Carries the generated field id from `Field` down to the control, so every
 * label is programmatically associated with its input without the call sites
 * having to invent ids.
 */
const FieldIdContext = React.createContext<string | null>(null);

function useFieldId(explicit?: string): string | undefined {
  const contextId = React.useContext(FieldIdContext);
  return explicit ?? contextId ?? undefined;
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, id, ...props }, ref) => {
  const fieldId = useFieldId(id);
  return (
    <input
      ref={ref}
      id={fieldId}
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-foreground placeholder:text-muted/70 transition-colors",
        "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, id, ...props }, ref) => {
  const fieldId = useFieldId(id);
  return (
    <textarea
      ref={ref}
      id={fieldId}
      className={cn(
        "min-h-32 w-full resize-y rounded-xl border border-line bg-surface px-3.5 py-3 text-sm text-foreground placeholder:text-muted/70 transition-colors",
        "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});
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
  const generatedId = React.useId();
  const hintId = `${generatedId}-hint`;

  return (
    <div className={cn("w-full", className)}>
      <Label htmlFor={generatedId}>{label}</Label>
      <FieldIdContext.Provider value={generatedId}>
        {children}
      </FieldIdContext.Provider>
      {error ? (
        <p id={hintId} className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
