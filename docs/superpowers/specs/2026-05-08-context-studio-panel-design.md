# Context Studio Panel Design

Date: 2026-05-08
Project: ai-context
Status: Approved design draft for review

## Goal

Build a local Context Studio panel under `src/` for the `ai-context` project.

The panel helps XUANJIAN inspect, explain, initialize, and repair the local AI context system. It must show the relationships among projects, scenes, skills, rules, project documents, and persona/profile configuration. It must also work before the full project UI is installed.

## User Outcomes

- Open one local URL and see all configured projects, scenes, skills, and rules.
- Understand why a node exists, where it is defined, and what it connects to.
- Click a relationship-map node and inspect details in a right-side drawer.
- See a checklist of missing or broken initialization items.
- Repair specific initialization problems one at a time.
- Read project documentation from `docs/repos/` and persona documentation from `docs/person/`.
- Start the tool even when React/Vite dependencies have not been installed.

## Selected Approach

Use a hybrid local app:

- `node src/server.mjs` is the always-bootable entrypoint.
- The server has no npm runtime dependency and can start before install.
- React + Vite powers the main panel after frontend dependencies are installed.
- If frontend dependencies are missing, the server serves a built-in bootstrap page.
- The bootstrap page shows initialization status and per-item repair buttons.

This preserves the requirement that the project can start when uninitialized, while still allowing a richer React panel for the normal daily workflow.

## Non-Goals

- No one-click global repair that changes everything at once.
- No automatic guessing of missing project, scene, skill, or rule content.
- No replacement for `scripts/install-ai-context.mjs` or `scripts/contextctl.mjs`.
- No remote service, account login, or cloud storage.
- No editing existing source Markdown content from the first version of the panel. The only Markdown write allowed in v1 is creating explicitly listed missing initialization files, such as a minimal `docs/person/profile.md`.
- No dependency on installed global `ai-context` skill links for startup.

## Architecture

### `src/server.mjs`

The local server is the stable entrypoint.

Responsibilities:

- Start with Node built-in modules only.
- Serve the bootstrap page when the React app is not ready.
- Serve or proxy the React/Vite app when dependencies are installed.
- Expose JSON APIs for graph data, node details, checks, and repair actions.
- Execute allowed local commands for explicit repair actions.
- Never depend on installed global entrypoints.

Expected command:

```bash
node src/server.mjs
```

Server API contract:

- `GET /api/graph`
  - Returns `{ nodes, edges, groups, warnings }`.
  - Used by the relationship map and overview pages.
- `GET /api/nodes/:nodeId`
  - Returns one normalized node plus reverse relationships, documentation summary, warnings, and valid actions.
  - Returns `404` when the node id is unknown.
- `GET /api/checks`
  - Returns `{ checks }`, where each check follows the `CheckResult` shape.
  - Must run without React/Vite dependencies.
- `POST /api/actions/:actionId`
  - Body is JSON and must match the selected action contract.
  - Returns `{ ok, actionId, summary, output, changedPaths, nextCheckIds }`.
  - Rejects unknown actions, missing parameters, unsafe parameters, and unsupported methods.

### `src/core/`

Core modules hold reusable logic that is independent of React.

Responsibilities:

- Load JSON indexes and detail files.
- Load selected Markdown summaries from `docs/repos/` and `docs/person/`.
- Build graph nodes and edges.
- Build reverse relationship indexes.
- Produce warnings for broken references and missing files.
- Produce installation and configuration check results.
- Map each repairable check to one explicit action.

The bootstrap UI and React UI both use server APIs backed by these modules.

### `src/app/`

React + Vite provides the normal panel.

Responsibilities:

- Render the main relationship map.
- Render filters and search.
- Render the right-side node detail drawer.
- Render the checks page.
- Trigger repair actions only after a user clicks the specific action.

## Data Sources

The panel uses existing `ai-context` sources as authority.

Primary sources:

- `config/entry.json`
- `config/profile.json`
- `config/projects/index.json`
- `config/projects/*.json`
- `config/scenes/index.json`
- `config/scenes/*.json`
- `config/skills/skills.json`
- `config/rules/rules.json`
- `runtime/current.json`
- `runtime/tasks/<activeTaskId>.json`

Documentation sources:

- `docs/repos/*.md`
- `docs/person/profile.md`
- `docs/person/learning-log.md` when useful for persona context

The panel must not create a second hand-maintained relationship table. It derives relationships from the JSON indexes and detail JSON files.

## Graph Model

`src/core/graph` produces a normalized graph:

```ts
type GraphNode = {
  id: string;
  type: "root" | "group" | "project" | "scene" | "skill" | "rule" | "profile" | "task";
  title: string;
  summary: string;
  sourcePath?: string;
  docPath?: string;
  status: "ok" | "warning" | "missing" | "unknown";
  raw?: unknown;
};

type GraphEdge = {
  from: string;
  to: string;
  relation: string;
  source: string;
};
```

Default map shape:

- Center node: `ai-context`
- First layer: `Projects`, `Scenes`, `Skills`, `Rules`, `Persona`, `Current Work`
- Second layer: configured project, scene, skill, rule, profile, and active task nodes
- Cross-links: project to scene, project to skill, project to rule, scene to project, scene to rule, profile to source document, current work to active project and scene

The graph builder also creates reverse indexes for node detail drawers:

- related projects
- related scenes
- related skills
- related rules
- related profile files
- related runtime task files
- warnings and check results

## Project Documentation

Project details must include two layers:

- JSON layer from `config/projects/<project-id>.json`
- Documentation layer from the configured `doc.path`, commonly `docs/repos/<project-id>.md`

If `doc.path` is missing or the file does not exist, the project node is marked with a warning and the checks page lists the exact problem.

The right-side drawer for a project shows:

- id, name, technology family, repository path, summary
- configured doc path and whether it exists
- a short Markdown-derived project description
- related scenes, skills, and rules
- source JSON path
- relevant warnings

## Persona And Profile Initialization

The panel treats persona/profile configuration as part of initialization.

Checks include:

- `config/profile.json` exists and parses.
- `docs/person/profile.md` exists.
- `config/profile.json.sourcePath` points to a real file.
- `config/entry.json` declares profile read policy.
- persona/profile files can be surfaced in the panel as documentation.

Repair actions:

- Create a minimal `docs/person/profile.md` from a template when the file is absent.
- Create a minimal `config/profile.json` when the file is absent.
- Show a precise warning when `sourcePath` points to the wrong location.
- Mark empty or too-short profile content as a warning for manual completion.

The panel must not invent long-term preferences. Generated persona content is only a minimal placeholder that asks the user to fill real preferences.

## Main UI

### Layout

The React panel has three persistent regions:

- Left navigation and filters
- Center relationship map
- Right details drawer

Navigation entries:

- Overview
- Projects
- Scenes
- Skills
- Rules
- Persona
- Checks

Filters:

- search by title, id, summary, source path
- type filter
- status filter
- show only warnings
- focus current work

### Relationship Map

The relationship map starts from the `ai-context` root node and grouped first layer.

Interactions:

- Click a node to open the details drawer.
- Double-click a node to focus on that node and its immediate neighbors.
- Use filters to reduce visible nodes.
- Use a reset control to return to the default overview.

The first version can use a pragmatic graph renderer selected during implementation. If a graph library is used, it belongs to the React app dependency set and must not be required by `src/server.mjs`.

### Details Drawer

The drawer shows:

- node title and type
- purpose or summary
- source path and document path
- raw JSON preview for technical inspection
- related projects, scenes, skills, rules, persona files, and current task
- status and warnings
- available actions

Actions are shown only when they are valid for the selected node.

## Bootstrap UI

When React/Vite is unavailable, the server serves a minimal built-in HTML page.

The bootstrap page shows:

- server status
- frontend dependency status
- core JSON parse status
- profile/persona status
- install/check command status
- repairable items with individual buttons

It does not need the full relationship map. It only needs enough UI to install dependencies, run checks, and reach the main panel.

## Checks

Checks are structured data:

```ts
type CheckResult = {
  id: string;
  title: string;
  area: "frontend" | "config" | "graph" | "profile" | "install" | "project-entry";
  status: "pass" | "warning" | "fail";
  message: string;
  sourcePath?: string;
  actionId?: string;
};
```

First-version checks:

- frontend dependencies are installed
- Vite app can be resolved
- `config/entry.json` exists and parses
- `config/profile.json` exists and parses
- `docs/person/profile.md` exists
- project index exists and project detail files parse
- scene index exists and scene detail files parse
- skill catalog exists and source paths resolve
- rule catalog exists and source paths resolve
- project `doc.path` files resolve, including `docs/repos/`
- graph references resolve to known nodes
- `runtime/current.json` parses
- active task path resolves when configured
- `node scripts/install-ai-context.mjs check` can run
- `node scripts/install-ai-context.mjs validate` can run
- ai-context skill links are present or reported as missing
- project entry sync drift is visible per project

## Repair Actions

Repair actions are explicit and scoped.

Allowed first-version actions:

- `install_frontend_dependencies`
  - Parameters: none.
  - Runs `npm install` from the repository root.
  - Allowed only when `package.json` exists and frontend dependencies are missing.
- `install_ai_context`
  - Parameters: none.
  - Runs `node scripts/install-ai-context.mjs install`.
- `validate_ai_context`
  - Parameters: none.
  - Runs `node scripts/install-ai-context.mjs validate`.
- `check_ai_context`
  - Parameters: none.
  - Runs `node scripts/install-ai-context.mjs check`.
- `sync_project_entry`
  - Parameters: `{ "projectId": string }`.
  - `projectId` must exist in `config/projects/index.json`.
  - Runs `node scripts/install-ai-context.mjs sync-projects --project <project-id> --write`.
- `create_minimal_profile_json`
  - Parameters: none.
  - Creates `config/profile.json` only when it is absent.
  - Fails if the file already exists.
- `create_minimal_person_profile`
  - Parameters: none.
  - Creates `docs/person/profile.md` only when it is absent.
  - Fails if the file already exists.

Actions not allowed in the first version:

- no one-click all repair
- no automatic creation of unknown project JSON
- no automatic creation of unknown scene JSON
- no automatic creation of unknown skill or rule content
- no broad project-skill install without a clearly labeled action
- no destructive cleanup

Each action response includes:

- command or file operation performed
- stdout or concise output summary
- changed paths when known
- next recommended check

Action safety rules:

- The client cannot provide arbitrary command text.
- Command actions use fixed argument arrays.
- Path creation actions write only the exact allowlisted paths.
- `sync_project_entry` validates `projectId` against the project index before running.
- File creation actions never overwrite existing files.

## Error Handling

The server returns structured errors:

- invalid JSON
- missing file
- command failed
- command timed out
- unsupported action
- action requires explicit project id

UI behavior:

- failed checks remain visible
- action failures show command output
- broken graph data should degrade to partial graph plus warnings
- invalid single project detail should not prevent the whole panel from opening

## Security And Safety

The server binds to localhost by default.

Repair actions are allowlisted. The client cannot submit arbitrary shell commands.

File writes are limited to known initialization files and known script operations. Destructive git or filesystem operations are not part of the panel.

## Testing Strategy

Core tests:

- graph builder creates expected nodes and edges from fixture config
- missing project doc path produces a warning
- missing profile files produce initialization checks
- invalid references produce warnings without crashing
- repair action registry rejects unknown actions

Server tests:

- server can start without `node_modules`
- bootstrap page is served when React app is unavailable
- graph API returns partial data with warnings when some files are broken
- check API returns structured results
- action API runs only allowlisted actions

UI tests:

- main panel renders graph groups
- clicking a node opens drawer details
- filters reduce visible nodes
- checks page shows pass/warning/fail statuses
- bootstrap page displays repairable checks without React dependencies

## Acceptance Criteria

- `node src/server.mjs` starts from a clean checkout without frontend dependencies.
- The browser opens a bootstrap page when frontend dependencies are missing.
- The bootstrap page can show profile/persona and config checks.
- After dependencies are installed, the React panel shows the relationship map.
- The default map has `ai-context` as the center and groups for projects, scenes, skills, rules, persona, and current work.
- Clicking a node opens a right-side drawer with source, purpose, relationships, and warnings.
- Project details include `docs/repos` content when configured.
- Persona/profile initialization is detected and repairable with minimal placeholders.
- Repair actions are per-item, explicit, and allowlisted.
- Broken references do not crash the whole panel.

## Open Implementation Decisions

These decisions are deferred to implementation planning, not product design:

- Exact React graph rendering library.
- Whether Vite runs as a dev proxy or the server serves a production build in the first implementation pass.
- Exact Markdown summary extraction method.
