---
alwaysApply: true
---
# new_mobile_h5 开发规范

**技术栈**: 原生 JavaScript + Zepto + Gulp

## 项目作用

- 作为主容器，通过 iframe 加载 `dhb-mobile-index`
- iframe id: `home-iframe`
- 当路由匹配 `#/home` 时显示 iframe，其他路由显示原有页面

## 环境配置

- **开发环境**: 修改 `local/domainConfig.js` 和 `local/projectConfig.js`
- **生产环境**: 修改 `js/config/domainConfig.js` 和 `js/config/projectConfig.js`
- 开发环境通过 `server.js` 代理，自动读取 `local/` 配置

## 运行方式

- 开发模式: `npm start` (端口 9009)
- 构建: `npm run build` 或 `npm run build_split`

## 代理配置

- `server.js` 负责代理 `dhb-mobile-index` 的请求
- iframe 加载路径: `/mobile-index#/home` (代理到 dhb-mobile-index)

## 注意事项

- 这是一个传统项目，使用原生 JS，避免引入现代框架
- 主要职责是作为容器，业务逻辑在新H5项目中
- 确保 iframe 的 src 配置正确
- 保持代码简洁，避免过度复杂化

