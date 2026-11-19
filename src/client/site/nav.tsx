"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, Moon, Sun, X } from "@/components/ui/icons";
import Link from "next/link";
import * as React from "react";

import { useTheme } from "@/client/providers/theme-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { SITE_SECTIONS } from "@/lib/constants";
import { cn } from "@/lib/cn";

export function SiteNav({ adminHref = "/admin" }: { adminHref?: string }) {
  const [scrolled, setScrolled] = React.useState(false);
  const [active, setActive] = React.useState("home");
  const [open, setOpen] = React.useState(false);
  const { theme, toggleTheme } = useTheme();
  const reduce = useReducedMotion();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    const sections = SITE_SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter((element): element is HTMLElement => Boolean(element));

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.2, 0.6] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const go = (id: string) => {
    setOpen(false);
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  /**
   * The nav items are real anchors so the page still navigates before (or
   * without) hydration; JavaScript only upgrades them to a smooth scroll.
   */
  const handleAnchor = (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const element = document.getElementById(id);
    if (!element) return; // let the browser handle the hash natively
    event.preventDefault();
    go(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scrolled ? "glass border-b border-line" : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <a
          href="#home"
          onClick={(event) => handleAnchor(event, "home")}
          className="flex items-center gap-2.5 text-sm font-semibold tracking-tight"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-xs font-bold text-white">
            PA
          </span>
          <span className="hidden sm:inline">Prottoy Amin</span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {SITE_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(event) => handleAnchor(event, section.id)}
              className={cn(
                "relative rounded-lg px-3 py-2 text-sm transition-colors",
                active === section.id
                  ? "text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              {active === section.id ? (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 -z-10 rounded-lg bg-surface-2"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              {section.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <ButtonLink
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            href={adminHref}
          >
            Admin
          </ButtonLink>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="glass overflow-hidden border-t border-line md:hidden"
          >
            <div className="mx-auto flex w-full max-w-6xl flex-col px-5 py-3 sm:px-8">
              {SITE_SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={(event) => handleAnchor(event, section.id)}
                  className="rounded-lg px-3 py-2.5 text-left text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  {section.label}
                </a>
              ))}
              <Link
                href={adminHref}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-left text-sm text-accent"
              >
                Admin
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
