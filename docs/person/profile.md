# 开发者长期画像 - XUANJIAN

> 这是一份关于开发者长期稳定能力、项目版图、协作方式和开发习惯的说明文件，帮助 AI 助手在不同窗口、不同会话中快速进入正确的协作状态。

## 文档分工与使用方式

为避免“长期画像”和“任务状态”混在一起，当前采用 JSON 索引 + 任务文件维护。权威正文位于 `ai-context` 项目内，`/Users/xj` 下保留兼容入口：

- `docs/person/profile.md`
  - 存放长期稳定信息：角色定位、核心能力、技术栈、项目地图、开发习惯、协作偏好、环境信息
- `config/profile.json`
  - 长期画像摘要。新会话默认先读它，需要细节时再读本文件全文
- `runtime/current.json`
  - 当前任务指针
- `runtime/tasks/<task-id>.json`
  - 当前任务、涉及项目、G1-G7 进度、运行/打包归档和产物状态
- `/Users/xj/AGENTS.md`
  - 全局 Codex 兼容入口，指向 `config/entry.json`
- `/Users/xj/WORK_CONTEXT.md`
  - 当前工作兼容入口，指向 `runtime/current.json`

### AI 助手工作规则

- 遇到工作类问题时，先参考 `config/entry.json` 和 `config/profile.json`，再根据任务读取 `runtime/current.json` 和活跃 task JSON
- 如果聊天中出现了明显的短期变化，例如“最近在做什么”“当前模块切换了”“最近常改项目变了”，优先更新对应 `runtime/tasks/<task-id>.json`
- 只有当长期稳定信息发生变化时，才更新 `docs/person/profile.md`
- 如果当前会话没有历史上下文，默认通过 `config/entry.json` 恢复协作背景
- 如果短期变化已经足够明确，但用户还没有主动提出同步，AI 助手应主动建议是否更新当前 task JSON
- 如果用户直接说“同步当前工作”，且当前会话里已有足够明确的新信息，直接更新当前 task JSON
- 如果用户直接说“同步当前工作”，但当前会话里没有足够明确的新信息，不要猜测，先简短追问要同步哪项变化

### 长期画像自动增长规则

长期画像可以随着项目开发和学习自动增长，但必须分层沉淀，避免把一次性细节写成长期事实：

- 项目事实、阶段性细节和临时约定，优先写入当前 task JSON、项目文档或 OpenSpec
- 项目中学到的新知识、工具经验和可复用排查方法，优先写入 `/Users/xj/Documents/ai-context/docs/person/learning-log.md`
- 可能影响长期画像的能力变化，先写入 `/Users/xj/Documents/ai-context/docs/person/profile-candidates.md`
- `docs/person/profile.md` 只接收稳定、通用、有用的长期信息

AI 可以自动写入学习记录和画像候选；当用户明确说“同步长期画像”“把这个记到长期画像”“以后都按这个来”，或候选已满足稳定、通用、有用三项标准时，可以自动更新 `docs/person/profile.md`。

禁止直接晋升到长期画像的内容包括：单次 bug 细节、临时分支状态、单个接口字段口径、临时工作重点、尚未验证的新工具偏好、AI 自己推断但缺少项目证据的信息。更新长期画像后，AI 必须说明新增内容、晋升原因和证据来源。

## 一句话定位

**以业务落地为导向的全栈开发工程师，成长路径是 iOS 原生开发 → 前端开发 → 全栈开发，当前长期活跃在 B2B 电商业务中。**

## 角色定位

**全栈开发工程师（转型中）**

- 技术路线：iOS 原生开发 → 前端开发 → 全栈开发
- 最擅长：iOS Objective-C 开发
- 当前主战场：前端（React/Taro）、Node.js（Egg.js）、原生小程序
- 典型工作方式：围绕业务需求，在 BFF、前端 H5/Taro、小程序、iOS WebView 容器之间联动推进

## 核心能力

- **端到端交付能力**
  - 能独立覆盖 BFF、前端、iOS 原生对接，适合推进跨端业务需求
- **混合架构开发能力**
  - 熟悉 H5 + WebView + JSBridge 的混合开发模式，能处理 H5 与原生容器的配合问题
- **B2B 电商业务开发能力**
  - 长期在商品、订单、支付、用户、仓储、管理端等业务域内工作
- **方案与落地衔接能力**
  - 倾向先梳理需求、写技术文档、画流程图，再进入编码
- **工程化与提效意识**
  - 对自动化、脚本化、技能沉淀、环境切换和发布辅助有较高兴趣与实践意愿

## 负责产品

| 产品 | 类型 | 说明 |
|------|------|------|
| **订货宝 (DHB)** | B2B 电商平台 | 主要产品，包含订货端和管理端 |
| **货销宝 (HXB)** | B2B 电商平台 | 另一个电商产品，同团队维护 |

**App 架构**：H5 开发 + 原生 WebView 嵌入的混合开发模式

## 技术栈

### 前端
- **React** - 主力框架，用于 H5 开发
- **Taro 3.x** - 跨平台开发框架，用于组件库和业务模块
- **TypeScript** - 类型安全
- **SCSS** - 样式预处理
- **原生小程序** - 微信小程序开发

### 移动端
- **iOS (Objective-C)** - 原生 App 开发，最擅长
- **iOS (Swift)** - 部分新模块
- **WebView/JSBridge** - 混合开发通信

### 后端 (BFF)
- **Egg.js** - Node.js 框架
- **TypeScript** - BFF 开发语言
- **Redis** - 缓存
- **MySQL** - 数据库操作
- **Swagger** - API 文档

### AI 相关
- **大模型 API 调用** - 主要工作方式
- **ComfyUI** - 工作流搭建（入门）
- **Dify** - 工作流搭建（入门）

### 工程化
- **Cursor Skills** - 自动化工作流
- **环境配置脚本** - 多环境切换
- **打包发布脚本** - CI/CD 辅助
- **Git 工作流** - 分支管理

## 项目地图

### 核心项目关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                        订货宝 (DHB) 生态                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐     npm 包      ┌──────────────────────┐   │
│  │  DHB_PACKAGES   │ ──────────────→ │  dhbfront-cash-mini  │   │
│  │  (分包业务模块)   │    @dhbmini/   │   (Taro 主包项目)     │   │
│  └─────────────────┘                 └──────────┬───────────┘   │
│                                                 │ 打包 H5        │
│                                                 ↓               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    订货端 (移动端)                         │   │
│  │  ┌─────────────────┐  iframe   ┌──────────────────────┐  │   │
│  │  │  new_mobile_h5  │ ←──────── │  dhb-mobile-index    │  │   │
│  │  │  (老 H5 容器)    │           │  (新 React H5)       │  │   │
│  │  └────────┬────────┘           └──────────────────────┘  │   │
│  │           │ webview                                       │   │
│  │           ↓                                               │   │
│  │  ┌─────────────────────────┐                             │   │
│  │  │  customize-mini-program │                             │   │
│  │  │  (微信小程序)            │                             │   │
│  │  └─────────────────────────┘                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    管理端                                  │   │
│  │  ┌─────────────────────────┐  ┌────────────────────────┐ │   │
│  │  │  dhbfront-manager-mobile│  │  dhb-manager           │ │   │
│  │  │  (移动端 H5 - Vite)      │  │  (PC 端 - React)       │ │   │
│  │  └─────────────────────────┘  └────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    原生 App                               │   │
│  │  ┌─────────────────────────┐                             │   │
│  │  │  DHB (iOS)              │  Objective-C + WebView      │   │
│  │  │  订货端 + 管理端         │                             │   │
│  │  └─────────────────────────┘                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    BFF 层 (Node.js)                       │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ │   │
│  │  │ bff-goods │ │ bff-order │ │bff-payment│ │ bff-user  │ │   │
│  │  │  商品/AI   │ │   订单    │ │   支付    │ │   用户    │ │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ │   │
│  │  ┌─────────────┐ ┌──────────────┐                        │   │
│  │  │bff-warehouse│ │ egg-business │                        │   │
│  │  │    仓库     │ │  公共模块    │                         │   │
│  │  └─────────────┘ └──────────────┘                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    BFF 基础设施                           │   │
│  │  ┌──────────────────────┐  ┌────────────────────────┐    │   │
│  │  │ egg-dhb-framework    │  │ egg-dhb-permission     │    │   │
│  │  │ BFF 框架骨架 (TS)     │→│ 权限控制插件 (JS/npm)   │    │   │
│  │  └──────────────────────┘  └────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↑ 各 BFF 服务引用                     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    公共资源                               │   │
│  │  ┌─────────────────┐  ┌─────────────────┐                │   │
│  │  │  dhbfront-img   │  │  dhbfront-utils │                │   │
│  │  │  图片资源服务    │  │  工具库 (Lerna) │                │   │
│  │  └─────────────────┘  └─────────────────┘                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 项目详情

| 项目 | 路径 | 技术栈 | 状态 | 说明 |
|------|------|--------|------|------|
| dhbfront-cash-mini | `/Documents/frontend/dhbfront-cash-mini` | Taro 3.x + React + TS | 活跃 | 跨平台组件库主包 |
| DHB_PACKAGES | `/Documents/frontend/DHB_PACKAGES` | Taro + TS | 活跃 | 分包业务模块 |
| dhb-mobile-index | `/Documents/frontend/dhb-mobile-index` | React + TS + SCSS | 活跃 | 订货端新 H5 |
| new_mobile_h5 | `/Documents/frontend/new_mobile_h5` | 原生 JS + Zepto | **基本不动** | 订货端老 H5 容器 |
| customize-mini-program | `/Documents/frontend/customize-mini-program` | 原生小程序 | 活跃 | 微信小程序 |
| dhbfront-manager-mobile | `/Documents/frontend/dhbfront-manager-mobile` | Vite + React + TS | 活跃 | 管理端移动 H5 |
| dhb-manager | `/Documents/frontend/dhb-manager` | React | 活跃 | 管理端 PC |
| DHB (iOS) | `/Documents/ios/DHB` | Objective-C | 活跃 | iOS 原生 App |
| bff-goods | `/Documents/node/bff-goods` | Egg.js + TS | 活跃 | 商品 BFF (含 AI 海报) |
| bff-order | `/Documents/node/bff-order` | Egg.js + TS | 维护 | 订单 BFF |
| bff-warehouse | `/Documents/node/bff-warehouse` | Egg.js + TS | 维护 | 仓库 BFF |
| bff-payment | `/Documents/node/bff-payment` | Egg.js + TS | 维护 | 支付 BFF |
| bff-user | `/Documents/node/bff-user` | Egg.js + TS | 维护 | 用户 BFF |
| egg-business | `/Documents/node/egg-business` | Egg.js + TS | 维护 | BFF 公共模块 |
| dhbfront-img | `/Documents/frontend/dhbfront-img` | 静态资源 | 维护 | 图片资源服务 |
| dhbfront-utils | `/Documents/frontend/dhbfront-utils` | Lerna + TS | 维护 | 工具库 (domain/dify/common) |
| egg-dhb-framework | `/Documents/node/plugin/egg-dhb-framework` | Egg.js + TS + tegg | 维护 | BFF 基础框架（Controller/Service 基类、权限中间件、HTTP 请求封装） |
| egg-dhb-permission | `/Documents/node/plugin/egg-dhb-permission` | Egg.js 插件 (JS) | 维护 | DHB 接口权限控制插件（npm 可安装） |

## 代表作品

### AI 海报生成（全栈独立完成）

这是一个具备代表性的全栈独立项目，涵盖：
- **BFF 层**：`bff-goods/app/module/app/aiPoster` - 海报生成、二维码、字体处理、Redis 缓存、数据库操作
- **前端**：Taro 组件开发
- **iOS**：`DHBSAIPosterWebViewController` - 原生 WebView 对接

技术亮点：
- 大模型 API 调用
- 海报图片合成
- 多端适配（H5/小程序/iOS）

## 开发习惯

### 新模块开发流程
1. **收到 Figma 设计** - 产品 UI 设计稿
2. **编写技术文档** - 梳理需求、技术方案
3. **绘制流程图** - 使用 draw.io（XML 格式），理清业务逻辑
4. **理解调整清楚后** - 再开始编码

### 编码顺序
1. **先写 BFF 接口** - 定义好数据结构
2. **再写前端页面** - 对接接口
3. **最后原生对接** - WebView/JSBridge

### 调试方式
- **BFF 调试**：Cursor 编辑器左侧 Debug 面板，本地启动 BFF 服务
- **前端调试**：本地项目访问本地 BFF，打断点调试
- **iOS 调试**：Xcode

### 工程化偏好
- 对自动化和工程化有很高兴趣
- 喜欢创建 Cursor Skills 提高开发效率
- 善于搭建环境配置和打包脚本

### 交互偏好
- **语言沟通** - 优先使用中文进行所有沟通
- **不清楚时主动询问** - 在不清楚上下文、需求、或技术方案时，必须先提问确认，不要假设或猜测
- **喜欢苏格拉底式提问** - 通过问答梳理思路，而非直接给答案
- 在写技术方案、理解需求、解决问题时，希望 AI 通过提问引导思考
- 这种方式有助于深入理解问题，避免遗漏关键点

### 协作场景

**1. 新模块开发**
- 收到 Figma 设计 → 通过提问梳理需求 → 写技术文档 → 画流程图 → 编码

**2. BUG 修复**
- 收到 BUG 描述 → 通过提问定位问题 → 梳理修复思路 → 一起修改代码
- 提问方向：复现步骤、影响范围、相关代码、日志信息等

## 当前工作说明

- 当前阶段性工作、最近常改项目、近期目标和临时约定，统一维护在 `runtime/current.json` 指向的 task JSON
- 本文件不再记录容易过期的“当前工作”内容，以保持长期稳定和跨会话可复用性

## 团队协作

- 有团队支持，但需要独立开发能力
- 前端、iOS、BFF 经常需要一人全包
- 部分接口可以用后端之前支持的接口
- 订货宝和货销宝是同一团队维护的两个产品

## 环境配置

### 订货宝 (DHB) 环境

| 环境 | 域名 | 协议 | 用途 |
|------|------|------|------|
| **开发环境** | `*.newdhb.com` | HTTP | 开发调试 |
| **预发环境** | `y*.dhb168.com` | HTTPS | 测试同事测试 |
| **正式环境** | `*.dhb168.com` | HTTPS | 生产上线 |

### 主要服务域名

| 服务 | 开发环境 | 预发环境 |
|------|----------|----------|
| bff-order | `http://bff-order.newdhb.com` | `https://ybff-order.dhb168.com` |
| bff-payment | `http://bff-payment.newdhb.com` | `https://ybff-payment.dhb168.com` |
| bff-user | `http://bff-user.newdhb.com` | `https://ybff-user.dhb168.com` |
| bff-warehouse | `http://bff-warehouse.newdhb.com` | `https://ybff-warehouse.dhb168.com` |
| bff-goods | `http://bff-goods.newdhb.com` | `https://ybff-goods.dhb168.com` |
| mobile-index | `http://mobile-index.newdhb.com` | `https://ymobile-index.dhb168.com` |
| manager-h5 | `http://m.newdhb.com` | `https://ym.dhb168.com` |

> 完整配置见：`dhbfront-utils/packages/domain/src/localEnv/localEnvConfig.ts`

### 发布流程

```
开发环境 → 预发环境 → 正式环境
(开发调试)   (测试验证)   (上线)
```

### 本地开发数据库

**MySQL 本地测试库**：`xj_dhb`
- 所有 DHB 需求的本地测试都在这个库里
- 连接方式：`mysql -u root`（无密码）
- Host: `127.0.0.1`, Port: `3306`

```sql
-- 查看库里的表
SHOW TABLES FROM xj_dhb;
```

**启动 MySQL**：
```bash
brew services start mysql
```

**图形化管理工具**：Sequel Ace（连接时 Host 填 `127.0.0.1`，不要填 `localhost`）

## 工具链

### 项目管理
- **BUG/需求管理**：JIRA (`http://project.dhb168.com`)

### 部署发布
- **BFF 和前端项目**：Zadig 平台发布
- **iOS App**：Xcode 本地打包发布

### 设计资源
- **UI 设计**：Figma（有统一组件库，持续完善中）
- **设计规范**：参照现有项目风格

### 启动命令（持续补充）
> 在开发过程中逐步记录各项目的启动命令

## 特殊注意事项

### 项目注意事项
- `new_mobile_h5` - **基本不会再动**，老项目仅作为容器
- `local/` 目录 - 开发环境配置，不提交到 git
- 自动生成的配置文件不要手动修改（如 `configEnv.js`、`ext.json`）

### 待补充
> 以下内容会在后续开发过程中逐步完善：
- [ ] 各项目容易踩坑的地方
- [ ] 配置相关的特殊注意事项
- [ ] 常见问题解决方案

## 学习方向

- 前端调试最佳实践（还在学习中）
- Taro 跨平台开发深入
- Node.js/Egg.js 进阶
- ComfyUI/Dify 工作流（未来可能对接）

---

> 📝 这是一份"活文档"，会在日常开发中不断更新和完善。
