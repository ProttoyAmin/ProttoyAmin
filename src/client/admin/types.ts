import type { DemoFlags } from "@/server/services/content.service";
import type { RuntimeStatus } from "@/server/db/registry";
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

export interface AdminData {
  owner: AdminUser;
  settings: SiteSettings;
  projects: Project[];
  experiences: Experience[];
  skills: Skill[];
  posts: Post[];
  messages: Message[];
  media: MediaAsset[];
  audit: AuditLog[];
  demo: DemoFlags;
  runtime: RuntimeStatus;
}

/**
 * Each admin page is its own route and only loads the data it needs, so
 * every panel declares exactly the slice it renders.
 */
export type OverviewData = Pick<
  AdminData,
  | "owner"
  | "projects"
  | "experiences"
  | "skills"
  | "posts"
  | "messages"
  | "media"
  | "audit"
  | "runtime"
> & { demo: DemoFlags };

export type ProjectsData = Pick<AdminData, "projects" | "media"> & {
  demo: Pick<DemoFlags, "projects">;
};
export type ExperienceData = Pick<AdminData, "experiences" | "media">;
export type SkillsData = Pick<AdminData, "skills">;
export type WritingData = Pick<AdminData, "posts" | "media">;
export type MessagesData = Pick<AdminData, "messages">;
export type MediaData = Pick<AdminData, "media" | "runtime">;
export type SettingsData = Pick<AdminData, "settings" | "owner" | "media">;
