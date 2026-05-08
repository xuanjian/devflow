# im-H5

## 基本信息

- repoKey: `im-h5`
- path: `/Users/xj/Documents/frontend/im-H5`
- technologyFamilyId: `frontend`
- technologyFamilyName: `前端`
- repoType: `web-app`
- package: `NIM_WEB_HTML5_DEMO`

## 项目定位

IM 相关 H5 项目，代码基础来自网易云信 Web Demo H5/Vue 版本。它更偏即时通讯 Demo/集成工程，不是 DHB/HXB 主业务前端。

## 技术栈/关键目录

- Vue 2 风格 H5 Demo + Webpack/Babel/PostCSS。
- 本地服务：`npm run server` 或 `node server`，默认 README 指向 `http://127.0.0.1:2001/webdemo/h5/index.html`。
- 构建：`npm run dev`、`npm run build`、`npm run prod`。
- 后端示例服务：`server.js`、`server/` 相关依赖。
- 源码：`src/App.vue`、`src/pages/`、`src/router/`、`src/store/`、`src/sdk/`、`src/themes/`、`src/utils/`。
- 静态入口：`index.html`、`login.html`、`regist.html`。

## 典型使用场景

- IM H5 Demo 定制、云信 SDK 接入或移动端 WebView IM 页面排查。
- 修改登录/注册/聊天页面、主题样式或 SDK 配置。
- 本地启动云信 H5 示例服务进行验证。

## 与其他项目关系

- 当前索引没有显示它和 DHB/HXB 核心链路的强绑定关系；处理时应先确认业务入口。
- 如果只是普通订货宝/货销宝移动端问题，通常不应优先选本仓库。

## 读取建议

- 先读 `config/projects/im-h5.json`、本文件和仓库 `README.md`。
- 资料主要来自原 Demo README；如果业务定制入口不明确，需要先让需求方确认当前线上入口或页面 URL。
- 避免把云信 Demo 的通用说明误当成 DHB/HXB 业务规则。

## 默认场景

- `single-repo-change` - 默认单仓修改场景

## 标签

- `frontend`
