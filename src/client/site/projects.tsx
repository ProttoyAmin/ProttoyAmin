/* eslint-disable @next/next/no-img-element --
   Portfolio media is user supplied and may be SVG, which next/image
   refuses to optimise; the images are served as-is by design. */
"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Link2 } from "@/components/ui/icons";

import { GitHubIcon } from "@/client/site/brand-icons";
import * as React from "react";

import { Section } from "@/client/site/section";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/server/types";

function ProjectCard({ project }: { project: Project }) {
  const reduce = useReducedMotion();

  return (
    <motion.article
      layout={!reduce}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface/60 transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.55)]"
    >
      {project.coverImage?.url ? (
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={project.coverImage.url}
            alt={project.coverImage.alt ?? project.title}
            width={project.coverImage.width ?? 1200}
            height={project.coverImage.height ?? 800}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
          {project.featured ? (
            <span className="absolute left-3 top-3">
              <Badge tone="accent">Featured</Badge>
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold tracking-tight">{project.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
          {project.summary}
        </p>

        {project.metrics.length > 0 ? (
          <dl className="mt-4 grid grid-cols-3 gap-2">
            {project.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-line/70 bg-background/40 px-2 py-2 text-center"
              >
                <dt className="text-[10px] uppercase tracking-wider text-muted">
                  {metric.label}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold">{metric.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-muted"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
          {project.links.repo ? (
            <a
              href={project.links.repo}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <GitHubIcon className="h-4 w-4" /> Source
            </a>
          ) : null}
          {project.links.live ? (
            <a
              href={project.links.live}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <Link2 className="h-4 w-4" /> Live
            </a>
          ) : null}
          {project.links.caseStudy ? (
            <a
              href={project.links.caseStudy}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <ArrowUpRight className="h-4 w-4" /> Case study
            </a>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

export function Projects({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = React.useState("All");
  const reduce = useReducedMotion();

  const tags = React.useMemo(() => {
    const set = new Set<string>();
    projects.forEach((project) => project.tags.forEach((tag) => set.add(tag)));
    return ["All", ...[...set].slice(0, 10)];
  }, [projects]);

  const visible =
    filter === "All"
      ? projects
      : projects.filter((project) => project.tags.includes(filter));

  return (
    <Section
      id="work"
      eyebrow="Selected work"
      title="Projects with receipts"
      description="A few things I have designed, built and shipped — each with the numbers that mattered."
    >
      {tags.length > 1 ? (
        <div className="mb-8 flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isActive = tag === filter;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setFilter(tag)}
                className={`relative rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "text-white"
                    : "border border-line text-muted hover:text-foreground"
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="project-filter"
                    className="absolute inset-0 -z-10 rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                {tag}
              </button>
            );
          })}
        </div>
      ) : null}

      <motion.div layout={!reduce} className="grid gap-5 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </AnimatePresence>
      </motion.div>
    </Section>
  );
}
