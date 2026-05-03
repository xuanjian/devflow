# Runtime Tasks

> 这里存放 XUANJIAN 专属研发工作流的任务交接包。每个 Jira 或临时需求一个目录，用文件承载跨对话框上下文。

## 启用条件

这里默认只记录 L3 / L4 复杂任务，或者用户明确要求走完整 Gate 的任务。

不需要进入这里的情况：

- L1 小任务：单文件、小样式、小文案、小 Bug。
- L2 中任务：一个页面、一个接口、一个局部联调链路，当前 Chat 能处理完。
- 影响范围清楚的普通 Bug。

这些任务直接在当前 Chat 里按 `ai-my-pm` 和必要的 superpowers 处理即可。

如果任务需要并行调研、代码走查或 review，但当前 Chat 仍能承载，优先在同一聊天框内使用子 Agent。只有子 Agent 也无法承载上下文、写入边界或验收打回时，才创建本目录下的完整任务包。

## 目录结构

```text
runtime/tasks/<ticket-key>/
  00-intake.md
  01-discovery.md
  02-product-ui.md
  03-tech-plan.md
  04-<project>-handoff.md
  superpowers/<project>/<superpower-generated-files>
  05-<project>-result.md
  06-acceptance.md
  07-rework.md
```

## 6 个 Gate

| Gate | 文件 | 作用 |
| --- | --- | --- |
| G0 Intake | `00-intake.md` | 读取 Jira，判断 Bug / 新功能 / 改版，提取链接和缺失信息。 |
| G1 Discovery | `01-discovery.md` | 采集项目、模块、需求边界、PC/移动端参考、接口和数据来源。 |
| G2 Product/UI | `02-product-ui.md` | 记录已有原型/UI，或承载新设计的 Figma 说明和确认记录。 |
| G3 Tech Plan | `03-tech-plan.md` | 生成开发文档，用户确认后才能建分支和进入开发。 |
| G4 Development | `04-*` / `superpowers/*` / `05-*` | 给每个项目生成 handoff，项目 Agent 执行自己的 superpowers，再回写结果。 |
| G5 Acceptance | `06-acceptance.md` / `07-rework.md` | 对照需求、Figma、UI、接口和开发结果验收；不通过生成返工单。 |

## 使用方式

1. 主 PM Chat 创建 `<ticket-key>` 目录。
2. 使用 `templates/00-intake.md` 写 `00-intake.md`。
3. 使用 `templates/01-discovery.md` 补齐采集信息。
4. 使用 `templates/02-product-ui.md` 记录原型/UI，必要时创建 Figma 并多轮确认。
5. 使用 `templates/03-tech-plan.md` 生成开发文档，用户确认后建分支。
6. 使用 `templates/04-project-handoff.md` 给每个项目生成 `04-<project>-handoff.md`。
7. 项目执行 Chat 按 handoff 指定的 superpowers 执行，并把 superpower 产物写入 `superpowers/<project>/`。
8. 如果 `writing-plans` 生成实施计划，PM Chat 审核该计划后再允许开发。
9. 项目执行 Chat 开发完成后使用 `templates/05-project-result.md` 生成 `05-<project>-result.md`。
10. 验收 Agent 使用 `templates/06-acceptance.md` 生成验收报告。
11. 不通过时使用 `templates/07-rework.md` 生成返工单并打回对应项目。

## 命名

- Jira 任务：使用 Jira key，例如 `DHB-12345`。
- 无 Jira 的临时任务：使用日期和短名，例如 `2026-05-03-stock-inventory-review`。
- 项目标识建议使用 `frontend`、`bff`、`ios`、`mini-program`、`pc`。

## 注意

- 这里记录动态任务，不是长期画像。
- 真实 `<ticket-key>` 任务目录默认被 `.gitignore` 忽略。
- 不要把密钥、账号密码、生产 token 写入任务文件。
- 项目执行 Chat 不默认读取完整 `ai-context`，只读取自己的 handoff 和 handoff 指定资料。
- 不再单独维护 `05-<project>-dev-plan.md`；开发计划由 superpowers 原生产物承担。
