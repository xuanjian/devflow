# customize-mini-program

## 基本信息

- repoKey: `customize-mini-program`
- path: `/Users/xj/Documents/frontend/customize-mini-program`
- technologyFamilyId: `frontend`
- technologyFamilyName: `前端`
- repoType: `mini-program-app`
- package: `customize-mini-program`

## 项目定位

订货宝原生微信小程序壳工程。它负责微信小程序入口、页面壳、支付/分享/下载等原生小程序能力，并通过 WebView 承接订货宝 H5 链路。

这个仓库不是 Taro 业务组件库；如果需求涉及跨端组件、H5/微信分包产物或 npm 包发布，通常还要联动 `dhbfront-cash-mini` 或 `DHB_PACKAGES`。

## 技术栈/关键目录

- 原生微信小程序结构：`app.js`、`app.json`、`app.wxss`、`pages/`、`component/`、`utils/`。
- 环境与 AppID 替换脚本：`scripts/beforeCompile.js`，对应 `npm run env:master`、`npm run env:release`、`npm run env:stage`。
- 上传脚本：`scripts/beforeUpload.js`，对应 `npm run upload`。
- npm 依赖：`@dhbmini/cash`，用于接入 cash-mini 发布出的包能力。
- 重要生成/配置文件：`configEnv.js`、`ext.json`、`project.config.json`、`project.private.config.json`。

## 典型使用场景

- 调整小程序壳自身页面、登录、支付、分享、下载、海报预览等微信端能力。
- 排查小程序 WebView 到 H5 的参数、域名、AppID 或 company_id 问题。
- 在测试/正式环境之间切换小程序域名、appid、ext 配置。
- 验证 cash-mini npm 包在原生微信小程序中的接入效果。

## 与其他项目关系

- 上游包：`dhbfront-cash-mini` 发布 `@dhbmini/cash` 后，本仓库通过 npm 构建使用。
- H5 链路：常与 `dhb-mobile-index`、`new_mobile_h5` 一起排查 WebView 页面。
- 图片资源：小程序图片可能来自 `dhbfront-img` 的 OSS 图片包。

## 读取建议

- 单独改小程序壳时，先读本文件、`config/projects/customize-mini-program.json`、`README.md` 和对应 `pages/<业务>/`。
- 涉及 H5 容器时，再读 `docs/scenes/mini-program-h5-webview.md`。
- 涉及 cash 分包或 npm 包时，再读 `dhbfront-cash-mini` 与 `DHB_PACKAGES` 的项目介绍。

## 默认场景

- `single-repo-change` - 默认单仓修改场景
- `mini-program-h5-webview` - 小程序到 H5 容器链路
- `packages-cash-index-h5-webview` - 分包到 cash / index / h5 / webview 链路

## 标签

- `dhb`
- `frontend`
- `mini-program`
