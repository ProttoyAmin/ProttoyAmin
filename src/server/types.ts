/**
 * Domain entities for the portfolio platform.
 *
 * These types are the contract between the persistence layer, the service
 * layer and the UI. They are intentionally driver-agnostic: the MongoDB driver
 * and the local memory driver both speak this vocabulary.
 */

export interface ImageAsset {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  blurDataUrl?: string;
  alt?: string;
}

export interface SocialLink {
  platform: string;
  label: string;
  url: string;
  icon?: string;
}

export interface SiteSettings {
  id: string;
  ownerEmail: string;
  siteTitle: string;
  tagline: string;
  description: string;
  hero: {
    greeting: string;
    headline: string;
    subheadline: string;
    ctaLabel: string;
    ctaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    portraitUrl: string;
    portraitAlt: string;
    primaryBadge?: { enabled: boolean; label: string; value: string };
    secondaryBadge?: { enabled: boolean; label: string; value: string };
  };
  socials: SocialLink[];
  theme: {
    default: "dark" | "light";
    accent: string;
    fontFamily?: "inter" | "manrope" | "dm-sans" | "space-grotesk";
    fontScale?: "compact" | "comfortable" | "spacious";
    bubbleStyle?: "rounded" | "pill" | "soft-square";
  };
  features: {
    contactEnabled: boolean;
    writingEnabled: boolean;
    twoFactorEnabled: boolean;
  };
  seo: {
    ogImageUrl: string;
    keywords: string[];
    author: string;
    location: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  passwordHash: string;
  role: "owner";
  tokenVersion: number;
  twoFactorEnabled: boolean;
  failedAttempts: number;
  lockedUntil?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  coverImage?: ImageAsset;
  gallery: ImageAsset[];
  tags: string[];
  links: {
    repo?: string;
    live?: string;
    caseStudy?: string;
  };
  featured: boolean;
  published: boolean;
  order: number;
  metrics: { label: string; value: string }[];
  seo: { title: string; description: string };
  isDummy: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  employmentType?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description: string[];
  logo?: ImageAsset;
  technologies: string[];
  published: boolean;
  order: number;
  isDummy: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  icon?: string;
  proficiency?: number;
  published: boolean;
  order: number;
  isDummy: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: ImageAsset;
  tags: string[];
  readingTimeMinutes: number;
  published: boolean;
  publishedAt?: string;
  seo: { title: string; description: string };
  isDummy: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject?: string;
  body: string;
  read: boolean;
  repliedAt?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  publicId: string;
  provider: "cloudinary" | "local";
  url: string;
  secureUrl: string;
  originalUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  alt?: string;
  folder: string;
  usedBy: { collectionName: string; documentId: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  at: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
  role: "owner";
  tokenVersion: number;
}
