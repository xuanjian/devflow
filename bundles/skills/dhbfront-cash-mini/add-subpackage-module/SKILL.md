---
name: add-subpackage-module
description: 为 dhbfront-cash-mini 项目新增分包业务模块。触发词：新增模块、添加模块、创建分包组件。用于从 npm 包引入业务组件，创建本地包装组件，并配置分包导出。
---

# 发布模块包到主包流程

## 触发条件

当用户说以下内容时触发：
- "新增模块"、"添加模块"、"发布模块"
- "添加分包组件"、"引入业务包"
- "把 xxx 模块添加到 xxx 项目"

## 执行前确认

**在执行前，必须先询问用户：**

1. **模块包信息**：
   - 模块包路径（如 `DHB_PACKAGES/dhbfront-domain-goods/packages/taro-goods-poster`）
   - 模块包名称（如 `@dhbfront-domain-goods/taro-goods-poster`）

2. **主包信息**：
   - 主包路径（如 `dhbfront-cash-mini`）
   - 主包名称（如 `@dhbmini/cash`）

3. **组件信息**：
   - 要导出的组件名称（如 `PosterHistory`）
   - 组件分类目录（如 `goods`、`payment`、`order`）
   - 包装组件的目录名（如 `poster`）

---

## 完整流程

### 第一阶段：模块包准备与发布

#### 步骤 1: 检查并修复模块包的 package.json

检查模块包的 `package.json` 中的 `exports` 字段配置：

```bash
# 读取模块包的 package.json
cat {模块包路径}/package.json
```

**常见问题：** `exports` 字段的 `import` 指向 `./src/index.ts`（源码），但 `files` 只包含 `./dist`。

**解决方案（二选一）：**

**方案 A - 删除 exports（推荐，更简单）：**
如果不需要子路径导出（如 `./demo`），直接删除整个 `exports` 字段，让 Node.js 使用 `main` 字段。

**方案 B - 修复 exports：**
让 `import` 也指向 `./dist` 目录：

```json
"exports": {
  ".": {
    "import": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "require": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "default": "./dist/index.js"
  }
}
```

#### 步骤 2: 提交代码到本地 git

```bash
cd {模块包所在的 monorepo 根目录}
git add .
git commit -m "fix: 修复 {模块包名} 的 exports 配置"
```

#### 步骤 3: 使用 lerna 升级版本并发布

```bash
cd {模块包所在的 monorepo 根目录}

# 升级版本（会自动更新 package.json 中的 version）
npx lerna version

# 发布到 npm
npx lerna publish from-package
```

**注意：** 
- lerna 会自动检测哪些包有变更
- 版本号会根据选择自动递增
- 发布需要 npm 登录权限

---

### 第二阶段：主包集成配置

#### 步骤 4: 配置 npm registry（如果需要）

检查主包的 `.npmrc` 文件，确保包含模块包的 registry：

```bash
# {主包路径}/.npmrc
@dhbfront-domain-goods:registry=http://npm.newdhb.com/
@dhbfront-domain-payment:registry=http://npm.newdhb.com/
```

#### 步骤 5: 安装模块包依赖

```bash
cd {主包路径}

# 在 package.json 的 devDependencies 中添加依赖
# "@dhbfront-domain-goods/taro-goods-poster": "^1.1.6"

npm install --legacy-peer-deps
```

#### 步骤 6: 创建本地包装组件

在主包中创建包装组件目录和文件：

```bash
mkdir -p {主包路径}/src/components/{组件分类目录}/{组件目录名}
```

创建 `index.tsx` 文件：

```tsx
import React from 'react'
import { {原始组件名}, {原始组件Props类型} } from '{模块包名}'

/**
 * {组件描述} Props
 */
export interface {包装组件名}Props {
  // 根据需要定义 props
}

/**
 * {组件描述}
 * 
 * 功能：
 * - 封装 {模块包名} 的 {原始组件名} 组件
 * - 处理安全区域参数传递
 * - 提供统一的接口给订货端使用
 */
export const {包装组件名}: React.FC<{包装组件名}Props> = (props) => {
  return (
    <{原始组件名} {...props} />
  )
}

export default {包装组件名}
```

#### 步骤 7: 在 subpackagesh5Client 中导出

修改 `{主包路径}/src/subpackagesh5Client/index.tsx`：

```tsx
// 添加导入
import { {包装组件名} } from '../components/{组件分类目录}/{组件目录名}'

// 在 export default 对象中添加
export default {
  // ... 其他组件
  {导出名称}: {包装组件名},
}
```

**注意：** 导出名称需要与 `dhb-mobile-index` 中的 `TaroSubpackageH5ClientInterface.tsx` 里的 `componentType` 一致。

#### 步骤 8: 配置 wyw-in-js（Linaria CSS-in-JS）

修改 `{主包路径}/wyw-in-js.config.js`：

```javascript
// 在 linariaOverrides 数组中添加模块包名
'taro-goods-poster',  // 新增
```

#### 步骤 9: 配置 Taro 构建

修改 `{主包路径}/config/index.ts`：

**9.1 添加到 linariaBabelLoader 数组（约第 14 行）：**
```typescript
const linariaBabelLoader = [
  // ... 其他
  'taro-goods-poster',  // 新增
]
```

**9.2 添加到 compile.include（约第 196 行）：**
```typescript
compile: {
  include: [
    // ... 其他
    '**/src/components/{组件分类目录}/{组件目录名}/**',  // 新增
  ]
}
```

---

### 第三阶段：验证与测试

#### 步骤 10: 构建测试

```bash
cd {主包路径}
npm run pack_dev:h5
```

检查是否有编译错误。

#### 步骤 11: 运行测试

启动开发环境进行测试：

```bash
# 终端 1: 主包 H5 开发
cd {主包路径}
npm run pack_dev:h5

# 终端 2: dhb-mobile-index
cd /Users/xj/Documents/frontend/dhb-mobile-index
npm start

# 终端 3: new_mobile_h5
cd /Users/xj/Documents/frontend/new_mobile_h5
npm start
```

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

| 模块包名 | 路径 |
|----------|------|
| @dhbfront-domain-goods/taro-goods-poster | dhbfront-domain-goods/packages/taro-goods-poster |
| @dhbfront-domain-goods/taro-goods-category | dhbfront-domain-goods/packages/taro-goods-category |
| @dhbfront-domain-goods/taro-goods-modal | dhbfront-domain-goods/packages/taro-goods-modal |
| @dhbfront-domain-payment/taro-payment | dhbfront-domain-payment/packages/taro-payment |

## 注意事项

1. **exports 配置问题**：如果模块包的 `exports.import` 指向源码 `./src/index.ts`，但 `files` 只包含 `./dist`，会导致模块解析失败。

2. **组件导出名称一致性**：确保 `subpackagesh5Client/index.tsx` 中的导出名称与 `dhb-mobile-index` 中的 `componentType` 一致。

3. **Linaria 配置**：使用 CSS-in-JS 的模块包需要在 `wyw-in-js.config.js` 和 `config/index.ts` 中配置。

4. **npm registry**：私有包需要在 `.npmrc` 中配置正确的 registry 地址。

5. **依赖安装**：使用 `--legacy-peer-deps` 避免 peer dependency 冲突。
