---
name: update-subpackage-module
description: 更新已有的分包业务模块。触发词：更新模块、更新分包、发布更新、模块升级。用于修改分包组件代码后，发布新版本并更新主包依赖。
---

# 更新分包模块流程

## 触发条件

当用户说以下内容时触发：
- "更新模块"、"更新分包"、"发布更新"
- "模块升级"、"升级分包"
- "发布 xxx 模块的更新"
- "更新 xxx 组件"
- "发布主包"、"发布 cash"（仅发布主包场景）

## 执行前确认

**在执行前，必须先询问用户：**

1. **模块包信息**（如果用户没有明确指定）：
   - 模块包路径（如 `DHB_PACKAGES/dhbfront-domain-goods/packages/taro-goods-poster`）
   - 模块包名称（如 `@dhbfront-domain-goods/taro-goods-poster`）

2. **运行模式**（三选一）：
   - **开发者模式**：本地调试，不发布到 npm
   - **完整发布流程**：发布分包 + 发布主包（首次发布修改）
   - **仅发布主包**：分包已发布或已在本地打包，只需发布主包（开发模式测试通过后）

---

## 完整流程

### ⚠️ 重要：分支限制

**分包更新流程（第一至第三阶段）必须在业务分支上执行！**

```
禁止在以下分支上执行分包更新流程：
- stage 分支
- release 分支  
- master 分支
```

**正确做法**：
1. 在业务分支（如 `xuanjian/海报历史`）上完成分包代码修改
2. 在业务分支上执行 lerna version 和 lerna publish
3. 在业务分支上更新主包依赖（package.json）
4. 提交并推送业务分支
5. 然后切换到 stage/release/master 分支进行合并和发布主包

**如果当前在 stage/release/master 分支上**：
- 先切换到业务分支：`git checkout {业务分支名}`
- 再执行分包更新流程

---

### 第一阶段：提交分包模块代码

#### 步骤 1: 检查并提交分包模块的修改

```bash
cd {模块包所在的 monorepo 根目录}

# 查看修改状态
git status

# 添加修改的文件
git add .

# 提交代码
git commit -m "feat: 更新 {模块包名} - {修改描述}"
```

**注意**：lerna 发布前需要先提交代码，否则会提示有未提交的修改。

---

### 第二阶段：发布分包模块新版本

#### 步骤 2: 使用 lerna 升级版本

```bash
cd {模块包所在的 monorepo 根目录}

# 方式一：交互式选择版本号
npx lerna version

# 方式二：自动升级 patch 版本（推荐，无需交互）
npx lerna version patch --yes --no-push
```

**版本选择说明**：
- `patch`: 1.1.7 → 1.1.8（bug 修复）
- `minor`: 1.1.7 → 1.2.0（新功能）
- `major`: 1.1.7 → 2.0.0（破坏性变更）
- `prerelease`: 1.1.7 → 1.1.8-alpha.0（预发布）

**参数说明**：
- `--yes`: 自动确认，无需手动输入 y
- `--no-push`: 不自动推送到远程仓库（后续手动推送）

#### 步骤 3: 发布到 npm

```bash
# 发布到 npm（lerna 会自动发布有变更的包）
npx lerna publish from-package --yes
```

**参数说明**：
- `--yes`: 自动确认发布

**获取新版本号**：发布后记录新版本号，后续步骤需要用到。

---

### 第三阶段：更新主包依赖

#### 步骤 4: 更新 dhbfront-cash-mini 的依赖版本

修改 `/Users/xj/Documents/frontend/dhbfront-cash-mini/package.json` 中对应模块包的版本号：

```bash
cd /Users/xj/Documents/frontend/dhbfront-cash-mini

# 查看当前版本
grep "{模块包名}" package.json

# 手动修改 package.json 中的版本号为新版本
# 或使用 npm 更新
npm update {模块包名} --legacy-peer-deps
```

#### 步骤 5: 安装更新的依赖

```bash
cd /Users/xj/Documents/frontend/dhbfront-cash-mini
npm install --legacy-peer-deps
```

#### 步骤 6: 提交依赖更新（重要！）

**⚠️ 这一步很容易遗漏，但非常重要！**

更新 package.json 后，必须先提交代码，否则后续执行 `npm run publish:test` 或 `npm run publish:prod` 时会报错：

```
npm ERR! Git working directory not clean.
```

```bash
cd /Users/xj/Documents/frontend/dhbfront-cash-mini

# 检查状态
git status

# 提交依赖更新
git add package.json
git commit -m "chore: 更新 {模块包名} 依赖到 {新版本号}"
```

---

### 第四阶段：选择运行模式

**询问用户**：是要 **开发者模式运行**、**完整发布流程** 还是 **仅发布主包**？

---

## 分支 C: 仅发布主包（快捷流程）

**适用场景**：
- 开发模式测试通过后，直接发布主包
- 分包代码已经在本地打包进主包了
- 不需要重复 git commit 和 lerna 发布步骤

**直接跳转到** [步骤 B1: 构建 H5 组件包](#步骤-b1-构建-h5-组件包)

---

## 分支 A: 开发者模式运行

如果用户选择开发者模式，**参考 `local-dev-workflow` skill 启动本地开发环境**。

该 skill 位于：`/Users/xj/Desktop/工作区/前端taro开发/.cursor/skills/local-dev-workflow/SKILL.md`

主要步骤包括：
1. 修改小程序配置（让 webview 指向本地 `http://127.0.0.1:9009`）
2. 启动 dhbfront-cash-mini H5 开发服务器
3. 启动 dhb-mobile-index
4. 启动 new_mobile_h5

测试完成后，用户说"恢复开发模式"可恢复远程环境配置。

---

## 分支 B: 打包主包发布

如果用户选择打包主包，需要先构建再发布。

### 步骤 B0: 询问发布环境

**询问用户**：发布到哪个环境？

| 环境 | 分支 | npm tag | 说明 |
|------|------|---------|------|
| 测试环境 | `stage` | beta | 日常开发测试 |
| 预发环境 | `release` | beta | 上线前最终测试 |
| 正式环境 | `master` | latest | 生产上线 |

---

### 分支 B-1: 发布测试版（stage 分支）

#### 步骤 1: 提交并推送业务分支代码

**⚠️ 如果当前在业务分支上，必须先提交并推送到远程！**

```bash
cd /Users/xj/Documents/frontend/dhbfront-cash-mini

# 1. 查看当前分支和状态
git branch
git status

# 2. 提交当前分支的修改（如果有）
git add .
git commit -m "feat: {修改描述}"

# 3. 推送业务分支到远程（重要！）
git push origin {当前业务分支名}
```

#### 步骤 2: 切换到 stage 分支并合并代码

```bash
# 4. 切换到 stage 分支
git checkout stage

# 5. 拉取远程最新代码（重要！）
git fetch origin
git pull origin stage

# 6. 合并业务分支到 stage
git merge {业务分支名} --no-edit
```

**⚠️ 如果合并有冲突**：
- 立即停止后续操作
- 告知用户："合并时发生冲突，请手动解决冲突后告诉我继续"
- 等待用户解决冲突并提交后再继续

#### 步骤 2: 安装依赖并提交

```bash
# 安装依赖
npm install --legacy-peer-deps

# 提交 package-lock.json（如果有变化）
git add package-lock.json
git commit -m "chore: 更新 package-lock.json"
```

#### 步骤 3: 发布测试版

```bash
npm run publish:test
```

**命令说明**：
- 版本号格式：`1.0.88` → `1.0.89-beta.0`
- 发布到 `beta` tag

---

### 分支 B-2: 发布预发版（release 分支）

#### 步骤 1: 提交并推送业务分支代码

**⚠️ 如果当前在业务分支上，必须先提交并推送到远程！**

```bash
cd /Users/xj/Documents/frontend/dhbfront-cash-mini

# 1. 查看当前分支和状态
git branch
git status

# 2. 提交当前分支的修改（如果有）
git add .
git commit -m "feat: {修改描述}"

# 3. 推送业务分支到远程（重要！）
git push origin {当前业务分支名}
```

#### 步骤 2: 切换到 release 分支并合并代码

```bash
# 4. 切换到 release 分支
git checkout release

# 5. 拉取远程最新代码（重要！）
git fetch origin
git pull origin release

# 6. 合并业务分支到 release
git merge {业务分支名} --no-edit
```

**⚠️ 如果合并有冲突**：
- 立即停止后续操作
- 告知用户："合并时发生冲突，请手动解决冲突后告诉我继续"
- 等待用户解决冲突并提交后再继续

#### 步骤 2: 安装依赖并提交

```bash
# 安装依赖
npm install --legacy-peer-deps

# 提交 package-lock.json（如果有变化）
git add package-lock.json
git commit -m "chore: 更新 package-lock.json"
```

#### 步骤 3: 发布预发版

```bash
npm run publish:test
```

**命令说明**：
- 版本号格式：`1.0.89-beta.0` → `1.0.89-beta.1`
- 发布到 `beta` tag
- 预发环境也使用 beta 版本

---

### 分支 B-3: 发布正式版（master 分支）

**⚠️ 只有测试通过、准备上线时才发布正式版！**

#### 步骤 1: 提交并推送业务分支代码

**⚠️ 如果当前在业务分支上，必须先提交并推送到远程！**

```bash
cd /Users/xj/Documents/frontend/dhbfront-cash-mini

# 1. 查看当前分支和状态
git branch
git status

# 2. 提交当前分支的修改（如果有）
git add .
git commit -m "feat: {修改描述}"

# 3. 推送业务分支到远程（重要！）
git push origin {当前业务分支名}
```

#### 步骤 2: 切换到 master 分支并合并代码

```bash
# 4. 切换到 master 分支
git checkout master

# 5. 拉取远程最新代码（重要！）
git fetch origin
git pull origin master

# 6. 合并业务分支到 master（或从 release 合并）
git merge {业务分支名} --no-edit
# 或者从 release 分支合并：
# git merge release --no-edit
```

**⚠️ 如果合并有冲突**：
- 立即停止后续操作
- 告知用户："合并时发生冲突，请手动解决冲突后告诉我继续"
- 等待用户解决冲突并提交后再继续

#### 步骤 2: 安装依赖并提交

```bash
# 安装依赖
npm install --legacy-peer-deps

# 提交 package-lock.json（如果有变化）
git add package-lock.json
git commit -m "chore: 更新 package-lock.json"
```

#### 步骤 3: 发布正式版

```bash
npm run publish:prod
```

**命令说明**：
- `publish:prod` = `npm run pack:build && npm version patch && npm publish --access restrict && node scripts/push_tag.js`
- 版本号格式：`1.0.88` → `1.0.89`
- 发布到 `latest` tag
- 自动推送 git tag

---

### 第五阶段：更新 dhb-mobile-index 依赖

#### 步骤 B3: 更新 dhb-mobile-index 的 @dhbmini/cash 版本

发布主包后，需要在 dhb-mobile-index 中更新依赖：

```bash
cd /Users/xj/Documents/frontend/dhb-mobile-index

# 查看当前版本
grep "@dhbmini/cash" package.json

# 修改 package.json 中的版本号为新发布的版本
# 例如将 "^1.0.88" 改为 "^1.0.89"
```

#### 步骤 B4: 安装更新的依赖

```bash
cd /Users/xj/Documents/frontend/dhb-mobile-index
npm install
```

#### 步骤 B5: 完成提示

告知用户：
- 分包模块已更新到新版本
- 主包 @dhbmini/cash 已发布新版本
- dhb-mobile-index 已更新到最新的 @dhbmini/cash

---

## 项目路径参考

| 类型 | 路径 |
|------|------|
| DHB_PACKAGES | `/Users/xj/Documents/frontend/DHB_PACKAGES` |
| dhbfront-domain-goods | `/Users/xj/Documents/frontend/DHB_PACKAGES/dhbfront-domain-goods` |
| dhbfront-cash-mini | `/Users/xj/Documents/frontend/dhbfront-cash-mini` |
| dhb-mobile-index | `/Users/xj/Documents/frontend/dhb-mobile-index` |
| new_mobile_h5 | `/Users/xj/Documents/frontend/new_mobile_h5` |

## 常见模块包

| 模块包名 | monorepo 根目录 | 包路径 |
|----------|----------------|--------|
| @dhbfront-domain-goods/taro-goods-poster | dhbfront-domain-goods | packages/taro-goods-poster |
| @dhbfront-domain-goods/taro-goods-category | dhbfront-domain-goods | packages/taro-goods-category |
| @dhbfront-domain-payment/taro-payment | dhbfront-domain-payment | packages/taro-payment |

## npm 脚本说明

| 脚本 | 说明 |
|------|------|
| `pack:h5` | 构建 H5 组件包 |
| `pack:weapp` | 构建小程序组件包 |
| `pack:build` | 同时构建 H5 和小程序组件包 |
| `pack_dev:h5` | H5 开发模式（热更新） |
| `publish:test` | 发布测试版（beta tag） |
| `publish:prod` | 发布正式版（latest tag） |

## 注意事项

1. **分包发布前先提交代码**：lerna version/publish 前必须先提交代码，否则会报错。

2. **主包发布前先提交依赖更新**：
   - 更新 dhbfront-cash-mini 的 package.json 后，必须先 git commit
   - 否则 `npm run publish:test` 会报 `Git working directory not clean` 错误
   - 这是最容易遗漏的一步！

3. **版本号同步**：
   - 分包模块版本更新后，需要同步更新 dhbfront-cash-mini 的依赖版本
   - 主包发布后，需要同步更新 dhb-mobile-index 的 @dhbmini/cash 版本

4. **测试版 vs 正式版**：
   - 测试版：用于内部测试，版本号带 `-beta.x` 后缀
   - 正式版：用于生产环境，正式发布

5. **依赖安装**：使用 `--legacy-peer-deps` 避免 peer dependency 冲突。

6. **开发者模式**：参考 `local-dev-workflow` skill，包含修改小程序配置、启动服务、恢复配置等完整流程。

## 常见错误及解决方案

### 错误 1: Git working directory not clean

```
npm ERR! Git working directory not clean.
```

**原因**：有未提交的修改（通常是 package.json 依赖更新）

**解决**：
```bash
git status  # 查看哪些文件被修改
git add .
git commit -m "chore: 更新依赖"
```

### 错误 2: lerna ERR! EUNCOMMIT

```
lerna ERR! EUNCOMMIT Working tree has uncommitted changes
```

**原因**：分包目录有未提交的代码

**解决**：
```bash
cd {monorepo 根目录}
git add .
git commit -m "feat: 更新分包组件"
```

### 错误 3: npm ERR! 403 Forbidden

**原因**：npm 认证失败或没有发布权限

**解决**：
```bash
npm login --registry=http://npm.newdhb.com/
```

## 流程图

### 完整流程（首次发布修改）

```
修改分包组件代码
       ↓
  git add && commit (分包)
       ↓
  lerna version patch --yes --no-push
       ↓
  lerna publish from-package --yes
       ↓
  更新 dhbfront-cash-mini 依赖版本 (package.json)
       ↓
     npm install --legacy-peer-deps
       ↓
  git add && commit (主包依赖更新) ⚠️ 重要！
       ↓
  ┌─────────────────────────────────────┐
  │          选择运行模式？              │
  └─────────────────────────────────────┘
       ↓                     ↓
  开发者模式            打包发布主包
       ↓                     ↓
  pack_dev:h5    ┌─────────────────────────┐
       ↓         │  选择发布环境？          │
  启动本地服务   └─────────────────────────┘
       ↓              ↓        ↓        ↓
    完成         测试环境   预发环境   正式环境
                    ↓        ↓        ↓
               stage分支 release分支 master分支
                    ↓        ↓        ↓
               git checkout && git pull
                    ↓        ↓        ↓
               git merge {业务分支}
                    ↓        ↓        ↓
               ┌─────────────────────────┐
               │ 有冲突？暂停让用户解决！ │
               └─────────────────────────┘
                    ↓        ↓        ↓
               npm install --legacy-peer-deps
                    ↓        ↓        ↓
               git commit (package-lock)
                    ↓        ↓        ↓
               publish:test  publish:test  publish:prod
                (beta)       (beta)        (latest)
                    ↓        ↓        ↓
               更新 dhb-mobile-index 的 @dhbmini/cash
                    ↓
                  完成
```

### 快捷流程（开发模式测试通过后发布）

```
开发模式测试通过
       ↓
  选择"仅发布主包"
       ↓
  git status (确保工作目录干净)
       ↓
  publish:test 或 publish:prod
       ↓
  更新 dhb-mobile-index 的 @dhbmini/cash
       ↓
     npm install
       ↓
     完成
```

### 关键检查点

```
┌────────────────────────────────────────────────────────┐
│  分包更新检查清单（必须在业务分支上执行！）              │
├────────────────────────────────────────────────────────┤
│  □ 当前在业务分支上（不是 stage/release/master）⚠️      │
│  □ 分包代码已提交 (git status 无修改)                   │
│  □ 分包已发布到 npm (lerna publish 成功)                │
│  □ 主包 package.json 已更新依赖版本                     │
│  □ 主包依赖更新已提交 ⚠️                                │
│  □ 业务分支代码已推送到远程 (git push) ⚠️ 重要！         │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  主包发布检查清单                                       │
├────────────────────────────────────────────────────────┤
│  □ 已切换到正确的分支 ⚠️ 重要！                         │
│    - 测试环境 → stage                                  │
│    - 预发环境 → release                                │
│    - 正式环境 → master                                 │
│  □ 已拉取远程最新代码 (git fetch && git pull) ⚠️        │
│  □ 已合并业务分支（无冲突，或冲突已解决）                │
│  □ npm install 成功                                    │
│  □ package-lock.json 修改已提交                        │
└────────────────────────────────────────────────────────┘

### 冲突处理

如果 git merge 时发生冲突：
1. **立即停止**后续操作
2. **告知用户**："合并时发生冲突，请手动解决冲突后告诉我继续"
3. **等待用户**解决冲突并执行 git add && git commit
4. 用户确认后，继续执行后续步骤
```
