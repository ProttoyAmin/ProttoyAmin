import "server-only";

import type { CollectionAdapter, QueryFilter } from "@/server/db/adapter";
import { newId } from "@/server/ids";
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
import type {
  AuditRepository,
  ExperienceRepository,
  MediaRepository,
  MessageRepository,
  PostRepository,
  ProjectRepository,
  Repositories,
  Repository,
  SettingsRepository,
  SkillRepository,
  UserRepository,
} from "@/server/repositories/types";

export interface AdapterBundle {
  settings: CollectionAdapter<SiteSettings>;
  users: CollectionAdapter<AdminUser>;
  projects: CollectionAdapter<Project>;
  experiences: CollectionAdapter<Experience>;
  skills: CollectionAdapter<Skill>;
  posts: CollectionAdapter<Post>;
  messages: CollectionAdapter<Message>;
  media: CollectionAdapter<MediaAsset>;
  auditLogs: CollectionAdapter<AuditLog>;
}

function baseRepository<T extends { id: string; createdAt: string; updatedAt: string }>(
  adapter: CollectionAdapter<T>,
): Repository<T> {
  return {
    list: (filter, sort) => adapter.list(filter, sort),
    findOne: (filter) => adapter.findOne(filter),
    getById: (id) => adapter.findOne({ id } as unknown as QueryFilter),
    create: (doc) => adapter.insert(doc),
    update: (id, patch) => adapter.update(id, patch),
    remove: (id) => adapter.remove(id),
    count: (filter) => adapter.count(filter),
  };
}

/**
 * Builds the typed repository set for a given adapter bundle.
 */
export function createRepositories(adapters: AdapterBundle): Repositories {
  const projects: ProjectRepository = {
    ...baseRepository(adapters.projects),
    async listPublished() {
      return adapters.projects.list(
        { published: true },
        { order: 1, createdAt: -1 },
      );
    },
    async getBySlug(slug) {
      return adapters.projects.findOne({ slug });
    },
    async listByTags(tags) {
      return adapters.projects.list({ tags: { $in: tags } });
    },
  };

  const experiences: ExperienceRepository = {
    ...baseRepository(adapters.experiences),
    async listPublished() {
      return adapters.experiences.list(
        { published: true },
        { order: 1, startDate: -1 },
      );
    },
  };

  const skills: SkillRepository = {
    ...baseRepository(adapters.skills),
    async listPublished() {
      return adapters.skills.list({ published: true }, { category: 1, order: 1 });
    },
  };

  const posts: PostRepository = {
    ...baseRepository(adapters.posts),
    async listPublished() {
      return adapters.posts.list(
        { published: true },
        { publishedAt: -1, createdAt: -1 },
      );
    },
    async getBySlug(slug) {
      return adapters.posts.findOne({ slug });
    },
  };

  const messages: MessageRepository = {
    ...baseRepository(adapters.messages),
    async listUnread() {
      return adapters.messages.list({ read: false }, { createdAt: -1 });
    },
  };

  const media: MediaRepository = {
    ...baseRepository(adapters.media),
    async getByPublicId(publicId) {
      return adapters.media.findOne({ publicId });
    },
  };

  const auditLogs: AuditRepository = {
    ...baseRepository(adapters.auditLogs),
    async listRecent(limit = 25) {
      return adapters.auditLogs.list({}, { at: -1 }).then((logs) => logs.slice(0, limit));
    },
  };

  const settings: SettingsRepository = {
    ...baseRepository(adapters.settings),
    async get() {
      const all = await adapters.settings.list({}, { updatedAt: -1 });
      return all[0] ?? null;
    },
    async save(doc) {
      const existing = await adapters.settings.list({}, { updatedAt: -1 });
      const current = existing[0];
      if (current) {
        const updated = await adapters.settings.update(current.id, doc);
        if (updated) return updated;
      }
      return adapters.settings.insert({ ...doc, id: doc.id ?? newId() } as never);
    },
  };

  const users: UserRepository = {
    ...baseRepository(adapters.users),
    async getByEmail(email) {
      return adapters.users.findOne({ email: email.toLowerCase() });
    },
    async count() {
      return adapters.users.count({});
    },
  };

  return {
    settings,
    users,
    projects,
    experiences,
    skills,
    posts,
    messages,
    media,
    auditLogs,
  };
}
