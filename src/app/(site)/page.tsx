import type { Metadata } from "next";

import { About } from "@/client/site/about";
import { Contact } from "@/client/site/contact";
import { ExperienceTimeline } from "@/client/site/experience";
import { SiteFooter } from "@/client/site/footer";
import { Hero } from "@/client/site/hero";
import { SiteNav } from "@/client/site/nav";
import { Projects } from "@/client/site/projects";
import { Skills } from "@/client/site/skills";
import { getRuntimeStatus } from "@/server/db/registry";
import {
  getSiteContent,
  groupSkillsByCategory,
} from "@/server/services/content.service";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteContent();
  return {
    title: settings.siteTitle || "Prottoy Amin — Software Engineer",
    description: settings.description,
    keywords: settings.seo.keywords,
    alternates: { canonical: "/" },
  };
}

export default async function HomePage() {
  const { settings, projects, experiences, skills, posts, demo } =
    await getSiteContent();
  const runtime = getRuntimeStatus();

  const groups = groupSkillsByCategory(skills);
  const marquee = skills.map((skill) => skill.name);

  const technologies = new Set<string>();
  experiences.forEach((experience) =>
    experience.technologies.forEach((tech) => technologies.add(tech)),
  );

  const years = Math.max(
    1,
    new Date().getFullYear() -
      Math.min(
        ...experiences.map((experience) =>
          Number.parseInt(experience.startDate.slice(0, 4), 10),
        ),
      ),
  );

  const stats = [
    { label: "Projects shipped", value: String(projects.length) },
    { label: "Years writing code", value: String(years) },
    { label: "Technologies", value: String(technologies.size) },
    { label: "Writing", value: String(posts.length) },
  ];

  const facts = [
    {
      label: "Focus",
      value:
        "Product engineering end to end — interfaces, APIs, data models and the pipelines between them.",
    },
    {
      label: "Approach",
      value:
        "Small, reversible changes. Typed boundaries. Tests that describe behaviour instead of implementation.",
    },
    {
      label: "Currently",
      value:
        "Building data-heavy products and the internal tooling that keeps them honest.",
    },
    {
      label: "Outside work",
      value:
        "Open-source maintenance, long walks, and an ongoing argument with a half-finished side project.",
    },
  ];

  const counters = [
    { label: "Years experience", value: years },
    { label: "Projects delivered", value: projects.length },
    { label: "Technologies used", value: technologies.size },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: settings.seo.author || "Prottoy Amin",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    jobTitle: "Full-stack engineer",
    email: `mailto:${settings.socials.find((s) => s.platform === "email")?.url.replace("mailto:", "") ?? ""}`,
    sameAs: settings.socials.map((social) => social.url),
    knowsAbout: marquee.slice(0, 12),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteNav />
      <main>
        <Hero
          greeting={settings.hero.greeting}
          headline={settings.hero.headline}
          subheadline={settings.hero.subheadline}
          ctaLabel={settings.hero.ctaLabel}
          ctaHref={settings.hero.ctaHref}
          secondaryCtaLabel={settings.hero.secondaryCtaLabel}
          secondaryCtaHref={settings.hero.secondaryCtaHref}
          portraitUrl={settings.hero.portraitUrl}
          portraitAlt={settings.hero.portraitAlt}
          socials={settings.socials}
          stats={stats}
        />

        <About description={settings.description} facts={facts} counters={counters} />

        <Skills groups={groups} marquee={marquee} />

        <ExperienceTimeline items={experiences} />

        <Projects projects={projects} />

        <Contact
          email={
            settings.socials.find((social) => social.platform === "email")?.url.replace(
              "mailto:",
              "",
            ) ?? ""
          }
          location={settings.seo.location || "Dhaka, Bangladesh"}
          availability="Open to interesting work"
        />
      </main>

      <SiteFooter
        name={settings.seo.author || "Prottoy Amin"}
        tagline={settings.tagline}
        socials={settings.socials}
      />

      {demo.projects || runtime.db.error ? (
        <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-line bg-background/90 px-4 py-2 text-xs text-muted shadow-lg backdrop-blur">
          {runtime.db.error
            ? `Demo content — database unreachable (${runtime.db.error.slice(0, 60)}…)`
            : "Demo content — sign in to the admin panel to publish your own"}
        </div>
      ) : null}
    </>
  );
}
