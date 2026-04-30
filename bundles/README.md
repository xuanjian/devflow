# bundles

> 这里存放 `ai-context` 的规则包和技能包源文件，项目目录里的对应内容应尽量只保留入口或 symlink。

## 分层约定

- `rules/`
  - 放 `.mdc`、`.md` 等规则类 bundle
- `skills/`
  - 放目录型或文件型 skill bundle

## 命名建议

- 通用共享 bundle 直接放在顶层
  - 例如：`shared-context.mdc`
- 项目专属但集中维护的 bundle 放在子目录
  - 例如：`ios-dhb/001-project-overview.mdc`
  - 例如：`dhb-packages/add-mobile-icon/`

## scope 解释

`registry/bundles.json` 会为每个 bundle 生成 `scope`：

- `project`
  - 当前只绑定一个仓库
- `shared`
  - 同一技术家族中的多个仓库复用
- `cross-family`
  - 跨多个技术家族复用
- `unbound`
  - 已存在于 `bundles/`，但当前还没有被任何仓库入口引用

## 维护原则

- 优先维护这里的源文件，不要在项目目录里直接改正文
- 新增或调整 bundle 后，重新运行：

```bash
node /Users/xj/Documents/ai-context/scripts/generate-adapters.mjs
```

- 生成器会同步：
  - 各仓库入口文件
  - 项目里的 rule / skill symlink
  - `registry/bundles.json`
  - 本地 git 忽略策略
