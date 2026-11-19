"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

export interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  reverse?: boolean;
}

/**
 * Infinite horizontal ticker. The track is duplicated so the loop is seamless.
 */
export function Marquee({
  children,
  className,
  duration = 32,
  reverse = false,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "group relative flex w-full overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]",
        className,
      )}
    >
      <div
        className="flex w-max shrink-0 animate-[marquee_var(--marquee-duration)_linear_infinite] items-center gap-3 pr-3 group-hover:[animation-play-state:paused]"
        style={
          {
            "--marquee-duration": `${duration}s`,
            animationDirection: reverse ? "reverse" : "normal",
          } as React.CSSProperties
        }
      >
        {children}
        <span aria-hidden className="contents">
          {children}
        </span>
      </div>
    </div>
  );
}
