"use server";

import { revalidatePath, updateTag } from "next/cache";

import { hashPassword, verifyPassword } from "@/server/auth/password";
import { requireOwner } from "@/server/auth/owner";
import { getRepositories } from "@/server/db/registry";
import { isAppError } from "@/server/errors";
import { recordAudit } from "@/server/services/audit.service";
import { CONTENT_CACHE_TAG } from "@/server/services/site-content-cache";
import { slugify } from "@/lib/slug";
import { readingTime } from "@/lib/format";
import {
  changePasswordSchema,
  experienceInputSchema,
  postInputSchema,
  projectInputSchema,
  settingsInputSchema,
  skillInputSchema,
  transferOwnershipSchema,
} from "@/lib/validation/content";
import { z } from "zod";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

function fail(error: unknown): ActionResult {
  if (isAppError(error)) return { ok: false, error: error.message };
  if (error instanceof z.ZodError) {
    return { ok: false, error: error.issues[0]?.message ?? "Invalid input" };
  }
  console.error("[admin] action failed:", error);
  return { ok: false, error: "Something went wrong. Please try again." };
}

function revalidate() {
  // `updateTag` gives read-your-own-writes: a publish is visible on the
  // very next public request.
  updateTag(CONTENT_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/admin");
}

/* ── Projects ─────────────────────────────────────────────────────────── */

export async function saveProjectAction(input: unknown): Promise<ActionResult> {
  try {
    const { user } = await requireOwner();
    const data = projectInputSchema.parse(input);

    const repositories = await getRepositories();
    const existing = data.id ? await repositories.projects.getById(data.id) : null;

    const slug =
      data.slug?.trim() || slugify(data.title) || `project-${Date.now().toString(36)}`;

    const payload = {
      title: data.title,
      slug,
      summary: data.summary,
      description: data.description,
      coverImage: data.coverImage,
      gallery: data.gallery,
      tags: data.tags,
      links: data.links,
      featured: data.featured === true || data.featured === "true",
      published: data.published === true || data.published === "true",
      order: data.order,
      metrics: data.metrics,
      seo: data.seo,
      isDummy: false,
    };

    const saved = existing
      ? await repositories.projects.update(existing.id, payload)
      : await repositories.projects.create(payload);

    await recordAudit({
      actorEmail: user.email,
      action: existing ? "project.update" : "project.create",
      entity: "projects",
      entityId: saved?.id,
      metadata: { title: payload.title },
    });

    revalidate();
    return { ok: true, message: existing ? "Project updated" : "Project created" };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  try {
    const { user } = await requireOwner();
    const repositories = await getRepositories();

    const existing = await repositories.projects.getById(id);
    if (!existing) return { ok: false, error: "Project not found" };

    await repositories.projects.remove(id);
    await recordAudit({
      actorEmail: user.email,
      action: "project.delete",
      entity: "projects",
      entityId: id,
      metadata: { title: existing.title },
    });

    revalidate();
    return { ok: true, message: "Project deleted" };
  } catch (error) {
    return fail(error);
  }
}

export async function toggleProjectPublishedAction(id: string): Promise<ActionResult> {
  try {
    const { user } = await requireOwner();
    const repositories = await getRepositories();
    const existing = await repositories.projects.getById(id);
    if (!existing) return { ok: false, error: "Project not found" };

    await repositories.projects.update(id, { published: !existing.published });
    await recordAudit({
      actorEmail: user.email,
      action: "project.publish",
      entity: "projects",
      entityId: id,
      metadata: { published: !existing.published },
    });

    revalidate();
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

/* ── Experience ───────────────────────────────────────────────────────── */

export async function saveExperienceAction(input: unknown): Promise<ActionResult> {
  try {
    const { user } = await requireOwner();
    const data = experienceInputSchema.parse(input);
    const repositories = await getRepositories();
    const existing = data.id ? await repositories.experiences.getById(data.id) : null;

    const payload = {
      company: data.company,
      role: data.role,
      employmentType: data.employmentType,
      location: data.location,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description,
      logo: data.logo,
      technologies: data.technologies,
      published: data.published === true || data.published === "true",
      order: data.order,
      isDummy: false,
    };

    const saved = existing
      ? await repositories.experiences.update(existing.id, payload)
      : await repositories.experiences.create(payload);

    await recordAudit({
      actorEmail: user.email,
      action: existing ? "experience.update" : "experience.create",
      entity: "experiences",
      entityId: saved?.id,
    });

    revalidate();
    return { ok: true, message: "Experience saved" };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteExperienceAction(id: string): Promise<ActionResult> {
  try {
    const { user } = await requireOwner();
    const repositories = await getRepositories();
    const existing = await repositories.experiences.getById(id);
    if (!existing) return { ok: false, error: "Experience not found" };

    await repositories.experiences.remove(id);
    await recordAudit({
      actorEmail: user.email,
      action: "experience.delete",
      entity: "experiences",
      entityId: id,
    });

    revalidate();
    return { ok: true, message: "Experience deleted" };
  } catch (error) {
    return fail(error);
  }
}

/* ── Skills ───────────────────────────────────────────────────────────── */

export async function saveSkillAction(input: unknown): Promise<ActionResult> {
  try {
    const { user } = await requireOwner();
    const data = skillInputSchema.parse(input);
    const repositories = await getRepositories();
    const existing = data.id ? await repositories.skills.getById(data.id) : null;

    const payload = {
      name: data.name,
      category: data.category,
      icon: data.icon,
      proficiency: data.proficiency,
      published: data.published === true || data.published === "true",
      order: data.order,
      isDummy: false,
    };

    const saved = existing
      ? await repositories.skills.update(existing.id, payload)
      : await repositories.skills.create(payload);

    await recordAudit({
      actorEmail: user.email,
      action: existing ? "skill.update" : "skill.create",
      entity: "skills",
      entityId: saved?.id,
    });

    revalidate();
    return { ok: true, message: "Skill saved" };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteSkillAction(id: string): Promise<ActionResult> {
  try {
    const { user } = await requireOwner();
    const repositories = await getRepositories();
    const existing = await repositories.skills.getById(id);
    if (!existing) return { ok: false, error: "Skill not found" };

    await repositories.skills.remove(id);
    await recordAudit({
      actorEmail: user.email,
      action: "skill.delete",
      entity: "skills",
      entityId: id,
    });

    revalidate();
    return { ok: true, message: "Skill deleted" };
  } catch (error) {
    return fail(error);
  }
}

/* ── Posts ────────────────────────────────────────────────────────────── */

export async function savePostAction(input: unknown): Promise<ActionResult> {
  try {
    const { user } = await requireOwner();
    const data = postInputSchema.parse(input);
    const repositories = await getRepositories();
    const existing = data.id ? await repositories.posts.getById(data.id) : null;

    const slug =
      data.slug?.trim() || slugify(data.title) || `post-${Date.now().toString(36)}`;
    const published = data.published === true || data.published === "true";

    const payload = {
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      coverImage: data.coverImage,
      tags: data.tags,
      readingTimeMinutes: readingTime(data.content),
      published,
      publishedAt: published
        ? (existing?.publishedAt ?? new Date().toISOString())
        : existing?.publishedAt,
      seo: data.seo,
      isDummy: false,
    };

    const saved = existing
      ? await repositories.posts.update(existing.id, payload)
      : await repositories.posts.create(payload);

    await recordAudit({
      actorEmail: user.email,
      action: existing ? "post.update" : "post.create",
      entity: "posts",
      entityId: saved?.id,
    });

    revalidate();
    return { ok: true, message: "Post saved" };
  } catch (error) {
    return fail(error);
  }
}

export async function deletePostAction(id: string): Promise<ActionResult> {
  try {
    const { user } = await requireOwner();
    const repositories = await getRepositories();
    const existing = await repositories.posts.getById(id);
    if (!existing) return { ok: false, error: "Post not found" };

    await repositories.posts.remove(id);
    await recordAudit({
      actorEmail: user.email,
      action: "post.delete",
      entity: "posts",
      entityId: id,
    });

    revalidate();
    return { ok: true, message: "Post deleted" };
  } catch (error) {
    return fail(error);
  }
}

/* ── Messages ─────────────────────────────────────────────────────────── */

export async function markMessageReadAction(
  id: string,
  read: boolean,
): Promise<ActionResult> {
  try {
    await requireOwner();
    const repositories = await getRepositories();
    await repositories.messages.update(id, { read });
    revalidatePath("/admin");
    return { ok: true };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteMessageAction(id: string): Promise<ActionResult> {
  try {
    const { user } = await requireOwner();
    const repositories = await getRepositories();
    await repositories.messages.remove(id);
    await recordAudit({
      actorEmail: user.email,
      action: "message.delete",
      entity: "messages",
      entityId: id,
    });
    revalidatePath("/admin");
    return { ok: true, message: "Message deleted" };
  } catch (error) {
    return fail(error);
  }
}

/* ── Settings ─────────────────────────────────────────────────────────── */

export async function saveSettingsAction(input: unknown): Promise<ActionResult> {
  try {
    const { user } = await requireOwner();
    const data = settingsInputSchema.parse(input);
    const repositories = await getRepositories();

    const saved = await repositories.settings.save({
      siteTitle: data.siteTitle,
      tagline: data.tagline,
      description: data.description,
      hero: {
        ...data.hero,
        primaryBadge: {
          ...data.hero.primaryBadge,
          enabled:
            data.hero.primaryBadge.enabled !== false &&
            data.hero.primaryBadge.enabled !== "false",
        },
        secondaryBadge: {
          ...data.hero.secondaryBadge,
          enabled:
            data.hero.secondaryBadge.enabled !== false &&
            data.hero.secondaryBadge.enabled !== "false",
        },
      },
      socials: data.socials,
      theme: data.theme,
      features: {
        contactEnabled: data.features.contactEnabled !== false,
        writingEnabled: data.features.writingEnabled === true,
        twoFactorEnabled: data.features.twoFactorEnabled === true,
      },
      seo: data.seo,
    });

    await recordAudit({
      actorEmail: user.email,
      action: "settings.update",
      entity: "settings",
      entityId: saved?.id,
    });

    revalidate();
    return { ok: true, message: "Settings saved" };
  } catch (error) {
    return fail(error);
  }
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  try {
    const { user } = await requireOwner();
    const data = changePasswordSchema.parse(input);
    const repositories = await getRepositories();

    const stored = await repositories.users.getById(user.id);
    if (!stored) return { ok: false, error: "Account not found" };

    const valid = await verifyPassword(data.currentPassword, stored.passwordHash);
    if (!valid) return { ok: false, error: "Current password is incorrect" };

    await repositories.users.update(user.id, {
      passwordHash: await hashPassword(data.newPassword),
      tokenVersion: (stored.tokenVersion ?? 1) + 1,
    });

    await recordAudit({
      actorEmail: user.email,
      action: "user.password_change",
      entity: "users",
      entityId: user.id,
    });

    return {
      ok: true,
      message: "Password updated. Sign in again with the new password.",
    };
  } catch (error) {
    return fail(error);
  }
}

export async function transferOwnershipAction(input: unknown): Promise<ActionResult> {
  try {
    const { user } = await requireOwner();
    const data = transferOwnershipSchema.parse(input);
    const repositories = await getRepositories();

    const stored = await repositories.users.getById(user.id);
    if (!stored) return { ok: false, error: "Account not found" };

    const valid = await verifyPassword(data.currentPassword, stored.passwordHash);
    if (!valid) return { ok: false, error: "Current password is incorrect" };

    const nextEmail = data.email.trim().toLowerCase();
    const existing = await repositories.users.getByEmail(nextEmail);

    if (existing && existing.id !== user.id) {
      return {
        ok: false,
        error: "That email already belongs to another account.",
      };
    }

    if (existing && existing.id === user.id) {
      return { ok: false, error: "This is already the owner email." };
    }

    if (!existing) {
      await repositories.users.create({
        email: nextEmail,
        name: stored.name,
        passwordHash: stored.passwordHash,
        role: "owner",
        tokenVersion: 1,
        twoFactorEnabled: stored.twoFactorEnabled,
        failedAttempts: 0,
      });
    }

    await repositories.settings.save({ ownerEmail: nextEmail });
    await repositories.users.update(user.id, { tokenVersion: stored.tokenVersion + 1 });

    await recordAudit({
      actorEmail: user.email,
      action: "ownership.transfer",
      entity: "settings",
      metadata: { from: user.email, to: nextEmail },
    });

    revalidate();
    return {
      ok: true,
      message: `Ownership moved to ${nextEmail}. Sign in again with that account.`,
    };
  } catch (error) {
    return fail(error);
  }
}
