/* eslint-disable @next/next/no-img-element --
   Portfolio media is user supplied and may be SVG, which next/image
   refuses to optimise; the images are served as-is by design. */
"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import * as React from "react";

import { Magnetic } from "@/components/motion/magnetic";
import { Reveal } from "@/components/motion/reveal";
import { ButtonLink } from "@/components/ui/button";
import { socialIcon } from "@/client/site/icons";
import type { SocialLink } from "@/server/types";

export interface HeroStat {
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
}) {
  const reduce = useReducedMotion();

  /**
   * Upgrades an in-page link to a smooth scroll. Real anchors keep the
   * calls to action working even before hydration.
   */
  const scrollTo = (href: string) => {
    if (href.startsWith("#")) {
      const element = document.getElementById(href.slice(1));
      element?.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
      return;
    }
    window.location.href = href;
  };

  const handleCta = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (!href.startsWith("#")) return; // let the browser follow the link
    event.preventDefault();
    scrollTo(href);
  };

  return (
    <section id="home" className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24">
      {/* Ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -left-32 -top-24 h-[28rem] w-[28rem] rounded-full bg-accent/25 blur-[110px]"
          style={reduce ? undefined : { animation: "drift 18s ease-in-out infinite" }}
        />
        <div
          className="absolute -right-24 top-32 h-[24rem] w-[24rem] rounded-full bg-cyan-400/20 blur-[120px]"
          style={reduce ? undefined : { animation: "drift 22s ease-in-out infinite reverse" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,var(--line)_1px,transparent_0)] [background-size:56px_56px] opacity-40" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-14 px-5 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <motion.p
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1.5 text-xs text-muted backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {greeting}
          </motion.p>

          <motion.h1
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            {headline}
          </motion.h1>

          <motion.p
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
          >
            {subheadline}
          </motion.p>

          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
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
              onClick={(event) =>
                handleCta(event, secondaryCtaHref || "#contact")
              }
            >
              {secondaryCtaLabel || "Get in touch"}
            </ButtonLink>
          </motion.div>

          {socials.length > 0 ? (
            <motion.ul
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex items-center gap-2"
            >
              {socials.map((social) => {
                const Icon = socialIcon(social.platform);
                return (
                  <li key={`${social.platform}-${social.url}`}>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={social.label}
                      className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface/60 text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:text-foreground"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </li>
                );
              })}
            </motion.ul>
          ) : null}
        </div>

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-sm lg:max-w-none"
        >
          <div className="relative overflow-hidden rounded-[28px] border border-line bg-surface shadow-[0_40px_120px_-40px_rgba(0,0,0,0.6)]">
            <img
              src={portraitUrl}
              alt={portraitAlt}
              width={720}
              height={720}
              className="aspect-square w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/80 to-transparent" />
          </div>

          <motion.div
            animate={reduce ? undefined : { y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-4 top-8 hidden rounded-2xl border border-line bg-background/90 px-4 py-3 shadow-lg backdrop-blur sm:block"
          >
            <p className="text-xs text-muted">Currently</p>
            <p className="text-sm font-semibold">Building products</p>
          </motion.div>

          <motion.div
            animate={reduce ? undefined : { y: [0, 12, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            className="absolute -right-3 bottom-10 hidden rounded-2xl border border-line bg-background/90 px-4 py-3 shadow-lg backdrop-blur sm:block"
          >
            <p className="text-xs text-muted">Stack</p>
            <p className="text-sm font-semibold">React · Go · MongoDB</p>
          </motion.div>
        </motion.div>
      </div>

      {stats.length > 0 ? (
        <Reveal delay={0.1} className="mx-auto mt-16 w-full max-w-6xl px-5 sm:px-8">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-line bg-surface/50 px-4 py-4"
              >
                <dt className="text-xs uppercase tracking-wider text-muted">
                  {stat.label}
                </dt>
                <dd className="mt-1 text-2xl font-semibold tracking-tight">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      ) : null}

      <div className="mx-auto mt-12 flex w-full max-w-6xl justify-center px-5 sm:px-8">
        <a
          href="#about"
          onClick={(event) => handleCta(event, "#about")}
          className="group flex flex-col items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted transition-colors hover:text-foreground"
        >
          Scroll
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </a>
      </div>
    </section>
  );
}
