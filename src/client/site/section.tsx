"use client";

import * as React from "react";

import { cn } from "@/lib/cn";
import { Reveal } from "@/components/motion/reveal";

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  contentClassName,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      id={id}
      className={cn("relative scroll-mt-24 py-20 sm:py-28", className)}
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <Reveal className="mb-10 max-w-2xl sm:mb-14">
          {eyebrow ? (
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-accent">
              <span className="h-px w-8 bg-accent/50" />
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-4 text-base leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </Reveal>
        <div className={contentClassName}>{children}</div>
      </div>
    </section>
  );
}
