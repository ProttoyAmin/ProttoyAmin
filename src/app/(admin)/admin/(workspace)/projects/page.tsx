import { ProjectsPanel } from "@/client/admin/projects-panel";
import { getRepositories } from "@/server/db/registry";

export const dynamic = "force-dynamic";

export const metadata = { title: "Projects" };

/** Admin → Projects. */
export default async function AdminProjectsPage() {
  const repositories = await getRepositories();

  const [projects, media] = await Promise.all([
    repositories.projects.list({}, { order: 1, createdAt: -1 }),
    repositories.media.list({}, { createdAt: -1 }),
  ]);

  const real = projects.filter((project) => !project.isDummy);

  return (
    <ProjectsPanel
      data={{
        projects: real.length > 0 ? real : projects,
        media,
        demo: { projects: real.length === 0 },
      }}
    />
  );
}
