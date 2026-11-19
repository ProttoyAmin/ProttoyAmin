import "server-only";

import mongoose, { Schema } from "mongoose";

/**
 * Mongoose schema definitions.
 *
 * Field names mirror the domain entities in `src/server/types.ts` so the
 * MongoDB adapter can hand documents straight to the repositories.
 */

const imageAssetSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    width: { type: Number },
    height: { type: Number },
    blurDataUrl: { type: String },
    alt: { type: String },
  },
  { _id: false },
);

const metricSchema = new Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const linkSchema = new Schema(
  {
    repo: { type: String },
    live: { type: String },
    caseStudy: { type: String },
  },
  { _id: false },
);

const seoSchema = new Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false },
);

/* ── Settings ─────────────────────────────────────────────────────────── */

const settingsSchema = new Schema(
  {
    ownerEmail: { type: String, default: "" },
    siteTitle: { type: String, default: "" },
    tagline: { type: String, default: "" },
    description: { type: String, default: "" },
    hero: {
      greeting: { type: String, default: "" },
      headline: { type: String, default: "" },
      subheadline: { type: String, default: "" },
      ctaLabel: { type: String, default: "" },
      ctaHref: { type: String, default: "" },
      secondaryCtaLabel: { type: String, default: "" },
      secondaryCtaHref: { type: String, default: "" },
      portraitUrl: { type: String, default: "" },
      portraitAlt: { type: String, default: "" },
      primaryBadge: {
        enabled: { type: Boolean, default: true },
        label: { type: String, default: "Currently" },
        value: { type: String, default: "Building products" },
      },
      secondaryBadge: {
        enabled: { type: Boolean, default: true },
        label: { type: String, default: "Stack" },
        value: { type: String, default: "React · Go · MongoDB" },
      },
    },
    socials: {
      type: [
        new Schema(
          {
            platform: { type: String, required: true },
            label: { type: String, required: true },
            url: { type: String, required: true },
            icon: { type: String },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    theme: {
      default: { type: String, enum: ["dark", "light"], default: "dark" },
      accent: { type: String, default: "#6d4aff" },
      fontFamily: {
        type: String,
        enum: ["inter", "manrope", "dm-sans", "space-grotesk"],
        default: "manrope",
      },
      fontScale: {
        type: String,
        enum: ["compact", "comfortable", "spacious"],
        default: "comfortable",
      },
      bubbleStyle: {
        type: String,
        enum: ["rounded", "pill", "soft-square"],
        default: "pill",
      },
    },
    features: {
      contactEnabled: { type: Boolean, default: true },
      writingEnabled: { type: Boolean, default: false },
      twoFactorEnabled: { type: Boolean, default: false },
    },
    seo: {
      ogImageUrl: { type: String, default: "" },
      keywords: { type: [String], default: [] },
      author: { type: String, default: "" },
      location: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

/* ── Users ────────────────────────────────────────────────────────────── */

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["owner"], default: "owner" },
    tokenVersion: { type: Number, default: 1 },
    twoFactorEnabled: { type: Boolean, default: false },
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

/* ── Projects ─────────────────────────────────────────────────────────── */

const projectSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    summary: { type: String, default: "" },
    description: { type: String, default: "" },
    coverImage: { type: imageAssetSchema },
    gallery: { type: [imageAssetSchema], default: [] },
    tags: { type: [String], default: [] },
    links: { type: linkSchema, default: () => ({}) },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    metrics: { type: [metricSchema], default: [] },
    seo: { type: seoSchema, default: () => ({}) },
    isDummy: { type: Boolean, default: false },
  },
  { timestamps: true },
);
projectSchema.index({ published: 1, order: 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ isDummy: 1 });

/* ── Experience ───────────────────────────────────────────────────────── */

const experienceSchema = new Schema(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    employmentType: { type: String },
    location: { type: String },
    startDate: { type: String, required: true },
    endDate: { type: String },
    description: { type: [String], default: [] },
    logo: { type: imageAssetSchema },
    technologies: { type: [String], default: [] },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    isDummy: { type: Boolean, default: false },
  },
  { timestamps: true },
);
experienceSchema.index({ order: 1, startDate: -1 });
experienceSchema.index({ isDummy: 1 });

/* ── Skills ───────────────────────────────────────────────────────────── */

const skillSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    icon: { type: String },
    proficiency: { type: Number, min: 1, max: 5 },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    isDummy: { type: Boolean, default: false },
  },
  { timestamps: true },
);
skillSchema.index({ category: 1, order: 1 });
skillSchema.index({ isDummy: 1 });

/* ── Posts ────────────────────────────────────────────────────────────── */

const postSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    coverImage: { type: imageAssetSchema },
    tags: { type: [String], default: [] },
    readingTimeMinutes: { type: Number, default: 1 },
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
    seo: { type: seoSchema, default: () => ({}) },
    isDummy: { type: Boolean, default: false },
  },
  { timestamps: true },
);
postSchema.index({ published: 1, publishedAt: -1 });
postSchema.index({ isDummy: 1 });

/* ── Messages ─────────────────────────────────────────────────────────── */

const messageSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String },
    body: { type: String, required: true },
    read: { type: Boolean, default: false },
    repliedAt: { type: Date },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);
messageSchema.index({ read: 1 });

/* ── Media ────────────────────────────────────────────────────────────── */

const mediaSchema = new Schema(
  {
    publicId: { type: String, required: true, unique: true },
    provider: { type: String, enum: ["cloudinary", "local"], required: true },
    url: { type: String, required: true },
    secureUrl: { type: String, required: true },
    originalUrl: { type: String, required: true },
    format: { type: String, default: "jpg" },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    bytes: { type: Number, default: 0 },
    alt: { type: String },
    folder: { type: String, default: "portfolio" },
    usedBy: {
      type: [
        new Schema(
          {
            collectionName: { type: String, required: true },
            documentId: { type: String, required: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);
mediaSchema.index({ provider: 1 });
mediaSchema.index({ createdAt: -1 });

/* ── Audit log ────────────────────────────────────────────────────────── */

const auditLogSchema = new Schema(
  {
    actorEmail: { type: String, required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    metadata: { type: Schema.Types.Mixed },
    ip: { type: String },
    at: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);
auditLogSchema.index({ at: -1 });
auditLogSchema.index({ actorEmail: 1, at: -1 });

/* ── Model registry ───────────────────────────────────────────────────── */

export const models = {
  settings: mongoose.models.Settings ?? mongoose.model("Settings", settingsSchema),
  users: mongoose.models.User ?? mongoose.model("User", userSchema),
  projects: mongoose.models.Project ?? mongoose.model("Project", projectSchema),
  experiences:
    mongoose.models.Experience ?? mongoose.model("Experience", experienceSchema),
  skills: mongoose.models.Skill ?? mongoose.model("Skill", skillSchema),
  posts: mongoose.models.Post ?? mongoose.model("Post", postSchema),
  messages: mongoose.models.Message ?? mongoose.model("Message", messageSchema),
  media: mongoose.models.Media ?? mongoose.model("Media", mediaSchema),
  auditLogs: mongoose.models.AuditLog ?? mongoose.model("AuditLog", auditLogSchema),
};

export type ModelName = keyof typeof models;
