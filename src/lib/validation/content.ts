import { z } from "zod";
import {
  booleanish,
  emailSchema,
  imageAssetSchema,
  isoMonthSchema,
  nonEmptyString,
  objectIdSchema,
  stringListSchema,
  urlSchema,
} from "./common";

/* ── Projects ─────────────────────────────────────────────────────────── */

export const projectInputSchema = z.object({
  id: objectIdSchema.optional(),
  title: nonEmptyString("Title", 140),
  slug: z
    .string()
    .trim()
    .max(90)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes")
    .optional(),
  summary: nonEmptyString("Summary", 240),
  description: z.string().trim().max(20_000).default(""),
  coverImage: imageAssetSchema.optional(),
  gallery: z.array(imageAssetSchema).max(12).default([]),
  tags: stringListSchema.default([]),
  links: z
    .object({
      repo: urlSchema.optional(),
      live: urlSchema.optional(),
      caseStudy: urlSchema.optional(),
    })
    .default({}),
  featured: booleanish.default(false),
  published: booleanish.default(true),
  order: z.number().int().min(0).max(9999).default(0),
  metrics: z
    .array(z.object({ label: z.string().trim().max(60), value: z.string().trim().max(60) }))
    .max(6)
    .default([]),
  seo: z
    .object({ title: z.string().trim().max(160).default(""), description: z.string().trim().max(320).default("") })
    .default({ title: "", description: "" }),
});

export type ProjectInput = z.input<typeof projectInputSchema>;
export type ProjectInputParsed = z.output<typeof projectInputSchema>;

/* ── Experience ───────────────────────────────────────────────────────── */

export const experienceInputSchema = z.object({
  id: objectIdSchema.optional(),
  company: nonEmptyString("Company", 120),
  role: nonEmptyString("Role", 120),
  employmentType: z.string().trim().max(60).optional(),
  location: z.string().trim().max(120).optional(),
  startDate: isoMonthSchema,
  endDate: isoMonthSchema.optional(),
  description: z.array(z.string().trim().min(1).max(400)).max(12).default([]),
  logo: imageAssetSchema.optional(),
  technologies: stringListSchema.default([]),
  published: booleanish.default(true),
  order: z.number().int().min(0).max(9999).default(0),
});

export type ExperienceInput = z.input<typeof experienceInputSchema>;

/* ── Skills ───────────────────────────────────────────────────────────── */

export const skillInputSchema = z.object({
  id: objectIdSchema.optional(),
  name: nonEmptyString("Name", 60),
  category: nonEmptyString("Category", 60),
  icon: z.string().trim().max(20).optional(),
  proficiency: z.coerce.number().int().min(1).max(5).optional(),
  published: booleanish.default(true),
  order: z.number().int().min(0).max(9999).default(0),
});

export type SkillInput = z.input<typeof skillInputSchema>;

/* ── Posts ────────────────────────────────────────────────────────────── */

export const postInputSchema = z.object({
  id: objectIdSchema.optional(),
  title: nonEmptyString("Title", 160),
  slug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes")
    .optional(),
  excerpt: nonEmptyString("Excerpt", 320),
  content: z.string().trim().max(60_000).default(""),
  coverImage: imageAssetSchema.optional(),
  tags: stringListSchema.default([]),
  published: booleanish.default(false),
  seo: z
    .object({ title: z.string().trim().max(160).default(""), description: z.string().trim().max(320).default("") })
    .default({ title: "", description: "" }),
});

export type PostInput = z.input<typeof postInputSchema>;

/* ── Messages ─────────────────────────────────────────────────────────── */

export const contactInputSchema = z.object({
  name: nonEmptyString("Name", 80),
  email: emailSchema,
  subject: z.string().trim().max(160).optional(),
  body: nonEmptyString("Message", 4000),
  // Anti-spam: hidden field must stay empty.
  website: z.string().max(0, "Spam detected").optional(),
  startedAt: z.number().int().optional(),
});

export type ContactInput = z.input<typeof contactInputSchema>;

/* ── Settings ─────────────────────────────────────────────────────────── */

export const socialLinkSchema = z.object({
  platform: nonEmptyString("Platform", 40),
  label: nonEmptyString("Label", 80),
  url: urlSchema,
  icon: z.string().trim().max(40).optional(),
});

export const settingsInputSchema = z.object({
  id: z.string().optional(),
  siteTitle: nonEmptyString("Site title", 120),
  tagline: z.string().trim().max(200).default(""),
  description: z.string().trim().max(400).default(""),
  hero: z.object({
    greeting: z.string().trim().max(80).default(""),
    headline: z.string().trim().max(160).default(""),
    subheadline: z.string().trim().max(400).default(""),
    ctaLabel: z.string().trim().max(60).default(""),
    ctaHref: z.string().trim().max(300).default(""),
    secondaryCtaLabel: z.string().trim().max(60).default(""),
    secondaryCtaHref: z.string().trim().max(300).default(""),
    portraitUrl: z.string().trim().max(1000).default(""),
    portraitAlt: z.string().trim().max(200).default(""),
  }),
  socials: z.array(socialLinkSchema).max(12).default([]),
  theme: z.object({
    default: z.enum(["dark", "light"]).default("dark"),
    // Any hex colour — the admin panel offers three presets but the owner
    // may type their own.
    accent: z
      .string()
      .trim()
      .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Use a hex colour like #6d4aff")
      .max(40)
      .default("#6d4aff"),
  }),
  features: z.object({
    contactEnabled: booleanish.default(true),
    writingEnabled: booleanish.default(false),
    twoFactorEnabled: booleanish.default(false),
  }),
  seo: z.object({
    ogImageUrl: z.string().trim().max(1000).default(""),
    keywords: stringListSchema.default([]),
    author: z.string().trim().max(120).default(""),
    location: z.string().trim().max(120).default(""),
  }),
});

export type SettingsInput = z.input<typeof settingsInputSchema>;

/* ── Auth ─────────────────────────────────────────────────────────────── */

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(200),
    newPassword: z
      .string()
      .min(10, "Use at least 10 characters")
      .max(200)
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[0-9]/, "Include a number"),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different",
    path: ["newPassword"],
  });

export const transferOwnershipSchema = z.object({
  email: emailSchema,
  currentPassword: z.string().min(1, "Current password is required").max(200),
});
