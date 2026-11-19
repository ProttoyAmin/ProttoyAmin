/**
 * Seeds the demo content into the configured database.
 *
 * Usage: npm run seed:dummy
 *
 * With MONGODB_URI set the demo rows are written to Atlas; without it they
 * land in the local JSON store at .data/db.json.
 */

import { getRepositories, getRuntimeStatus } from "../src/server/db/registry";
import {
  DUMMY_EXPERIENCES,
  DUMMY_POSTS,
  DUMMY_PROJECTS,
  DUMMY_SETTINGS,
  DUMMY_SKILLS,
} from "../src/seed/dummy";

async function main() {
  const repositories = await getRepositories();
  const status = getRuntimeStatus();

  console.log(`→ driver: ${status.db.driver}`);

  const settings = await repositories.settings.get();
  if (!settings) {
    await repositories.settings.save({ ...DUMMY_SETTINGS });
    console.log("✓ settings created");
  } else {
    console.log("· settings already exist — left untouched");
  }

  for (const project of DUMMY_PROJECTS) {
    const existing = await repositories.projects.getBySlug(project.slug);
    if (existing) continue;
    const { id: _id, createdAt: _c, updatedAt: _u, ...payload } = project;
    await repositories.projects.create(payload);
    console.log(`✓ project: ${project.title}`);
  }

  for (const experience of DUMMY_EXPERIENCES) {
    const existing = await repositories.experiences.getById(experience.id);
    if (existing) continue;
    const { id: _id, createdAt: _c, updatedAt: _u, ...payload } = experience;
    await repositories.experiences.create(payload);
    console.log(`✓ experience: ${experience.role} @ ${experience.company}`);
  }

  for (const skill of DUMMY_SKILLS) {
    const existing = await repositories.skills.getById(skill.id);
    if (existing) continue;
    const { id: _id, createdAt: _c, updatedAt: _u, ...payload } = skill;
    await repositories.skills.create(payload);
    console.log(`✓ skill: ${skill.name}`);
  }

  for (const post of DUMMY_POSTS) {
    const existing = await repositories.posts.getBySlug(post.slug);
    if (existing) continue;
    const { id: _id, createdAt: _c, updatedAt: _u, ...payload } = post;
    await repositories.posts.create(payload);
    console.log(`✓ post: ${post.title}`);
  }

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
