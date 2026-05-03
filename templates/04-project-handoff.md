# 04 Project Handoff

## 基本信息

- Ticket：
- 项目标识：frontend / bff / ios / mini-program / pc
- 项目路径：
- 分支：
- 当前 Gate：G4 Development

## 必须读取

- Intake：
- Discovery：
- Product/UI：
- Tech Plan：
- Figma：
- 其他：

## 本项目任务

- 

## 写入范围

- 允许创建：
  - 
- 允许修改：
  - 
- 禁止修改：
  - 

## 关键业务规则

- 

## 接口 / 数据 / 字段

- 

## UI / 产品对齐要求

- 

## 必须执行的 superpowers

| superpower | 触发条件 | 产物要求 |
| --- | --- | --- |
| writing-plans | 需要实施计划、跨文件、跨模块或风险不低时 | 产物写入 `runtime/tasks/<ticket-key>/superpowers/<project>/`，PM Chat 审核后才能开发。 |
| test-driven-development | 功能、Bug、行为变更 | 按 superpower 要求先写失败测试，再实现。 |
| systematic-debugging | 根因不清、测试失败、构建失败、行为异常 | 记录调查证据和结论。 |
| verification-before-completion | 声明完成前 | 记录验证命令和结果。 |

## superpower 产物目录

```text
runtime/tasks/<ticket-key>/superpowers/<project>/
```

不再单独生成 `05-<project>-dev-plan.md`。如果 `writing-plans` 产出实施计划，PM Chat 审核该 superpower 产物后再允许开发。

## 验证要求

- 

## 项目执行 Chat 启动语

```text
读取 /Users/xj/Documents/ai-context/runtime/tasks/<ticket-key>/04-<project>-handoff.md。
按 handoff 指定的 superpowers 执行；将 superpower 产物写入 /Users/xj/Documents/ai-context/runtime/tasks/<ticket-key>/superpowers/<project>/。
如果 writing-plans 生成实施计划，等待 PM Chat 审核通过后再开发。完成后生成 05-<project>-result.md。
```
