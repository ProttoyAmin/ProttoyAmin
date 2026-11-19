import "server-only";

import { MemoryStore } from "@/server/db/adapters/memory-adapter";
import { createMongoAdapter } from "@/server/db/adapters/mongo-adapter";
import { connectMongo } from "@/server/db/connection";
import { models } from "@/server/db/models";
import { env, hasCloudinaryCredentials, hasMongoCredentials } from "@/server/env";
import { createRepositories, type AdapterBundle } from "@/server/repositories/factory";
import type { Repositories } from "@/server/repositories/types";
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
import { DUMMY_DATA } from "@/seed/dummy";

export type DbDriver = "mongo" | "memory";
export type MediaDriver = "cloudinary" | "local";

export interface RuntimeStatus {
  db: {
    driver: DbDriver;
    connected: boolean;
    error: string | null;
    hint: string | null;
  };
  media: {
    driver: MediaDriver;
    error: string | null;
  };
  configured: {
    mongo: boolean;
    cloudinary: boolean;
    sessionSecret: boolean;
  };
  demo: boolean;
}

let repositoriesPromise: Promise<Repositories> | null = null;
let status: RuntimeStatus = {
  db: { driver: "memory", connected: false, error: null, hint: null },
  media: { driver: "local", error: null },
  configured: {
    mongo: hasMongoCredentials(),
    cloudinary: hasCloudinaryCredentials(),
    sessionSecret: Boolean(env.session.secret),
  },
  demo: true,
};

export function getRuntimeStatus(): RuntimeStatus {
  const driver = resolveMediaDriver();
  const missingCloudinary =
    driver === "cloudinary" && !hasCloudinaryCredentials();

  return {
    ...status,
    media: {
      driver,
      error: missingCloudinary
        ? "MEDIA_DRIVER=cloudinary but the Cloudinary credentials are incomplete."
        : status.media.error,
    },
  };
}

function resolveDbDriver(): DbDriver {
  if (env.db.driver === "memory") return "memory";
  if (env.db.driver === "mongo") return "mongo";
  return hasMongoCredentials() ? "mongo" : "memory";
}

function resolveMediaDriver(): MediaDriver {
  if (env.media.driver === "local") return "local";
  if (env.media.driver === "cloudinary") return "cloudinary";
  return hasCloudinaryCredentials() ? "cloudinary" : "local";
}

function mongoAdapters(): AdapterBundle {
  return {
    settings: createMongoAdapter<SiteSettings>(models.settings, "settings"),
    users: createMongoAdapter<AdminUser>(models.users, "users"),
    projects: createMongoAdapter<Project>(models.projects, "projects"),
    experiences: createMongoAdapter<Experience>(models.experiences, "experiences"),
    skills: createMongoAdapter<Skill>(models.skills, "skills"),
    posts: createMongoAdapter<Post>(models.posts, "posts"),
    messages: createMongoAdapter<Message>(models.messages, "messages"),
    media: createMongoAdapter<MediaAsset>(models.media, "media"),
    auditLogs: createMongoAdapter<AuditLog>(models.auditLogs, "auditLogs"),
  };
}

async function memoryAdapters(): Promise<AdapterBundle> {
  const store = new MemoryStore();
  await store.load({
    settings: [DUMMY_DATA.settings],
    projects: DUMMY_DATA.projects,
    experiences: DUMMY_DATA.experiences,
    skills: DUMMY_DATA.skills,
    posts: DUMMY_DATA.posts,
    messages: [],
    media: [],
    auditLogs: [],
  });

  return {
    settings: store.collection<SiteSettings>("settings"),
    users: store.collection<AdminUser>("users"),
    projects: store.collection<Project>("projects"),
    experiences: store.collection<Experience>("experiences"),
    skills: store.collection<Skill>("skills"),
    posts: store.collection<Post>("posts"),
    messages: store.collection<Message>("messages"),
    media: store.collection<MediaAsset>("media"),
    auditLogs: store.collection<AuditLog>("auditLogs"),
  };
}

/**
 * Resolves the repository set for the current process.
 *
 * Resolution order:
 *   1. Explicit `DB_DRIVER` wins.
 *   2. Otherwise MongoDB is used when `MONGODB_URI` is present.
 *   3. If MongoDB is configured but unreachable, the local driver takes over
 *      and the failure is surfaced through `getRuntimeStatus()` — the UI
 *      keeps rendering instead of crashing.
 */
export async function getRepositories(): Promise<Repositories> {
  if (!repositoriesPromise) {
    repositoriesPromise = resolveRepositories();
  }
  return repositoriesPromise;
}

async function resolveRepositories(): Promise<Repositories> {
  const desired = resolveDbDriver();

  if (desired === "mongo") {
    try {
      await connectMongo(env.db.uri);
      status = {
        ...status,
        db: { driver: "mongo", connected: true, error: null, hint: null },
        demo: false,
      };
      return createRepositories(mongoAdapters());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[db] MongoDB connection failed:", message);
      status = {
        ...status,
        db: {
          driver: "memory",
          connected: false,
          error: message,
          hint: "MongoDB is configured but unreachable — showing demo content.",
        },
        demo: true,
      };
    }
  }

  if (desired === "mongo" && env.isProduction) {
    console.error(
      "[db] CRITICAL: running on the local driver in production. Set MONGODB_URI.",
    );
  }

  const adapters = await memoryAdapters();
  return createRepositories(adapters);
}

/** Resets the cached repositories — used by tests and the seeding script. */
export function resetRegistry(): void {
  repositoriesPromise = null;
}
