# Skill: 在 Taro 分包中新增业务模块

## 触发提示词

使用以下提示词触发此工作流：

```
在 {分包项目名} 中新增 {模块名} 模块
```

**示例：**
- `在 dhbfront-domain-goods 中新增 goodsDetail 模块`
- `在 dhbfront-domain-order 中新增 orderList 模块`
- `在 dhbfront-domain-user 中新增 userProfile 模块`

---

## 概述

此工作流用于在 `DHB_PACKAGES` 下的任意 Taro 分包项目中创建新的业务模块。

**项目结构：**
```
DHB_PACKAGES/
├── dhbfront-domain-goods/       # 商品领域分包
├── dhbfront-domain-order/       # 订单领域分包（示例）
├── dhbfront-domain-user/        # 用户领域分包（示例）
└── dhbfront-cash-mini/          # 主包（引入各分包）
```

**开发流程：**
1. 在分包中开发业务模块
2. 本地测试通过后构建
3. 发布到私有 npm `http://npm.newdhb.com/`
4. 在主包 `dhbfront-cash-mini` 中引入使用

---

## 变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| `{domainName}` | 分包项目名 | `dhbfront-domain-goods` |
| `{moduleName}` | 模块名（小驼峰） | `goodsDetail` |
| `{ModuleName}` | 模块名（大驼峰） | `GoodsDetail` |
| `{模块中文名}` | 模块中文描述 | `商品详情` |

---

## 前置条件

- 已安装 pnpm（`pnpm -v` 确认版本）
- 已在分包项目根目录执行 `pnpm install`
- 分包项目已有 `taro-dev-webpack` 开发壳

---

## 工作流步骤

### Step 1: 创建业务包目录结构

```bash
cd {domainName}/packages
mkdir -p taro-{moduleName}/src/{assets,i8n,service,utils,view-business/{moduleName}/demo}
mkdir -p taro-{moduleName}/{scripts,types}
```

### Step 2: 创建 package.json

位置：`packages/taro-{moduleName}/package.json`

```json
{
  "name": "@{domainName}/taro-{moduleName}",
  "version": "1.0.0",
  "description": "{模块中文名}业务包",
  "main": "./dist/index.js",
  "typings": "./dist/index.d.ts",
  "scripts": {
    "clean": "rimraf dist",
    "build:mvAssets": "node ./scripts/mvAssets.cjs",
    "tsc": "tsc",
    "build": "npm run clean && tsc && npm run build:mvAssets",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "@dhbfront-utils/common": "^1.0.0",
    "@dhbfront-utils/shell_env": "^1.0.0",
    "@dhbfront-utils/taro-utils": "^1.0.0",
    "@linaria/react": "npm:@dhbfront-utils/linaria_react@^6.3.6"
  },
  "peerDependencies": {
    "@tarojs/components": "^4.1.7",
    "@tarojs/taro": "^4.1.7",
    "react": "^18.0.0"
  }
}
```

### Step 3: 创建 TypeScript 配置

位置：`packages/taro-{moduleName}/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "declaration": true,
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "./src",
    "jsx": "preserve",
    "allowJs": true,
    "skipLibCheck": true
  },
  "include": ["src", "types"]
}
```

### Step 4: 创建核心文件

#### 4.1 入口文件 `src/index.ts`

```typescript
/**
 * {模块中文名}业务包入口
 * 每个入口文件 view 上最好加一个 .taro-{moduleName} 这个类名，重置默认样式
 */

import './initCode'
import './assets/reset.scss'

export * from './view-business/{moduleName}/{ModuleName}'
```

#### 4.2 初始化文件 `src/initCode.ts`

```typescript
import { getPlatformProvider } from '@dhbfront-utils/shell_env'
import i18n from "i18next";
import { taro{ModuleName}En } from './i8n/taro-{moduleName}-en';
import { taro{ModuleName}Zh } from './i8n/taro-{moduleName}-zh';

const i18nInstance: typeof i18n = getPlatformProvider('reactI18n')

// 注册命名空间 - 英文
i18nInstance.addResourceBundle('en', 'taro-{moduleName}', taro{ModuleName}En);
// 注册命名空间 - 中文
i18nInstance.addResourceBundle('zh', 'taro-{moduleName}', taro{ModuleName}Zh);
```

#### 4.3 重置样式 `src/assets/reset.scss`

```scss
.taro-{moduleName} {
  font-size: 14px;
  * { box-sizing: border-box; }
  taro-view-core taro-image-core {
    width: auto;
    height: auto;
  }
}
```

#### 4.4 国际化文件

> **重要规范**：key 必须使用中文，这样在中文语言文件中就是 `'中文key': '中文value'` 的格式。

**中文 `src/i8n/taro-{moduleName}-zh.ts`**

```typescript
/**
 * {模块中文名}模块国际化 - 中文
 */
export const taro{ModuleName}Zh = {
  // 通用
  '{模块中文名}': '{模块中文名}',
  '提示': '提示',
  '开发中': '开发中',
  
  // 加载状态
  '加载中...': '加载中...',
  '刷新中...': '刷新中...',
  '没有更多了': '没有更多了',
  
  // 操作按钮
  '确定': '确定',
  '取消': '取消',
  '保存': '保存',
  '保存成功': '保存成功',
  '保存失败': '保存失败',
  
  // 根据业务需求添加更多文案
  // 带插值的 key 也用中文
  '{{count}}分钟前': '{{count}}分钟前',
}
```

**英文 `src/i8n/taro-{moduleName}-en.ts`**

```typescript
/**
 * {模块中文名}模块国际化 - 英文
 */
export const taro{ModuleName}En = {
  // Common
  '{模块中文名}': '{ModuleName}',
  '提示': 'Tips',
  '开发中': 'In Development',
  
  // Loading State
  '加载中...': 'Loading...',
  '刷新中...': 'Refreshing...',
  '没有更多了': 'No more',
  
  // Action Buttons
  '确定': 'Confirm',
  '取消': 'Cancel',
  '保存': 'Save',
  '保存成功': 'Saved successfully',
  '保存失败': 'Save failed',
  
  // 根据业务需求添加更多文案
  // 带插值的 key 也用中文，value 是英文翻译
  '{{count}}分钟前': '{{count}} minutes ago',
}
```

**在组件中使用：**

```tsx
import { useTranslation } from 'react-i18next'

const MyComponent = () => {
  // 使用命名空间
  const { t } = useTranslation('taro-{moduleName}')
  
  return (
    <View>
      {/* 直接使用中文 key */}
      <Text>{t('{模块中文名}')}</Text>
      <Text>{t('加载中...')}</Text>
      
      {/* 带参数的翻译 */}
      <Text>{t('{{count}}分钟前', { count: 5 })}</Text>
    </View>
  )
}

// Taro API 中的文案也需要国际化
Taro.showToast({ title: t('保存成功'), icon: 'success' })
Taro.showModal({
  title: t('提示'),
  content: t('需要您的授权'),
  confirmText: t('确定'),
})
```

#### 4.5 类型声明 `types/global.d.ts`

```typescript
/// <reference types="@tarojs/taro" />

declare module '*.png';
declare module '*.gif';
declare module '*.jpg';
declare module '*.scss';
declare module '*.css';

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production',
    TARO_ENV: 'weapp' | 'swan' | 'alipay' | 'h5' | 'rn' | 'tt' | 'quickapp' | 'qq' | 'jd'
  }
}
```

#### 4.6 图片工具 `src/utils/imgUtils.ts`

用于获取 `dhbfront-img` 项目中 `mobile-img/{moduleName}` 目录下的图标资源。

```typescript
import { getPlatformProvider } from '@dhbfront-utils/shell_env'

/**
 * 获取 {moduleName} 目录下的图片 URL
 * @param path 图片路径（相对于 mobile-img/{moduleName} 目录）
 * @returns 完整的图片 URL
 * 
 * @example
 * // 获取固定颜色图标
 * get{ModuleName}ImgUrl('icon_close_white.svg')
 * 
 * // 获取主题色图标
 * get{ModuleName}ImgUrl('theme/1/icon_download.svg')
 */
export const get{ModuleName}ImgUrl = (path: string) => {
  const imgDomain = getPlatformProvider('domainImg')
  if (path.slice(0, 1) === '/') {
    path = path.slice(1)
  }
  if (process.env.NODE_ENV === 'development') {
    return `http://127.0.0.1:7077/mini_program_imgs/image/mobile-img/{moduleName}/${path}`
  }
  return `${imgDomain}/mini_program_imgs/image/mobile-img/{moduleName}/${path}`
}

/**
 * 获取图片域名
 */
export const getImgDomain = () => {
  return getPlatformProvider('domainImg')
}

/**
 * 主题类型配置
 * 对应后端返回的 theme type
 * 
 * | type | name | theme_color |
 * |------|------|-------------|
 * | 1    | 默认  | #FF6645 (橙色) |
 * | 2    | 绿色  | #47B203 |
 * | 3    | 蓝色  | #2E5DDF |
 * | 4    | 橙色  | #FF6645 |
 * | 5    | 黑色  | #222222 |
 * | 6    | 红色  | #EC1919 |
 * | 7    | 粉色  | #FF778A |
 */
const VALID_THEMES = [1, 2, 3, 4, 5, 6, 7]

/**
 * 获取主题目录编号
 * @param theme 主题类型（1-7）
 * @returns 主题目录编号字符串
 */
export const getThemeDir = (theme?: number): string => {
  if (theme && VALID_THEMES.includes(theme)) {
    return String(theme)
  }
  return '1' // 默认主题
}

/**
 * 获取主题色图标 URL
 * @param iconName 图标名称（如 'icon_download.svg' 或 'icon_check.svg'）
 * @param theme 主题类型（可选，1-7，不传则从 themeConfig 获取）
 * @returns 完整的图标 URL
 * 
 * @example
 * // 使用指定主题
 * getThemeIconUrl('icon_download.svg', 1)
 * 
 * // 自动从 themeConfig 获取主题
 * getThemeIconUrl('icon_check.svg')
 */
export const getThemeIconUrl = (iconName: string, theme?: number): string => {
  let themeType = theme
  if (!themeType) {
    const themeConfig = getPlatformProvider('themeConfig')
    themeType = themeConfig?.theme || 1
  }
  const themeDir = getThemeDir(themeType)
  return get{ModuleName}ImgUrl(`theme/${themeDir}/${iconName}`)
}
```

**使用方式：**

```tsx
import { get{ModuleName}ImgUrl, getThemeIconUrl } from '../../utils/imgUtils'

// 固定颜色图标
const ICON_CLOSE = get{ModuleName}ImgUrl('icon_close_white.svg')
const ICON_DOWNLOAD_GRAY = get{ModuleName}ImgUrl('icon_download_gray.svg')

// 主题色图标（自动根据当前主题获取）
const downloadIcon = useMemo(() => getThemeIconUrl('icon_download.svg', themeConfig?.theme), [themeConfig?.theme])
const checkIcon = useMemo(() => getThemeIconUrl('icon_check.svg', themeConfig?.theme), [themeConfig?.theme])
```

> **注意**：图标资源需要在 `dhbfront-img/image/mobile-img/{moduleName}/` 目录下创建，参考 `add-mobile-icon` skill。

### Step 5: 创建 Service 接口层

创建 `src/service/{moduleName}Service.ts`，包含 PHP API 和 BFF 接口示例：

```typescript
import { apiMobileTaroRequest, bffGoodsTaroRequest } from '@dhbfront-utils/taro-utils'

// ==================== 类型定义 ====================

/**
 * PHP API 响应格式（code 为 string 类型 "100"）
 */
export interface PhpApiExampleResponse {
  code: string
  data?: {
    example_field: string
    // 根据实际返回结构定义
  }
  message?: string
}

/**
 * BFF 响应格式（code 为 number 类型 200）
 */
export interface BffExampleResponse {
  code: number
  data?: {
    example_field: string
    // 根据实际返回结构定义
  }
  message?: string
}

// ==================== 接口服务 ====================

export const {moduleName}Service = {
  /**
   * PHP API 示例 - 调用订货端接口
   * 
   * 特点：
   * - URL: /api.php
   * - 请求体: { a, c, val: { ...params } }
   * - 认证: skey 由框架自动注入到 val 中
   * - 响应: { code: "100", message: "", data: {...} }
   */
  phpApiExample: async (params: {
    example_id: string
  }): Promise<PhpApiExampleResponse> => {
    const res = await apiMobileTaroRequest.request<PhpApiExampleResponse>({
      url: '/api.php',
      data: {
        a: 'exampleAction',      // Action 名称
        c: 'DingHuo',            // Controller 名称
        val: {
          example_id: params.example_id,
        }
      },
      method: 'POST'
    })
    return res.data as PhpApiExampleResponse
  },

  /**
   * BFF 接口示例 - 调用 BFF 服务
   * 
   * 特点：
   * - URL: /path/to/api
   * - 请求体: 直接传参数对象
   * - 认证: authorization 由框架自动注入到 header
   * - 响应: { code: 200, message: "", data: {...} }
   */
  bffExample: async (params: {
    example_id: number
    page: number
    size: number
  }): Promise<BffExampleResponse> => {
    const res = await bffGoodsTaroRequest.request<BffExampleResponse>({
      url: '/example/getData',
      data: params,
      method: 'POST'
    })
    return res.data as BffExampleResponse
  },
}
```

> **提示**：根据实际业务需求修改接口，参考 `create-api-request.md` skill 从 curl 生成接口代码。

### Step 6: 创建业务组件

#### 6.1 主组件 `src/view-business/{moduleName}/{ModuleName}.tsx`

```tsx
import { View, Text } from '@tarojs/components'
import { styled } from '@linaria/react'
import { useTranslation } from 'react-i18next'
import { getPlatformProvider } from '@dhbfront-utils/shell_env'

/**
 * 将 hex 颜色转为 rgba
 */
const hexToRgba = (hex: string, alpha: number = 1): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    const r = parseInt(result[1], 16)
    const g = parseInt(result[2], 16)
    const b = parseInt(result[3], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return hex
}

const Container = styled(View)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px;
`

const Title = styled(Text)`
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
`

const SubTitle = styled(Text)`
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
`

const ButtonGroup = styled(View)`
  display: flex;
  flex-direction: row;
  gap: 12px;
`

const PrimaryButton = styled(View)`
  height: 44px;
  padding: 0 24px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const SecondaryButton = styled(View)`
  height: 44px;
  padding: 0 24px;
  border-radius: 22px;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
`

const ButtonText = styled(Text)`
  font-size: 15px;
  font-weight: 500;
`

/**
 * {模块中文名}组件
 */
export const {ModuleName} = () => {
  // 国际化
  const { t } = useTranslation('taro-{moduleName}')
  
  // 获取主题色配置
  const themeConfig = getPlatformProvider('themeConfig')
  const themeColor = themeConfig?.theme_color || '#FF6645'
  const buttonColorStart = themeConfig?.button_color_start || '#FF6645'
  const buttonColorEnd = themeConfig?.button_color_end || '#FE916A'

  return (
    <Container className="taro-{moduleName}">
      <Title>{t('{模块中文名}')}</Title>
      <SubTitle>{t('开发中')}</SubTitle>
      
      <ButtonGroup>
        <SecondaryButton 
          style={{ 
            background: hexToRgba(themeColor, 0.1),
            borderColor: themeColor 
          }}
        >
          <ButtonText style={{ color: themeColor }}>{t('取消')}</ButtonText>
        </SecondaryButton>
        
        <PrimaryButton 
          style={{ 
            background: `linear-gradient(to right, ${buttonColorStart}, ${buttonColorEnd})`,
            boxShadow: `0 4px 12px ${hexToRgba(buttonColorStart, 0.25)}`
          }}
        >
          <ButtonText style={{ color: '#fff' }}>{t('确定')}</ButtonText>
        </PrimaryButton>
      </ButtonGroup>
    </Container>
  )
}
```

#### 6.2 Demo 文件 `src/view-business/{moduleName}/demo/{ModuleName}.demo.tsx`

```tsx
import { {ModuleName} } from '../{ModuleName}';

/**
 * @business {moduleName}
 * @group {moduleName}
 * @demoName {模块中文名}Demo
 */
export const {ModuleName}Demo = () => {
  return <{ModuleName} />
}
```

#### 6.3 创建 demo.ts 入口文件 `src/demo.ts`

```typescript
//此文件动态生成，请勿修改
import "./assets/reset.scss"
import './initCode'
import { {ModuleName}Demo } from './view-business/{moduleName}/demo/{ModuleName}.demo';

export const demos: Record<string, Record<string, Record<string, { componentName: string, Component: React.FC }>>> = {
  {moduleName}: {
    {moduleName}: {
      {ModuleName}Demo: {
        componentName: '{模块中文名}Demo',
        Component: {ModuleName}Demo
      },
    },
  },
};
```

### Step 7: 复制构建脚本

从同项目已有业务包（如 `taro-goods-category`）的 `scripts/` 目录复制：

- `mvAssets.cjs` - 资源文件移动脚本

### Step 8: 配置开发壳

#### 8.0 配置 i18n 多语言支持（首次配置）

如果开发壳尚未配置多语言支持，需要在 `packages/taro-dev-webpack/src/app.ts` 中配置：

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          "Welcome to React": "Welcome to React and react-i18next",
        }
      },
      zh: {
        translation: {
          "Welcome to React": "欢迎使用 React 和 react-i18next",
        }
      }
    },
    lng: "zh",           // 当前语言：'zh' 中文 / 'en' 英文
    fallbackLng: "en",   // 回退语言
    interpolation: {
      escapeValue: false
    }
  });
```

**语言配置说明：**

| 配置项 | 说明 | 可选值 |
|--------|------|--------|
| `lng` | 当前使用的语言 | `'zh'` 中文, `'en'` 英文 |
| `fallbackLng` | 找不到翻译时的回退语言 | `'en'` |
| `resources` | 全局翻译资源 | 按语言代码分组 |

**业务包 i18n 注册流程：**

1. 业务包在 `initCode.ts` 中调用 `i18nInstance.addResourceBundle()` 注册命名空间
2. 开发壳的 `app.ts` 中 i18n 配置会被注入到 `getPlatformProvider('reactI18n')`
3. 组件中使用 `useTranslation('taro-{moduleName}')` 获取翻译函数

#### 8.1 添加依赖

`packages/taro-dev-webpack/package.json` → dependencies：

```json
"@{domainName}/taro-{moduleName}": "workspace:*",
```

#### 8.2 添加编译配置

`packages/taro-dev-webpack/config/index.ts` → `compilePack` 数组：

```typescript
const compilePack = [
  // ... 已有包
  'taro-{moduleName}',  // 新增
]
```

#### 8.3 添加 Demo 生成

`packages/taro-dev-webpack/config/dev.ts`：

```typescript
readDemoComponent({
  sourceDir: path.join(__dirname,'../../taro-{moduleName}/src'),
  outputFilePath: path.join(__dirname,'../../taro-{moduleName}/src','demo.ts'),
  initCodeImport: `import "./assets/reset.scss"\nimport './initCode'\n`
})
```

#### 8.3.1 开发壳 alias 解析包/demo（必须，业务包不要加 exports）

使用 BaseDemo 且 Demo 页从 `@{domainName}/taro-{moduleName}/demo` 导入时，webpack 默认无法解析（业务包发布时只带 `dist/`，不带 `src/demo.ts`）。**在开发壳用 alias 指向源码即可，业务包 package.json 不要加 `./demo` 导出**，这样发布到主包时无需再删。

在 `packages/taro-dev-webpack/config/index.ts` 的 `alias` 中增加（与现有 poster/modal 并列）：

```javascript
'@{domainName}/taro-{moduleName}/demo': path.join(__dirname, '../../taro-{moduleName}/src/demo.ts'),
```

说明：`readDemoComponent` 会在启动时生成各包下的 `src/demo.ts`，alias 仅开发壳使用，业务包发布后主包不引用 `/demo`，故无需在业务包写 exports。

#### 8.4 创建 Demo 页面

`packages/taro-dev-webpack/src/pages/demo{ModuleName}.tsx`：

```tsx
import { demos } from '@{domainName}/taro-{moduleName}/demo'
import { View } from '@tarojs/components'
import { BaseDemo } from '../demo/baseDemo'

export default () => {
  return (
    <View className='taro-{moduleName}'>
      {BaseDemo({ demos, url: 'pages/demo{ModuleName}' })}
    </View>
  )
}
```

#### 8.5 注册路由

`packages/taro-dev-webpack/src/app.config.ts`：

```typescript
pages: [
  'pages/index/index',        // 首页导航必须放第一位
  // ... 已有页面
  'pages/demo{ModuleName}',   // 新增
],
```

> ⚠️ **注意**：如果 `'pages/index/index'` 不在 pages 数组第一位，需要将其移动到第一位，确保首页导航页面是默认入口。

#### 8.6 更新首页导航

`packages/taro-dev-webpack/src/pages/index/index.tsx`：

在 `demoPages` 数组中添加新模块的导航入口：

```tsx
const demoPages = [
  // ... 已有入口
  { name: '{模块中文名} ({ModuleName})', url: '/pages/demo{ModuleName}' },  // 新增
]
```

### Step 9: 安装并运行

```bash
# 分包项目根目录
cd {domainName}
pnpm install --no-frozen-lockfile

# 启动开发
cd packages/taro-dev-webpack
pnpm dev:h5
```

访问 `http://localhost:10086` 验证新模块。

---

## 发布流程

```bash
# 1. 构建业务包
cd {domainName}/packages/taro-{moduleName}
pnpm build

# 2. 发布到私有 npm
npm publish --registry http://npm.newdhb.com/

# 3. 在主包中引入
cd /path/to/dhbfront-cash-mini
pnpm add @{domainName}/taro-{moduleName}
```

---

## 检查清单

### 业务包文件
- [ ] `package.json` 创建（注意包名格式 `@{domainName}/taro-{moduleName}`；**不要**在业务包加 `exports["./demo"]`，由开发壳 alias 解析）
- [ ] `tsconfig.json` 创建
- [ ] `src/index.ts` 入口文件
- [ ] `src/initCode.ts` 初始化
- [ ] `src/demo.ts` Demo 入口文件（导出 demos 对象）
- [ ] `src/assets/reset.scss` 重置样式
- [ ] `src/i8n/taro-{moduleName}-zh.ts` 国际化文件（中文，key 使用中文）
- [ ] `src/i8n/taro-{moduleName}-en.ts` 国际化文件（英文，key 使用中文，value 是英文翻译）
- [ ] `src/service/{moduleName}Service.ts` 接口服务（含 PHP API 和 BFF 示例）
- [ ] `src/utils/imgUtils.ts` 图片工具（获取图标 URL）
- [ ] `types/global.d.ts` 类型声明
- [ ] `scripts/mvAssets.cjs` 构建脚本
- [ ] 业务组件 `src/view-business/{moduleName}/{ModuleName}.tsx`
- [ ] Demo 文件 `src/view-business/{moduleName}/demo/{ModuleName}.demo.tsx`

### 图标资源（dhbfront-img）
- [ ] 创建目录 `dhbfront-img/image/mobile-img/{moduleName}/`
- [ ] 创建目录 `dhbfront-img/image/mobile-img/{moduleName}/theme/1-7/`（如需主题色图标）
- [ ] 添加固定颜色图标到模块根目录
- [ ] 添加主题色图标到 `theme/1-7/` 子目录（参考 `add-mobile-icon` skill）

### 开发壳配置
- [ ] `config/index.ts` → `alias` 增加 `'@{domainName}/taro-{moduleName}/demo': path.join(__dirname, '../../taro-{moduleName}/src/demo.ts')`（否则 import 包/demo 会 404）
- [ ] `package.json` 添加依赖 `@{domainName}/taro-{moduleName}: workspace:*`
- [ ] `config/index.ts` → `compilePack` 数组添加包名
- [ ] `config/dev.ts` → 添加 `readDemoComponent` 调用
- [ ] `src/pages/demo{ModuleName}.tsx` Demo 页面创建
- [ ] `src/app.config.ts` 路由注册（确保 `pages/index/index` 在第一位）
- [ ] `src/pages/index/index.tsx` 首页导航添加入口

### 最后步骤
- [ ] 根目录运行 `pnpm install --no-frozen-lockfile` 链接新包
- [ ] 运行 `pnpm dev:h5` 验证

---

## 快速提示词模板

复制以下提示词，替换变量后使用：

```
在 dhbfront-domain-goods 中新增 {你的模块名} 模块，
模块中文名是 {中文名称}，
参照 add-taro-module skill 创建完整的目录结构和配置
```
