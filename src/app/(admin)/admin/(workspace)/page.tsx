import { OverviewPanel } from "@/client/admin/overview-panel";
import { getOwnerContext } from "@/server/auth/owner";
import { getRepositories, getRuntimeStatus } from "@/server/db/registry";

export const dynamic = "force-dynamic";

export const metadata = { title: "Overview" };

/** Admin → Overview. */
export default async function AdminOverviewPage() {
  const context = await getOwnerContext();
  if ("error" in context) return null;

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
    <OverviewPanel
      data={{
        owner: context.user,
        projects: realProjects.length > 0 ? realProjects : projects,
        experiences:
          realExperiences.length > 0 ? realExperiences : experiences,
        skills: realSkills.length > 0 ? realSkills : skills,
        posts: realPosts.length > 0 ? realPosts : posts,
        messages,
        media,
        audit,
        demo: {
          settings: false,
          projects: realProjects.length === 0,
          experiences: realExperiences.length === 0,
          skills: realSkills.length === 0,
          posts: realPosts.length === 0,
        },
        runtime: getRuntimeStatus(),
      }}
    />
  );
}
