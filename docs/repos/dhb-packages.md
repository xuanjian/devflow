# DHB_PACKAGES

## 基本信息

- repoKey: `dhb-packages`
- path: `/Users/xj/Documents/frontend/DHB_PACKAGES`
- technologyFamilyId: `frontend`
- technologyFamilyName: `前端`
- repoType: `domain-packages`
- main workspace: `dhbfront-domain-goods/`

## 项目定位

DHB 分包业务模块集合，当前主要看到 `dhbfront-domain-goods` 工作区。它用于沉淀可被 cash-mini、H5 或小程序链路集成的领域业务包，常作为 `dhbfront-cash-mini` 的上游联调仓库。

这个仓库不是最终 App 壳，改动通常要考虑包导出、构建产物、版本发布和下游集成。

## 技术栈/关键目录

- 根目录主要是聚合层：`dhbfront-domain-goods/`、`docs/`、`package-lock.json`。
- 领域工作区：`dhbfront-domain-goods/packages/` 存放实际业务包。
- 工作区配置：`dhbfront-domain-goods/lerna.json`、`package.json`、`pnpm-workspace.yaml`。
- 脚本与测试：`dhbfront-domain-goods/scripts/`、`tests/`。
- 项目索引挂载了 `dhb-taro-module`、`dhb-api-from-curl`、`add-mobile-icon` 等技能，说明它常用于新增 Taro 业务模块、生成接口封装和接入移动端图片资源。

## 典型使用场景

- 新增或维护 DHB Taro 领域业务包。
- 为 cash-mini 或 H5 链路提供商品、支付等领域模块。
- 根据 curl 生成请求封装、mock 或模块内部服务代码。
- 新增移动端 SVG/图片资源并和 `dhbfront-img` 对齐。

## 与其他项目关系

- 下游集成：`dhbfront-cash-mini` 会消费这里的领域包。
- 终端链路：能力最终可能进入 `dhb-mobile-index`、`new_mobile_h5` 或 `customize-mini-program`。
- 图片资源：移动图标/图片常联动 `dhbfront-img`。

## 读取建议

- 先读 `config/projects/dhb-packages.json`，确认是否需要加载 `dhb-packages/core` 规则或相关技能。
- 改具体业务包时，进入 `dhbfront-domain-goods/packages/<package>/` 再读该包的 `package.json`、入口文件和 README。
- 资料不足时不要把根目录当成完整工程；当前有效源码主要在 `dhbfront-domain-goods/` 下。

## 默认场景

- `single-repo-change` - 默认单仓修改场景
- `packages-cash-index-h5-webview` - 分包到 cash / index / h5 / webview 链路
- `frontend-bff-debug` - 前端与部分 BFF 联调场景

## 标签

- `dhb`
- `frontend`
- `packages`
