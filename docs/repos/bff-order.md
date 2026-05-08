# bff-order

## 基本信息

- repoKey: `bff-order`
- path: `/Users/xj/Documents/node/bff-order`
- technologyFamilyId: `bff`
- technologyFamilyName: `BFF / Node`
- repoType: `bff-service`
- package: `dhb-node-order`
- runtime: Egg 3 + TypeScript + tegg, Volta Node 18.20.0

## 项目定位

订单域 BFF 服务，覆盖订单详情、订单编辑、分享订单、发票/抬头/税号/项目、附件、地区、导出任务、AI 图片能力、采购记录、小程序发货等与订单链路强相关的接口编排。

这个仓库不是纯订单列表服务，实际承接了订单周边的大量业务能力。遇到订单详情字段、编辑、发票资料、分享订单、订单相关附件或小程序交付链路时，应优先从这里找入口。

## 技术栈/关键目录

- `config/`: 环境配置、白名单、插件和本地/生产配置。
- `app/module/detail`、`app/module/detailPcManager`: 订单详情、PC 管理端订单详情能力。
- `app/module/edit`: 订单编辑相关接口。
- `app/module/shareOrder`: 分享订单接口。
- `app/module/invoicePermission`、`invoiceConfig`、`title`、`taxNo`、`project`: 发票、抬头、税号、项目和开票权限能力。
- `app/module/Area`: 地区与客户地区关系。
- `app/module/goods`: 订单侧商品附件、商品视频配置等。
- `app/module/ai`: AI 图片/工作流相关能力。
- `app/module/miniDeliver`: 小程序发货/收货信息相关接口。
- `app/module/record`: 采购记录相关接口。
- `app/module/common/base`: BFF 基础服务、DHB 管理端请求、日志等公共封装。

## 典型使用场景

- 订单详情、订单编辑、订单商品字段展示或保存异常。
- 发票抬头、税号、项目、开票权限、电子发票相关联调。
- 分享订单、小程序发货、采购记录、附件/视频等订单周边能力排查。
- 订单域 AI 图片处理或图片分割能力排查。

## 与其他项目关系

- 依赖 `egg-dhb-framework` 和 `egg-dhb-permission`。
- 依赖 `@egg-dhb-business/app-print-lib`、`common-lib`、`table-lib`、`token-lib`、`system-config-lib` 等公共业务包。
- 与 `bff-payment` 在支付/结算链路上有衔接，但资金归属通常在 `bff-payment`。
- 与 `bff-goods` 有商品资料交集，但订单内商品展示、附件、视频等订单上下文逻辑通常在本仓库。

## 读取建议

先根据接口路径或业务名定位模块。订单主体看 `detail`/`edit`；开票相关看 `invoice*`、`title`、`taxNo`、`project`；分享和小程序交付看 `shareOrder`、`miniDeliver`；AI 能力看 `ai/service/workflow` 和对应 Controller。
