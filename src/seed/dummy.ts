import "server-only";

import type {
  Experience,
  Post,
  Project,
  SiteSettings,
  Skill,
} from "@/server/types";

/**
 * Demo content.
 *
 * These documents are what a visitor sees before the owner publishes their
 * own material. They live in code (not in the database) so the MongoDB
 * cluster is never polluted with placeholder rows; the local memory driver
 * copies them in so the admin panel can be exercised end to end.
 *
 * Resolution contract (see `src/server/services/content.service.ts`):
 * real content always wins, per collection.
 */

const now = "2026-01-01T00:00:00.000Z";

export const DUMMY_SETTINGS: SiteSettings = {
  id: "site",
  ownerEmail: "",
  siteTitle: "Prottoy Amin — Software Engineer",
  tagline: "I build dependable products and the systems behind them.",
  description:
    "Full-stack engineer working across product, platform and applied machine learning.",
  hero: {
    greeting: "Hi, I'm Prottoy",
    headline: "Full-stack engineer building fast, resilient products.",
    subheadline:
      "I work across the stack — from typed React interfaces to Go services, MongoDB data models and the pipelines that keep them healthy.",
    ctaLabel: "View my work",
    ctaHref: "#work",
    secondaryCtaLabel: "Get in touch",
    secondaryCtaHref: "#contact",
    portraitUrl: "/demo/portrait.svg",
    portraitAlt: "Portrait of Prottoy Amin",
  },
  socials: [
    {
      platform: "github",
      label: "GitHub",
      url: "https://github.com/ProttoyAmin",
      icon: "github",
    },
    {
      platform: "linkedin",
      label: "LinkedIn",
      url: "https://linkedin.com/in/md-jahid-bin-amin-a45194228/",
      icon: "linkedin",
    },
    {
      platform: "x",
      label: "X",
      url: "https://x.com/jahid_bin1647",
      icon: "x",
    },
    {
      platform: "email",
      label: "Email",
      url: "mailto:md.jahid.bin.amin@gmail.com",
      icon: "mail",
    },
  ],
  theme: {
    default: "dark",
    accent: "#7c5cff",
  },
  features: {
    contactEnabled: true,
    writingEnabled: true,
    twoFactorEnabled: false,
  },
  seo: {
    ogImageUrl: "/demo/og.svg",
    keywords: [
      "Prottoy Amin",
      "full stack engineer",
      "react",
      "next.js",
      "mongodb",
      "golang",
    ],
    author: "Prottoy Amin",
    location: "Dhaka, Bangladesh",
  },
  createdAt: now,
  updatedAt: now,
};

export const DUMMY_PROJECTS: Project[] = [
  {
    id: "100000000000000000000001",
    title: "Insight Analytics Studio",
    slug: "insight-analytics-studio",
    summary:
      "Real-time product analytics dashboard with streaming events, cohort retention and shareable reports.",
    description:
      "A streaming analytics platform that turns raw product events into decision-ready dashboards.\n\n**Highlights**\n\n- Event pipeline ingesting ~2M events/day through a Go collector\n- Cohort and retention models computed incrementally in MongoDB aggregation pipelines\n- Dashboard UI built with Next.js App Router and streaming server components\n- Role-scoped workspaces with audit trails for every export",
    coverImage: {
      url: "/demo/project-1.svg",
      alt: "Insight Analytics Studio dashboard preview",
      width: 1200,
      height: 800,
    },
    gallery: [],
    tags: ["Next.js", "TypeScript", "MongoDB", "Go", "Realtime"],
    links: {
      repo: "https://github.com/ProttoyAmin",
      live: "https://example.com",
    },
    featured: true,
    published: true,
    order: 1,
    metrics: [
      { label: "Events / day", value: "2M" },
      { label: "p95 render", value: "180ms" },
      { label: "Dashboards", value: "40+" },
    ],
    seo: { title: "", description: "" },
    isDummy: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "100000000000000000000002",
    title: "Prompt Lab",
    slug: "prompt-lab",
    summary:
      "A playground for building, evaluating and versioning LLM prompts with reproducible runs.",
    description:
      "An experimentation surface for prompt engineering: every prompt is versioned, every run is reproducible, and evaluation suites gate promotions to production.\n\n**Highlights**\n\n- Deterministic run comparison with token and latency budgets\n- Side-by-side evaluation of multiple models and prompt variants\n- Python evaluation service with a typed FastAPI boundary\n- One-click export of winning prompts as typed SDK snippets",
    coverImage: {
      url: "/demo/project-2.svg",
      alt: "Prompt Lab interface preview",
      width: 1200,
      height: 800,
    },
    gallery: [],
    tags: ["React", "Python", "FastAPI", "LLM", "Evaluation"],
    links: {
      repo: "https://github.com/ProttoyAmin",
    },
    featured: true,
    published: true,
    order: 2,
    metrics: [
      { label: "Runs stored", value: "120k" },
      { label: "Models supported", value: "8" },
      { label: "Avg. latency", value: "1.2s" },
    ],
    seo: { title: "", description: "" },
    isDummy: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "100000000000000000000003",
    title: "Commerce Core",
    slug: "commerce-core",
    summary:
      "Headless commerce backend handling catalogue, cart, pricing rules and order orchestration.",
    description:
      "A commerce service built for catalogues that outgrow a single monolith.\n\n**Highlights**\n\n- Idempotent order pipeline with compensating actions\n- Rule-based pricing engine (bundles, tiers, regional pricing)\n- Dockerised deployment on Kubernetes with horizontal autoscaling\n- Contract-tested integrations for payments and fulfilment",
    coverImage: {
      url: "/demo/project-3.svg",
      alt: "Commerce Core architecture preview",
      width: 1200,
      height: 800,
    },
    gallery: [],
    tags: ["Go", "PostgreSQL", "Docker", "Kubernetes", "AWS"],
    links: {
      repo: "https://github.com/ProttoyAmin",
      caseStudy: "https://example.com",
    },
    featured: false,
    published: true,
    order: 3,
    metrics: [
      { label: "Orders / day", value: "18k" },
      { label: "Uptime", value: "99.98%" },
      { label: "Deploys / week", value: "12" },
    ],
    seo: { title: "", description: "" },
    isDummy: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "100000000000000000000004",
    title: "Atlas Design System",
    slug: "atlas-design-system",
    summary:
      "Accessible component library and design-token pipeline shared across four product teams.",
    description:
      "A design system that ships tokens, components and documentation as one artifact.\n\n**Highlights**\n\n- Token pipeline from a single source of truth to CSS, Figma and mobile\n- 42 accessible components built on Radix primitives\n- Visual regression tests and automated accessibility audits in CI\n- Adoption dashboard tracking usage across the organisation",
    coverImage: {
      url: "/demo/project-4.svg",
      alt: "Atlas Design System components preview",
      width: 1200,
      height: 800,
    },
    gallery: [],
    tags: ["React", "Tailwind", "Radix UI", "Storybook"],
    links: {
      repo: "https://github.com/ProttoyAmin",
      live: "https://example.com",
    },
    featured: false,
    published: true,
    order: 4,
    metrics: [
      { label: "Components", value: "42" },
      { label: "Teams using it", value: "4" },
      { label: "A11y score", value: "100" },
    ],
    seo: { title: "", description: "" },
    isDummy: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "100000000000000000000005",
    title: "Vision Notebook",
    slug: "vision-notebook",
    summary:
      "Experiment tracker for computer-vision models: datasets, runs and model registry in one place.",
    description:
      "Reproducible machine-learning experimentation without the spreadsheet sprawl.\n\n**Highlights**\n\n- Dataset versioning with content hashing\n- Distributed training runs tracked by a Python SDK\n- Model registry with automatic promotion gates\n- Dashboards for accuracy, drift and cost per inference",
    coverImage: {
      url: "/demo/project-5.svg",
      alt: "Vision Notebook experiment tracking preview",
      width: 1200,
      height: 800,
    },
    gallery: [],
    tags: ["Python", "PyTorch", "TensorFlow", "MLOps"],
    links: {
      repo: "https://github.com/ProttoyAmin",
    },
    featured: false,
    published: true,
    order: 5,
    metrics: [
      { label: "Models tracked", value: "320" },
      { label: "Datasets", value: "64" },
      { label: "Cost saved", value: "38%" },
    ],
    seo: { title: "", description: "" },
    isDummy: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "100000000000000000000006",
    title: "Signal Board",
    slug: "signal-board",
    summary:
      "Realtime collaborative whiteboard with presence, cursors and an offline-first sync engine.",
    description:
      "A multiplayer canvas that stays consistent under flaky networks.\n\n**Highlights**\n\n- CRDT-based document model with deterministic replay\n- Presence, cursor and selection broadcasting over WebSockets\n- Offline queue with background reconciliation\n- Snapshots persisted as compressed diffs",
    coverImage: {
      url: "/demo/project-6.svg",
      alt: "Signal Board collaborative canvas preview",
      width: 1200,
      height: 800,
    },
    gallery: [],
    tags: ["TypeScript", "Node.js", "Socket.io", "Redis"],
    links: {
      repo: "https://github.com/ProttoyAmin",
    },
    featured: false,
    published: true,
    order: 6,
    metrics: [
      { label: "Concurrent users", value: "500" },
      { label: "Sync latency", value: "40ms" },
      { label: "Conflicts", value: "0" },
    ],
    seo: { title: "", description: "" },
    isDummy: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const DUMMY_EXPERIENCES: Experience[] = [
  {
    id: "200000000000000000000001",
    company: "Northwind Labs",
    role: "Senior Product Engineer",
    employmentType: "Full-time",
    location: "Remote",
    startDate: "2024-02",
    description: [
      "Led the rebuild of the customer-facing analytics product from a jQuery front end to a typed React codebase.",
      "Designed the event pipeline and data models behind a real-time dashboard used by 40+ teams.",
      "Introduced preview environments and automated accessibility checks, cutting release defects by a third.",
    ],
    technologies: ["React", "TypeScript", "Node.js", "MongoDB", "AWS"],
    published: true,
    order: 1,
    isDummy: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "200000000000000000000002",
    company: "Brightlane",
    role: "Full-stack Engineer",
    employmentType: "Full-time",
    location: "Dhaka, Bangladesh",
    startDate: "2022-06",
    description: [
      "Built and maintained the billing and provisioning services behind a B2B subscription product.",
      "Migrated a relational reporting workload to an event-driven architecture with replayable pipelines.",
      "Mentored two junior engineers through their first production deployments.",
    ],
    technologies: ["Go", "PostgreSQL", "Docker", "Redis", "GCP"],
    published: true,
    order: 2,
    isDummy: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "200000000000000000000003",
    company: "Corvus Systems",
    role: "Software Engineer",
    employmentType: "Full-time",
    location: "Dhaka, Bangladesh",
    startDate: "2021-01",
    description: [
      "Shipped REST and GraphQL APIs consumed by three client products.",
      "Cut average API response time in half by introducing query caching and read replicas.",
      "Set up the first automated CI pipeline with integration and load tests.",
    ],
    technologies: ["Node.js", "Express", "MySQL", "Docker"],
    published: true,
    order: 3,
    isDummy: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "200000000000000000000004",
    company: "Open Source",
    role: "Maintainer & Contributor",
    employmentType: "Volunteer",
    location: "Remote",
    startDate: "2020-03",
    description: [
      "Maintain a widely used CLI for scaffolding production-ready services.",
      "Review community pull requests and triage issue backlogs every week.",
      "Wrote migration guides that helped thousands of developers upgrade across major versions.",
    ],
    technologies: ["TypeScript", "Go", "Python"],
    published: true,
    order: 4,
    isDummy: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const DUMMY_SKILLS: Skill[] = [
  { name: "React", category: "Frontend", icon: "⚛️", proficiency: 5, published: true, order: 1, isDummy: true, id: "300000000000000000000001", createdAt: now, updatedAt: now },
  { name: "Next.js", category: "Frontend", icon: "▲", proficiency: 5, published: true, order: 2, isDummy: true, id: "300000000000000000000001", createdAt: now, updatedAt: now },
  { name: "TypeScript", category: "Frontend", icon: "🟦", proficiency: 5, published: true, order: 3, isDummy: true, id: "300000000000000000000002", createdAt: now, updatedAt: now },
  { name: "Tailwind CSS", category: "Frontend", icon: "🎨", proficiency: 5, published: true, order: 4, isDummy: true, id: "300000000000000000000003", createdAt: now, updatedAt: now },
  { name: "React Query", category: "Frontend", icon: "🔁", proficiency: 4, published: true, order: 5, isDummy: true, id: "300000000000000000000004", createdAt: now, updatedAt: now },
  { name: "Node.js", category: "Backend", icon: "🟩", proficiency: 5, published: true, order: 1, isDummy: true, id: "6a1a2b3c4d5e600000000001", createdAt: now, updatedAt: now },
  { name: "Express", category: "Backend", icon: "🅧", proficiency: 4, published: true, order: 2, isDummy: true, id: "6a1a2b3c4d5e600000000002", createdAt: now, updatedAt: now },
  { name: "Go", category: "Backend", icon: "🐹", proficiency: 4, published: true, order: 3, isDummy: true, id: "6a1a2b3c4d5e600000000003", createdAt: now, updatedAt: now },
  { name: "Python", category: "Backend", icon: "🐍", proficiency: 4, published: true, order: 4, isDummy: true, id: "6a1a2b3c4d5e600000000004", createdAt: now, updatedAt: now },
  { name: "Django", category: "Backend", icon: "🎸", proficiency: 3, published: true, order: 5, isDummy: true, id: "6a1a2b3c4d5e600000000005", createdAt: now, updatedAt: now },
  { name: "MongoDB", category: "Database", icon: "🍃", proficiency: 5, published: true, order: 1, isDummy: true, id: "7a1a2b3c4d5e600000000001", createdAt: now, updatedAt: now },
  { name: "PostgreSQL", category: "Database", icon: "🐘", proficiency: 4, published: true, order: 2, isDummy: true, id: "7a1a2b3c4d5e600000000002", createdAt: now, updatedAt: now },
  { name: "Redis", category: "Database", icon: "🧱", proficiency: 4, published: true, order: 3, isDummy: true, id: "7a1a2b3c4d5e600000000003", createdAt: now, updatedAt: now },
  { name: "AWS", category: "Cloud & DevOps", icon: "☁️", proficiency: 4, published: true, order: 1, isDummy: true, id: "8a1a2b3c4d5e600000000001", createdAt: now, updatedAt: now },
  { name: "Docker", category: "Cloud & DevOps", icon: "🐳", proficiency: 4, published: true, order: 2, isDummy: true, id: "8a1a2b3c4d5e600000000002", createdAt: now, updatedAt: now },
  { name: "Kubernetes", category: "Cloud & DevOps", icon: "☸️", proficiency: 3, published: true, order: 3, isDummy: true, id: "8a1a2b3c4d5e600000000003", createdAt: now, updatedAt: now },
  { name: "Nginx", category: "Cloud & DevOps", icon: "🧿", proficiency: 4, published: true, order: 4, isDummy: true, id: "8a1a2b3c4d5e600000000004", createdAt: now, updatedAt: now },
  { name: "Git", category: "Tooling", icon: "🌿", proficiency: 5, published: true, order: 1, isDummy: true, id: "9a1a2b3c4d5e600000000001", createdAt: now, updatedAt: now },
  { name: "Jest & Vitest", category: "Tooling", icon: "🧪", proficiency: 4, published: true, order: 2, isDummy: true, id: "9a1a2b3c4d5e600000000002", createdAt: now, updatedAt: now },
  { name: "PyTorch", category: "AI & ML", icon: "🔥", proficiency: 3, published: true, order: 1, isDummy: true, id: "a1a2b3c4d5e600000000001", createdAt: now, updatedAt: now },
  { name: "TensorFlow", category: "AI & ML", icon: "🧠", proficiency: 3, published: true, order: 2, isDummy: true, id: "a1a2b3c4d5e600000000002", createdAt: now, updatedAt: now },
  { name: "Pandas", category: "AI & ML", icon: "🐼", proficiency: 4, published: true, order: 3, isDummy: true, id: "a1a2b3c4d5e600000000003", createdAt: now, updatedAt: now },
];

export const DUMMY_POSTS: Post[] = [
  {
    id: "400000000000000000000001",
    title: "Designing event pipelines that survive rewind",
    slug: "designing-event-pipelines-that-survive-rewind",
    excerpt:
      "Idempotency, replay and the quiet discipline of treating every event as something you might have to process twice.",
    content:
      "Every event-driven system eventually processes the same event twice. The question is not whether it happens, but whether your pipeline is built to survive it.\n\n## Start with the assumption\n\nAssume at-least-once delivery. Write handlers that can run twice without changing the outcome, and pick idempotency keys that come from the domain, not from the transport.\n\n## Keep an audit trail\n\nPersist the outcome of every handler run. When a replay happens you want to see *what changed*, not just *that something ran*.\n\n> The cheapest incident is the one your audit log explains in five minutes.",
    coverImage: { url: "/demo/project-1.svg", alt: "Event pipeline diagram" },
    tags: ["Architecture", "Eventing", "Reliability"],
    readingTimeMinutes: 4,
    published: true,
    publishedAt: "2026-01-10T00:00:00.000Z",
    seo: { title: "", description: "" },
    isDummy: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "400000000000000000000002",
    title: "TypeScript types are a design tool",
    slug: "typescript-types-are-a-design-tool",
    excerpt:
      "How discriminated unions and branded types move decisions to compile time — and keep them there.",
    content:
      "Types are often treated as documentation that happens to be checked. In practice they are the cheapest place to encode a decision.\n\n## Encode the states, not the flags\n\nA status string plus three booleans is three states plus two impossible ones. A discriminated union removes the impossible states entirely.\n\n## Brand your identifiers\n\nA branded type costs one line and prevents an entire class of bug.",
    coverImage: { url: "/demo/project-4.svg", alt: "TypeScript type diagram" },
    tags: ["TypeScript", "Design"],
    readingTimeMinutes: 3,
    published: true,
    publishedAt: "2025-12-02T00:00:00.000Z",
    seo: { title: "", description: "" },
    isDummy: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "400000000000000000000003",
    title: "Shipping a design system without a rewrite",
    slug: "shipping-a-design-system-without-a-rewrite",
    excerpt:
      "Tokens first, components second, adoption last — and none of it requiring a big-bang migration.",
    content:
      "Design systems fail when they are positioned as a rewrite. They succeed when they are positioned as a shortcut.\n\n## Tokens first\n\nShip a single source of truth for colour, spacing and type. Everything else can follow at the team's pace.\n\n## Make the old path still work\n\nEvery migration plan that removes the old path stops being migrated.",
    coverImage: { url: "/demo/project-6.svg", alt: "Design system adoption chart" },
    tags: ["Design Systems", "Frontend"],
    readingTimeMinutes: 3,
    published: true,
    publishedAt: "2025-11-18T00:00:00.000Z",
    seo: { title: "", description: "" },
    isDummy: true,
    createdAt: now,
    updatedAt: now,
  },
];

export const DUMMY_DATA = {
  settings: DUMMY_SETTINGS,
  projects: DUMMY_PROJECTS,
  experiences: DUMMY_EXPERIENCES,
  skills: DUMMY_SKILLS,
  posts: DUMMY_POSTS,
};
