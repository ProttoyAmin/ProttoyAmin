/**
 * Application-wide constants. Isomorphic and safe to import anywhere.
 */

export const APP_NAME = "Prottoy Amin — Portfolio";

export const SESSION_COOKIE = "pa_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const ADMIN_TABS = [
  { id: "overview", label: "Overview" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "writing", label: "Writing" },
  { id: "messages", label: "Messages" },
  { id: "media", label: "Media" },
  { id: "settings", label: "Settings" },
] as const;

export type AdminTabId = (typeof ADMIN_TABS)[number]["id"];

export const SITE_SECTIONS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact" },
] as const;

export const CLOUDINARY_FOLDER = "portfolio";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB (Cloudinary free limit)

export const MEDIA_FOLDERS = ["portfolio", "projects", "posts", "profile"] as const;
