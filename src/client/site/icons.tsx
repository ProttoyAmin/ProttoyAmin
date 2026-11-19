"use client";

import { Globe, Mail, Music2, type IconComponent } from "@/components/ui/icons";

import { GitHubIcon, LinkedInIcon, XIcon, YouTubeIcon } from "@/client/site/brand-icons";

const ICONS: Record<string, IconComponent> = {
  mail: Mail,
  email: Mail,
  music: Music2,
  web: Globe,
  globe: Globe,
};

const BRAND_ICONS: Record<string, IconComponent> = {
  github: GitHubIcon as unknown as IconComponent,
  linkedin: LinkedInIcon as unknown as IconComponent,
  x: XIcon as unknown as IconComponent,
  twitter: XIcon as unknown as IconComponent,
  youtube: YouTubeIcon as unknown as IconComponent,
};

export function socialIcon(platform: string): IconComponent {
  const key = platform.toLowerCase();
  return BRAND_ICONS[key] ?? ICONS[key] ?? Globe;
}
