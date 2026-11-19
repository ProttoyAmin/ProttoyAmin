/**
 * Application-wide constants. Isomorphic and safe to import anywhere.
 */

export const APP_NAME = "Prottoy Amin — Portfolio";

export const SESSION_COOKIE = "pa_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * The admin is a set of separate pages, one per concern. Each entry maps
 * to its own route so a page can be linked, bookmarked and reloaded.
 */
export const ADMIN_NAV = [
  { id: "overview", label: "Overview", href: "/admin" },
  { id: "projects", label: "Projects", href: "/admin/projects" },
  { id: "experience", label: "Experience", href: "/admin/experience" },
  { id: "skills", label: "Skills", href: "/admin/skills" },
  { id: "writing", label: "Writing", href: "/admin/writing" },
  { id: "messages", label: "Messages", href: "/admin/messages" },
  { id: "media", label: "Media", href: "/admin/media" },
  { id: "settings", label: "Settings", href: "/admin/settings" },
] as const;

export type AdminNavId = (typeof ADMIN_NAV)[number]["id"];

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
