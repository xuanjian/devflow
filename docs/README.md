# docs

`docs` 目录用于放初始化后生成的本地说明文档。刚安装时这里保持最小状态，不预置个人项目或公司资料。

## 框架文档

- `docs/install.md`：新机器安装、OpenSpec/superpowers 依赖、首次初始化、项目接入和隐私检查。
- `docs/project-introduction.md`：DevFlow 的任务处理流程、G1-G7、OpenSpec/superpowers 分工和看板用法。

## 初始化后通常会生成

- 项目介绍正文默认放在业务项目的 `.ai-configs/project.md`；DevFlow 只在 `config/projects/*.json` 里记录入口路径和关系。
- `docs/scenes/<scene-id>.md`：场景说明、涉及项目、协作步骤、验证方式。
- `docs/person/profile.md`：本机用户画像和 AI 协作偏好。

## 生成方式

推荐让 AI 执行 `devflow-init`，通过对话收集信息后自动生成这些文档和对应 JSON 关系。

也可以在面板中新增项目、场景、skill、rule，让后端 action 生成配套文件。

## 隐私边界

公开仓库不要提交真实项目资料、账号、token、工单、内部链接或个人画像。需要共享最小版时，只保留示例或空模板。
