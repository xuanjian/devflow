# 新增 BFF 服务层

为 dhbfront-manager-mobile 项目新增 BFF 服务层接口调用。

## 触发词

- 新增 BFF 服务
- 添加 BFF 接口
- 创建 BFF 模块
- 新增接口调用层
- 添加服务层

## 使用场景

当需要在项目中接入新的 BFF 服务时使用此 skill，包括：
- 创建 HTTP 客户端实例
- 创建服务层文件
- 添加类型定义
- 配置域名（如需要）

## 信息收集

在开始之前，需要向用户确认以下信息：

1. **模块名称**（必填）：例如 `ai-poster`、`purchase-record`、`supplier`
2. **BFF 服务域名 key**（必填）：对应 `domainConfig.hosts` 中的 key，例如：
   - `bff-goods` - 商品服务
   - `bff-order` - 订单服务
   - `bff-user` - 用户服务
   - `bff-warehouse` - 仓库服务
   - `bff-payment` - 支付服务
3. **服务名称**（可选）：用于命名，如不提供则从模块名称推导
4. **是否需要添加新域名到配置**（可选）：如果 BFF 服务域名不在现有配置中

## 执行步骤

### 步骤 1：创建模块目录结构

如果模块目录不存在，创建以下结构：

```
src/module/{模块名}/
├── utils/
│   └── httpBff{服务名}.ts      # HTTP 客户端
├── services/
│   └── {服务名}Services.ts     # 服务层
└── model/
    └── {服务名}Model.ts        # 类型定义
```

### 步骤 2：创建 HTTP 客户端文件

在 `src/module/{模块名}/utils/` 目录下创建 HTTP 客户端文件。

**文件命名规范**：`httpBff{服务名}.ts`

**代码模板**：

```typescript
// {服务描述} BFF HTTP 客户端
import type { AxiosInstance } from 'axios';
import { getBffBase } from '../../../utils/httpBffBase';

let httpBff{服务名}Instance: AxiosInstance | null = null;

/**
 * 创建 {服务描述} 服务的 HTTP 客户端实例
 * 使用全局 domainConfig 配置，确保在不同环境下使用正确的域名
 * authorization 由 getBffBase 内部的拦截器统一处理
 */
export const httpBff{服务名} = (): AxiosInstance => {
    if (!httpBff{服务名}Instance) {
        httpBff{服务名}Instance = getBffBase({
            baseURL: domainConfig.hosts['{域名key}'], // 从全局配置获取 {域名key} 服务域名
        });
    }
    return httpBff{服务名}Instance;
};
```

**关键要点**：
- 使用单例模式，避免重复创建实例
- 使用全局 `domainConfig.hosts['{域名key}']` 获取域名，**不要从 local/ 目录导入**
- 导出工厂函数而非直接导出实例
- `getBffBase` 已经处理了 authorization header，无需额外添加拦截器

### 步骤 3：创建服务层文件

在 `src/module/{模块名}/services/` 目录下创建服务层文件。

**文件命名规范**：`{服务名}Services.ts`

**代码模板**：

```typescript
// {服务描述} 服务层
import { httpBff{服务名} } from '../utils/httpBff{服务名}';
import type {
    // 导入需要的类型
} from '../model/{服务名}Model';

/**
 * {服务描述} 服务
 */
export const {服务名}Services = {
    /**
     * 接口描述
     * @url /path/to/api @httpMethod post @desc 接口说明
     */
    apiMethodName: (data: RequestType) => {
        return httpBff{服务名}().post<{
            code: number;
            message?: string;
            data: ResponseType;
        }>('/path/to/api', data);
    },

    /**
     * GET 请求示例
     * @url /path/to/api @httpMethod get @desc 接口说明
     */
    getMethodName: (params: ParamsType) => {
        return httpBff{服务名}().get<{
            code: number;
            message?: string;
            data: ResponseType;
        }>('/path/to/api', { params });
    },
};
```

**关键要点**：
- 调用 HTTP 客户端时使用 `httpBff{服务名}()` 函数调用形式
- 为每个接口添加 JSDoc 注释，包含 `@url`、`@httpMethod`、`@desc`
- 使用泛型定义响应类型

### 步骤 4：创建类型定义文件

在 `src/module/{模块名}/model/` 目录下创建类型定义文件。

**文件命名规范**：`{服务名}Model.ts`

**代码模板**：

```typescript
/**
 * {服务描述} 数据模型
 */

/**
 * 请求参数类型
 * @url /path/to/api @httpMethod post @desc 接口说明
 */
export interface RequestTypeName {
    /** 字段说明 */
    fieldName: string;
    /** 可选字段说明 */
    optionalField?: number;
}

/**
 * 响应数据类型
 */
export interface ResponseTypeName {
    /** 字段说明 */
    resultField: string;
}
```

**关键要点**：
- 每个接口定义单独的 Request 和 Response 类型
- 所有字段必须添加 JSDoc 注释
- 使用 `?` 标记可选字段

### 步骤 5：添加域名配置（如需要）

如果 BFF 服务域名不在现有配置中，需要添加：

**1. 更新 `public/config/domainConfig.js`（生产环境）**：

```javascript
var domainConfig = {
  "envCode": "online",
  "hosts": {
    // ... 现有配置
    "{域名key}": "https://{域名key}.dhb168.com",
  }
}
```

**2. 更新 `local/domainConfig.ts`（开发环境）**：

```typescript
export const domainConfig = {
  "envCode": "test",
  "hosts": {
    // ... 现有配置
    "{域名key}": "http://{域名key}.newdhb.com",
  }
}
```

**3. 更新 `src/typings/index.d.ts`（类型声明）**：

在 `domains` 类型中添加新的域名 key。

### 步骤 6：验证配置

完成后，检查以下内容：
1. HTTP 客户端文件正确使用全局 `domainConfig`
2. 服务层文件正确调用 HTTP 客户端函数（带括号）
3. 类型定义完整且有注释
4. 域名配置在各环境文件中一致

## 环境域名对照表

| 环境 | 域名格式 | 协议 |
|------|---------|------|
| 测试环境 | `{service}.newdhb.com` | HTTP |
| 预发环境 | `y{service}.dhb168.com` | HTTPS |
| 正式环境 | `{service}.dhb168.com` | HTTPS |

## 常见错误

### 错误 1：直接从 local/ 导入配置

```typescript
// ❌ 错误：直接导入 local 配置，会导致生产环境使用测试域名
import { domainConfig } from '../../../../local/domainConfig.ts';

// ✅ 正确：使用全局 domainConfig（由运行时注入）
baseURL: domainConfig.hosts['bff-goods'],
```

### 错误 2：直接导出实例而非工厂函数

```typescript
// ❌ 错误：直接导出实例
export const httpBffAiPoster = getBffBase({
    baseURL: domainConfig.hosts['bff-goods'],
});

// ✅ 正确：导出工厂函数
export const httpBffAiPoster = (): AxiosInstance => {
    if (!httpBffAiPosterInstance) {
        httpBffAiPosterInstance = getBffBase({
            baseURL: domainConfig.hosts['bff-goods'],
        });
    }
    return httpBffAiPosterInstance;
};
```

### 错误 3：调用 HTTP 客户端时忘记加括号

```typescript
// ❌ 错误：忘记函数调用
return httpBffAiPoster.post('/api/path', data);

// ✅ 正确：使用函数调用
return httpBffAiPoster().post('/api/path', data);
```

### 错误 4：在函数外添加拦截器

```typescript
// ❌ 错误：在函数外添加拦截器（会报错，因为此时 httpBffAiPoster 是函数不是实例）
httpBffAiPoster.interceptors.request.use(config => {
    // ...
});

// ✅ 正确：getBffBase 已经处理了 authorization，无需额外拦截器
```

## 参考文件

- HTTP 客户端示例：`src/module/ai-poster/utils/httpBffAiPoster.ts`
- 服务层示例：`src/module/ai-poster/services/aiPosterServices.ts`
- 类型定义示例：`src/module/ai-poster/model/AiPosterModel.ts`
- 基础 HTTP 配置：`src/utils/httpBffBase.ts`
- 域名配置：`public/config/domainConfig.js`
