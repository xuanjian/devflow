# bff-user

## 基本信息

- repoKey: `bff-user`
- path: `/Users/xj/Documents/node/bff-user`
- technologyFamilyId: `bff`
- technologyFamilyName: `BFF / Node`
- repoType: `bff-service`
- package: `dhb-node-user`
- runtime: Egg 3 + TypeScript + tegg, Node.js >= 18

## 项目定位

用户与基础配置相关 BFF 服务，负责用户/客户基础信息、控制台配置、上传授权、微信分享码、用户配置、打印配置和权限代理等能力。

这个仓库更接近“用户与框架配置域”的中间层，不是订单、商品、仓储业务主仓。遇到登录后用户信息、客户信息、控制台入口配置、上传 STS 或用户个性化配置问题时优先进入这里。

## 技术栈/关键目录

- `config/`: 环境配置、白名单、插件和本地/生产配置。
- `app/module/clientInfo`: 客户/公司信息查询，包含按编号批量查客户 ID 等接口。
- `app/module/controlConsole`: 控制台入口、默认菜单/功能项、员工/老板视角配置。
- `app/module/upload`: 上传相关授权能力，例如获取 OSS AssumeRole。
- `app/module/wechatShareCode`: 微信分享码生成与查询。
- `app/module/userConfig`: 用户配置读写。
- `app/module/pc/printConfig`: PC 打印配置接口。
- `app/module/common/permission`: 权限相关代理接口与模型。
- `app/module/common/base`、`app/module/common/curls`: 基础 Controller/Service 和 DHB 请求封装。

## 典型使用场景

- 前端需要客户、公司、用户配置、控制台入口配置等基础数据。
- 上传图片/文件时需要排查 STS、AssumeRole 或 OSS 相关授权。
- 微信分享码、用户配置、PC 打印配置接口异常。
- 权限接口代理、登录上下文字段、白名单配置相关问题。

## 与其他项目关系

- 依赖 `egg-dhb-framework` 提供基础 Egg/tegg 框架能力。
- 依赖 `egg-dhb-permission` 做接口权限控制。
- 依赖 `@egg-dhb-business/common-lib` 等 `egg-business` 公共包。
- 与 PC/H5/原生端的用户态、客户态和配置态能力关联较多；业务订单、商品、仓储数据通常转到对应 BFF。

## 读取建议

不要被 README 里的 GitLab 模板干扰，实际信息以 `package.json` 和 `app/module/*` 为准。按功能名找目录：上传看 `upload`，客户信息看 `clientInfo`，控制台看 `controlConsole`，打印配置看 `pc/printConfig`，权限看 `common/permission`。
