"use client";

import * as React from "react";

import { Marquee } from "@/components/motion/marquee";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Section } from "@/client/site/section";
import { Badge } from "@/components/ui/badge";
import type { Skill } from "@/server/types";

export function Skills({
  groups,
  marquee,
}: {
  groups: { category: string; items: Skill[] }[];
  marquee: string[];
}) {
  return (
    <Section
      id="skills"
      eyebrow="Toolkit"
      title="The tools I reach for"
      description="A pragmatic stack: typed on the front end, explicit on the back end, boring where boring wins."
    >
      {marquee.length > 0 ? (
        <Reveal className="mb-10">
          <Marquee duration={38}>
            {marquee.map((item) => (
              <Badge
                key={item}
                tone="outline"
                className="px-3 py-1.5 text-sm font-normal"
              >
                {item}
              </Badge>
            ))}
          </Marquee>
        </Reveal>
      ) : null}

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <Stagger
            key={group.category}
            className="rounded-2xl border border-line bg-surface/40 p-5"
          >
            <StaggerItem>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                {group.category}
              </h3>
            </StaggerItem>
            <StaggerItem className="mt-4 flex flex-wrap gap-2">
              {group.items.map((skill) => (
                <span
                  key={skill.id}
                  title={skill.name}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-background px-3 py-1.5 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:text-foreground"
                >
                  {skill.icon ? <span aria-hidden>{skill.icon}</span> : null}
                  <span className="text-muted group-hover:text-foreground">
                    {skill.name}
                  </span>
                  {skill.proficiency ? (
                    <span className="ml-0.5 flex gap-0.5" aria-hidden>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <span
                          key={index}
                          className={
                            index < skill.proficiency!
                              ? "h-1 w-1 rounded-full bg-accent"
                              : "h-1 w-1 rounded-full bg-line"
                          }
                        />
                      ))}
                    </span>
                  ) : null}
                </span>
              ))}
            </StaggerItem>
          </Stagger>
        ))}
      </div>
    </Section>
  );
}
