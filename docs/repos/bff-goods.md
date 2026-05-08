# bff-goods

## 基本信息

- repoKey: `bff-goods`
- path: `/Users/xj/Documents/node/bff-goods`
- technologyFamilyId: `bff`
- technologyFamilyName: `BFF / Node`
- repoType: `bff-service`
- package: `bff-goods`
- runtime: Egg 3 + TypeScript + tegg, Node.js >= 18

## 项目定位

商品域 BFF 服务，同时承接 AI 海报、商品详情、商品视频、ComfyUI/RunningHub、百炼、火山引擎等 AI 生成链路。基础商品接口在 `app/module/goods`，App 侧 AI 与详情能力集中在 `app/module/app/*`。

这个仓库不是 `goods-initialization` 批量初始化工具，也不是独立 ComfyUI 服务；它是 DHB 商品业务线上 BFF，负责把商品业务、AI 任务队列和外部 AI 服务封装成前端可用接口。

## 技术栈/关键目录

- `config/`: 环境配置、白名单、插件和 `aiProviders.ts`。
- `app/module/goods`: 商品主接口，包括商品查询、导入/导出或基础商品操作入口。
- `app/module/app/details`: App 商品详情相关能力。
- `app/module/app/aiPoster`: AI 海报历史、任务、提示词任务、队列、处理器、权益/次数管理和配置。
- `app/module/app/comfyui`: ComfyUI/RunningHub 调用封装。
- `app/module/app/common/bailian`: 阿里百炼请求模型、客户端和服务。
- `app/module/app/common/volcengine`: 火山引擎服务、模型和客户端。
- `app/module/app/video`: 商品视频列表和请求封装。
- `app/module/app/common/common/redis`: AI/任务相关 Redis 封装。

## 典型使用场景

- 商品基础接口、商品详情、商品视频接口联调。
- AI 海报生成、提示词任务、海报任务队列、历史记录和权益次数排查。
- ComfyUI/RunningHub、百炼、火山引擎等外部 AI 服务调用异常。
- AI 任务与 Redis/BullMQ 队列、MySQL 日志或生成结果落库问题。

## 与其他项目关系

- 依赖 `egg-dhb-framework`、`egg-dhb-permission`。
- 依赖 `@egg-dhb-business/ali-oss-lib`、`common-lib`、`token-lib` 等 `egg-business` 公共包。
- 与 `goods-initialization` 的无图商品初始化/搜图链路可能有业务概念交集，但不是同一个工具项目。
- 与外部 ComfyUI/RunningHub 服务是调用关系，具体生成服务不在本仓库内。

## 读取建议

商品基础问题先看 `app/module/goods`；App 商品详情看 `app/module/app/details`；AI 海报优先看 `app/module/app/aiPoster/controller/aiPoster.ts` 和 `service/*Task*`、`processors/*`；外部 AI 调用看 `comfyui`、`bailian`、`volcengine` 目录。
