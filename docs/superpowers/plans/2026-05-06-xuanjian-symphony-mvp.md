# Xuanjian Symphony MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first local Xuanjian Symphony MVP: a Web Console plus Orchestrator service that lets XUANJIAN manually create tasks, shows Gate/artifact review state, supports PM Agent communication, and keeps Codex app-server workers as a mockable adapter.

**Architecture:** Create a new Node/TypeScript app under `/Users/xj/Documents/node/xuanjian-symphony`. Use a single local web app with API routes, local JSON persistence, and React UI. Keep Codex worker execution behind an adapter so MVP can ship with mock workers before real `codex app-server` integration.

**Tech Stack:** Node.js, TypeScript, React, Vite, Express or Fastify, local JSON store, Vitest, Playwright-ready browser validation.

---

## Chunk 1: Project Scaffold

### Task 1: Create Project Skeleton

**Files:**
- Create: `/Users/xj/Documents/node/xuanjian-symphony/package.json`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/tsconfig.json`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/vite.config.ts`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/src/main.tsx`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/src/App.tsx`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/src/styles.css`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/server/index.ts`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/server/app.ts`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/data/.gitkeep`

- [ ] **Step 1: Create directory and initialize package**

Run:

```bash
mkdir -p /Users/xj/Documents/node/xuanjian-symphony
cd /Users/xj/Documents/node/xuanjian-symphony
npm init -y
```

Expected: `package.json` exists.

- [ ] **Step 2: Add runtime dependencies**

Run:

```bash
npm install @vitejs/plugin-react vite react react-dom express cors
npm install -D typescript tsx vitest @types/node @types/react @types/react-dom @types/express @types/cors
```

Expected: dependencies install without errors.

- [ ] **Step 3: Write config files**

Add scripts:

```json
{
  "scripts": {
    "dev": "concurrently \"npm:dev:server\" \"npm:dev:web\"",
    "dev:web": "vite --host 127.0.0.1 --port 5179",
    "dev:server": "tsx watch server/index.ts",
    "build": "tsc --noEmit && vite build",
    "test": "vitest run"
  }
}
```

If `concurrently` is used, install it as dev dependency. Otherwise run server and web separately.

- [ ] **Step 4: Add minimal app and server**

Server starts on `127.0.0.1:5180` and exposes:

```ts
app.get('/api/health', (_req, res) => res.json({ ok: true }));
```

React app renders `Xuanjian Symphony`.

- [ ] **Step 5: Verify scaffold**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold xuanjian symphony"
```

## Chunk 2: Domain Model And Local Store

### Task 2: Add Task, Artifact, PM Message, Decision, Worker Models

**Files:**
- Create: `/Users/xj/Documents/node/xuanjian-symphony/server/domain/types.ts`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/server/store/jsonStore.ts`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/server/store/seed.ts`
- Test: `/Users/xj/Documents/node/xuanjian-symphony/server/store/jsonStore.test.ts`

- [ ] **Step 1: Write failing tests for local store**

Test that a task can be created, loaded, updated, and persisted.

- [ ] **Step 2: Implement domain types**

Include:

```ts
type Gate = 'G0' | 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'HumanReview';
type ReviewStatus = 'Draft' | 'PendingUserReview' | 'Approved' | 'Rejected' | 'Superseded';
```

Entities:

- `Task`
- `Artifact`
- `PmMessage`
- `DecisionTrace`
- `WorkerStatus`
- `HumanFeedback`
- `ReworkItem`

- [ ] **Step 3: Implement JSON store**

Persist to `/Users/xj/Documents/node/xuanjian-symphony/data/store.json`.

- [ ] **Step 4: Add AIAGENT-93 seed**

Seed task:

```text
AIAGENT-93 / 搭建自己 symphony / G3 / PendingUserReview
```

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: store tests pass.

- [ ] **Step 6: Commit**

```bash
git add server data package-lock.json package.json
git commit -m "feat: add local orchestration store"
```

## Chunk 3: Manual Task Intake

### Task 3: Create Tasks Manually

**Files:**
- Create: `/Users/xj/Documents/node/xuanjian-symphony/server/tasks/taskInput.ts`
- Test: `/Users/xj/Documents/node/xuanjian-symphony/server/tasks/taskInput.test.ts`
- Modify: `/Users/xj/Documents/node/xuanjian-symphony/server/app.ts`

- [ ] **Step 1: Write task input validation tests**

Cases:

```text
title is required
source defaults to manual
key can be provided manually
key can be generated from title/date when missing
```

- [ ] **Step 2: Implement task input normalization**

Return a normalized internal task input or throw validation error.

- [ ] **Step 3: Add API**

```text
POST /api/tasks
body: { key?: string, title: string, description?: string, source?: string }
```

On success, create/update internal task and default artifacts.

- [ ] **Step 4: Verify with AIAGENT-93**

Run server and call:

```bash
curl -s -X POST http://127.0.0.1:5180/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"key":"AIAGENT-93","title":"搭建自己 symphony","source":"manual"}'
```

Expected: response includes key `AIAGENT-93`.

- [ ] **Step 5: Commit**

```bash
git add server package.json package-lock.json
git commit -m "feat: add manual task intake"
```

## Chunk 4: Orchestrator API

### Task 4: Add Gate, Artifact, PM, Decision, Feedback APIs

**Files:**
- Create: `/Users/xj/Documents/node/xuanjian-symphony/server/orchestrator/orchestrator.ts`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/server/orchestrator/gates.ts`
- Test: `/Users/xj/Documents/node/xuanjian-symphony/server/orchestrator/gates.test.ts`
- Modify: `/Users/xj/Documents/node/xuanjian-symphony/server/app.ts`

- [ ] **Step 1: Write gate rule tests**

Rules:

- Pending artifact blocks next Gate.
- Approved tech plan allows development start.
- Human feedback creates rework candidate assigned to PM.

- [ ] **Step 2: Implement gate helpers**

Functions:

```ts
canAdvance(task, artifacts): boolean
approveArtifact(taskKey, artifactType): Artifact
rejectArtifact(taskKey, artifactType, reason): Artifact
appendPmMessage(taskKey, body): PmMessage
createDecisionTrace(taskKey, input): DecisionTrace
submitHumanFeedback(taskKey, body): HumanFeedback
```

- [ ] **Step 3: Add APIs**

```text
GET /api/tasks
GET /api/tasks/:key
GET /api/tasks/:key/artifacts
POST /api/tasks/:key/artifacts/:type/approve
POST /api/tasks/:key/artifacts/:type/reject
GET /api/tasks/:key/messages
POST /api/tasks/:key/messages
GET /api/tasks/:key/decisions
POST /api/tasks/:key/human-feedback
GET /api/workers
```

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: gate/orchestrator tests pass.

- [ ] **Step 5: Commit**

```bash
git add server
git commit -m "feat: add orchestrator APIs"
```

## Chunk 5: Web Console UI

### Task 5: Build Desktop And Mobile Console

**Files:**
- Create: `/Users/xj/Documents/node/xuanjian-symphony/src/api/client.ts`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/src/components/Sidebar.tsx`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/src/components/TaskPool.tsx`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/src/components/MobileTaskSwitcher.tsx`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/src/components/GateTimeline.tsx`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/src/components/ArtifactReviewPanel.tsx`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/src/components/PmCommunicationPanel.tsx`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/src/components/PmDecisionTrace.tsx`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/src/components/AgentOutputPanel.tsx`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/src/components/HumanAcceptancePanel.tsx`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/src/components/WorkerStatusPanel.tsx`
- Modify: `/Users/xj/Documents/node/xuanjian-symphony/src/App.tsx`
- Modify: `/Users/xj/Documents/node/xuanjian-symphony/src/styles.css`

- [ ] **Step 1: Build API client**

Fetch all task detail data from API routes.

- [ ] **Step 2: Implement desktop layout**

Match approved prototype:

```text
left app nav
300px task pool
right detail workspace
```

- [ ] **Step 3: Implement mobile layout**

At mobile width:

```text
hide left app nav
hide task pool
show current task switcher
show bottom nav: Task / PM / Artifacts / Acceptance
```

- [ ] **Step 4: Implement artifact panel**

Each artifact card has:

```text
Open / Approve / Reject
```

Reject requires reason.

- [ ] **Step 5: Implement PM communication panel**

User can send message to PM. Message becomes task event and decision trace can be shown.

- [ ] **Step 6: Implement PM decision trace**

Render fields:

```text
facts / assumptions / evidence / decision / next action / confidence / correction point
```

- [ ] **Step 7: Implement human acceptance panel**

User submits final feedback to PM. API creates feedback/rework candidate.

- [ ] **Step 8: Run build**

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 9: Manual browser validation**

Open:

```text
http://127.0.0.1:5179
```

Check desktop and mobile viewports.

- [ ] **Step 10: Commit**

```bash
git add src
git commit -m "feat: build orchestration console"
```

## Chunk 6: Worker Adapter Mock

### Task 6: Add Codex Worker Adapter Interface

**Files:**
- Create: `/Users/xj/Documents/node/xuanjian-symphony/server/workers/workerTypes.ts`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/server/workers/mockWorkerAdapter.ts`
- Create: `/Users/xj/Documents/node/xuanjian-symphony/server/workers/codexAppServerAdapter.ts`
- Test: `/Users/xj/Documents/node/xuanjian-symphony/server/workers/mockWorkerAdapter.test.ts`

- [ ] **Step 1: Define adapter interface**

```ts
interface WorkerAdapter {
  listWorkers(): Promise<WorkerStatus[]>;
  startTask(input: WorkerStartInput): Promise<WorkerStatus>;
  stopWorker(workerId: string): Promise<WorkerStatus>;
}
```

- [ ] **Step 2: Implement mock adapter**

Return deterministic workers for prototype.

- [ ] **Step 3: Add placeholder Codex adapter**

Document expected app-server flow:

```text
initialize -> thread/start -> turn/start -> stream -> completion
```

Do not launch real Codex in MVP.

- [ ] **Step 4: Connect `/api/workers`**

Return mock worker status.

- [ ] **Step 5: Run tests and build**

```bash
npm test
npm run build
```

Expected: both pass.

- [ ] **Step 6: Commit**

```bash
git add server
git commit -m "feat: add codex worker adapter shell"
```

## Chunk 7: Verification And Handoff

### Task 7: Verify MVP And Update AIAGENT-93

**Files:**
- Modify: `/Users/xj/Documents/ai-context/runtime/tasks/AIAGENT-93/05-xuanjian-symphony-result.md`
- Modify: `/Users/xj/Documents/ai-context/runtime/tasks/AIAGENT-93/06-acceptance.md`

- [ ] **Step 1: Run full verification**

```bash
cd /Users/xj/Documents/node/xuanjian-symphony
npm test
npm run build
```

Expected: both pass.

- [ ] **Step 2: Browser check**

Validate:

- Manual task creation works.
- AIAGENT-93 appears in task pool after manual creation.
- PM panel accepts messages.
- Artifacts can approve/reject.
- PM decision trace is visible.
- Human feedback creates rework candidate.
- Mobile view hides left menu and task pool.

- [ ] **Step 3: Write result document**

Create `05-xuanjian-symphony-result.md` with changed files, commands, and known gaps.

- [ ] **Step 4: Write acceptance document**

Create `06-acceptance.md` with functional and UI checks.

- [ ] **Step 5: Commit ai-context result docs if intended**

Runtime task files are ignored by default. If the user wants them tracked, adjust `.gitignore`; otherwise keep them local.

- [ ] **Step 6: Final handoff**

Report:

- Local app URL.
- Verification results.
- Remaining V2 work: Jira/Notion/Figma source adapters, real Codex app-server, daemon polling, workspace isolation.
