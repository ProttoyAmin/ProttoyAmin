import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-white shadow-[0_8px_30px_-12px_var(--accent)] hover:brightness-110",
        secondary: "bg-surface-2 text-foreground hover:bg-line/60",
        outline: "border border-line bg-transparent hover:bg-surface",
        ghost: "bg-transparent text-muted hover:bg-surface-2 hover:text-foreground",
        danger: "bg-danger text-white hover:brightness-110",
        link: "bg-transparent text-accent underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
