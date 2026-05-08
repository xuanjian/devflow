---
name: add-mobile-icon
description: 在 dhbfront-img 项目中新增图标。触发词：新增图标、添加图标、创建图标、添加 svg 图标。支持固定颜色图标和主题色图标，支持任意模块目录（goods、order、payment 等）。
---

# 新增移动端图标

在 dhbfront-img 项目中新增 SVG 图标的自动化流程。

## 触发场景

- 用户说"新增图标 xxx"
- 用户说"添加图标到 xxx 模块"
- 用户想要将 Base64 图标转换为 SVG 文件
- 用户想要添加主题色图标

## 目录结构

```
dhbfront-img/image/mobile-img/
├── <module>/                    # 模块目录（如 goods、order、payment）
│   ├── icon_xxx.svg             # 固定颜色图标
│   └── theme/                   # 主题色图标目录
│       ├── 1/                   # 默认/橙色 #FF6645
│       │   └── icon_xxx.svg
│       ├── 2/                   # 绿色 #47B203
│       │   └── icon_xxx.svg
│       ├── 3/                   # 蓝色 #2E5DDF
│       │   └── icon_xxx.svg
│       ├── 4/                   # 橙色 #FF6645
│       │   └── icon_xxx.svg
│       ├── 5/                   # 黑色 #222222
│       │   └── icon_xxx.svg
│       ├── 6/                   # 红色 #EC1919
│       │   └── icon_xxx.svg
│       └── 7/                   # 粉色 #FF778A
│           └── icon_xxx.svg
```

## 主题色配置

| 主题目录 | 主题名 | theme_color |
|----------|--------|-------------|
| 1 | 默认 | `#FF6645` (橙色) |
| 2 | 绿色 | `#47B203` |
| 3 | 蓝色 | `#2E5DDF` |
| 4 | 橙色 | `#FF6645` |
| 5 | 黑色 | `#222222` |
| 6 | 红色 | `#EC1919` |
| 7 | 粉色 | `#FF778A` |

## 执行流程

### 第 1 步：收集信息

使用 AskQuestion 工具询问：

1. **模块名称**：图标放在哪个模块目录（如 goods、order、payment、cart）
2. **图标名称**：图标文件名（如 icon_close、icon_share）
3. **图标类型**：固定颜色 / 主题色
4. **SVG 内容或 Base64**：图标的 SVG 代码或 Base64 编码

```
示例问题：
- 图标放在哪个模块目录？（如：goods、order、payment、cart）
- 图标文件名是什么？（如：icon_close_white、icon_share）
- 是固定颜色还是主题色图标？
  - 固定颜色：放在模块根目录，颜色不变
  - 主题色：放在 theme/1-7 目录，根据主题切换颜色
- 提供 SVG 内容或 Base64 编码
```

### 第 2 步：解析图标

**如果是 Base64：**
```javascript
// Base64 格式：data:image/svg+xml;base64,PHN2Zy...
// 解码获取 SVG 内容
const svgContent = atob(base64String.replace('data:image/svg+xml;base64,', ''))
```

**如果是 SVG 内容：**
直接使用提供的 SVG 代码

### 第 3 步：创建目录（如果不存在）

```bash
# 创建模块目录
mkdir -p /Users/xj/Documents/frontend/dhbfront-img/image/mobile-img/<module>

# 如果是主题色图标，创建 theme 子目录
mkdir -p /Users/xj/Documents/frontend/dhbfront-img/image/mobile-img/<module>/theme/{1,2,3,4,5,6,7}
```

### 第 4 步：创建图标文件

#### 固定颜色图标

直接写入 SVG 文件到模块目录：

```
dhbfront-img/image/mobile-img/<module>/<icon_name>.svg
```

#### 主题色图标

为每个主题目录创建对应颜色的 SVG 文件：

```
dhbfront-img/image/mobile-img/<module>/theme/1/<icon_name>.svg  # #FF6645
dhbfront-img/image/mobile-img/<module>/theme/2/<icon_name>.svg  # #47B203
dhbfront-img/image/mobile-img/<module>/theme/3/<icon_name>.svg  # #2E5DDF
dhbfront-img/image/mobile-img/<module>/theme/4/<icon_name>.svg  # #FF6645
dhbfront-img/image/mobile-img/<module>/theme/5/<icon_name>.svg  # #222222
dhbfront-img/image/mobile-img/<module>/theme/6/<icon_name>.svg  # #EC1919
dhbfront-img/image/mobile-img/<module>/theme/7/<icon_name>.svg  # #FF778A
```

**主题色替换规则：**
将 SVG 中的 `stroke="xxx"` 或 `fill="xxx"` 替换为对应主题色。

### 第 5 步：创建/更新 imgUtils.ts（如果需要）

检查对应的 Taro 包中是否有 `imgUtils.ts`，如果没有则创建：

**文件路径示例：**
- goods 模块：`DHB_PACKAGES/dhbfront-domain-goods/packages/taro-goods-poster/src/utils/imgUtils.ts`
- order 模块：`DHB_PACKAGES/dhbfront-domain-order/packages/taro-xxx/src/utils/imgUtils.ts`

**imgUtils.ts 模板：**

```typescript
import { getPlatformProvider } from '@dhbfront-utils/shell_env'

/**
 * 获取 <module> 目录下的图片 URL
 * @param path 图片路径（相对于 mobile-img/<module> 目录）
 * @returns 完整的图片 URL
 * 
 * @example
 * // 获取固定颜色图标
 * get<Module>ImgUrl('icon_close_white.svg')
 * 
 * // 获取主题色图标
 * get<Module>ImgUrl('theme/1/icon_download.svg')
 */
export const get<Module>ImgUrl = (path: string) => {
  const imgDomain = getPlatformProvider('domainImg')
  if (path.slice(0, 1) === '/') {
    path = path.slice(1)
  }
  if (process.env.NODE_ENV === 'development') {
    return `http://127.0.0.1:7077/mini_program_imgs/image/mobile-img/<module>/${path}`
  }
  return `${imgDomain}/mini_program_imgs/image/mobile-img/<module>/${path}`
}

/**
 * 获取图片域名
 */
export const getImgDomain = () => {
  return getPlatformProvider('domainImg')
}

/**
 * 主题类型配置
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
 */
export const getThemeIconUrl = (iconName: string, theme?: number): string => {
  let themeType = theme
  if (!themeType) {
    const themeConfig = getPlatformProvider('themeConfig')
    themeType = themeConfig?.theme || 1
  }
  const themeDir = getThemeDir(themeType)
  return get<Module>ImgUrl(`theme/${themeDir}/${iconName}`)
}
```

### 第 6 步：验证

1. 确认 SVG 文件已正确创建
2. 确认文件内容正确（颜色、路径等）
3. 确认 imgUtils.ts 存在且导出正确

## 完整示例

### 示例 1：添加固定颜色图标

**用户输入：** "添加一个白色关闭图标到 order 模块"

**AI 询问：**
1. 图标文件名？→ 用户回复 `icon_close_white`
2. 提供 SVG 内容？→ 用户提供 SVG 或 Base64

**执行步骤：**

1. 创建目录 `dhbfront-img/image/mobile-img/order/`
2. 创建文件 `icon_close_white.svg`

**结果：**
```
dhbfront-img/image/mobile-img/order/
└── icon_close_white.svg
```

### 示例 2：添加主题色图标

**用户输入：** "添加一个主题色下载图标到 goods 模块"

**AI 询问：**
1. 图标文件名？→ 用户回复 `icon_download`
2. 提供 SVG 内容？→ 用户提供 SVG 或 Base64

**执行步骤：**

1. 确认目录存在 `dhbfront-img/image/mobile-img/goods/theme/1-7/`
2. 为每个主题创建 `icon_download.svg`，替换颜色

**结果：**
```
dhbfront-img/image/mobile-img/goods/theme/
├── 1/icon_download.svg  # stroke="#FF6645"
├── 2/icon_download.svg  # stroke="#47B203"
├── 3/icon_download.svg  # stroke="#2E5DDF"
├── 4/icon_download.svg  # stroke="#FF6645"
├── 5/icon_download.svg  # stroke="#222222"
├── 6/icon_download.svg  # stroke="#EC1919"
└── 7/icon_download.svg  # stroke="#FF778A"
```

## 使用方式

在组件中使用图标：

```tsx
import { getGoodsImgUrl, getThemeIconUrl } from '../../utils/imgUtils'

// 固定颜色图标
const ICON_CLOSE = getGoodsImgUrl('icon_close_white.svg')

// 主题色图标（自动根据当前主题获取）
const downloadIcon = getThemeIconUrl('icon_download.svg')

// 指定主题的图标
const downloadIcon = getThemeIconUrl('icon_download.svg', 2) // 绿色主题
```

## 注意事项

- SVG 图标建议使用 24x24 的 viewBox
- 固定颜色图标文件名建议带颜色后缀，如 `icon_close_white.svg`、`icon_download_gray.svg`
- 主题色图标文件名不需要颜色后缀，如 `icon_download.svg`、`icon_check.svg`
- 主题色替换时，替换 `stroke` 或 `fill` 属性（根据 SVG 实际使用的属性）
- 开发环境需要启动 dhbfront-img 的本地服务（端口 7077）
