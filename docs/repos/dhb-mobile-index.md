# dhb-mobile-index

## 基本信息

- repoKey: `dhb-mobile-index`
- path: `/Users/xj/Documents/frontend/dhb-mobile-index`
- technologyFamilyId: `frontend`
- technologyFamilyName: `前端`
- repoType: `web-app`
- package: `dhb-refactor`
- runtime: Volta `node@12.20.0`

## 项目定位

订货端 React H5 主入口，常处在订货宝移动端链路中心。它承接新版订货端 H5 页面、WebView 参数、分享页、容器跳转和部分 PC/H5 复用入口。

当问题描述里出现订货端 H5、index、WebView、分享链接、加购流程或 iOS/小程序容器参数时，这个仓库通常是优先候选。

## 技术栈/关键目录

- React + TypeScript + CRA/自定义脚本 + Webpack。
- 启动/构建：`npm start`、`npm run build`、`npm run test`、`npm run dll`。
- 入口与配置：`index.tsx`、`config/`、`scripts/`、`public/`、`local/`。
- H5 主源码：`src/pages/`、`src/router/`、`src/services/`、`src/api/`、`src/utils/`、`src/hooks/`。
- 共享/特殊入口：`share/`、`src/share/`、`srcH5Public/`、`srcPc/`。
- README 提到 App 嵌入页面常见参数：`skey`、`guest`、`statusHeight`、`timestamp`、`platform`。

## 典型使用场景

- 订货端 H5 页面开发、路由跳转、分享页和 WebView 参数排查。
- 加购、商品、订单、客户等订货端移动链路联调。
- iOS/Android/微信小程序容器打开 H5 后参数缺失、环境域名、登录态问题定位。
- 与老 H5 容器 `new_mobile_h5` 对照迁移或兼容。

## 与其他项目关系

- 容器/老链路：`new_mobile_h5` 常作为历史实现和外层容器参考。
- 小程序链路：`customize-mini-program` 可能通过 WebView 打开本仓库页面。
- 组件/分包：`dhbfront-cash-mini` 和 `DHB_PACKAGES` 可能提供部分可复用业务能力。
- BFF：常联动商品、订单、用户、仓库等 BFF。

## 读取建议

- 先读 `config/projects/dhb-mobile-index.json` 和本文件，确认是否是新版 H5 主入口。
- 具体问题先从路由、页面、服务三层查：`src/router/` -> `src/pages/` -> `src/services/`/`src/api/`。
- 容器问题要同步看场景文档：`index-h5-webview`、`cash-index-h5-webview`、`ios-h5-webview-bff`。

## 默认场景

- `single-repo-change` - 默认单仓修改场景
- `index-h5-webview` - index 到 h5 / webview 链路
- `cash-index-h5-webview` - cash 到 index / h5 / webview 链路
- `packages-cash-index-h5-webview` - 分包到 cash / index / h5 / webview 链路
- `mini-program-h5-webview` - 小程序到 H5 容器链路
- `frontend-bff-debug` - 前端与部分 BFF 联调场景
- `ios-h5-webview-bff` - iOS + H5 + 容器 + BFF 全链路场景

## 标签

- `dhb`
- `frontend`
- `h5`
