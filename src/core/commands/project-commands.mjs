import { normalizeCommandResult } from "../contracts/devflow-types.mjs";

export async function addProject(repository, input = {}) {
  const project = {
    id: input.projectId,
    name: input.name || input.projectId,
    technologyFamilyId: input.technologyFamilyId || "",
    path: input.projectPath || input.path || ".",
    products: normalizeStringList(input.products),
    domains: normalizeStringList(input.domains),
    role: normalizeString(input.role)
  };

  if (input.dryRun) {
    const existing = project.id && typeof repository.getProject === "function"
      ? await repository.getProject(project.id)
      : null;
    return {
      ...normalizeCommandResult({
        status: "noop",
        action: "addProject",
        entityType: "project",
        entityId: project.id,
        message: "Dry run only. SQLite was not changed.",
        paths: []
      }),
      project,
      before: existing,
      willWrite: JSON.stringify(existing) !== JSON.stringify(project)
    };
  }

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

function normalizeStringList(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => normalizeString(value))
    .filter(Boolean))];
}

function normalizeString(value) {
  return String(value ?? "").trim();
}
