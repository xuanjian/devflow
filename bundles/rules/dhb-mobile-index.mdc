---
alwaysApply: true
---
# dhb-mobile-index 开发规范

**技术栈**: React + TypeScript + SCSS

## 项目结构

- `src/` - 主应用代码
- `srcPc/` - PC 模式代码
- `srcH5Public/` - 公开页面代码
- `share/` - 共享代码和组件

## 环境配置

- 开发环境优先看 `local/domainConfig.js` 和 `local/projectConfig.js`
- 生产环境优先看 `public/config/domainConfig.js` 和 `public/config/projectConfig.js`

## 运行方式

- 开发模式: `npm start`
- 生产构建: `npm run build`
- 通过 `new_mobile_h5` 代理访问时，路径为 `/mobile-index`

## 路由规则

- 主应用路由: `/mobile-index#/xxx`
- PC 模式路由: `/mobile-index/pc#/xxx`
- 公开页面路由: `/mobile-index/public#/xxx`

## 注意事项

- 修改 `local/` 配置后通常需要重启开发服务器
- 注意与 `new_mobile_h5` 的 iframe 集成
- 涉及容器问题时优先补充 `index-h5-webview` scene
