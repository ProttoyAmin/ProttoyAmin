"use client";

import { Globe, Mail, Music2, type LucideIcon } from "lucide-react";

import {
  GitHubIcon,
  LinkedInIcon,
  XIcon,
  YouTubeIcon,
} from "@/client/site/brand-icons";

const ICONS: Record<string, LucideIcon> = {
  mail: Mail,
  email: Mail,
  music: Music2,
  web: Globe,
  globe: Globe,
};

const BRAND_ICONS: Record<string, LucideIcon> = {
  github: GitHubIcon as unknown as LucideIcon,
  linkedin: LinkedInIcon as unknown as LucideIcon,
  x: XIcon as unknown as LucideIcon,
  twitter: XIcon as unknown as LucideIcon,
  youtube: YouTubeIcon as unknown as LucideIcon,
};

export function socialIcon(platform: string): LucideIcon {
  const key = platform.toLowerCase();
  return BRAND_ICONS[key] ?? ICONS[key] ?? Globe;
}
