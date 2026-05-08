# Context Studio Panel Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Context Studio panel that starts with `node src/server.mjs`, detects uninitialized state, and shows a React relationship map for ai-context projects, scenes, skills, rules, persona, and current work.

**Architecture:** Use a zero-dependency Node server as the stable startup layer, with focused core modules for config loading, graph building, checks, and repair actions. Add a Vite + React app under `src/app/` for the rich panel, while the server can still serve a built-in bootstrap page before frontend dependencies are installed.

**Tech Stack:** Node ESM, Node built-in `node:test`, React, Vite, Vitest, Testing Library, CSS, SVG-based React graph rendering for v1, npm.

---

## File Structure

Create these focused units:

- `package.json`: npm scripts and React/Vite dev dependencies.
- `src/server.mjs`: zero-dependency HTTP server, static serving, API routing, bootstrap fallback.
- `src/bootstrap/page.mjs`: server-rendered bootstrap HTML.
- `src/core/paths.mjs`: repository root and safe path helpers.
- `src/core/json-loader.mjs`: JSON reads with recoverable errors.
- `src/core/markdown.mjs`: small Markdown summary extraction.
- `src/core/graph.mjs`: normalized nodes, edges, groups, reverse relationships, warnings.
- `src/core/checks.mjs`: structured initialization/config checks.
- `src/core/actions.mjs`: allowlisted repair action registry and executor.
- `src/app/index.html`: Vite entry HTML.
- `src/app/main.jsx`: React bootstrap.
- `src/app/App.jsx`: app shell and state coordination.
- `src/app/api.js`: browser API client.
- `src/app/components/Sidebar.jsx`: navigation/search/filter controls.
- `src/app/components/GraphView.jsx`: SVG relationship map.
- `src/app/components/DetailsDrawer.jsx`: selected node details.
- `src/app/components/ChecksView.jsx`: checks and repair actions.
- `src/app/styles.css`: responsive, utilitarian panel styling.
- `tests/core/fixtures/basic-ai-context/`: minimal fixture config for core tests.
- `tests/core/fixtures/missing-doc-ai-context/`: fixture with a project doc path that does not resolve.
- `tests/core/fixtures/missing-profile-ai-context/`: fixture missing profile/persona files.
- `tests/core/graph.test.mjs`: graph behavior tests.
- `tests/core/checks.test.mjs`: check behavior tests.
- `tests/core/actions.test.mjs`: action registry safety tests.
- `tests/server.test.mjs`: server API and bootstrap tests.
- `src/app/components/*.test.jsx`: React UI behavior tests.
- `src/app/test/setup.js`: Vitest DOM setup.

Do not put graph-building or repair logic inside React components. React consumes API payloads only.

## Chunk 1: Project Scaffold And Test Harness

### Task 1: Add npm and test scripts

**Files:**
- Create: `package.json`

- [ ] **Step 1: Create package metadata and scripts**

Add scripts:

```json
{
  "scripts": {
    "dev": "vite src/app --host 127.0.0.1",
    "build": "vite build src/app --outDir ../../dist/app",
    "test": "node --test tests/**/*.test.mjs && vitest run --config src/app/vitest.config.js",
    "test:core": "node --test tests/**/*.test.mjs",
    "test:ui": "vitest run --config src/app/vitest.config.js",
    "start": "node src/server.mjs"
  },
  "dependencies": {
    "react": "latest",
    "react-dom": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@vitejs/plugin-react": "latest",
    "jsdom": "latest",
    "vite": "latest",
    "vitest": "latest"
  }
}
```

Use `type: "module"` and keep the project private.

- [ ] **Step 2: Run npm install**

Run: `npm install`

Expected: `package-lock.json` and `node_modules/` are created.

- [ ] **Step 3: Run empty test command**

Run: `npm test`

Expected initially: no matching tests or no tests found. If Node treats this as a failure, continue after Task 2 creates the first test.

- [ ] **Step 4: Optional checkpoint commit**

If executing in a workflow that wants incremental commits:

```bash
git add package.json package-lock.json
git commit -m "chore: add context studio npm scaffold"
```

## Chunk 2: Core Data Loading And Graph

### Task 2: Add path and JSON loader tests first

**Files:**
- Create: `src/core/paths.mjs`
- Create: `src/core/json-loader.mjs`
- Create: `tests/core/fixtures/basic-ai-context/config/entry.json`
- Create: `tests/core/json-loader.test.mjs`

- [ ] **Step 1: Write failing JSON loader test**

Test behaviors:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readJsonFile } from "../../src/core/json-loader.mjs";

test("readJsonFile returns parsed data and no error for valid JSON", async () => {
  const result = await readJsonFile(new URL("./fixtures/basic-ai-context/config/entry.json", import.meta.url));
  assert.equal(result.ok, true);
  assert.equal(result.data.version, 1);
  assert.equal(result.error, undefined);
});

test("readJsonFile returns a recoverable error for missing files", async () => {
  const result = await readJsonFile(new URL("./fixtures/basic-ai-context/config/missing.json", import.meta.url));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "missing_file");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/core/json-loader.test.mjs`

Expected: FAIL because `src/core/json-loader.mjs` does not exist.

- [ ] **Step 3: Implement JSON loader**

Implement `readJsonFile(pathLike)` returning:

```js
{ ok: true, data, path }
{ ok: false, data: null, path, error: { code, message } }
```

Use `fs.promises.readFile` and `JSON.parse`. Distinguish `missing_file` and `invalid_json`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/core/json-loader.test.mjs`

Expected: PASS.

### Task 3: Build graph from fixture config

**Files:**
- Create: `src/core/markdown.mjs`
- Create: `src/core/graph.mjs`
- Create fixture files under `tests/core/fixtures/basic-ai-context/config/`
- Create fixture docs under `tests/core/fixtures/basic-ai-context/docs/`
- Create: `tests/core/graph.test.mjs`

- [ ] **Step 1: Write failing graph test**

Fixture must include one project, one scene, one skill, one rule, profile, current task, and project doc.

Test behaviors:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { buildContextGraph } from "../../src/core/graph.mjs";

test("buildContextGraph creates root groups and cross-links", async () => {
  const graph = await buildContextGraph({ rootDir: new URL("./fixtures/basic-ai-context/", import.meta.url) });
  assert.ok(graph.nodes.find((node) => node.id === "root:ai-context"));
  assert.ok(graph.nodes.find((node) => node.id === "group:projects"));
  assert.ok(graph.nodes.find((node) => node.id === "project:demo-project"));
  assert.ok(graph.edges.find((edge) => edge.from === "project:demo-project" && edge.to === "scene:demo-scene"));
  assert.equal(graph.warnings.length, 0);
});

test("buildContextGraph warns when a project doc path is missing", async () => {
  const graph = await buildContextGraph({ rootDir: new URL("./fixtures/missing-doc-ai-context/", import.meta.url) });
  assert.ok(graph.warnings.some((warning) => warning.code === "missing_project_doc"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/core/graph.test.mjs`

Expected: FAIL because `buildContextGraph` does not exist.

- [ ] **Step 3: Implement Markdown summary helper**

In `src/core/markdown.mjs`, export `summarizeMarkdown(markdown, maxChars = 420)`:

- strip front matter if present
- use first non-heading paragraph when available
- fall back to first heading plus next text
- return a compact plain-text string

- [ ] **Step 4: Implement graph builder**

In `src/core/graph.mjs`, export:

```js
export async function buildContextGraph({ rootDir = process.cwd() } = {}) {}
export function getNodeDetails(graph, nodeId) {}
```

Build normalized IDs with prefixes:

- `root:ai-context`
- `group:projects`
- `project:<id>`
- `scene:<id>`
- `skill:<id>`
- `rule:<id>`
- `profile:main`
- `task:<activeTaskId>`

Return `{ nodes, edges, groups, warnings, detailsById }`.

- [ ] **Step 5: Run graph tests**

Run: `node --test tests/core/json-loader.test.mjs tests/core/graph.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit core graph**

```bash
git add src/core tests/core
git commit -m "feat: build context studio graph data"
```

## Chunk 3: Checks And Actions

### Task 4: Add checks from fixture state

**Files:**
- Create: `src/core/checks.mjs`
- Create: `tests/core/checks.test.mjs`

- [ ] **Step 1: Write failing checks test**

Test behaviors:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { runChecks } from "../../src/core/checks.mjs";

test("runChecks reports profile and project docs as structured checks", async () => {
  const result = await runChecks({ rootDir: new URL("./fixtures/basic-ai-context/", import.meta.url) });
  assert.ok(result.checks.find((check) => check.id === "vite_app_resolved" && check.status === "pass"));
  assert.ok(result.checks.find((check) => check.id === "profile_json" && check.status === "pass"));
  assert.ok(result.checks.find((check) => check.id === "person_profile_doc" && check.status === "pass"));
  assert.ok(result.checks.find((check) => check.id === "project_docs" && check.status === "pass"));
});

test("runChecks marks missing persona files as repairable failures", async () => {
  const result = await runChecks({ rootDir: new URL("./fixtures/missing-profile-ai-context/", import.meta.url) });
  assert.ok(result.checks.find((check) => check.id === "profile_json" && check.actionId === "create_minimal_profile_json"));
  assert.ok(result.checks.find((check) => check.id === "person_profile_doc" && check.actionId === "create_minimal_person_profile"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/core/checks.test.mjs`

Expected: FAIL because `runChecks` does not exist.

- [ ] **Step 3: Implement checks**

Implement `runChecks({ rootDir })` returning `{ checks }`.

First pass must include the non-command, non-link basics:

- `frontend_package_json`
- `frontend_dependencies`
- `vite_app_resolved`
- `entry_json`
- `profile_json`
- `person_profile_doc`
- `projects_index`
- `scenes_index`
- `skills_catalog`
- `rules_catalog`
- `project_docs`
- `runtime_current`

Command-backed, link, graph-reference, and sync-drift checks are added in Task 4.5 so each TDD cycle has a clear red state.

- [ ] **Step 4: Run checks tests**

Run: `node --test tests/core/checks.test.mjs`

Expected: PASS.

### Task 4.5: Cover script, link, graph-reference, and sync-drift checks

**Files:**
- Modify: `src/core/checks.mjs`
- Modify: `tests/core/checks.test.mjs`

- [ ] **Step 1: Write failing tests for full first-version check scope**

Add tests for:

```js
test("runChecks reports active task, graph references, script commands, skill links, and project entry drift", async () => {
  const result = await runChecks({ rootDir: new URL("./fixtures/basic-ai-context/", import.meta.url), runCommands: false });
  const ids = new Set(result.checks.map((check) => check.id));
  assert.equal(ids.has("active_task_path"), true);
  assert.equal(ids.has("graph_references"), true);
  assert.equal(ids.has("install_command"), true);
  assert.equal(ids.has("install_check_command"), true);
  assert.equal(ids.has("install_validate_command"), true);
  assert.equal(ids.has("ai_context_skill_links"), true);
  assert.equal(ids.has("project_entry_sync_drift"), true);
});
```

Use `runCommands: false` in unit tests so the test verifies check production without invoking real install scripts.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/core/checks.test.mjs`

Expected: FAIL because the new check IDs are not all produced.

- [ ] **Step 3: Implement the missing checks**

Rules:

- `active_task_path`: pass when `runtime/current.json.activeTaskPath` exists or no active task is configured.
- `graph_references`: pass when `buildContextGraph` has no missing-reference warnings; warning otherwise.
- `install_command`: when `runCommands !== false`, run `node scripts/install-ai-context.mjs install --dry-run` if the script supports it; if dry-run is unsupported, return `warning` with message `Install command is available as an action but not executed by checks`.
- `install_check_command`: when `runCommands !== false`, run `node scripts/install-ai-context.mjs check`; otherwise return `warning` with message `Not run in dry check mode`.
- `install_validate_command`: same pattern for `validate`.
- `ai_context_skill_links`: inspect expected links from `config/entry.json.installation.skillLinks` and report missing links. Resolve `~` against the current user's home directory and `<ai-context-root>` against `rootDir`; treat unresolved placeholder formats as warnings, not crashes.
- `project_entry_sync_drift`: when `runCommands !== false`, run `node scripts/install-ai-context.mjs sync-projects`; otherwise return `warning` with message `Not run in dry check mode`.

- [ ] **Step 4: Run checks tests**

Run: `node --test tests/core/checks.test.mjs`

Expected: PASS.

### Task 5: Add allowlisted actions

**Files:**
- Create: `src/core/actions.mjs`
- Create: `tests/core/actions.test.mjs`

- [ ] **Step 1: Write failing action safety tests**

Test behaviors:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { runAction } from "../../src/core/actions.mjs";

test("runAction rejects unknown actions", async () => {
  const result = await runAction({ rootDir: new URL("./fixtures/basic-ai-context/", import.meta.url), actionId: "rm_rf", body: {} });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "unsupported_action");
});

test("create_minimal_profile_json refuses to overwrite existing files", async () => {
  const result = await runAction({ rootDir: new URL("./fixtures/basic-ai-context/", import.meta.url), actionId: "create_minimal_profile_json", body: {} });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "file_exists");
});

test("sync_project_entry requires a known project id", async () => {
  const result = await runAction({ rootDir: new URL("./fixtures/basic-ai-context/", import.meta.url), actionId: "sync_project_entry", body: { projectId: "../bad" } });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "invalid_project_id");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/core/actions.test.mjs`

Expected: FAIL because `actions.mjs` does not exist.

- [ ] **Step 3: Implement action registry**

Implement `runAction({ rootDir, actionId, body })`.

Use a registry for:

- `install_frontend_dependencies`
- `install_ai_context`
- `validate_ai_context`
- `check_ai_context`
- `sync_project_entry`
- `create_minimal_profile_json`
- `create_minimal_person_profile`

Command actions use `child_process.spawn` with fixed argument arrays and a 60-second timeout. File creation actions write only exact allowlisted paths and never overwrite.

- [ ] **Step 4: Run action tests**

Run: `node --test tests/core/actions.test.mjs`

Expected: PASS.

- [ ] **Step 5: Optional checkpoint commit**

If executing in a workflow that wants incremental commits:

```bash
git add src/core tests/core
git commit -m "feat: add context studio checks and actions"
```

## Chunk 4: Zero-Dependency Server And Bootstrap

### Task 6: Add server API tests

**Files:**
- Create: `src/bootstrap/page.mjs`
- Create: `src/server.mjs`
- Create: `tests/server.test.mjs`

- [ ] **Step 1: Write failing server tests**

Test behaviors:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { startServer } from "../src/server.mjs";

test("server serves bootstrap HTML without frontend build", async () => {
  const server = await startServer({ rootDir: new URL("./core/fixtures/basic-ai-context/", import.meta.url), port: 0 });
  try {
    const response = await fetch(`${server.url}/`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /Context Studio/);
    assert.match(html, /Initialization/);
  } finally {
    await server.close();
  }
});

test("server exposes graph and checks APIs", async () => {
  const server = await startServer({ rootDir: new URL("./core/fixtures/basic-ai-context/", import.meta.url), port: 0 });
  try {
    const graph = await fetch(`${server.url}/api/graph`).then((res) => res.json());
    const checks = await fetch(`${server.url}/api/checks`).then((res) => res.json());
    assert.ok(graph.nodes.length > 0);
    assert.ok(checks.checks.length > 0);
  } finally {
    await server.close();
  }
});

test("server rejects unknown actions", async () => {
  const server = await startServer({ rootDir: new URL("./core/fixtures/basic-ai-context/", import.meta.url), port: 0 });
  try {
    const response = await fetch(`${server.url}/api/actions/not_allowed`, { method: "POST", body: "{}" });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.error.code, "unsupported_action");
  } finally {
    await server.close();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/server.test.mjs`

Expected: FAIL because server exports do not exist.

- [ ] **Step 3: Implement bootstrap page**

`src/bootstrap/page.mjs` exports `renderBootstrapPage({ checks })`.

The HTML includes:

- title `Context Studio`
- server status
- initialization checklist
- per-item action buttons for repairable checks
- small inline script to call `GET /api/checks` and `POST /api/actions/:actionId`

Keep this page dependency-free.

- [ ] **Step 4: Implement server**

`src/server.mjs` exports `startServer({ rootDir = process.cwd(), port = 0, host = "127.0.0.1" })`.

Route handling:

- `GET /api/graph`
- `GET /api/nodes/:nodeId`
- `GET /api/checks`
- `POST /api/actions/:actionId`
- `GET /` serves React app if `dist/app/index.html` exists, else bootstrap page
- static assets under built app when available

When run directly, listen on `127.0.0.1` and print the local URL.

- [ ] **Step 5: Run server tests**

Run: `node --test tests/server.test.mjs`

Expected: PASS.

- [ ] **Step 6: Manual startup check without relying on Vite**

Run: `node src/server.mjs`

Expected: terminal prints a localhost URL and the page responds.

Stop the server after checking.

- [ ] **Step 7: Manual startup check with frontend dependencies unavailable**

Temporarily move `node_modules` aside if it exists:

```bash
mv node_modules node_modules.tmp
node src/server.mjs
```

Expected: server still starts and serves the bootstrap page.

Stop the server and restore:

```bash
mv node_modules.tmp node_modules
```

- [ ] **Step 8: Optional checkpoint commit**

If executing in a workflow that wants incremental commits:

```bash
git add src/bootstrap src/server.mjs tests/server.test.mjs
git commit -m "feat: add context studio server bootstrap"
```

## Chunk 5: React Panel

### Task 7: Add React app shell and API client

**Files:**
- Create: `src/app/index.html`
- Create: `src/app/main.jsx`
- Create: `src/app/App.jsx`
- Create: `src/app/api.js`
- Create: `src/app/styles.css`
- Create: `src/app/vitest.config.js`
- Create: `src/app/test/setup.js`
- Create: `src/app/App.test.jsx`

- [ ] **Step 1: Write failing app shell test**

Test with Vitest and Testing Library:

```jsx
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import App from "./App.jsx";

test("App renders loading state then main regions", async () => {
  global.fetch = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ nodes: [], edges: [], groups: [], warnings: [] }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ checks: [] }) });

  render(<App />);

  expect(screen.getByText(/Context Studio/i)).toBeInTheDocument();
  expect(await screen.findByText(/Overview/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run UI test to verify it fails**

Run: `npm run test:ui -- src/app/App.test.jsx`

Expected: FAIL because `App.jsx` does not exist.

- [ ] **Step 3: Add API client**

Implement functions:

```js
export async function fetchGraph() {}
export async function fetchNodeDetails(nodeId) {}
export async function fetchChecks() {}
export async function runAction(actionId, body = {}) {}
```

Each throws an `Error` with response text when the server returns non-2xx.

- [ ] **Step 4: Add app shell**

`App.jsx` loads graph and checks on mount. It stores:

- `graph`
- `checks`
- `selectedNodeId`
- `selectedNodeDetails`
- `query`
- `typeFilter`
- `statusFilter`
- `showWarningsOnly`

Render loading and error states.

- [ ] **Step 5: Add Vitest and Vite entries**

`main.jsx` renders `<App />` into `#root`.

`vitest.config.js` uses jsdom and `src/app/test/setup.js` imports `@testing-library/jest-dom/vitest`.

- [ ] **Step 6: Run UI test**

Run: `npm run test:ui -- src/app/App.test.jsx`

Expected: PASS.

- [ ] **Step 7: Run frontend build**

Run: `npm run build`

Expected: Vite builds `dist/app`.

### Task 8: Add panel components

**Files:**
- Create: `src/app/components/Sidebar.jsx`
- Create: `src/app/components/GraphView.jsx`
- Create: `src/app/components/DetailsDrawer.jsx`
- Create: `src/app/components/ChecksView.jsx`
- Create: `src/app/components/Sidebar.test.jsx`
- Create: `src/app/components/GraphView.test.jsx`
- Create: `src/app/components/DetailsDrawer.test.jsx`
- Create: `src/app/components/ChecksView.test.jsx`
- Modify: `src/app/App.jsx`
- Modify: `src/app/styles.css`

- [ ] **Step 1: Write failing Sidebar test**

Assert search and warning-only controls render and call handlers.

Run: `npm run test:ui -- src/app/components/Sidebar.test.jsx`

Expected: FAIL before component exists.

- [ ] **Step 2: Implement Sidebar**

Render navigation entries:

- Overview
- Projects
- Scenes
- Skills
- Rules
- Persona
- Checks

Render search and filters.

- [ ] **Step 3: Write failing GraphView test**

Assert it renders root/group/project nodes and calls `onSelectNode` when a node is clicked.

Run: `npm run test:ui -- src/app/components/GraphView.test.jsx`

Expected: FAIL before component exists.

- [ ] **Step 4: Implement GraphView**

Use SVG for v1 to avoid choosing a separate graph library.

Layout:

- center root node
- group nodes around root
- child nodes arranged in columns by type
- cross-links as subtle lines

Interactions:

- click selects node
- double-click focuses immediate neighbors
- reset focus button

- [ ] **Step 5: Write failing DetailsDrawer test**

Assert it renders source path, documentation summary, related lists, warnings, and action buttons when provided.

Run: `npm run test:ui -- src/app/components/DetailsDrawer.test.jsx`

Expected: FAIL before component exists.

- [ ] **Step 6: Implement DetailsDrawer**

Render:

- title, type, status
- summary and documentation summary
- source/doc paths
- related lists
- warnings
- raw JSON collapsible block
- valid actions

- [ ] **Step 7: Write failing ChecksView test**

Assert it groups checks by area and calls `onRunAction` with the check action id.

Run: `npm run test:ui -- src/app/components/ChecksView.test.jsx`

Expected: FAIL before component exists.

- [ ] **Step 8: Implement ChecksView**

Render checks grouped by area. For checks with `actionId`, show a repair button. After repair, refresh checks and graph.

- [ ] **Step 9: Wire components into App**

Connect filters to graph rendering. Connect node selection to `GET /api/nodes/:nodeId`.

- [ ] **Step 10: Run UI tests and build**

Run: `npm run test:ui`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 11: Optional checkpoint commit**

If executing in a workflow that wants incremental commits:

```bash
git add src/app dist/app package.json package-lock.json
git commit -m "feat: add context studio react panel"
```

## Chunk 6: Integration Verification And Documentation

### Task 9: Integration verification

**Files:**
- No required file changes.

- [ ] **Step 1: Run full automated tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 2: Run existing ai-context validation**

Run: `node scripts/install-ai-context.mjs validate`

Expected: PASS.

Run: `node scripts/install-ai-context.mjs check`

Expected: PASS or known environment-specific warnings only. Record the exact result in final notes.

- [ ] **Step 3: Build frontend**

Run: `npm run build`

Expected: PASS and `dist/app/index.html` exists.

- [ ] **Step 4: Verify server serves built app**

Run: `node src/server.mjs`

Open the printed URL.

Expected:

- React panel loads.
- Graph shows `ai-context` center and group nodes.
- Clicking a project opens drawer with `docs/repos` content.
- Checks page shows profile/persona checks.

Stop the server after verifying.

- [ ] **Step 5: Verify bootstrap fallback**

Temporarily move `dist/app` aside:

```bash
mv dist/app dist/app.tmp
node src/server.mjs
```

Open the printed URL.

Expected:

- Bootstrap page loads.
- Checks are visible.
- No React bundle is required.

Stop the server and restore:

```bash
mv dist/app.tmp dist/app
```

- [ ] **Step 6: Final status check**

Run: `git status --short`

Expected: only intended files changed.

- [ ] **Step 7: Record final run commands in the handoff**

Do not edit README or runtime task files unless the user explicitly asks. Put the run command and verification results in the final response.

## Execution Notes

- Use @superpowers:test-driven-development for every production behavior change.
- Use @superpowers:verification-before-completion before claiming the feature works.
- Keep server code independent from React/Vite imports.
- Do not make action APIs accept arbitrary command strings.
- Do not overwrite existing persona/profile files.
- If package installation or Vite versions fail, fix package metadata before changing server behavior.
