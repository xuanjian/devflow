# yxt-mobile

## 基本信息

- repoKey: `yxt-mobile`
- path: `/Users/xj/Documents/frontend/yxt-mobile`
- technologyFamilyId: `frontend`
- technologyFamilyName: `前端`
- repoType: `web-app`
- package: `yxt-mobile`

## 项目定位

盈销通移动端应用，基于 React + TypeScript + Vite 构建。它是独立的现代移动端前端项目，不应和老 Umi 项目 `hxb-mobile` 混用。

## 技术栈/关键目录

- React 19 + TypeScript + Vite。
- 路由/状态/UI：React Router DOM、Zustand、Antd Mobile、styled-components。
- 请求：Axios。
- 启动/构建：`npm run dev`、`npm run build`、`npm run preview`、`npm run start`。
- 源码：`src/pages/`、`src/components/`、`src/services/`、`src/hooks/`、`src/contexts/`、`src/config/`、`src/types/`、`src/utils/`。
- 部署说明：`DEPLOYMENT.md`。

## 典型使用场景

- 盈销通移动端页面开发、路由和接口联调。
- Vite/React 现代移动端构建、预览或部署问题。
- 多环境构建，README 提到通过 `MODE=development|staging|production` 控制环境。

## 与其他项目关系

- 与 `hxb-mobile` 都可能涉及 HXB/YXT 移动业务，但技术栈和仓库不同。
- 若需求来自旧货销宝 App 资金/报表 H5，优先核对是否实际落在 `hxb-mobile`。

## 读取建议

- 先读 `config/projects/yxt-mobile.json`、本文件和仓库 `README.md`。
- 页面任务按 `src/pages/` -> `src/services/` -> `src/config/` 查。
- 部署或环境变量问题再读 `DEPLOYMENT.md`。

## 默认场景

- `single-repo-change` - 默认单仓修改场景

## 标签

- `frontend`
