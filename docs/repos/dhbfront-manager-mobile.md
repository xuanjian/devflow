# dhbfront-manager-mobile

## 基本信息

- repoKey: `dhbfront-manager-mobile`
- path: `/Users/xj/Documents/frontend/dhbfront-manager-mobile`
- technologyFamilyId: `frontend`
- technologyFamilyName: `前端`
- repoType: `web-app`
- package: `dhbfront-manager-mobile`

## 项目定位

DHB 管理端移动 H5 项目，面向管理端在移动设备或原生 WebView 中使用的业务页面。当前技术栈是 React + TypeScript + Vite，和 PC 管理端 `dhb-manager` 不是同一个工程。

近期盘点单改造等管理端移动需求通常落在这里，并可能联动 iOS 原生 WebView/桥接和 BFF。

## 技术栈/关键目录

- React + TypeScript + Vite。
- UI/样式：`antd-mobile`、MUI、`styled-components`、`lucide-react`。
- 请求/路由：`axios`、`react-router`、`react-router-dom`、`rxjs`。
- 启动/构建：`npm start`、`npm run dev -- --host`、`npm run build`、`npm run preview`。
- 页面与模块：`src/pages/`、`src/module/`。
- 路由与模型：`src/router/`、`src/model/`。
- 公共逻辑：`src/hooks/`、`src/utils/`、`src/typings/`。
- 域名配置：`config/domainConfig.js` 运行期注入，开发态使用 `local/domainConfig.js`。

## 典型使用场景

- 管理端移动 H5 页面开发，例如盘点单、仓库、订单或管理端移动工作流。
- iOS/Android WebView 内打开管理端移动页后的参数、桥接、打印预览或域名问题。
- 与 BFF 接口联调，尤其是仓库、订单、商品等管理端接口。
- 和 PC 管理端 `dhb-manager` 对照业务字段和交互口径。

## 与其他项目关系

- PC 对照：`dhb-manager`。
- 原生容器：iOS/Android 管理端 WebView 可能负责打开页面、桥接和打印预览。
- BFF：盘点、库存、订单等需求常联动 `bff-warehouse`、`bff-order` 或 `bff-goods`。
- 公共域名工具：依赖 `@dhbfront-utils/domain`。

## 读取建议

- 先读 `config/projects/dhbfront-manager-mobile.json`、本文件和仓库 `README.md`。
- 改页面时从 `src/router/` 定位入口，再读 `src/pages/` 或 `src/module/` 下的具体模块。
- 涉及 WebView/原生桥接时，不要只看 H5；同步查原生调用参数和 BFF 字段口径。

## 默认场景

- `single-repo-change` - 默认单仓修改场景

## 标签

- `dhb`
- `frontend`
- `manager`
