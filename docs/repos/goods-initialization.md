# goods-initialization

## 基本信息

- repoKey: `goods-initialization`
- path: `/Users/xj/Documents/frontend/goods-initialization`
- technologyFamilyId: `frontend`
- technologyFamilyName: `前端`
- repoType: `plugin`
- package: `goods-initialization`
- runtime: Node `>=18.0.0`

## 项目定位

无图商品批量搜图工具，内补人员用的工具。当前实现是一个 Egg 单仓库同时承载页面、接口和后台 worker，用于登录后获取真实商品列表，对无图商品批量搜图，并在任务视图中审核、选择和应用图片。

虽然索引类型是 frontend/plugin，但仓库实际同时包含 React 前端、Egg 服务、Redis/队列 worker 和任务状态流转。

## 技术栈/关键目录

- 后端：Egg + TypeScript + tegg，入口 `app.ts`、`app/router.ts`。
- 前端：React + Ant Design，源码在 `frontend/goods-initialization/`，构建后进入 Egg 静态资源/视图链路。
- 服务目录：`app/controller/`、`app/service/`、`app/utils/`、`app/view/`。
- 配置目录：`config/`，包含环境、白名单、worker role 等配置。
- Worker/任务：通过 `WORKER_ROLE` 区分 search/apply/all。
- 构建/验证：`npm run build:frontend`、`npm run tsc`、`npm run lint`、`npm run test`、`npm run prepublishOnly`。

## 典型使用场景

- 无图商品批量搜索候选图片、任务队列、审核和应用流程开发。
- 排查图片搜索 API、任务状态、Redis errorMessage 或 worker 执行问题。
- 调整任务页前端交互，例如候选图预览、抽屉、审核操作。
- 单仓库内同时修改前端和 Egg 接口。

## 与其他项目关系

- 工程风格参考过 `/Users/xj/Documents/node/bff-goods`。
- 商品数据/图片能力可能与 DHB 商品 BFF 或外部搜图服务联动。

## 读取建议

- 先读 `config/projects/goods-initialization.json`、本文件和仓库 `README.md`。
- 需求不清时先补齐入口、用户可见结果、是否影响接口/任务状态/审核流程。
- 排查搜图失败时优先看真实任务日志、Redis 记录和最小 curl 复现，不要只猜前端展示。

## 默认场景

- `single-repo-change` - 默认单仓修改场景

## 标签

- `plugin`
- `tool`
