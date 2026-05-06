# 03 Tech Plan

## 基本信息

- Ticket：AIAGENT-93
- 需求名称：搭建 XJamesSymphony 控制台和编排 MVP
- 任务类型：新功能 / 平台建设
- 当前状态：G3 Tech Plan / Pending User Review
- 上游确认：G2 Product/UI 已由 XUANJIAN 确认可进入下一阶段

## 目标

把当前“能看、能聊、能确认产物”的控制台，推进到真正可调度的 Orchestrator MVP：

```text
Web Console
-> Orchestrator Runtime
-> Task / Artifact / Event Store
-> PM step runner
-> Codex worker adapter
-> Acceptance / Rework loop
```

第一阶段仍只对接 Codex/OpenAI，不做 Gemini / Anthropic / 自定义供应商。

## 核心判断

需要轮询，但不能无脑推进。

XJamesSymphony 应该有一个后台 Orchestrator loop。这个判断必须参考官方 `openai/symphony`：

- GitHub：https://github.com/openai/symphony
- 本地参考仓库：`/Users/xj/Documents/openai-symphony`
- 当前参考 HEAD：`58cf97da06d556c019ccea20c67f4f77da124bf3`
- 关键参考文件：
  - `SPEC.md`
  - `elixir/README.md`
  - `elixir/WORKFLOW.md`
  - `elixir/lib/symphony_elixir/orchestrator.ex`
  - `elixir/lib/symphony_elixir/agent_runner.ex`
  - `elixir/lib/symphony_elixir/codex/app_server.ex`
  - `elixir/lib/symphony_elixir/workspace.ex`
  - `elixir/lib/symphony_elixir/config/schema.ex`

官方 Symphony 的核心不是 UI，而是长运行调度服务：

```text
Poll tracker
-> select eligible issues
-> claim issue
-> create / reuse isolated workspace
-> launch Codex app-server in workspace
-> stream events
-> continue turns while issue remains active
-> retry / reconcile / cleanup
```

我们的 loop 对应为：

```text
every N seconds:
  load runnable tasks
  skip blocked / waiting / running tasks
  decide next action
  enqueue or run step
  persist events / artifacts / status
```

这个机制和 OpenAI Symphony 的核心思想一致：Orchestrator 负责持续扫描任务、选择可执行项、控制并发、处理重试和停住条件。但 XJamesSymphony 的产品约束更强：

- 任何 `PendingUserReview` 产物未确认时，任务必须停住。
- PM 缺少需求边界、项目、接口、数据来源时，任务必须停住并向用户追问。
- 同一任务不能同时跑多个会写同一上下文的 PM step。
- 项目 worker 写代码前必须有已确认技术方案。
- 验收失败必须回到 PM 归因，再生成返工动作。

## 官方 Symphony 可复用机制

### 必须参考

1. Poll loop
   - 官方：启动后立即 tick，然后按 `polling.interval_ms` 周期轮询。
   - 我们：本地 runtime 也要有 `interval_ms`，同时提供手动 `POST /api/runtime/tick` 便于调试。

2. Runtime state
   - 官方：`running / claimed / retry_attempts / completed / codex_totals / rate_limits` 由 Orchestrator 单点持有。
   - 我们：JSON MVP 里持久化 `runs / events / locks`，但调度写入仍由一个 runtime 单点完成。

3. Eligibility / claim
   - 官方：候选 issue 必须处于 active state，不能 already running / claimed，并受并发限制。
   - 我们：候选 task 必须不是 `PendingUserReview`，不能 locked/running，不能有未确认产物。

4. Retry and continuation
   - 官方：正常 worker 结束后有短延迟 continuation check；异常失败走指数退避。
   - 我们：PM/worker step 成功后检查是否仍可推进；失败按 `retryCount` 和 backoff 进入 retry 或 blocked。

5. Reconciliation
   - 官方：每 tick 先 reconcile running issues，终态 issue 会停止 worker 并清 workspace。
   - 我们：每 tick 先 reconcile active runs，发现任务被删除、产物被驳回、人工待确认或任务失败时停止/阻塞 run。

6. Workspace isolation
   - 官方：每个 issue 有 sanitized workspace key，Codex 只在 issue workspace 内运行。
   - 我们：每个任务/项目 worker 使用独立 workspace 或 git worktree，写业务代码前必须绑定业务项目路径和分支。

7. WORKFLOW.md contract
   - 官方：用 repo 内 `WORKFLOW.md` 的 YAML front matter + prompt body 控制 tracker、polling、workspace、hooks、agent、codex。
   - 我们：上层策略来自 `ai-context/scenes/xuanjian-symphony.md`；后续每个业务项目可以补自己的 `WORKFLOW.md` 或等价配置。

8. Codex app-server protocol boundary
   - 官方：Codex app-server 是被 Orchestrator 启动的执行层，协议以当前 Codex schema 为准。
   - 我们：先保留 adapter，真正接入时要读取本机 Codex app-server schema，而不是手写死协议字段。

### 不直接照搬

1. Issue tracker
   - 官方当前以 Linear 为主。
   - 我们第一阶段手动任务；Jira 后续作为 source adapter。

2. UI 范围
   - 官方 spec 明确不规定 rich web UI。
   - 我们产品目标就是 Web Console，所以会扩展任务池、PM 聊天、产物确认、验收返工、worker 状态。

3. 自动无人值守程度
   - 官方 workflow 偏 unattended，agent 尽量自己推进。
   - 我们因为要做需求澄清、产品/UI确认、技术方案确认，所以人工 Gate 更强。

## Orchestrator Runtime

### 运行模式

先做单进程本地 runtime：

```text
server/index.ts
-> createApp()
-> createOrchestratorRuntime(store, adapters)
-> runtime.start()
```

后续再拆成 daemon / queue / scheduler。

### Tick 策略

默认每 3-5 秒 tick 一次，开发期可配置：

```text
ORCHESTRATOR_ENABLED=true
ORCHESTRATOR_INTERVAL_MS=5000
ORCHESTRATOR_MAX_CONCURRENCY=1
```

MVP 并发建议先为 1，避免本地 JSON store 和 workspace 写冲突。

### 任务筛选

tick 时只选择 runnable task：

```text
status not in PendingUserReview / Approved / Rejected
and not locked
and no pending artifact review
and no active worker run
and nextAction exists
```

对于 `G0 / Draft`：

- 不自动启动。
- 只有用户对 PM 说“开始 / 启动项目”等，才进入 G1。

对于 `PendingUserReview`：

- tick 只能记录 blocked 状态。
- 不允许自动进入下一 Gate。

## 状态机

建议先把 Gate 和状态拆清楚：

```text
Task.gate:
G0 Draft
G1 Discovery
G2 Product/UI
G3 TechPlan
G4 Development
G5 Acceptance
HumanReview / Done

Task.status:
Draft
Running
Blocked
PendingUserReview
Approved
Failed
```

MVP 可先保留现有字段，但新增 runtime 事件用于追踪真实推进：

```text
TaskEvent:
task.created
pm.message.received
runtime.tick
task.blocked
step.started
step.completed
artifact.created
artifact.approved
artifact.rejected
worker.started
worker.event
worker.completed
worker.failed
acceptance.failed
rework.created
```

## 数据模型新增

在现有 JSON store 上补字段：

```ts
interface RuntimeRun {
  id: string;
  taskKey: string;
  gate: Gate;
  kind: 'pm' | 'discovery' | 'design' | 'tech-plan' | 'dev' | 'acceptance';
  state: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  workerId?: string;
  startedAt?: string;
  finishedAt?: string;
  retryCount: number;
  lastError?: string;
}

interface TaskEvent {
  id: string;
  taskKey: string;
  type: string;
  body: string;
  createdAt: string;
}

interface TaskLock {
  taskKey: string;
  owner: string;
  expiresAt: string;
}
```

JSON MVP 可以直接加到 `SymphonyStoreData`：

```ts
runs: RuntimeRun[]
events: TaskEvent[]
locks: TaskLock[]
```

## PM Step Runner

PM 不是每 tick 都回复用户。PM step runner 只在有明确 next action 时运行：

```text
用户消息
-> PM 分析
-> 更新 task context
-> 判断是否缺资料
-> 生成下一步问题或产物
-> 如果产物需要确认，状态改 PendingUserReview
```

MVP 先实现规则型 PM runner：

- 启动任务：生成 G1 启动会问题。
- 用户补充原型/UI/链接：纳入 context，继续问边界或生成 discovery 文档。
- 用户确认产品/UI：生成 G3 技术方案草案。
- 技术方案确认：允许 G4 dev worker。

后续再把 PM runner 接到 Codex thread。

## Codex Worker Adapter

第一版接口先定清楚：

```ts
interface WorkerAdapter {
  start(input: WorkerStartInput): Promise<WorkerRun>;
  continue(runId: string, input?: WorkerContinueInput): Promise<WorkerRun>;
  cancel(runId: string): Promise<void>;
}
```

MVP：

- 继续使用 mock worker。
- 记录 worker run / event。
- 页面展示真实 run 状态，而不是固定 mock。

V2：

- 接 `codex app-server`。
- 保存 thread id / turn id / workspace path。
- stream event 写入 TaskEvent。

## API 规划

新增：

```text
POST /api/runtime/tick
POST /api/runtime/start
POST /api/runtime/stop
GET  /api/tasks/:key/events
GET  /api/tasks/:key/runs
POST /api/tasks/:key/advance
```

说明：

- `runtime/tick` 便于开发期手动触发。
- `runtime/start` 启动后台 interval。
- `tasks/:key/advance` 只用于用户确认后手动推进，不绕过 Gate。

现有接口保留：

```text
POST /api/tasks/:key/messages
POST /api/tasks/:key/artifacts/:type/approve
POST /api/tasks/:key/artifacts/:type/reject
PATCH /api/tasks/:key/agent-models/:agentId
```

## 前端改造

右侧状态面板新增或强化：

- Runtime 状态：running / stopped / last tick。
- 当前 blocked reason。
- 最近 TaskEvent。
- 当前 run。
- 失败重试次数。

PM 聊天区：

- 用户发消息后显示 PM 分析中。
- 如果 runtime 正在处理，显示“PM 正在推进当前步骤”。
- 不展示模型原始思维链，只展示 PM 输出的事实、判断、下一步和问题。

任务栏：

- `Running`：蓝色进度。
- `PendingUserReview`：黄色停住。
- `Blocked`：可用橙色/警告态。
- `Failed`：红色。

## 开发顺序

1. 补 `RuntimeRun / TaskEvent / TaskLock` 类型和 JSON store 默认值。
2. 实现 `orchestrator/runtime.ts`：
   - `tick()`
   - `start()`
   - `stop()`
   - lock / unlock
   - blocked reason
3. 实现规则型 `pmStepRunner`。
4. 实现 runtime API。
5. 前端展示 events / runs / runtime status。
6. 把 artifact approve 后的“下一步推进”接入 runtime。
7. 增加测试。

## 测试

必须覆盖：

- `PendingUserReview` 阻止 tick 推进。
- `G0 Draft` 不会被 tick 自动启动。
- 用户说“开始”后进入 G1。
- 有 active run 时不会重复启动。
- run 失败后记录 retry。
- 超过 retry 后进入 Failed 或 Blocked。
- artifact approved 后才允许进入下一 Gate。
- reject artifact 后退回对应 Gate，并生成 blocked reason。

## 验收口径

G3 技术方案通过后，才能进入 G4 开发。

G4 第一阶段完成标准：

- 可以启动/停止 runtime。
- 可以手动触发 tick。
- tick 能扫描任务。
- 任务待确认时不会推进。
- 任务可推进时能创建 run/event。
- 前端能看到 runtime 状态、run、event、blocked reason。
- 仍然只对接 Codex/OpenAI 模型下拉。

## 用户审核

- 是否通过：待确认
- 确认人：XUANJIAN
- 确认时间：待确认
