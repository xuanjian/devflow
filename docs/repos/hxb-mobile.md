# hxb-mobile

## 基本信息

- repoKey: `hxb-mobile`
- path: `/Users/xj/Documents/frontend/hxb-mobile`
- technologyFamilyId: `frontend`
- technologyFamilyName: `前端`
- repoType: `web-app`
- runtime: Volta `node@12.20.0`

## 项目定位

货销宝移动端 H5 项目，README 描述其主要承载货销宝 App 的资金、报表模块。项目支持 HXB/YXT 等不同 `UMI_ENV`，属于 Umi + React 老移动端工程。

## 技术栈/关键目录

- React + Umi + DVA + Ant Design + styled-components。
- 启动：`npm run start` 或 `npm run start:hxb`，默认端口 `3002`。
- 多环境：`start:hxb`、`start:yxt`、`build:hxb`、`build:yxt`、`build:stage`、`build:release`、`build:prod`。
- 配置：`config/`、`local/`、`mock/`。
- 源码：`src/pages/`、`src/models/`、`src/services/`、`src/components/`、`src/utils/`。
- 构建产物：`dist/`，README 提到提交构建文件时可能需要强制 add。

## 典型使用场景

- 货销宝移动端资金、报表等 H5 页面开发。
- HXB/YXT 两套环境或品牌入口的移动端构建问题。
- 老 Umi 项目的 mock、接口、构建产物排查。

## 与其他项目关系

- 和 iOS/HXB 原生项目可能存在 WebView 或资源联动，但本仓库是前端 H5 部分。
- `yxt-mobile` 是另一个更现代的 YXT Vite 移动端项目，不要混成同一仓库。

## 读取建议

- 先读 `config/projects/hxb-mobile.json`、本文件和仓库 `README.md`。
- 先确认当前任务目标是 HXB 还是 YXT，再选择对应 `UMI_ENV` 和构建命令。
- 老项目问题优先查 `config/`、`src/services/`、`src/pages/` 和 mock 配置。

## 默认场景

- `single-repo-change` - 默认单仓修改场景

## 标签

- `hxb`
- `frontend`
