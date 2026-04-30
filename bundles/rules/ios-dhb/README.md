# DHB 项目 Cursor Rules (新版)

## 📁 规则文件结构

本项目已迁移到 Cursor 最新的规则系统，所有规则按功能模块化组织。

### 核心规则 (Always Apply)
这些规则始终应用于整个项目：

- **001-project-overview.mdc** - 项目概述和技术栈
- **002-naming-conventions.mdc** - 命名规范
- **003-file-structure.mdc** - 文件结构规范
- **040-project-specific.mdc** - 项目特定规范
- **041-forbidden-practices.mdc** - 禁止事项

### 自动附加规则 (Auto Attached)
当编辑匹配特定文件模式的文件时自动应用：

- **010-page-creation.mdc** - 页面创建规范 (Controller/Service/Networking)
- **011-layout-sdautolayout.mdc** - 布局规范 (所有 .m 文件)
- **012-networking.mdc** - 网络请求规范 (Networking/Service)
- **013-data-model.mdc** - 数据模型规范 (Model/DTO)
- **014-safe-area-layout.mdc** - 页面可视区域布局规范 (自定义导航/底部栏防遮挡)
- **020-notification-system.mdc** - 通知机制规范
- **021-cart-shopping.mdc** - 购物车加购规范

### 代理请求规则 (Agent Requested)
AI 根据上下文自行决定是否使用：

- **030-memory-management.mdc** - 内存管理规范
- **031-thread-safety.mdc** - 线程安全规范
- **032-error-handling.mdc** - 错误处理规范
- **052-common-issues.mdc** - 常见问题

### 手动引用规则 (Manual)
需要明确提及才会使用：

- **050-testing.mdc** - 测试规范
- **051-deployment.mdc** - 打包发布规范
- **053-code-review.mdc** - 代码审查检查点

## 🎯 规则命名规范

使用数字前缀控制优先级和分类：

- **001-099**: 核心规则（项目概述、命名、结构）
- **010-029**: 开发规范（页面创建、布局、网络、数据模型）
- **020-029**: 业务规范（通知、购物车）
- **030-039**: 质量规范（内存、线程、错误处理）
- **040-049**: 项目特定和禁止事项
- **050-059**: 测试、部署、代码审查

## 🚀 使用方法

### 在 Cursor 中使用

1. **Always Apply 规则**：自动应用，无需额外操作
2. **Auto Attached 规则**：编辑匹配文件时自动加载
3. **Agent Requested 规则**：AI 会根据需要自动选择
4. **Manual 规则**：在聊天中提及规则名即可激活

### 手动引用特定规则

在与 AI 对话时，可以这样引用：

```
@testing.mdc 帮我写一个单元测试
@deployment.mdc 我要打包发布，需要注意什么？
@code-review.mdc 帮我检查这段代码
```

## 📝 规则维护

### 更新规则

1. 直接编辑对应的 `.mdc` 文件
2. 遵循 Markdown with Front Matter 格式
3. 更新 front matter 中的 `description` 和 `globs`

### 添加新规则

1. 在 `.cursor/rules/` 目录创建新的 `.mdc` 文件
2. 使用合适的数字前缀命名
3. 添加 front matter 元数据
4. 编写规则内容

### 规则模板

```markdown
---
description: 简短描述规则的用途
globs:
  - "**/*.{h,m}"
alwaysApply: false
---

# 规则标题

## 规则内容
...
```

## 🔄 从旧版迁移

### 旧版本 (.cursorrules)
- 单个大文件
- 所有规则混在一起
- 无法按场景选择性应用

### 新版本 (.cursor/rules/*.mdc)
- ✅ 模块化管理，易于维护
- ✅ 支持条件应用，性能更好
- ✅ AI 可以选择性使用规则
- ✅ 更好的版本控制

### 迁移状态

✅ **已完成迁移**：所有规则已从 `.cursorrules` 拆分到新的 `.mdc` 文件

⚠️ **旧文件保留**：`.cursorrules` 文件已保留作为备份，可以安全删除

## 📚 参考资源

- [Cursor Rules 官方文档](https://docs.cursor.com/context/rules)
- [项目文档](../购物车加购文档/)
- [SDAutoLayout 替换评估](../SDAutoLayout_to_Masonry_替换任务.md)
- [iOS14 升级指南](../iOS14升级风险评估和整改指南.md)

## 📅 更新日志

- **2025-11-11**: 完成从 `.cursorrules` 到新规则系统的迁移
- **2025-11-11**: 创建 17 个模块化规则文件
- **2025-11-11**: 配置规则类型和文件匹配模式
- **2026-04-15**: 新增 `014-safe-area-layout.mdc`，规范自定义导航和底部栏页面的可视区域计算

---

**注意**: 新规则系统已生效，建议删除旧的 `.cursorrules` 文件。

