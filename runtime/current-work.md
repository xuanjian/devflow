# 当前工作上下文 - XUANJIAN

> 这是一份动态工作上下文文件，用于记录“最近在做什么、最近常改什么、近期协作重点是什么”。它和 `person/profile.md` 配合使用：`person/profile.md` 管长期稳定画像，这里管短期会变化的工作状态。

## 使用方式

- 新会话或新窗口里，涉及具体工作问题时，优先同时参考 `person/profile.md` 和本文件
- 短期变化优先更新本文件，例如当前模块变化、最近常改项目变化、近期协作重点变化
- 长期稳定变化才更新 `person/profile.md`，例如角色定位、主技术栈、长期负责产品、开发习惯等
- 如果聊天过程中已经能明确判断短期工作重心发生变化，AI 助手可以主动建议同步本文件

## 当前重点

- **管理端移动 H5：盘点单改造**
  - 主要涉及项目：
    - `/Users/xj/Documents/frontend/dhbfront-manager-mobile`
    - `/Users/xj/Documents/node/bff-warehouse`
    - `/Users/xj/Documents/frontend/dhb-manager`
    - `/Users/xj/Documents/ios/DHB`
  - 当前关键动作：
    - 盘点单列表页已做右侧筛选抽屉，包含盘点时间、审核状态、盘点仓库、选择商品、重置/确定
    - 盘点单详情页按 Figma 信息结构和 iOS 原生入库单详情风格重做
    - 详情页仍在按浏览器 review 调整视觉和字段展示
    - 数量字段口径已从 PC 跳转、BFF 旧接口适配和截图中阶段性确认
    - 需要继续压缩详情页底部空白、补齐盘点/调整数量展示、调整商品清单和备注布局

## 最近决策 / 临时约定

这个区域用于记录“已经说清楚、后续会影响协作和实现方式”的短期结论。

- 当前采用双文件协作方式：
  - `person/profile.md` 维护长期稳定画像
  - `runtime/current-work.md` 维护动态工作上下文
- 当短期工作状态发生变化时，优先更新 `runtime/current-work.md`
- 如果短期变化已经足够明确，但用户还没有主动提出同步，AI 助手可以主动建议是否更新本文件
- 如果用户跨窗口协作，希望快速恢复上下文，优先依赖这份文件而不是当前聊天记忆
- 盘点单当前开发分支：`/Users/xj/Documents/frontend/dhbfront-manager-mobile` 的 `xuanjian/盘点单`
- 盘点单详情页面当前本地联调地址示例：`http://127.0.0.1:5173/warehouse/stockInventory/detail/304`
- 盘点单继续开发前的上游资料必须先看：
  - Notion `开发盘点单`：`34be6217e0478194a570f2a46b622e0b`
  - Notion `盘点单需求整理 v1`：`34be6217e04781e9b080d16e3be2a598`
  - Notion `盘点单需求文档 v1`：`34be6217e0478117ad68e56c4c890835`
  - Notion `盘点单开发方案 v1`：`34be6217e047811480a7ec8e17d6065a`
  - Notion `盘点单 PC 逻辑拆解与移动端开发方案 v1`：`34be6217e04781f89350ed143f54586d`
  - Notion `盘点单测试文档 v1`：`34be6217e0478187a5dfe96225a0a1e7`
  - Figma 盘点单原型：fileKey `VogmR5DW1GXvmruuWePydn`，旧会话读取过节点 `2:2`
- 盘点单资料使用顺序：
  - 需求和范围先以 Notion 需求整理、需求文档、开发方案为准
  - 页面结构和视觉以 Figma 原型为准
  - 移动端细节和资源参考 iOS 原生实现
  - PC 逻辑只作为字段、状态、数量口径的参考，不能假设 `dhb-manager` 有详情源码
- 盘点单详情按钮规则：
  - 待审核显示打印、取消盘点、通过审核
  - 已审核和已取消可打印
  - 无审核权限不显示审核类按钮
- 盘点单详情调整数量颜色规则：
  - 正数红色
  - 负数绿色
  - 不额外加减号，按接口值或兜底计算值显示
- 盘点单数量字段阶段性口径：
  - 盘点数量优先取 `num -> stock_count_num -> stock_count_number -> inventory_number -> r_inventory_number -> count_num -> check_num`
  - 实际库存优先取 `physical -> physical_inventory -> actual_inventory -> stock_num -> real_number -> r_real_number`
  - 调整数量优先取 `adjust_num -> adjust_number -> tune_up -> r_tune_up -> change_num -> difference_num`
  - 如果没有调整字段，再用 `盘点数量 - 实际库存` 兜底，保留正负号
- PC 管理端 React 仓库 `dhb-manager` 没有盘点详情页源码；列表只跳老 PHP `/Manager/Stock/viewInventory?id=...`
- BFF 旧详情接口线索：`/?module=Manager&controller=Stock&action=viewInventory&id=${id}&_m_=1&_js_init_=1&format=json`
- iOS 原生资源结论：
  - 打印图标用 `rkdxq_icon_print@3x.png`，前端复制为 `src/assets/icon_print.png`
  - 商品默认图用 `invalid@3x.png`，前端复制为 `src/assets/goods_placeholder.png`
  - `daying_select.png` 是勾选图，不适合作为打印图标
- AI 海报 2 期产品方向已明确：
  - 前端不再暴露“创意 / 功能 / 场景”3 个按钮
  - 海报类型由系统根据商品信息自动判断
  - 用户只保留补充要求输入，不负责选择海报方向
- ComfyUI 中已验证过的分层思路，在正式链路里做了收口：
  - `bff-goods` 正式链路采用“商品信息整理 -> 策略+模板联合判断 -> 结构化 poster_schemes -> 生图”
  - 正式链路不再保留 `posterType` 作为主驱动字段
- 前端海报模块入口约定：
  - 保持原生端仍然访问 `/ai-poster/config`
  - H5 内部将 `/ai-poster/config` 作为“入口分发页”
  - 真正配置页改为 `/ai-poster/configure`
  - 有历史海报且没有进行中任务时，优先进入历史页
- 提示词编辑页约定：
  - 只允许编辑 `主标题`、`副标题`
  - 其他字段只读
  - 不向用户暴露“适用模板”等内部字段
  - 只读区采用中文 `key: value` 形式展示
- 历史海报页交互约定：
  - 右上角使用纯图标新增按钮
  - 底部为 3 个按钮：下载、公众号分享、小程序分享
  - 公众号分享继续走现有海报分享链路
  - 小程序分享为单独能力，不复用公众号分享
- 小程序分享当前结论：
  - 已确认老 PHP 商品分享接口 `shareGoodsConfirm` 可返回 `share_link`、`share_link_for_mini`
  - 返回链接中已带 `component_appid`、`wid` 等小程序相关标识
  - 现成接口线索包括：
    - `/api/v1/wx-applet/wx-qrcode-unlimit/${type}`
    - `/web/share-srv/v0/company/qrcode-public`
  - 当前阻塞：
    - `wx-qrcode-unlimit` 在 `newdhb` 测试环境上游返回 `502`
    - `qrcode-public` 走新网关 Bearer token，不认老 `skey`
  - 当前不应继续寻找给前端暴露的 `appsecret`，应在服务端内部处理

## 当前阶段进展

- 前端 `/Users/xj/Documents/frontend/dhbfront-manager-mobile` 盘点单
  - 列表页已做右侧筛选抽屉
  - `StockInventoryModel.ts` 已补充 `goods_id` 查询字段和筛选选商品桥参数类型
  - `stockInventoryBridge.ts` 已新增 `selectFilterGoods`，使用独立桥方法名 `stockInventoryFilterSelectGoods`
  - `StockInventoryDetail.tsx` 已按 Figma 信息结构重做：
    - 顶部标题和操作日志入口
    - 仓库统计卡
    - 基础信息卡
    - 商品清单区和字段设置入口
    - 商品卡片、商品自定义字段、备注、底部按钮
  - 已处理过的详情 review：
    - 状态中文显示
    - 商品自定义字段过滤 `商品名称`
    - 移除“左滑备注”提示
    - 经办人 label 居左
    - 商品字段改左对齐
    - 底部安全区高度已调小过
    - 打印图标和商品默认图切换为原生资源
- 后端 `/Users/xj/Documents/node/bff-warehouse`
  - 盘点单相关模块有新增和修改
  - 曾同步修过打印数据里的调整数量兜底规则
- 调研层面
  - 已在 Notion 搜到盘点单需求、开发方案、PC 逻辑拆解、测试文档等页面，新会话可通过页面 ID 继续 fetch
  - 已从旧会话恢复 Figma 原型 fileKey 和节点信息
  - 已确认 PC React 仓库没有盘点详情页源码
  - 已确认原生入库单筛选抽屉、商品选择、图标资源、默认商品图等参考路径
  - 已确认盘点单详情数量字段只能通过旧接口字段适配和现有截图阶段性对齐
- 前端 `/Users/xj/Documents/frontend/dhbfront-manager-mobile` AI 海报 2 期
  - 已去掉海报类型 3 个按钮
  - 已完成海报入口分发页、历史页、配置页、提示词编辑页改造
  - 已将提示词页改成结构化方案卡片展示
  - 已将历史页底部改成下载、公众号分享、小程序分享 3 个按钮
- 后端 `/Users/xj/Documents/node/bff-goods`
  - 已去掉 `posterType`
  - 已将提示词链路改成结构化 `poster_schemes`
  - 已完成本地联调所需配置与数据库补齐
- 调研层面
  - 已确认 `shareGoodsConfirm` 可用测试环境 `skey` 调通
  - 已确认 `qrcode-public` 走新网关 token，不走老 `skey`
  - 已确认 `wx-qrcode-unlimit` 在测试环境当前不可用

## 当前问题 / 阻塞

- 盘点单详情最后一轮视觉反馈还没完成：
  - 商品清单标题高度再高一点，离上面卡片更近
  - 备注 `备注：--` 要居左
  - 底部空白仍然太多，需要继续压缩 `FooterBar`、`GoodsSection` padding 和 safe area
  - 商品行右侧盘点数量、调整数量没有展示，需要检查当前接口字段是否没覆盖
  - 顶部统计卡里的盘点总和、调整总和没有展示，需要检查汇总字段或从商品行聚合
- 盘点单前端当前 dirty 文件较多，新会话继续前应先看 `git status` 和相关 diff，避免覆盖已有改动
- 盘点单详情继续处理 review 时，优先使用 `receiving-code-review` 思路：先确认反馈、再最小范围修改、最后构建验证
- 小程序分享海报链路还未真正接通
- 现成小程序码接口在测试环境不稳定或不可用，无法直接完成二维码替换
- 生图质量虽然主链已跑通，但“更像真实商业摄影、弱 AI 味”仍是后续持续优化项

### 适合记录在这里的内容

- 当前模块的关键结论
- 已确定的技术方案方向
- 当前阶段的边界条件
- 前后端协作分工
- 需求讨论中已经拍板的约定
- 最近暴露出的阶段性注意事项

### 不适合记录在这里的内容

- 长期不变的角色定位和技术栈
- 已经过时的历史阶段信息
- 只有一次性的临时闲聊内容

## 最近常碰的项目

以下内容偏向“近期活跃工作面”，会随着阶段变化而变化：

- `/Users/xj/Documents/frontend/dhbfront-cash-mini`
  - Taro 主包项目，承接跨平台业务模块和整体配置
- `/Users/xj/Documents/frontend/DHB_PACKAGES`
  - 分包业务模块仓库，商品相关模块是近期重要工作面
- `/Users/xj/Documents/frontend/dhb-mobile-index`
  - 订货端 React H5，新业务入口和页面承接较多
- `/Users/xj/Documents/node/bff-goods`
  - 商品 BFF，也是 AI 海报、ComfyUI 相关能力的主要后端落点
- `/Users/xj/Documents/frontend/dhbfront-manager-mobile`
  - 管理端移动 H5，当前是盘点单改造主战场
- `/Users/xj/Documents/node/bff-user`
  - 用户侧 BFF，近期有模块级新增痕迹
- `/Users/xj/Documents/node/bff-warehouse`
  - 仓库与商品相关服务，当前盘点单 BFF 和打印链路需要联动
- `/Users/xj/Documents/ios/DHB`
  - iOS 原生 App 容器与打包发布仍然是长期协作链路的一部分

## 近期协作偏好

- 如果是新模块，优先按 `Figma -> 提问梳理需求 -> 技术方案 -> 流程图 -> 编码` 的顺序推进
- 如果是 Bug 修复，优先先问清楚复现路径、影响范围、相关代码和日志信息
- 如果是跨端需求，优先从数据结构、接口边界和容器对接方式一起看，不只盯前端页面

## 近期代表性背景

- **AI 海报生成**
  - 这是已经完成且很能代表能力结构的项目，覆盖 BFF、前端、iOS 原生对接
  - 相关能力在后续涉及 AI、图片合成、工作流、跨端页面时仍然具有参考价值

## 自动同步约定

- 当用户明确说“同步当前工作”时，优先更新本文件
- 当用户明确说“同步长期画像”时，优先更新 `person/profile.md`
- 当聊天中已经出现足够明确的新阶段信息时，AI 助手可以主动提出更新建议
- 如果跨窗口协作，希望 AI 快速接上上下文，最稳的方式仍然是把变化落到本文件

## 什么时候更新

以下情况优先更新 `runtime/current-work.md`：

- 当前在做的模块变了
- 最近常改的项目变了
- 当前阶段目标变了
- 近期协作方式变了
- 近期临时约定变了
- 出现了值得记录的阶段性注意事项或踩坑

以下情况通常不需要更新 `runtime/current-work.md`：

- 只是一次临时问答
- 只是讨论思路，还没有形成明确工作重心
- 没有形成可持续一段时间的阶段性信息
- 变化属于长期稳定画像，应该改 `person/profile.md`

## 触发方式

以下表达都可以视为更新触发：

- `同步当前工作`
- `把这个记到当前上下文`
- `更新一下当前工作`
- `最近主要在改 xxx`
- `当前重点改成 xxx`
- `最近常改项目换成 xxx`

如果用户没有明确说“同步”，但对话中已经出现足够清晰且稳定的新阶段信息，AI 助手可以主动建议是否更新本文件。

如果用户只说了 `同步当前工作`，但当前会话中没有新的明确信息可写入，本次不应盲目改文件，而应先追问“这次要同步哪项变化”。

## 最近更新时间

- `2026-04-24`
