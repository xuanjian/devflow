# print

## 基本信息

- repoKey: `print`
- path: `/Users/xj/Documents/node/print`
- technologyFamilyId: `bff`
- technologyFamilyName: `BFF / Node`
- repoType: `tool`
- package: `custom-print-service`
- runtime: Koa 2 + Apollo GraphQL + Sequelize/MySQL, legacy JavaScript service

## 项目定位

自定义打印模板 Node 服务，提供打印模板、默认模板、数据源、纸张类型、模板预览、打印预览和 GraphQL 查询能力。它更像独立打印模板/预览服务，不是 Egg BFF。

这个仓库关注“模板配置与预览服务端”，包括模板数据结构、模板合并、预览 mock 数据、订单/拣货/发货预览数据转发等。原生打印桥接或业务 BFF 打印数据生成不一定在这里。

## 技术栈/关键目录

- `index.js`: Koa 应用入口，挂载 GraphQL、路由、中间件和上下文。
- `config/`: dev/test/prod 配置，包含服务地址、鉴权服务、管理端地址、MySQL 和 Sentry。
- `app/routes`: REST 路由，如 `/api/v1/templatePreview`、`/api/v1/printPreview`、纸张列表和打印解码。
- `app/graphql`: GraphQL schema、resolver、directive 和 scalar。
- `app/services/template.js`: 自定义打印模板增删改查、模板与默认模板数据合并。
- `app/services/default_template.js`: 默认模板读取。
- `app/services/datasource.js`: 打印数据源读取。
- `app/services/printPreviewService.js`: 订单、拣货、发货等预览数据请求转发。
- `app/lib/esc-pos-encoder.js`: ESC/POS 编码能力。
- `app/lib/data`: 模板预览 mock 数据。

## 典型使用场景

- 自定义打印模板列表、保存、启停、详情或默认模板合并异常。
- 打印模板预览页面、预览 mock 数据、打印预览接口异常。
- GraphQL 打印模板接口、数据源接口或纸张类型接口排查。
- 需要确认订单、拣货、发货预览数据是从哪个服务转发而来。

## 与其他项目关系

- 与 `bff-order`、`bff-warehouse` 在打印预览数据上有上下游关系，`printPreviewService` 会转发订单、出库/拣货、发货等预览请求。
- 与管理端打印模板配置页面存在联调关系。
- 与原生打印能力不是同一层：本仓库负责模板和预览服务端，原生负责设备/打印执行时不要混淆。

## 读取建议

模板配置问题先看 `app/services/template.js` 和 GraphQL resolver；预览问题先看 `app/routes/templatePreview.js` 与 `app/services/printPreviewService.js`；环境地址问题看 `config/config.*.js`。这个仓库是旧 JS/Koa 服务，不按 Egg BFF 规则找 `app/module`。
