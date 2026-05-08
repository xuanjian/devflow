# egg-dhb-permission

## 基本信息

- repoKey: `egg-dhb-permission`
- path: `/Users/xj/Documents/node/plugin/egg-dhb-permission`
- technologyFamilyId: `bff`
- technologyFamilyName: `BFF / Node`
- repoType: `plugin`
- package: `egg-dhb-permission`
- runtime: Egg plugin, JavaScript, Node.js >= 16

## 项目定位

DHB 接口权限控制 Egg 插件。插件提供 `permission` 中间件，根据配置的权限服务地址、白名单、免鉴权白名单和本地开发配置，对请求进行权限校验，并把校验结果写入请求上下文。

这个仓库职责很窄，主要处理权限中间件本身，不承载业务 Controller/Service。业务接口权限异常时，应先判断是业务服务配置问题、权限服务返回问题，还是插件中间件逻辑问题。

## 技术栈/关键目录

- `config/config.default.js`: 插件默认配置，包含 `permission` 配置结构。
- `app/middleware/permission.js`: 权限中间件主体逻辑。
- `app/model/permissionModel.js`: 权限校验类型/模式定义。
- `test/fixtures/apps/example`: Egg 插件测试用例工程。
- `test/index.test.js`: 插件基础测试。

## 典型使用场景

- BFF 接口权限校验、白名单、免鉴权路径、本地 dev 权限模拟出现异常。
- 需要确认 `skey`、`sessionId`、PC clientSessionId 等不同鉴权模式如何调用权限服务。
- 多个 BFF 同时受同一权限插件行为影响。

## 与其他项目关系

- 被多个 DHB BFF 服务依赖，例如 `bff-order`、`bff-warehouse`、`bff-goods`、`bff-user`。
- 与 `egg-dhb-framework` 有边界重叠，但本仓库是独立权限插件，框架仓库则包含更完整的基础 Controller/Service 和请求封装。
- 上游依赖实际权限服务接口，例如 `/permission/check` 和 `/permission/checkBySessionId`。

## 读取建议

权限问题先在业务 BFF 确认 `config/plugin.ts`、`config/whitePath.ts`、`noAuthWhitePath` 和权限服务返回；如果多个服务表现一致，或中间件对路径、状态码、上下文写入的处理有问题，再读 `app/middleware/permission.js`。
