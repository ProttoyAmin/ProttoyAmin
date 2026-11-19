"use client";

import * as React from "react";
import { useTheme } from "@/client/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "@/components/ui/icons";
import { SITE_SECTIONS } from "@/lib/constants";
import { cn } from "@/lib/cn";

/** A compact in-page dock placed after the hero, rather than a top banner. */
export function SectionNav() {
  const { theme, toggleTheme } = useTheme();
  const [active, setActive] = React.useState("home");

  React.useEffect(() => {
    const elements = SITE_SECTIONS.map(({ id }) => document.getElementById(id)).filter(
      (item): item is HTMLElement => Boolean(item),
    );
    if (!elements.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const current = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (current?.target.id) setActive(current.target.id);
      },
      { rootMargin: "-42% 0px -48% 0px", threshold: [0, 0.15, 0.5] },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="sticky top-3 z-40 mx-auto -mt-2 mb-4 flex w-fit max-w-[calc(100%-2rem)] items-center rounded-full border border-line/80 bg-background/85 p-1.5 shadow-lg shadow-black/5 backdrop-blur-xl">
      <a
        href="#home"
        aria-label="Prottoy Amin home"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold text-white"
      >
        PA
      </a>
      <nav
        aria-label="Portfolio sections"
        className="flex min-w-0 items-center gap-0.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SITE_SECTIONS.slice(1).map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active === section.id ? "location" : undefined}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-2 text-xs font-medium transition-colors sm:px-3.5 sm:text-sm",
              active === section.id
                ? "bg-surface-2 text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            {section.label}
          </a>
        ))}
      </nav>
      <a
        href="/admin"
        className="hidden shrink-0 rounded-full px-3 py-2 text-xs font-medium text-muted transition hover:bg-surface-2 hover:text-foreground sm:inline-flex"
      >
        Admin
      </a>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 rounded-full"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  );
}
