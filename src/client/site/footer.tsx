"use client";

import { ArrowUp } from "lucide-react";
import * as React from "react";

import { socialIcon } from "@/client/site/icons";
import type { SocialLink } from "@/server/types";

export function SiteFooter({
  name,
  tagline,
  socials,
}: {
  name: string;
  tagline: string;
  socials: SocialLink[];
}) {
  return (
    <footer className="border-t border-line py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-tight">{name}</p>
          <p className="mt-1 max-w-md text-sm text-muted">{tagline}</p>
        </div>

        <div className="flex items-center gap-4">
          <ul className="flex items-center gap-3">
            {socials.map((social) => {
              const Icon = socialIcon(social.platform);
              return (
                <li key={`${social.platform}-${social.url}`}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.label}
                    className="text-muted transition-colors hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-xs text-muted transition-colors hover:text-foreground"
          >
            <ArrowUp className="h-3.5 w-3.5" /> Top
          </button>
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-6xl px-5 sm:px-8">
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} {name}. Built with Next.js, MongoDB and
          Framer Motion.
        </p>
      </div>
    </footer>
  );
}
