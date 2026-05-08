# bff-payment

## 基本信息

- repoKey: `bff-payment`
- path: `/Users/xj/Documents/node/bff-payment`
- technologyFamilyId: `bff`
- technologyFamilyName: `BFF / Node`
- repoType: `bff-service`
- package: `bff-payment`
- runtime: Egg 3 + TypeScript + tegg, Volta Node 18.17.0

## 项目定位

支付与结算域 BFF 服务，负责支付账户、支付申请、HHT 支付、支付宝/微信相关接口、分账、结算、提现、调整结算、交易流水、账期、操作日志等支付链路中间层能力。

这个仓库处理的是资金、账户、结算和支付平台对接相关接口；订单详情、商品、仓储等业务字段如果只是支付链路的入参或展示依赖，应先确认是否真正归属支付域。

## 技术栈/关键目录

- `config/`: 环境配置、白名单、插件和支付相关常量配置。
- `app/module/payment`: 通用支付接口入口。
- `app/module/payment/hht`: HHT 支付相关接口。
- `app/module/payment/alipay`、`app/module/alipayApi`: 支付宝支付、登录和阿里云能力。
- `app/module/paymentAccount`: 支付账户管理。
- `app/module/apply`: 支付/开通/申请类接口。
- `app/module/splitBill`: 分账和清分能力。
- `app/module/settlement`: 结算、提现、手续费、调整结算等能力。
- `app/module/transactionNotes`: 交易流水/交易记录能力。
- `app/module/client/clientBillPeriod`: 客户账期配置。
- `app/module/common`: 表格、筛选、账户、支付、日志等公共服务封装。

## 典型使用场景

- 支付账户、支付方式、支付申请或 HHT/支付宝相关接口联调。
- 分账、结算、提现、手续费、调整结算等资金链路排查。
- 交易流水、账期、支付日志、操作日志展示异常。
- 需要核对支付域调用 DHB 后端、Payment 后端或阿里云/支付宝 SDK 的参数和返回。

## 与其他项目关系

- 使用 `@egg-dhb-business/common-lib` 等公共包，部分能力与 `egg-business` 共享。
- 与订单 BFF 存在业务衔接，但支付域资金逻辑应优先在本仓库确认。
- 与前端管理端、App/H5 支付入口、第三方支付/云平台服务存在联调关系。
- 当前仓库未配置 `egg.framework` 指向 `egg-dhb-framework`，但仍采用 Egg + tegg 组织接口。

## 读取建议

资金相关改动先定位到具体子域：账户看 `paymentAccount`，支付动作看 `payment`/`payment/hht`/`payment/alipay`，结算看 `settlement`，分账看 `splitBill`，流水看 `transactionNotes`。涉及生产打包时注意 `tsc-server` 会替换 `permission-prod.ts`。
