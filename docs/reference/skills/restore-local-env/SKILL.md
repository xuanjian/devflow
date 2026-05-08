---
name: restore-local-env
description: 恢复 DHB 本地联调环境。触发词：恢复环境、恢复配置、结束开发、还原配置。用于停止统一执行器启动的进程并恢复其备份的配置文件。
---

# 恢复本地开发环境

## 目标

停止 `run-projects` 统一执行器拉起的进程，并恢复其维护的备份文件。

## 执行入口

```bash
node /Users/xj/Documents/ai-context/bundles/skills/run-projects/run-projects.js --restore
```

## 说明

- 会先恢复 `/Users/xj/Documents/ai-context/bundles/skills/run-projects/runtime/backups/` 里的备份
- 会停止 `/Users/xj/Documents/ai-context/bundles/skills/run-projects/runtime/pids/` 里记录的进程
- 恢复完成后，如有本地服务仍在运行，需按需重启
- 这里的“恢复”是恢复到 `run-projects` 最近一次启动前写入的备份，不是恢复到 Git 基线
- 如果某个文件在写备份前就已经有本地修改，`--restore` 后这些修改仍会保留
- `run-projects` 已不再把 `new_mobile_h5/js/common/dhb.js` 纳入环境切换和备份恢复范围；恢复环境不会改动它的 9009 本地 debug 覆盖逻辑
- 若用户明确要恢复仓库版本，应单独对目标文件执行 `git restore --source=HEAD -- <path>`
