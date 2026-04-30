# DHB 前端共享链路上下文

> 这份前端共享链路说明最初来自旧的 `_dhb-ai-context/AGENTS.shared.md`，现已收拢到 `ai-context`，供前端联调类 scene 和共享 skill 参考。

## 项目链路

`DHB_PACKAGES -> dhbfront-cash-mini -> dhb-mobile-index -> new_mobile_h5 -> customize-mini-program / iOS WebView`

## 关键路由规则

- 当从 `new_mobile_h5` 进入 React 页面，必须使用 `#/home/...`
- `dhb-mobile-index` 的 `HashRouter` 使用 `basename="/home"`，容器侧会补 `/home`

## 联调推荐顺序

1. `dhbfront-cash-mini`
2. `dhb-mobile-index`
3. `new_mobile_h5`
4. `customize-mini-program`

## 常见启动组合

1. `dhb-packages + dhbfront-cash-mini + dhb-mobile-index + new_mobile_h5 + customize-mini-program`
2. `dhb-packages + dhbfront-cash-mini + dhb-mobile-index + new_mobile_h5`
3. `dhbfront-cash-mini + dhb-mobile-index + new_mobile_h5`
4. `dhbfront-cash-mini + dhb-mobile-index + new_mobile_h5 + customize-mini-program`
5. `dhb-mobile-index + new_mobile_h5 + customize-mini-program`
6. `dhb-mobile-index + new_mobile_h5`

## 组合选择小指引

- 只看 H5 页面 UI 或交互：`dhb-mobile-index`，必要时加 `new_mobile_h5`
- 调试 cash 组件或主包逻辑：`dhbfront-cash-mini + dhb-mobile-index`
- 调试分包能力：`DHB_PACKAGES + dhbfront-cash-mini + dhb-mobile-index`
- 需要小程序容器联调：在上述基础上补 `customize-mini-program`

## 环境切换要点

- H5 主要通过 `local/domainConfig.js` 切换
- `new_mobile_h5` 不再通过修改 `js/common/dhb.js` 的 9009 分支切环境；本地 debug 覆盖逻辑保持原样
- 小程序环境由 `scripts/beforeCompile.js` 与 `project.config.json` 控制
