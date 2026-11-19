/* eslint-disable @next/next/no-img-element -- user-managed media is served as-is, including SVG. */
"use client";

import { motion, useReducedMotion } from "motion/react";
import * as React from "react";

import { Magnetic } from "@/components/motion/magnetic";
import { ButtonLink } from "@/components/ui/button";
import { ArrowUpRight } from "@/components/ui/icons";
import { socialIcon } from "@/client/site/icons";
import type { SocialLink } from "@/server/types";

export interface HeroStat {
  label: string;
  value: string;
}

interface HeroBadge {
  enabled: boolean;
  label: string;
  value: string;
}

export function Hero({
  greeting,
  headline,
  subheadline,
  ctaLabel,
  ctaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  portraitUrl,
  portraitAlt,
  socials,
  stats,
  primaryBadge = { enabled: true, label: "Currently", value: "Building products" },
  secondaryBadge = { enabled: true, label: "Stack", value: "React · Go · MongoDB" },
  bubbleStyle = "pill",
}: {
  greeting: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  portraitUrl: string;
  portraitAlt: string;
  socials: SocialLink[];
  stats: HeroStat[];
  primaryBadge?: HeroBadge;
  secondaryBadge?: HeroBadge;
  bubbleStyle?: "rounded" | "pill" | "soft-square";
}) {
  const reduce = useReducedMotion();
  const shape =
    bubbleStyle === "pill"
      ? "rounded-full"
      : bubbleStyle === "rounded"
        ? "rounded-3xl"
        : "rounded-xl";

  const scrollTo = (href: string) => {
    if (href.startsWith("#")) {
      document.getElementById(href.slice(1))?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
      return;
    }
    window.location.href = href;
  };
  const handleCta = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    event.preventDefault();
    scrollTo(href);
  };

  return (
    <section
      id="home"
      className="relative isolate overflow-hidden pb-12 pt-28 sm:pb-16 sm:pt-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -right-28 -top-20 h-[25rem] w-[25rem] rounded-full bg-accent/15 blur-[110px]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
        <div className="max-w-2xl">
          <motion.p
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/70 px-3.5 py-2 text-sm text-muted backdrop-blur"
          >
            <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_0_4px_color-mix(in_oklab,var(--success)_18%,transparent)]" />
            {greeting}
          </motion.p>

          <motion.h1
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.04 }}
            className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-balance sm:text-6xl lg:text-[4.6rem]"
          >
            {headline}
          </motion.h1>

          <motion.p
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8"
          >
            {subheadline}
          </motion.p>

          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Magnetic>
              <ButtonLink
                size="lg"
                href={ctaHref || "#work"}
                onClick={(event) => handleCta(event, ctaHref || "#work")}
              >
                {ctaLabel || "View my work"}
                <ArrowUpRight className="h-4 w-4" />
              </ButtonLink>
            </Magnetic>
            <ButtonLink
              size="lg"
              variant="outline"
              href={secondaryCtaHref || "#contact"}
              onClick={(event) => handleCta(event, secondaryCtaHref || "#contact")}
            >
              {secondaryCtaLabel || "Get in touch"}
            </ButtonLink>
          </motion.div>

          {socials.length > 0 ? (
            <ul className="mt-7 flex items-center gap-2">
              {socials.map((social) => {
                const Icon = socialIcon(social.platform);
                return (
                  <li key={`${social.platform}-${social.url}`}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={social.label}
                      className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface/70 text-muted transition hover:-translate-y-0.5 hover:border-accent/50 hover:text-foreground"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="relative mx-auto w-full max-w-[27rem] lg:max-w-none"
        >
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-accent/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-line bg-surface shadow-[0_32px_100px_-48px_rgba(0,0,0,.72)]">
            <img
              src={portraitUrl}
              alt={portraitAlt}
              width={840}
              height={960}
              className="aspect-[.88] w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background/25 to-transparent" />
          </div>
          {primaryBadge.enabled ? (
            <motion.div
              animate={reduce ? undefined : { y: [0, -5, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              className={`absolute -left-3 top-8 max-w-[85%] border border-line/80 bg-background/90 px-4 py-3 shadow-xl backdrop-blur-xl sm:-left-7 sm:top-12 sm:px-5 ${shape}`}
            >
              <p className="text-[11px] font-medium uppercase tracking-[.14em] text-muted">
                {primaryBadge.label}
              </p>
              <p className="mt-1 text-sm font-semibold tracking-tight sm:text-base">
                {primaryBadge.value}
              </p>
            </motion.div>
          ) : null}
          {secondaryBadge.enabled ? (
            <motion.div
              animate={reduce ? undefined : { y: [0, 5, 0] }}
              transition={{
                duration: 6.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
              className={`absolute -right-2 bottom-8 max-w-[90%] border border-line/80 bg-background/90 px-4 py-3 shadow-xl backdrop-blur-xl sm:-right-6 sm:bottom-12 sm:px-5 ${shape}`}
            >
              <p className="text-[11px] font-medium uppercase tracking-[.14em] text-muted">
                {secondaryBadge.label}
              </p>
              <p className="mt-1 text-sm font-semibold tracking-tight sm:text-base">
                {secondaryBadge.value}
              </p>
            </motion.div>
          ) : null}
        </motion.div>
      </div>

      {stats.length ? (
        <dl className="mx-auto mt-14 grid w-full max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-background/90 px-4 py-4 sm:px-6">
              <dt className="text-xs font-medium uppercase tracking-[.12em] text-muted">
                {stat.label}
              </dt>
              <dd className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
