---
name: run-projects
description: Use when running DHB local frontend projects across cash-mini, dhb-mobile-index, new_mobile_h5, customize-mini-program, or linked subpackages, especially when switching environments, linking local packages, or recovering from unstable startup flows.
---

# 运行本地开发项目

## 数据来源

- 预设、环境、分包、变更文件以 `/Users/xj/Documents/ai-context/bundles/skills/run-projects/presets.json` 为准
- 执行入口为 `/Users/xj/Documents/ai-context/bundles/skills/run-projects/run-projects.js`
- 链路背景参考 `/Users/xj/Documents/ai-context/docs/frontend-shared-context.md`

## 交互顺序

### 启动前固定提示

- 只要用户提“启动项目 / 跑项目 / 本地开发”，先明确提示：
  - 当前 Codex 会话常见 Node 环境是 `v23`
  - `dhb-mobile-index` 在 Node `v23` 下容易触发 webpack4 的 `ERR_OSSL_EVP_UNSUPPORTED`
  - 因此 `cash-mini`、`dhb-mobile-index`、`new_mobile_h5` 默认都应单独开启终端分别运行
- `run-projects.js` 只用于出计划和手动命令，不再承担真正启动项目的职责
- 必须明确区分：
  - 对话里执行的 shell 只是后台会话
  - 不等于用户在 Cursor / VSCode 里能看到的“终端标签页”
  - 如果用户要“新开终端”或“我能观察到”，应明确指向 Cursor 菜单里的“终端 -> 新建终端 / 拆分终端”
- 即使调用 `run-projects.js`，默认也只允许 `--dry-run`；真正执行必须额外带 `--force-unified`

### 预设 1-6

固定展示以下 6 个预设：

1. `dhb-packages + dhbfront-cash-mini + dhb-mobile-index + new_mobile_h5 + customize-mini-program`
2. `dhb-packages + dhbfront-cash-mini + dhb-mobile-index + new_mobile_h5`
3. `dhbfront-cash-mini + dhb-mobile-index + new_mobile_h5`
4. `dhbfront-cash-mini + dhb-mobile-index + new_mobile_h5 + customize-mini-program`
5. `dhb-mobile-index + new_mobile_h5 + customize-mini-program`
6. `dhb-mobile-index + new_mobile_h5`

另提供 1 个自定义入口。

### 环境问题

固定只问 3 个环境按钮：

- `测试`
- `预发`
- `线上`

说明：命令行里仍用 `--env release` 表示“预发渠道”，但真正写入 H5 配置文件的 `envCode` 应为 `demo`。

### 分包问题

- 只有选中预设 `1` 或 `2` 时，才追加第三个问题：
  - “要 link 哪些分包模块？”
- 其余预设不问这个问题

## 执行规则

- `run-projects.js` 正常模式只输出手动多终端启动方案，不直接启动项目
- `run-projects.js --dry-run` 只用于查看预设下的配置改动计划
- 先停止统一执行器曾记录的旧进程
- 再确认是否需要先安装依赖；若用户明确要求安装，则先执行安装，再继续
- 再对“本次会改到的文件”重新做一份最新备份，覆盖旧备份
- 再按预设和环境改配置
- H5 链路配置不只看 `domainConfig`：
  - `new_mobile_h5/local/projectConfig.js`
  - `dhb-mobile-index/local/projectConfig.js`
  这两处也要跟环境一起切，否则 `host_img`、`host_taskUrl` 之类仍会留在旧环境
- 若包含 `dhbfront-cash-mini`，先单独启动 `cash-mini`
- `cash-mini` 以“首轮构建并拷贝完成”为成功信号，再启动其余项目
- 若 `cash-mini` 分包模式缺少 `scripts/watchSubpackagesAndPack.js`，则立即停止流程，不启动后续项目
- 若手动启动过程中发现配置改坏或服务异常，再执行 `--restore`
- 不要在正式执行前先恢复历史备份；回滚基线应始终以“本次启动前的文件状态”为准
- 后台启动命令应复用当前会话的 Node/npm 环境，不要再额外套一层 login shell，避免仓库吃到错误的 Node 版本
- 每次启动前应覆盖旧日志，避免历史日志干扰本轮健康检查
- `dhb-mobile-index` 需固定使用 `volta run --node 12.20.0 npm start`，否则容易触发 webpack4 的 `ERR_OSSL_EVP_UNSUPPORTED`
- `run-projects.js --restore` 只会恢复到“本次启动前的备份状态”，不会自动恢复到 Git 基线
- 若目标文件在启动前本身就有本地改动，恢复后仍可能保持这些改动；需要回 Git 版本时应单独执行 `git restore`
- 切到预发或线上时，不再修改 `new_mobile_h5/js/common/dhb.js` 的 `9009` 本地 debug 覆盖逻辑；环境切换只落到 `local/domainConfig.js` 与 `local/projectConfig.js` 等显式环境配置。

## 稳定优先策略

- 默认且唯一推荐方式是“手动多终端模式”
- 若用户要求“每一步沟通跑一次”或明确要求单独终端，更应坚持“手动多终端模式”
- 不再提供“一键启动”路径，因为这条链路会稳定撞上 Node 版本和健康检查问题
- 不要把“后台替用户执行命令”描述成“已新开终端”；只有用户自己在 Cursor 里打开的终端，才是可见终端

## 手动多终端模式

### 适用场景

- 作为默认启动方式
- 需要边启动边确认
- 需要稳定复现，不接受统一执行器自动切换 Node 环境
- 预设 `1`、`2`、`3`、`4` 中包含 `dhbfront-cash-mini`
- 存在分包联调，尤其是 `taro-goods-combine`

### 标准顺序

1. 先在 `dhbfront-cash-mini` 目录启动分包监听和打包同步
2. 等 `cash-mini` 首轮出现“编译结束！”和“拷贝结束！”
3. 再单独进入 `dhb-mobile-index` 目录启动 `npm start`
4. 最后单独进入 `new_mobile_h5` 目录启动 `npm start`

### 固定提醒

- `cash-mini`、`dhb-mobile-index`、`new_mobile_h5` 都应各自单独开终端运行
- 不要把这三段混在同一个统一执行器里当作默认流程
- 启动 `dhb-mobile-index` 前，要先提醒用户：当前 Node `v23` 环境下直接跑很容易失败
- 如果用户明确说“我要在 Cursor 里看到终端”，就不要只给后台执行结果，应直接给出“终端 1 / 终端 2 / 终端 3”格式的命令

### 标准命令

`dhbfront-cash-mini`

```bash
cd /Users/xj/Documents/frontend/dhbfront-cash-mini
npm run pack:h5:watch_with_subpackages
```

`dhb-mobile-index`

```bash
cd /Users/xj/Documents/frontend/dhb-mobile-index
npm start
```

`new_mobile_h5`

```bash
cd /Users/xj/Documents/frontend/new_mobile_h5
npm start
```

### Cursor 可见终端话术

- 如果用户要“自己观察”，直接按下面格式回复，不要说“我已经帮你开了终端”

`终端 1`

```bash
cd /Users/xj/Documents/frontend/dhbfront-cash-mini
npm run pack:h5:watch_with_subpackages
```

`终端 2`

```bash
cd /Users/xj/Documents/frontend/dhb-mobile-index
/Users/xj/.volta/bin/volta run --node 12.20.0 npm start
```

`终端 3`

```bash
cd /Users/xj/Documents/frontend/new_mobile_h5
npm start
```

### 关键观察点

- `cash-mini` 成功信号不是端口，而是日志里的“编译结束！”和“拷贝结束！”
- `dhb-mobile-index` 成功信号是 `3000` 端口监听成功
- `new_mobile_h5` 成功信号是 `9009` 端口监听成功
- 若 `new_mobile_h5` 已经起来但 `3000` 没起来，页面依然不可用，因为它只是反代 `dhb-mobile-index`
- 若用户说“恢复后文件还是不对”，先检查它是不是恢复到了旧备份而不是 Git 基线，尤其是本次启动计划实际改到的配置文件。

### 分包 Watch 规则

- 如果 `cash-mini` 跑的是 `npm run pack:h5:watch_with_subpackages`，它会自动拉起已 link 分包的 `build:watch`
- 这种情况下，不要默认再让用户额外开一个相同分包的 watch 终端，否则容易重复监听
- 只有下面两种情况，才建议额外开第 4 个终端去看 `DHB_PACKAGES` 分包：
  - 用户没有跑 `cash-mini` 的 `pack:h5:watch_with_subpackages`
  - 用户想单独观察某个分包自身的编译日志
- 如果需要单独观察 `taro-goods-combine`，命令是：

```bash
cd /Users/xj/Documents/frontend/DHB_PACKAGES/dhbfront-domain-goods/packages/taro-goods-combine
npm run build:watch
```

### 当前已验证的稳定链路

- `cash-mini` 分支使用 `xuanjian/combine`
- `dhb-mobile-index` 需要在自己的终端里单独跑 `npm start`
- `cash-mini` 的分包监听脚本使用 `scripts/watchSubpackagesAndPack.js`
- `run-projects.js` 默认只负责输出手动步骤，不负责真正启动
- `cash-mini` 跑分包联调前，如依赖缺失，可先执行：

```bash
cd /Users/xj/Documents/frontend/dhbfront-cash-mini
npm i --legacy-peer-deps
```

## 执行命令

普通预设：

```bash
node /Users/xj/Documents/ai-context/bundles/skills/run-projects/run-projects.js --preset <preset-id> --env <test|release|online>
```

包含分包的预设：

```bash
node /Users/xj/Documents/ai-context/bundles/skills/run-projects/run-projects.js --preset <preset-id> --env <test|release|online> --subpackages <name1,name2>
```

只看配置改动计划：

```bash
node /Users/xj/Documents/ai-context/bundles/skills/run-projects/run-projects.js --preset <preset-id> --env <test|release|online> --dry-run
```

## 关键约束

- 前端环境只有 `测试`、`预发`、`线上`，没有独立的“本地环境”
- “是否接本地项目”由预设决定，不由环境决定
- 分包联调统一按 `file:` 协议处理，不单独使用 `npm link`
- 分包联调除了改 `package.json`，还必须同步改 `dhbfront-cash-mini/config/index.ts`
- 启动项目默认不自动执行 `npm install --legacy-peer-deps`
- 但如果用户在当前会话明确要求先安装依赖，应先执行安装，再正式启动
- 如需让 `cash-mini` 重新安装 `file:` 分包依赖，单独在 `dhbfront-cash-mini` 下手动执行 `npm install --legacy-peer-deps`
- 分包自身 `build/build:watch` 走 `pnpm`
- `cash-mini` 有两种模式：
  - 无分包：`npm run pack_dev:h5`
  - 有分包：`npm run pack:h5:watch_with_subpackages`
- 有分包时，`cash-mini` 的 `pack:h5:watch_with_subpackages` 已会接管分包监听，不要再额外重复启动同一个分包的 `build:watch`
- 执行 `--restore` 时，除了删 pid 记录，还要尽量终止整组后台进程，避免残留 watcher
- `run-projects` 的 dry-run / 执行计划里，H5 链路至少应出现以下变更项：
  - `new_mobile_h5/local/domainConfig.js`
  - `new_mobile_h5/local/projectConfig.js`
  - `dhb-mobile-index/local/domainConfig.js`
  - `dhb-mobile-index/local/projectConfig.js`
  - `customize-mini-program/pages/home/home.js`
  - `customize-mini-program/project.config.json`

## 结束联调

恢复环境统一走：

```bash
node /Users/xj/Documents/ai-context/bundles/skills/run-projects/run-projects.js --restore
```
