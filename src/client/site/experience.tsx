"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import * as React from "react";

import { Reveal } from "@/components/motion/reveal";
import { Section } from "@/client/site/section";
import { formatDateRange } from "@/lib/format";
import type { Experience } from "@/server/types";

export function ExperienceTimeline({ items }: { items: Experience[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 65%", "end 60%"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    mass: 0.4,
  });

  return (
    <Section
      id="experience"
      eyebrow="Experience"
      title="Where I have worked"
      description="A track record of shipping products, growing teams and keeping systems honest."
    >
      <div ref={containerRef} className="relative">
        <div className="absolute left-[7px] top-2 h-full w-px bg-line md:left-1/2 md:-translate-x-1/2" />
        <motion.div
          style={{ scaleY: reduce ? 1 : progress }}
          className="absolute left-[7px] top-2 h-full w-px origin-top bg-gradient-to-b from-accent to-cyan-400 md:left-1/2 md:-translate-x-1/2"
        />

        <div className="space-y-10">
          {items.map((item, index) => (
            <Reveal
              key={item.id}
              delay={index * 0.05}
              className={`relative pl-9 md:grid md:grid-cols-2 md:gap-10 md:pl-0 ${
                index % 2 === 0 ? "" : ""
              }`}
            >
              <span className="absolute left-0 top-1.5 grid h-4 w-4 place-items-center rounded-full border border-accent bg-background md:left-1/2 md:-translate-x-1/2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </span>

              <div
                className={
                  index % 2 === 0
                    ? "md:col-start-1 md:pr-10 md:text-right"
                    : "md:col-start-2 md:pl-10"
                }
              >
                <p className="text-xs uppercase tracking-wider text-accent">
                  {formatDateRange(item.startDate, item.endDate)}
                  {item.employmentType ? ` · ${item.employmentType}` : ""}
                </p>
                <h3 className="mt-1.5 text-lg font-semibold tracking-tight">
                  {item.role}
                </h3>
                <p className="text-sm text-muted">
                  {item.company}
                  {item.location ? ` · ${item.location}` : ""}
                </p>

                {item.description.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
                    {item.description.map((line) => (
                      <li
                        key={line}
                        className={
                          index % 2 === 0 ? "md:text-right" : undefined
                        }
                      >
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {item.technologies.length > 0 ? (
                  <div
                    className={`mt-4 flex flex-wrap gap-1.5 ${
                      index % 2 === 0 ? "md:justify-end" : ""
                    }`}
                  >
                    {item.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full border border-line px-2.5 py-1 text-xs text-muted"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
