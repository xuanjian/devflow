# Scene: profile-growth

## 适用场景

- 用户提到长期画像、能力成长、学习沉淀、自动同步画像。
- 一个阶段性项目完成，需要提炼经验和能力变化。
- 新工具、新流程、新技术在项目中被有效使用，需要判断是否影响长期协作方式。
- 用户明确说“同步长期画像”“自动同步画像”“把这个记到长期画像”。

## 分层原则

长期画像自动增长分为四层：

```text
项目事实
  docs/repos/*.md / OpenSpec / runtime/current.json / runtime/tasks/*.json / 项目代码 / Notion

学习记录
  docs/person/learning-log.md

画像候选
  docs/person/profile-candidates.md

长期画像
  /Users/xj/Documents/ai-context/docs/person/profile.md
```

## 自动同步规则

### 可以自动写入 learning-log

- 阶段性任务完成后，形成明确的技术学习、业务理解或协作方式变化。
- bug 排查结束后，形成可复用的排查经验。
- 新工具或新流程完成有效试用，并能说明适用场景和限制。
- 跨仓或跨端需求完成后，形成新的链路理解。

### 可以自动写入 profile-candidates

- 某项能力在多个项目或多次会话中重复出现。
- 某项能力明显改变长期技术栈、协作方式或工程方法。
- 代表性项目证明能力已经形成，而不是刚刚试用。
- 该信息会影响未来 AI 的任务拆分、方案选择或实现方式。

### 可以自动晋升到 profile.md

满足以下任一条件：

- 用户明确说“同步长期画像”“把这个记到长期画像”“以后都按这个来”。
- 候选同时满足稳定、通用、有用三项标准：
  - 稳定：预计未来 1 到 3 个月仍然有效。
  - 通用：不只服务于一个临时需求。
  - 有用：会影响 AI 后续协作判断。

## 禁止自动晋升

以下内容不得直接进入 `/Users/xj/Documents/ai-context/docs/person/profile.md`：

- 单次 bug 的细节。
- 临时分支状态。
- 单个接口字段口径。
- 临时工作重点。
- 尚未验证的新工具偏好。
- AI 自己推断、但缺少项目证据的信息。

## 输出要求

当 AI 自动更新画像相关文件时，最终回复必须说明：

- 写入了哪些文件。
- 新增内容属于学习记录、画像候选还是长期画像。
- 如果更新了 `/Users/xj/Documents/ai-context/docs/person/profile.md`，必须说明晋升原因和证据来源。

## 维护建议

- `docs/person/learning-log.md` 可以较频繁增长。
- `docs/person/profile-candidates.md` 中等频率增长。
- `docs/person/profile.md` 低频更新，只保留稳定、通用、有用的信息。
