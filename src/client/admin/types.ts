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
