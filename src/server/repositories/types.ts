import "server-only";

import type { AdapterDoc, QueryFilter, SortSpec } from "@/server/db/adapter";
import type {
  AdminUser,
  AuditLog,
  Experience,
  MediaAsset,
  Message,
  Post,
  Project,
  SiteSettings,
  Skill,
} from "@/server/types";

/**
 * Repository contracts. Services depend on these interfaces only, never on a
 * concrete driver.
 */

export interface Repository<T extends AdapterDoc> {
  list(filter?: QueryFilter, sort?: SortSpec): Promise<T[]>;
  findOne(filter: QueryFilter): Promise<T | null>;
  getById(id: string): Promise<T | null>;
  create(
    doc: Omit<T, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T | null>;
  remove(id: string): Promise<boolean>;
  count(filter?: QueryFilter): Promise<number>;
}

export interface SettingsRepository extends Repository<SiteSettings> {
  get(): Promise<SiteSettings | null>;
  save(settings: Partial<SiteSettings>): Promise<SiteSettings>;
}

export interface UserRepository extends Repository<AdminUser> {
  getByEmail(email: string): Promise<AdminUser | null>;
  count(filter?: QueryFilter): Promise<number>;
}

export interface ProjectRepository extends Repository<Project> {
  listPublished(): Promise<Project[]>;
  getBySlug(slug: string): Promise<Project | null>;
  listByTags(tags: string[]): Promise<Project[]>;
}

export interface ExperienceRepository extends Repository<Experience> {
  listPublished(): Promise<Experience[]>;
}

export interface SkillRepository extends Repository<Skill> {
  listPublished(): Promise<Skill[]>;
}

export interface PostRepository extends Repository<Post> {
  listPublished(): Promise<Post[]>;
  getBySlug(slug: string): Promise<Post | null>;
}

export interface MessageRepository extends Repository<Message> {
  listUnread(): Promise<Message[]>;
}

export interface MediaRepository extends Repository<MediaAsset> {
  getByPublicId(publicId: string): Promise<MediaAsset | null>;
}

export interface AuditRepository extends Repository<AuditLog> {
  listRecent(limit?: number): Promise<AuditLog[]>;
}

export interface Repositories {
  settings: SettingsRepository;
  users: UserRepository;
  projects: ProjectRepository;
  experiences: ExperienceRepository;
  skills: SkillRepository;
  posts: PostRepository;
  messages: MessageRepository;
  media: MediaRepository;
  auditLogs: AuditRepository;
}
