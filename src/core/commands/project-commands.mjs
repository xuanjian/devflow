import { normalizeCommandResult } from "../contracts/devflow-types.mjs";

export async function addProject(repository, input = {}) {
  const project = {
    id: input.projectId,
    name: input.name || input.projectId,
    technologyFamilyId: input.technologyFamilyId || "",
    path: input.projectPath || input.path || "."
  };

  await repository.writeProject(project);

  return normalizeCommandResult({
    status: "ok",
    action: "addProject",
    entityType: "project",
    entityId: project.id,
    message: `Added project ${project.id}.`,
    paths: []
  });
}
