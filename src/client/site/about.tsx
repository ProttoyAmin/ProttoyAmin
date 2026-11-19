"use client";

import * as React from "react";

import { Counter } from "@/components/motion/counter";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Section } from "@/client/site/section";

export interface AboutFact {
  label: string;
  value: string;
}

export function About({
  description,
  facts,
  counters,
}: {
  description: string;
  facts: AboutFact[];
  counters: { label: string; value: number; suffix?: string }[];
}) {
  return (
    <Section
      id="about"
      eyebrow="About"
      title="Engineering with intent"
      description={description}
    >
      <div className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr]">
        <Stagger className="grid gap-4 sm:grid-cols-2">
          {facts.map((fact) => (
            <StaggerItem
              key={fact.label}
              className="rounded-2xl border border-line bg-surface/50 p-5"
            >
              <p className="text-xs uppercase tracking-wider text-muted">
                {fact.label}
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed">
                {fact.value}
              </p>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {counters.map((counter) => (
            <Reveal
              key={counter.label}
              className="rounded-2xl border border-line bg-gradient-to-br from-accent/10 to-transparent p-5"
            >
              <p className="text-3xl font-semibold tracking-tight">
                <Counter
                  value={counter.value}
                  suffix={counter.suffix}
                />
              </p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted">
                {counter.label}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
