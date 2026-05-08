# egg-dhb-framework

## 基本信息

- repoKey: `egg-dhb-framework`
- path: `/Users/xj/Documents/node/plugin/egg-dhb-framework`
- technologyFamilyId: `bff`
- technologyFamilyName: `BFF / Node`
- repoType: `plugin`
- package: `dhb-node-stock`
- runtime: Egg 3 + TypeScript + tegg, Node.js >= 18

## 项目定位

DHB BFF 基础框架仓库，为多个 Egg/tegg BFF 提供基础 Controller、基础 Service、DHB 请求封装、权限服务、登录上下文模型、gRPC 权限客户端、日志/权限中间件和健康检查等通用框架能力。

这个仓库处在业务 BFF 下方，改动会影响多个服务。只有框架级行为、公共请求上下文、基础权限、基础 Controller/Service 或插件接入边界需要调整时，才应进入这里。

## 技术栈/关键目录

- `config/`: 框架默认配置、白名单、插件和环境配置。
- `app/module/common/base/controller/baseCtorller.ts`: 基础 Controller。
- `app/module/common/base/service/baseService.ts`: 基础 Service 和通用注入能力。
- `app/module/common/curls/service/dhbCurl.ts`: DHB 请求封装。
- `app/module/common/permission/service/dhbPermission.ts`: 权限服务封装。
- `app/middleware/permission.ts`: 权限中间件。
- `app/middleware/loggerSwitchPermission.ts`: 日志开关权限中间件。
- `app/grpc/*`: 权限 gRPC 生成代码。
- `app/model/*`、`app/contract/*`: 基础模型和 Swagger/契约描述。

## 典型使用场景

- 多个 BFF 同时出现基础 Controller/Service、权限上下文、DHB 请求封装或日志中间件问题。
- 新 BFF 接入 DHB 框架插件，需要确认框架暴露的基础能力。
- 修改权限校验、白名单、登录态透传、gRPC 权限客户端等跨仓库公共逻辑。

## 与其他项目关系

- 被 `bff-order`、`bff-warehouse`、`bff-goods`、`bff-user` 等仓库通过 `egg.framework` 或依赖引用。
- 与 `egg-dhb-permission` 分工不同：本仓库提供更完整的 BFF 基础框架和权限服务封装，`egg-dhb-permission` 更像独立权限中间件插件。
- 与 `egg-business` 分工不同：本仓库偏框架层，`egg-business` 偏可复用业务包。

## 读取建议

业务字段问题不要先改这里。只有问题已经证明属于框架公共行为时，再读 `app/module/common/base`、`app/module/common/curls`、`app/module/common/permission` 和 `app/middleware`。改动后需要考虑所有消费该框架的 BFF 服务。
