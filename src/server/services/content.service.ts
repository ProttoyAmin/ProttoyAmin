import "server-only";

import { getRepositories, getRuntimeStatus } from "@/server/db/registry";
import {
  DUMMY_EXPERIENCES,
  DUMMY_POSTS,
  DUMMY_PROJECTS,
  DUMMY_SETTINGS,
  DUMMY_SKILLS,
} from "@/seed/dummy";
import type {
  Experience,
  Post,
  Project,
  SiteSettings,
  Skill,
} from "@/server/types";

export interface DemoFlags {
  settings: boolean;
  projects: boolean;
  experiences: boolean;
  skills: boolean;
  posts: boolean;
}

export interface SiteContent {
  settings: SiteSettings;
  projects: Project[];
  experiences: Experience[];
  skills: Skill[];
  posts: Post[];
  demo: DemoFlags;
}

interface Resolved<T> {
  items: T[];
  isDemo: boolean;
}

/**
 * Real content always wins, per collection.
 *
 * As soon as the owner publishes content for a collection, the demo content
 * for that collection disappears; the other collections keep their demo data
 * until they are replaced too.
 */
function resolveCollection<T extends { isDummy: boolean }>(
  stored: T[],
  fallback: T[],
): Resolved<T> {
  const real = stored.filter((item) => !item.isDummy);
  if (real.length > 0) return { items: real, isDemo: false };

  const dummy = stored.filter((item) => item.isDummy);
  if (dummy.length > 0) return { items: dummy, isDemo: true };

  return { items: fallback, isDemo: true };
}

/**
 * Loads everything the public one-pager needs.
 *
 * This function never throws: if the database is unreachable the demo
 * content is served so the site still renders.
 */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const repositories = await getRepositories();

    const [storedSettings, storedProjects, storedExperiences, storedSkills, storedPosts] =
      await Promise.all([
        repositories.settings.get(),
        repositories.projects.listPublished(),
        repositories.experiences.listPublished(),
        repositories.skills.listPublished(),
        repositories.posts.listPublished(),
      ]);

    const projects = resolveCollection(storedProjects, DUMMY_PROJECTS);
    const experiences = resolveCollection(storedExperiences, DUMMY_EXPERIENCES);
    const skills = resolveCollection(storedSkills, DUMMY_SKILLS);
    const posts = resolveCollection(storedPosts, DUMMY_POSTS);

    const ownerEmail = storedSettings?.ownerEmail ?? "";
    const settings: SiteSettings = storedSettings ?? {
      ...DUMMY_SETTINGS,
      ownerEmail,
    };

    return {
      settings,
      projects: projects.items,
      experiences: experiences.items,
      skills: skills.items,
      posts: posts.items,
      demo: {
        settings: !storedSettings,
        projects: projects.isDemo,
        experiences: experiences.isDemo,
        skills: skills.isDemo,
        posts: posts.isDemo,
      },
    };
  } catch (error) {
    console.error("[content] falling back to demo content:", error);
    return {
      settings: DUMMY_SETTINGS,
      projects: DUMMY_PROJECTS,
      experiences: DUMMY_EXPERIENCES,
      skills: DUMMY_SKILLS,
      posts: DUMMY_POSTS,
      demo: {
        settings: true,
        projects: true,
        experiences: true,
        skills: true,
        posts: true,
      },
    };
  }
}

/** Groups skills by category, preserving the configured order. */
export function groupSkillsByCategory(skills: Skill[]): {
  category: string;
  items: Skill[];
}[] {
  const groups = new Map<string, Skill[]>();

  for (const skill of skills) {
    const list = groups.get(skill.category) ?? [];
    list.push(skill);
    groups.set(skill.category, list);
  }

  return [...groups.entries()].map(([category, items]) => ({
    category,
    items: items.sort((a, b) => a.order - b.order),
  }));
}

export interface AdminSnapshot {
  settings: SiteSettings;
  projects: Project[];
  experiences: Experience[];
  skills: Skill[];
  posts: Post[];
  demo: DemoFlags;
  runtime: ReturnType<typeof getRuntimeStatus>;
}

export async function getAdminSnapshot(): Promise<AdminSnapshot> {
  const repositories = await getRepositories();

  const [settings, projects, experiences, skills, posts] = await Promise.all([
    repositories.settings.get(),
    repositories.projects.list({}, { order: 1, createdAt: -1 }),
    repositories.experiences.list({}, { order: 1, startDate: -1 }),
    repositories.skills.list({}, { category: 1, order: 1 }),
    repositories.posts.list({}, { createdAt: -1 }),
  ]);

  const resolvedProjects = resolveCollection(projects, []);
  const resolvedExperiences = resolveCollection(experiences, []);
  const resolvedSkills = resolveCollection(skills, []);
  const resolvedPosts = resolveCollection(posts, []);

  return {
    settings: settings ?? { ...DUMMY_SETTINGS },
    projects: resolvedProjects.items,
    experiences: resolvedExperiences.items,
    skills: resolvedSkills.items,
    posts: resolvedPosts.items,
    demo: {
      settings: !settings,
      projects: resolvedProjects.isDemo,
      experiences: resolvedExperiences.isDemo,
      skills: resolvedSkills.isDemo,
      posts: resolvedPosts.isDemo,
    },
    runtime: getRuntimeStatus(),
  };
}
