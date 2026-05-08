# 开发者长期画像 - XUANJIAN

> 只记录长期稳定、跨会话有用的信息。当前任务、临时项目状态、环境细节和项目清单不要写在这里，分别放到 `runtime/tasks/*.json`、`config/projects/*.json`、`config/scenes/*.json` 或具体项目文档中。

## 默认读取方式

新会话默认先读：

1. `config/entry.json`
2. `config/profile.json`
3. `runtime/current.json`
4. `runtime/tasks/<activeTaskId>.json`

只有当任务需要长期偏好、协作方式、技术背景或项目地图细节时，再读本文件全文。

## 一句话定位

XUANJIAN 是以业务落地为导向的全栈开发工程师，成长路径是 iOS 原生开发 -> 前端开发 -> 全栈开发，长期活跃在 DHB/HXB 这类 B2B 电商业务中。

## 技术侧重点

- iOS Objective-C 是最熟悉的原生能力。
- 当前主战场是 React/Taro/H5、Node.js Egg BFF、原生小程序和 WebView 容器联动。
- 常见任务会跨前端、BFF、iOS 原生、H5 容器、小程序、PC 参考页和少量平台排障。
- 熟悉 H5 + WebView + JSBridge 的混合链路，能处理原生与 H5 的边界问题。
- 对自动化、脚本化、AI skill、环境切换和发布提效有持续兴趣。

## 产品与业务背景

- 主要产品：DHB 订货宝。
- 相关产品：HXB 货销宝。
- 业务域长期集中在商品、订单、支付、用户、仓储、管理端、订货端和移动端容器链路。
- 项目清单、技术族、路径、场景和 skill 关系以 `config/projects/*.json`、`config/scenes/*.json` 为准，不在本文件重复维护。

## 协作偏好

- 用户只说“要做什么需求”时，AI 应自动判断项目、场景、工具、流程和角色，不要让用户先选择执行细节。
- 复杂 bug 先查真实链路、复现、日志和上下游字段，再改代码。
- 跨端任务要同时考虑 H5、BFF、iOS、小程序、PC 参考、Figma/Notion 上游资料。
- 用户直接纠正时，以用户最新口径为准，及时收缩方案，不继续扩散。
- 回答要具体、可执行，少讲抽象原则。
- UI/产品原型类任务要先做可视化或可操作样子，再继续细化规则。

## 开发习惯

- 新模块通常先理解需求和上游设计，再写技术方案、流程图或任务拆分，最后编码。
- 编码顺序常见为：先确定 BFF/数据结构，再写前端页面，最后补原生 WebView/JSBridge 对接。
- 排障时偏好最小复现、真实命令、线上/本地证据和可回退改动。
- 临时验证可以短路，但必须容易回退。
- 对已有项目风格和历史约束比较敏感，不希望 AI 擅自重构无关内容。

## 上下文维护规则

- 当前阶段性工作统一维护在 `runtime/current.json` 指向的 task JSON。
- 长期画像只在稳定事实变化时更新。
- 项目事实写入 `config/projects/*.json` 或 `docs/repos/*.md`。
- 场景组合和联调方式写入 `config/scenes/*.json` 或 `docs/scenes/*.md`。
- 可复用排查方法和学习沉淀写入 `docs/person/learning-log.md`。
- 可能晋升为长期画像的信息先写入 `docs/person/profile-candidates.md`。

## 不应写入本文件

- 单次 bug 细节。
- 临时分支状态。
- 单个接口字段口径。
- 当前正在做的任务。
- 某一次构建、发布、调试结果。
- 尚未验证的新工具偏好。
- AI 自己推断但缺少证据的信息。

## 个人学习方向

- 前端调试和复杂页面问题定位。
- Taro 跨平台开发。
- Node.js/Egg.js BFF 进阶。
- ComfyUI/Dify 等 AI 工作流。
- AI 辅助开发流程、skill 配置和任务流转工具化。
