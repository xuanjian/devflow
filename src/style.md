大明中枢 UI Design Token & Style Guide

01. 设计核心理念

关键词

* 中枢
* 阵列
* 玉牌
* 黑石
* 铜金
* 机关
* 能量纹路
* 古代科技感
* 东方赛博

⸻

02. 视觉世界观

不是传统古风。

而是：

「大明机关中枢 + 古代阵法科技 + iOS Liquid Glass」

整体像：

* 黑色玄武岩控制台
* 铜金能量回路
* 宝石镶嵌节点
* 阵法线路板
* 中枢调度台
* 可点亮的机关网络

⸻

03. 色彩 Token

主背景

--bg-main: #0B0D11;
--bg-panel: #121416;
--bg-stone: #17191D;
--bg-node: #1B1D22;

⸻

金属色

--gold-main: #D4AF37;
--gold-soft: #C89B3C;
--gold-dark: #8B6E3B;
--gold-border: #5A4728;

⸻

功能色

项目（红）

--project-main: #E74C3C;
--project-glow: #FF6A5C;

场景（绿）

--scene-main: #2ECC71;
--scene-glow: #6EFFA3;

技能（黄）

--skill-main: #F39C12;
--skill-glow: #FFD36B;

规则（紫）

--rule-main: #9B59B6;
--rule-glow: #C88BFF;

连接能量（蓝）

--link-main: #3498DB;
--link-glow: #6BC7FF;

⸻

文字

--text-main: #E7E1D1;
--text-secondary: #B8B0A1;
--text-dim: #6E665A;

⸻

04. 材质规范

黑石材质

特点：

* 不是纯黑
* 有粗糙纹理
* 有细裂纹
* 有阵法刻线
* 有铜线嵌入

Texture

* basalt
* obsidian
* ancient stone
* worn metal
* engraved circuitry

⸻

铜金边缘

特点：

* 不发白光
* 微弱暖金辉光
* 边缘有磨损
* 局部氧化

不允许

❌ 科幻霓虹金
❌ 纯黄色描边
❌ iOS 白高光

⸻

05. Node 节点规范

结构

节点 =

[ 宝石ICON ]
[ 名称 ]
[ 类型 ]

⸻

Node 类型

根节点

* 黑金
* 最大
* 中央阵眼

项目

* 红宝石
* 铜金框

场景

* 绿玉石

技能

* 金琥珀

规则

* 紫晶石

⸻

06. 镶嵌系统

节点不是“浮动卡片”。

而是：

镶嵌在黑石机关板上的宝石槽位。

⸻

槽位规范

圆槽

用于 icon

横槽

用于 node 信息

⸻

状态

未激活

* 黑石
* 微金边
* 暗纹

Hover

* 边缘能量轻亮
* 微微浮起

激活

* 宝石发光
* 对应纹路发光
* 连接能量流动

⸻

07. 连接线规范

禁止

❌ 普通 graph 直线
❌ 流程图箭头
❌ SVG 白线

⸻

正确方式

连接线：

像机关纹路
像阵法能量回路
像雕刻铜线

⸻

线条风格

默认

* 深铜色
* 雕刻进石板

激活

* 蓝色能量
* 沿纹路流动
* 有脉冲

⸻

08. 动效规范

Hover

transform: translateY(-2px);

⸻

点亮

box-shadow:
0 0 8px currentColor,
0 0 24px currentColor;

⸻

能量流动

速度：

慢
稳
克制

像：

* 阵法启动
* 灵力传输
* 铜线导能

不是：

❌ 电竞 UI
❌ 高频闪烁
❌ 赛博朋克

⸻

09. 面板规范

Panel

* 黑石
* 微玻璃雾化
* 金边
* 圆角极小

border-radius: 10px;
backdrop-filter: blur(8px);

⸻

右侧详情

像：

奏折 / 中枢档案

不是：

❌ 普通后台 Drawer

⸻

10. 字体规范

中文

推荐：

* 思源宋体
* HarmonyOS Sans SC
* 阿里普惠体

⸻

标题

font-weight: 600;
letter-spacing: 1px;

⸻

11. 阴影规范

禁止

❌ 大面积阴影
❌ 漂浮感 Material Design

⸻

正确

0 0 12px rgba(212,175,55,0.08)

⸻

12. UI 气质

最终气质：

不是 SaaS
不是游戏
不是古风网站
而是：
“大明帝国的 AI 中枢控制台”

⸻

13. Image Prompt（统一生成规范）

节点

ancient chinese steampunk node,
dark basalt stone,
bronze gold border,
embedded gemstone,
engraved circuitry,
fantasy ui,
dark imperial dashboard,
high detail,
worn texture,
subtle glow,
black background

⸻

背景

ancient mechanism stone board,
dark basalt slab,
engraved energy circuits,
embedded grooves,
bronze lines,
imperial chinese sci-fi,
high detail texture,
dark fantasy ui

⸻

14. 前端实现建议

推荐技术

UI

* React
* Tailwind
* Framer Motion

Graph

* React Flow
* PixiJS
* Canvas Layer

发光

* SVG filter
* mix-blend-mode
* canvas glow

⸻

15. 最终视觉目标

用户打开页面第一感觉：

不是“管理后台”
而是：
进入了一个
“大明 AI 中枢机关阵”