# new_mobile_h5

## 基本信息

- repoKey: `new-mobile-h5`
- path: `/Users/xj/Documents/frontend/new_mobile_h5`
- technologyFamilyId: `frontend`
- technologyFamilyName: `前端`
- repoType: `legacy-container`
- package: `dhb2`
- runtime: Volta `node@11.5.0`

## 项目定位

订货端老 H5 容器，承接历史 H5 页面、iframe/WebView 容器、分享页和部分移动端入口。它是 Gulp 3 时代的老工程，和新版 React H5 `dhb-mobile-index` 并存。

当问题出现老页面、`js/common/dhb.js`、`html/client/index.html`、分享 404、旧 WebView 容器或 Node/Gulp 兼容报错时，应优先考虑本仓库。

## 技术栈/关键目录

- 老式 H5 + Gulp 3 + Babel/Browserify + Express。
- 启动：`npm start`，入口 `server.js`。
- 构建：`npm run build`、`npm run build_split`、`npm run buildwx`。
- 关键配置：`js/common/dhb.js`、`local/`、`gulpfile.js`。
- 业务源码：`js/client/`、`js/manager/`、`js/services.js`、`js/directives.js`。
- HTML 入口：`html/`、`index.html`、`404.html`、`download.html`、`choice_platform.html`。
- README 明确 Node 需要 `<= v11.5.0`，高版本常见 `primordials is not defined`。

## 典型使用场景

- 老 H5 页面、分享页、下载页、游客/权限/404 等容器页排查。
- WebView 外壳到老 H5 的环境、登录态、域名和参数问题。
- 老 Gulp 构建、Node 版本、静态资源部署问题。
- 和新版 `dhb-mobile-index` 对照迁移或排查链路分流。

## 与其他项目关系

- 新版订货端 H5：`dhb-mobile-index`。
- 小程序 WebView：`customize-mini-program` 可能打开旧 H5 页面。
- cash 分包链路：可能联动 `dhbfront-cash-mini` 和 `DHB_PACKAGES`。
- 原生 App：iOS/Android WebView 可能仍打开这里的历史页面。

## 读取建议

- 先读 `config/projects/new-mobile-h5.json`、本文件和仓库 `README.md`。
- 环境/域名问题先查 `local/` 和当前运行脚本，不要随意改 `js/common/dhb.js`，除非任务明确要求。
- 老项目启动失败先确认项目内 Node/Volta 版本，再看 Gulp 3 兼容问题。

## 默认场景

- `single-repo-change` - 默认单仓修改场景
- `index-h5-webview` - index 到 h5 / webview 链路
- `cash-index-h5-webview` - cash 到 index / h5 / webview 链路
- `packages-cash-index-h5-webview` - 分包到 cash / index / h5 / webview 链路
- `mini-program-h5-webview` - 小程序到 H5 容器链路
- `ios-h5-webview-bff` - iOS + H5 + 容器 + BFF 全链路场景

## 标签

- `dhb`
- `frontend`
- `container`
