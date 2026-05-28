import { normalizeCommandResult } from "../contracts/devflow-types.mjs";
import { createSqliteRepository } from "../repositories/sqlite-repository.mjs";
import { ensureSqliteDatabase } from "../storage/sqlite-bootstrap.mjs";
import { deleteTask as deleteTaskCommand, finishTask as finishTaskCommand } from "./task-commands.mjs";

export async function createActionCommandService({ rootDir }) {
  await ensureSqliteDatabase({ rootDir });
  const repository = createSqliteRepository({ rootDir });
  return {
    listProjects: () => repository.listProjects(),
    getProject: (projectId) => repository.getProject(projectId),
    listSceneTemplates: () => repository.listSceneTemplates(),
    getSceneTemplate: (sceneTemplateId) => repository.getSceneTemplate(sceneTemplateId),
    listSkills: () => repository.listSkills(),
    listRules: () => repository.listRules(),
    listTasks: () => repository.listTasks(),
    getTask: (taskId) => repository.getTask(taskId),
    getActiveTask: () => repository.getActiveTask(),
    getConfig: (key) => repository.getConfig(key),
    getProfile: () => repository.getProfile(),
    writeProject: (project) => writeProject(repository, project),
    writeSceneTemplate: (sceneTemplate) => writeSceneTemplate(repository, sceneTemplate),
    writeSkill: (skill) => writeSkill(repository, skill),
    writeRule: (rule) => writeRule(repository, rule),
    writeTask: (task) => writeTask(repository, task),
    finishTask: (input) => finishTaskCommand(repository, { rootDir, ...input }),
    deleteTask: (input) => deleteTaskCommand(repository, { rootDir, ...input }),
    setRuntimeState: (runtimeState) => setRuntimeState(repository, runtimeState),
    setConfig: (key, value) => setConfig(repository, key, value),
    deleteProject: (projectId) => deleteProject(repository, projectId),
    deleteSceneTemplate: (sceneTemplateId) => deleteSceneTemplate(repository, sceneTemplateId),
    deleteSkill: (skillId) => deleteSkill(repository, skillId),
    deleteRule: (ruleId) => deleteRule(repository, ruleId)
  };
}

async function writeProject(repository, project) {
  await repository.writeProject(project);
  return commandResult("writeProject", "project", project.id);
}

async function writeSceneTemplate(repository, sceneTemplate) {
  await repository.writeSceneTemplate(sceneTemplate);
  return commandResult("writeSceneTemplate", "sceneTemplate", sceneTemplate.id);
}

async function writeSkill(repository, skill) {
  await repository.writeSkill(skill);
  return commandResult("writeSkill", "skill", skill.id);
}

async function writeRule(repository, rule) {
  await repository.writeRule(rule);
  return commandResult("writeRule", "rule", rule.id);
}

async function writeTask(repository, task) {
  await repository.writeTask(task);
  return commandResult("writeTask", "task", task.id);
}

async function setRuntimeState(repository, runtimeState) {
  await repository.setRuntimeState(runtimeState);
  return commandResult("setRuntimeState");
}

async function setConfig(repository, key, value) {
  await repository.setConfig(key, value);
  return commandResult("setConfig");
}

async function deleteProject(repository, projectId) {
  await repository.deleteProject(projectId);
  return commandResult("deleteProject", "project", projectId);
}

async function deleteSceneTemplate(repository, sceneTemplateId) {
  await repository.deleteSceneTemplate(sceneTemplateId);
  return commandResult("deleteSceneTemplate", "sceneTemplate", sceneTemplateId);
}

async function deleteSkill(repository, skillId) {
  await repository.deleteSkill(skillId);
  return commandResult("deleteSkill", "skill", skillId);
}

async function deleteRule(repository, ruleId) {
  await repository.deleteRule(ruleId);
  return commandResult("deleteRule", "rule", ruleId);
}

function commandResult(action, entityType, entityId) {
  return normalizeCommandResult({
    status: "ok",
    action,
    entityType,
    entityId,
    message: entityId ? `${action} ${entityId}` : `${action} complete.`,
    paths: ["data/devflow.db"]
  });
}
