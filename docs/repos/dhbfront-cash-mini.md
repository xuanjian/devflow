# dhbfront-cash-mini

## 基本信息

- repoKey: `dhbfront-cash-mini`
- path: `/Users/xj/Documents/frontend/dhbfront-cash-mini`
- technologyFamilyId: `frontend`
- technologyFamilyName: `前端`
- repoType: `frontend-library`
- package: `@dhbmini/cash`
- runtime: Volta `node@20.0.0`

## 项目定位

Taro 跨平台业务组件/分包工程，是 DHB H5、小程序和原生小程序链路之间的公共组件层。支付宝侧可作为独立小程序开发，微信和 H5 侧通常打成 npm 包或 native components 供下游集成。

当需求涉及 cash、Taro 跨端组件、微信分包、H5 分包或 `@dhbmini/cash` 发布时，应优先定位到这里。

## 技术栈/关键目录

- Taro + React + TypeScript，支持 weapp、alipay、h5、tt、swan、qq、jd、quickapp 等构建目标。
- 开发/构建：`npm run dev:weapp`、`npm run dev:h5`、`npm run build:alipay`、`npm run pack:build`。
- 发布：`publish:test`、`publish:release`、`publish:gray`、`publish:prod`。
- 业务组件：`src/componentBusiness/`。
- 纯 UI 组件：`src/componentPure/`。
- 页面与分包：`src/pages/`、`src/subPackages/`、`src/subpackagesh5/`、`src/subpackagesh5Client/`。
- 请求/模型/工具：`src/services/`、`src/model/`、`src/utils/`、`src/hooks/`。
- 构建配置：`config/`、`wyw-in-js.config.js`、`scripts/`。

## 典型使用场景

- 开发跨 H5/微信/支付宝的 Taro 业务组件。
- 调试 cash 分包在 `dhb-mobile-index`、`new_mobile_h5` 或小程序中的表现。
- 发布 `@dhbmini/cash` 测试包、灰度包或正式包。
- 将 `DHB_PACKAGES` 的领域模块接入 cash-mini。

## 与其他项目关系

- 上游模块：`DHB_PACKAGES` 提供部分领域业务包。
- 下游消费：`customize-mini-program` 依赖 `@dhbmini/cash`；H5 链路可能经 `dhb-mobile-index` 或 `new_mobile_h5` 使用。
- 图片资源：常通过 `dhbfront-img` 或 `getImageUrl` 类工具取移动端图片。

## 读取建议

- 先读 `config/projects/dhbfront-cash-mini.json`、本文件和仓库 `README.md`。
- 新组件优先放 `src/componentBusiness/` 或 `src/componentPure/`，不要继续扩展 README 标记为废弃的旧目录。
- 涉及发布或分包联调时，同步读 `dhb-local-env`、`dhb-subpackage-release` 或对应场景文档。

## 默认场景

- `single-repo-change` - 默认单仓修改场景
- `cash-index-h5-webview` - cash 到 index / h5 / webview 链路
- `packages-cash-index-h5-webview` - 分包到 cash / index / h5 / webview 链路
- `frontend-bff-debug` - 前端与部分 BFF 联调场景

## 标签

- `dhb`
- `frontend`
- `cash-mini`
