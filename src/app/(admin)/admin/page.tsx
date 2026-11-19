import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { AdminShell } from "@/client/admin/shell";
import { Button } from "@/components/ui/button";
import { getOwnerContext } from "@/server/auth/owner";
import { getRepositories } from "@/server/db/registry";

export const dynamic = "force-dynamic";

function AccessDenied({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-danger/15 text-danger">
        <ShieldAlert className="h-6 w-6" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        Access restricted
      </h1>
      <p className="mt-3 text-sm text-muted">{message}</p>
      <p className="mt-2 text-sm text-muted">
        Only the account listed in <code>settings.ownerEmail</code> can manage
        this site.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/admin/login">
          <Button variant="outline">Sign in as the owner</Button>
        </Link>
        <Link href="/">
          <Button>Back to the site</Button>
        </Link>
      </div>
    </main>
  );
}

export default async function AdminPage() {
  const context = await getOwnerContext();

  if ("error" in context) {
    return <AccessDenied message={context.message} />;
  }

  const repositories = await getRepositories();

  const [projects, experiences, skills, posts, messages, media, audit] =
    await Promise.all([
      repositories.projects.list({}, { order: 1, createdAt: -1 }),
      repositories.experiences.list({}, { order: 1, startDate: -1 }),
      repositories.skills.list({}, { category: 1, order: 1 }),
      repositories.posts.list({}, { createdAt: -1 }),
      repositories.messages.list({}, { createdAt: -1 }),
      repositories.media.list({}, { createdAt: -1 }),
      repositories.auditLogs.listRecent(30),
    ]);

  const realProjects = projects.filter((project) => !project.isDummy);
  const realExperiences = experiences.filter((item) => !item.isDummy);
  const realSkills = skills.filter((item) => !item.isDummy);
  const realPosts = posts.filter((item) => !item.isDummy);

  return (
    <AdminShell
      data={{
        owner: context.user,
        settings: context.settings,
        projects: realProjects.length > 0 ? realProjects : projects,
        experiences:
          realExperiences.length > 0 ? realExperiences : experiences,
        skills: realSkills.length > 0 ? realSkills : skills,
        posts: realPosts.length > 0 ? realPosts : posts,
        messages,
        media,
        audit,
        demo: {
          settings: !context.settings?.ownerEmail,
          projects: realProjects.length === 0,
          experiences: realExperiences.length === 0,
          skills: realSkills.length === 0,
          posts: realPosts.length === 0,
        },
        runtime: (await import("@/server/db/registry")).getRuntimeStatus(),
      }}
    />
  );
}
