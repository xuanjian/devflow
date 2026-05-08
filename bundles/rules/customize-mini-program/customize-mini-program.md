---
alwaysApply: true
---
# customize-mini-program 开发规范

**技术栈**: 原生小程序 + npm 包

## 环境切换

- **方式一**: 命令行参数 `node scripts/beforeCompile.js env=stage|release|master`
- **方式二**: Git 分支自动判断（master → 正式环境，其他 → 测试环境）
- 在微信开发者工具中点击"编译"会自动执行 `beforeCompile.js`

## 配置文件

- `scripts/env.js` - 环境配置源文件（**手动修改此文件**）
- `scripts/beforeCompile.js` - 编译前脚本（自动生成配置）
- `configEnv.js` - **自动生成，不要手动修改**
- `ext.json` - **自动生成，不要手动修改**
- `project.private.config.json` - **自动生成，不要手动修改**

## 环境配置说明

- `stage` (测试环境): appid `wxcc8dd5ebedb797cd`
- `release` (预发环境): appid `wxf3dd7d9d4c635f1a`
- `master` (正式环境): appid `wxf3dd7d9d4c635f1a`

## webview 配置

- `home` 页面使用 `webview` 组件
- webview 的 src 指向 `new_mobile_h5` 的域名
- 实际显示的是 `dhb-mobile-index` 的首页（通过 iframe）

## npm 包使用

- 安装 `@dhbmini/cash` 后，需要在微信开发者工具中：工具 → 构建 npm
- 修改 npm 包后必须重新构建

## 开发流程

1. 安装依赖: `npm install`
2. 配置环境: 点击编译按钮（自动执行）或手动运行 `node scripts/beforeCompile.js`
3. 构建 npm: 在微信开发者工具中执行
4. 上传代码: `npm run upload`

## 注意事项

- 如果配置没有生效，多点击一次编译按钮
- 清理缓存，关闭开发者工具，重新打开
- 确保小程序后台配置了正确的业务域名
- webview 域名必须在微信公众平台配置
- **不要手动修改自动生成的配置文件**

