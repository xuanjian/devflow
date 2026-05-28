import {
  normalizeQueryRouteResult,
  normalizeSceneTemplate,
  normalizeWorkset
} from "../contracts/devflow-types.mjs";
import { queryRules, querySkills } from "./current-query.mjs";

export async function queryRoute(repository, { text = "" } = {}) {
  const sourceText = String(text || "");
  const [projects, sceneTemplates] = await Promise.all([
    repository.listProjects(),
    repository.listSceneTemplates()
  ]);
  const sceneTemplate = findBestSceneTemplate(sceneTemplates, projects, sourceText);
  const selectedProjects = await resolveProjects(repository, projects, sceneTemplate, sourceText);
  const templateId = sceneTemplate?.id;
  const projectIds = selectedProjects.map((project) => project.id).filter(Boolean);
  const skills = (await querySkills(repository, { projectId: projectIds[0], templateId })).skills;
  const rules = (await queryRules(repository, { projectId: projectIds[0], templateId })).rules;
  const workset = sceneTemplate || selectedProjects.length > 0 ? normalizeWorkset({
    id: sceneTemplate?.id ? `workset-route-${sceneTemplate.id}` : "workset-route-ad-hoc",
    sourceText,
    confidence: sceneTemplate ? "medium" : "low",
    reason: sceneTemplate ? "Matched template keywords or project hints." : "Matched project metadata.",
    sceneTemplateId: sceneTemplate?.id,
    capabilities: (sceneTemplate?.capabilityIds || []).map((id) => ({ id })),
    projects: selectedProjects.map((project) => ({ id: project.id, role: project.role || "primary" })),
    skills: skills.map((skill) => ({ id: skill.id })),
    rules: rules.map((rule) => ({ id: rule.id }))
  }) : null;

  return normalizeQueryRouteResult({
    mode: inferRouteMode(sourceText, Boolean(sceneTemplate || selectedProjects.length)),
    sceneTemplate: sceneTemplate ? {
      ...normalizeSceneTemplate(sceneTemplate),
      confidence: "medium",
      reason: "Matched template keywords or project hints."
    } : null,
    workset,
    skills,
    rules,
    readPaths: collectReadPaths({ sceneTemplate, projects: selectedProjects, skills, rules }),
    nextAction: workset ? "Inspect selected project context." : "No DevFlow context selected."
  });
}

function inferRouteMode(text, hasMatch) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return "none";
  }
  if (/\b(resume|continue|current|last)\b|继续|恢复/.test(normalized)) {
    return "resume";
  }
  if (/\b(jira|notion|figma|prd|openspec|cross-project|high-risk)\b|高风险|跨项目/.test(normalized)) {
    return "full";
  }
  return hasMatch ? "light" : "none";
}

function findBestSceneTemplate(sceneTemplates, projects, text) {
  const scored = sceneTemplates
    .map((template) => ({ template, score: scoreTemplate(template, projects, text) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.template || null;
}

function scoreTemplate(template, projects, text) {
  const haystack = normalizeText([
    template.id,
    template.name,
    template.summary,
    template.capabilityIds,
    template.projectHints?.map((hint) => hint.id),
    template.skillHints?.map((hint) => hint.id),
    template.ruleHints?.map((hint) => hint.id),
    template.projectHints?.map((hint) => {
      const project = projects.find((candidate) => candidate.id === hint.id);
      return [project?.name, project?.summary, project?.tags];
    })
  ].flat(Infinity).filter(Boolean).join(" "));

  return scoreText(text, haystack);
}

async function resolveProjects(repository, projects, sceneTemplate, text) {
  if (sceneTemplate?.projectHints?.length) {
    if (typeof repository.listProjectsForSceneTemplate === "function") {
      return repository.listProjectsForSceneTemplate(sceneTemplate.id);
    }
    const resolved = await Promise.all(sceneTemplate.projectHints.map(async (hint) => {
      const project = await repository.getProject(hint.id);
      return project ? { ...project, role: hint.role } : null;
    }));
    return resolved.filter(Boolean);
  }

  const scored = projects
    .map((project) => ({ project, score: scoreText(text, normalizeText([project.id, project.name, project.summary, project.tags].flat().filter(Boolean).join(" "))) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((entry) => entry.project);
}

function collectReadPaths({ sceneTemplate, projects, skills, rules }) {
  const paths = [];
  addPath(paths, sceneTemplate?.sourcePath);
  for (const project of projects) {
    addPath(paths, project.sourcePath || (project.id ? `config/projects/${project.id}.json` : ""));
    addPath(paths, project.doc?.path);
  }
  for (const skill of skills) {
    addPath(paths, skill.sourcePath);
  }
  for (const rule of rules) {
    addPath(paths, rule.sourcePath);
  }
  return paths;
}

function addPath(paths, candidate) {
  if (candidate && !paths.includes(candidate)) {
    paths.push(candidate);
  }
}

function scoreText(needle, haystack) {
  const normalizedNeedle = normalizeText(needle);
  if (!normalizedNeedle || !haystack) {
    return 0;
  }
  return normalizedNeedle
    .split(/\s+/)
    .filter(Boolean)
    .reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function normalizeText(input) {
  return String(input || "").toLowerCase();
}
