# bff-warehouse

## 基本信息

- repoKey: `bff-warehouse`
- path: `/Users/xj/Documents/node/bff-warehouse`
- technologyFamilyId: `bff`
- technologyFamilyName: `BFF / Node`
- repoType: `bff-service`
- package: `dhb-node-stock`
- runtime: Egg 3 + TypeScript + tegg, Node.js >= 18

## 项目定位

仓储业务 BFF 服务，面向 DHB 管理端、H5/App 仓储链路提供中间层接口。代码里覆盖入库、出库、发货、库存商品、供应商、表格列配置、打印预览、导入导出任务等仓储相关能力。

这个仓库不是通用打印服务，也不是商品主数据服务；它主要负责仓储域接口编排、字段转换、上游请求封装、权限上下文和仓储相关打印数据准备。

## 技术栈/关键目录

- `config/`: 环境配置、白名单、插件和本地/生产配置。
- `app/module/app/inStock`: 入库列表、详情、新增、筛选和打印相关接口。
- `app/module/app/outShippingStock`: 出库/发货库存列表、详情、记录相关接口。
- `app/module/app/outWarehouse`: 出库单列表、详情、新增和打印能力。
- `app/module/app/shipping`: 发货列表、详情和请求封装。
- `app/module/app/goods`: 仓储侧商品、SKU、库存商品详情。
- `app/module/app/table`: App 端表格列配置，按出库、供应商、发货、入库、库存商品等场景拆分。
- `app/module/pc/goods`: PC 商品导入、多规格导入和模板处理。
- `app/module/common/*`: BFF 基础服务、DHB 请求封装、Redis、打印模型等公共能力。

## 典型使用场景

- H5/App 仓储页面接口联调，比如入库、出库、发货、库存商品列表和详情。
- 仓储打印预览或打印数据异常排查，尤其是入库、出库、发货单据。
- PC 仓储商品导入、导入任务、模板字段问题排查。
- 仓储接口权限、登录上下文、Redis 缓存或日志级别动态调整问题。

## 与其他项目关系

- 依赖 `egg-dhb-framework` 作为 Egg 框架扩展和基础能力入口。
- 依赖 `egg-dhb-permission` 做 DHB 接口权限控制。
- 依赖 `@egg-dhb-business/app-print-lib`、`common-lib`、`table-lib`、`system-config-lib` 等来自 `egg-business` 的公共业务包。
- 常与管理端/H5 仓储页面、原生打印预览链路联调；涉及打印时还可能与独立 `print` 服务或原生打印能力形成上下游关系。

## 读取建议

先从 `config/projects/bff-warehouse.json` 确认项目路由，再按任务入口读取对应模块目录。仓储业务问题优先看 `app/module/app/*`；PC 导入问题看 `app/module/pc/goods` 和 `app/module/pc/task`；打印问题重点看对应业务模块的 `*Print*` service 和 `app/module/common/print`。
