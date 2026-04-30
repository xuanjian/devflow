# Runtime Tasks

> 这里存放 XUANJIAN 专属 Symphony 第一阶段的任务交接包。每个 Jira 或临时需求一个目录，用文件承载上下文，避免所有决策堆在单个聊天框。

## 目录结构

```text
runtime/tasks/<ticket-key>/
  intake.md
  pc-research.md
  reference-research.md
  requirement.md
  figma.md
  dev-handoff.md
  design-qa.md
```

## 使用方式

1. 主 PM Chat 创建 `<ticket-key>` 目录。
2. 使用 `templates/jira-intake-report.md` 写 `intake.md`。
3. 按需要补 `pc-research.md`、`reference-research.md`、`requirement.md`、`figma.md`。
4. 需求确认后生成 `dev-handoff.md`。
5. 项目执行 Chat 只读取 `dev-handoff.md` 和里面明确列出的资料。
6. 开发完成后生成 `design-qa.md`。

## 命名

- Jira 任务：使用 Jira key，例如 `DHB-12345`。
- 无 Jira 的临时任务：使用日期和短名，例如 `2026-05-01-stock-inventory-review`。

## 注意

- 这里记录动态任务，不是长期画像。
- 任务完成后可以保留归档，后续自动调度服务可读取这些文件。
- 不要把密钥、账号密码、生产 token 写入任务文件。
