import { SkillsPanel } from "@/client/admin/skills-panel";
import { getRepositories } from "@/server/db/registry";

export const dynamic = "force-dynamic";

export const metadata = { title: "Skills" };

/** Admin → Skills. */
export default async function AdminSkillsPage() {
  const repositories = await getRepositories();
  const skills = await repositories.skills.list({}, { category: 1, order: 1 });
  const real = skills.filter((item) => !item.isDummy);

  return <SkillsPanel data={{ skills: real.length > 0 ? real : skills }} />;
}
