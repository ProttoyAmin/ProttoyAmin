import { ExperiencePanel } from "@/client/admin/experience-panel";
import { getRepositories } from "@/server/db/registry";

export const dynamic = "force-dynamic";

export const metadata = { title: "Experience" };

/** Admin → Experience. */
export default async function AdminExperiencePage() {
  const repositories = await getRepositories();

  const [experiences, media] = await Promise.all([
    repositories.experiences.list({}, { order: 1, startDate: -1 }),
    repositories.media.list({}, { createdAt: -1 }),
  ]);

  const real = experiences.filter((item) => !item.isDummy);

  return (
    <ExperiencePanel
      data={{
        experiences: real.length > 0 ? real : experiences,
        media,
      }}
    />
  );
}
