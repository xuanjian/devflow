# egg-business

## 基本信息

- repoKey: `egg-business`
- path: `/Users/xj/Documents/node/egg-business`
- technologyFamilyId: `bff`
- technologyFamilyName: `BFF / Node`
- repoType: `shared-library`
- package: `egg-dhb-business`
- runtime: Egg 3 + TypeScript + tegg, workspaces `app/module/*`, Volta Node 19.0.0

## 项目定位

DHB Egg BFF 公共业务包仓库。根仓库通过 npm workspaces/Lerna 管理多个可发布包，给各 BFF 服务复用请求封装、表格列配置、Token、打印、OSS、系统配置等公共能力。

这个仓库不是某一个线上业务 BFF，而是公共业务能力的来源。只有当多个 BFF 共用逻辑需要统一、或业务服务依赖的 `@egg-dhb-business/*` 包需要调整时，才应进入这里。

## 技术栈/关键目录

- `app/module/common-lib`: 公共请求封装、HXB/DHB 网关签名、按钮权限、Excel 模板和 helper。
- `app/module/table-lib`: 表格列配置、通用列 Controller/Service、自定义字段配置。
- `app/module/token-lib`: Token 服务和中间件装饰器。
- `app/module/app-print-lib`: App 打印服务、打印模型和 ESC/POS 编码器。
- `app/module/ali-oss-lib`: 阿里 OSS 服务封装。
- `app/module/system-config-lib`: 系统配置读取和中间件。
- `config/`: 作为 Egg 工程本身运行/调试这些包时的配置。

## 典型使用场景

- BFF 服务依赖的 `@egg-dhb-business/common-lib`、`table-lib`、`token-lib`、`app-print-lib` 等公共包行为异常。
- 多个 BFF 重复实现同一套请求、表格列、打印、Token、OSS 或系统配置能力，需要收敛到公共包。
- 调整公共包版本、发布 Lerna workspace 包、验证下游 BFF 兼容性。

## 与其他项目关系

- 被 `bff-order`、`bff-warehouse`、`bff-goods`、`bff-user`、`bff-payment` 等 BFF 服务以 `@egg-dhb-business/*` 依赖消费。
- 依赖 `egg-dhb-framework` 作为框架层基础。
- 与具体业务 BFF 是“公共包 -> 服务消费方”的关系；修改这里需要额外关注下游多个服务的兼容。

## 读取建议

先确认问题是否真属于公共能力。如果只影响单个业务 BFF，优先在业务仓库修；如果多个仓库共用同一个 `@egg-dhb-business/*` 包，再读对应 `app/module/*` 包目录和该包自己的 `package.json`/README。发布相关操作看根 `package.json` 的 `lerna:*` 脚本。
