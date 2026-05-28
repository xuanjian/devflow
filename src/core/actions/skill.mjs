import path from "node:path";
import {
  actionCommands,
  actionError,
  actionOk,
  importSkillDirectory,
  listFromBody,
  loadProjectsByIdsFromStore,
  makeSkillMount,
  normalizeId,
  removeGeneratedSource,
  removeProjectMountInStore,
  resolveSkillDir,
  upsertById
} from "./shared.mjs";

export const skillActions = {
  add_skill_from_path: { run: addSkillFromPath },
  delete_skill: { run: deleteSkill }
};

export async function addSkillFromPath({ rootPath, actionId, body }) {
  const commands = await actionCommands(rootPath);
  const skillPath = body?.skillPath ? path.resolve(String(body.skillPath)) : "";
  if (!skillPath) {
    return actionError(actionId, "invalid_skill_path", "新增技能需要填写 skill 路径。");
  }
  const skillDir = await resolveSkillDir(skillPath);
  if (!skillDir) {
    return actionError(actionId, "invalid_skill_path", `未找到 SKILL.md: ${skillPath}`);
  }
  const skillCatalog = { version: 1, skills: await commands.listSkills() };
  const imported = await importSkillDirectory(rootPath, skillDir, {
    id: normalizeId(body?.skillId || path.basename(skillDir)),
    name: body?.name,
    description: body?.description,
    projectIds: listFromBody(body?.projectIds),
    catalog: skillCatalog
  });
  await commands.writeSkill(imported.skill);
  imported.changedPaths.push("data/devflow.db");
  const projects = await loadProjectsByIdsFromStore(commands, listFromBody(body?.projectIds));
  for (const project of projects) {
    project.skills = project.skills || [];
    upsertById(project.skills, makeSkillMount(imported.skill));
    await commands.writeProject(project);
  }
  return actionOk(actionId, `新增技能 ${imported.skill.name}，已挂载 ${projects.length} 个项目。`, imported.changedPaths);
}

export async function deleteSkill({ rootPath, actionId, body }) {
  const commands = await actionCommands(rootPath);
  const id = normalizeId(body?.skillId || body?.id || body?.name);
  if (!id) return actionError(actionId, "invalid_skill_id", "删除 skill 需要填写 skillId。");

  const skill = (await commands.listSkills()).find((item) => item.id === id);
  if (!skill) return actionError(actionId, "unknown_skill", `Unknown skillId: ${id}`);

  const changedPaths = [];
  await commands.deleteSkill(id);
  changedPaths.push("data/devflow.db");
  await removeProjectMountInStore(commands, "skills", id, skill.sourcePath);
  changedPaths.push(...await removeGeneratedSource(rootPath, skill.sourcePath, "bundles/skills/"));

  return actionOk(actionId, `删除 skill ${id}。`, changedPaths);
}
