# 创建 API 请求 Skill

## 触发词
- 创建请求
- 新增接口
- 添加 API
- create request
- add api

## 功能说明
根据用户提供的 curl 命令，自动生成对应的 Taro 请求代码，包括：
1. 识别服务类型（PHP API / BFF 服务）
2. 生成请求方法和类型定义
3. 处理认证方式

## 使用流程

### 步骤 1：收集信息
向用户询问以下信息：
1. **curl 命令**：完整的 curl 请求
2. **接口用途**：这个接口是做什么的（用于生成注释和方法名）
3. **返回结果**（可选）：如果无法自动获取，需要用户提供

### 步骤 2：解析域名判断服务类型

#### 域名环境规则
| 环境 | 域名格式 | 示例 |
|------|---------|------|
| 测试 | `*.newdhb.com` | `api.newdhb.com`, `bff-goods.newdhb.com` |
| 预发 | `y*.dhb168.com` | `yapi.dhb168.com`, `ybff-goods.dhb168.com` |
| 正式 | `*.dhb168.com` | `api.dhb168.com`, `bff-goods.dhb168.com` |

**重要**：无论用户给的是哪个环境的域名，都统一转换为测试环境域名来判断服务类型。

#### 转换规则
```
预发/正式 → 测试
yapi.dhb168.com → api.newdhb.com
api.dhb168.com → api.newdhb.com
ybff-goods.dhb168.com → bff-goods.newdhb.com
bff-goods.dhb168.com → bff-goods.newdhb.com
```

#### 服务类型映射（基于测试环境域名）
| 测试环境域名 | 服务类型 | 请求工具 |
|-------------|---------|---------|
| `api.newdhb.com` | 订货端 PHP API | `apiMobileTaroRequest` |
| `bff-goods.newdhb.com` | BFF Goods 服务 | `bffGoodsTaroRequest` |
| `bff-order.newdhb.com` | BFF Order 服务 | `bffOrderTaroRequest` |
| `bff-payment.newdhb.com` | BFF Payment 服务 | `bffPaymentTaroRequest` |
| `bff-user.newdhb.com` | BFF User 服务 | `bffUserTaroRequest` |
| `bff-warehouse.newdhb.com` | BFF Warehouse 服务 | `bffWarehouseTaroRequest` |

### 步骤 3：生成代码

#### PHP API 请求（apiMobileTaroRequest）

**特点**：
- URL 格式：`/api.php`
- 请求体：`{ a, c, val: { ...参数 } }`
- 认证：通过 `val.skey` 传递（框架自动处理）
- 返回格式：`{ code: "100", message: "", data: {...} }`

**代码模板**：
```typescript
export interface XxxResponse {
  code: string
  data?: {
    // 根据实际返回结构定义
  }
  message?: string
}

/**
 * 接口描述
 */
xxx: async (params: {
  // 参数定义
}): Promise<XxxResponse> => {
  const res = await apiMobileTaroRequest.request<XxxResponse>({
    url: '/api.php',
    data: {
      a: 'actionName',
      c: 'ControllerName',
      val: {
        // 参数
      }
    },
    method: 'POST'
  })
  return res.data as XxxResponse
},
```

#### BFF 请求（bffXxxTaroRequest）

**特点**：
- URL 格式：`/path/to/api`
- 请求体：直接传参数对象
- 认证：通过 `authorization` header 传递（框架自动处理）
- 返回格式：`{ code: 200, message: "", data: {...} }`

**代码模板**：
```typescript
export interface XxxResponse {
  code: number
  data?: {
    // 根据实际返回结构定义
  }
  message?: string
}

/**
 * 接口描述
 */
xxx: async (params: {
  // 参数定义
}): Promise<XxxResponse> => {
  const res = await bffGoodsTaroRequest.request<XxxResponse>({
    url: '/path/to/api',
    data: params,
    method: 'POST'
  })
  return res.data as XxxResponse
},
```

### 步骤 4：导入声明

确保 service 文件顶部有正确的导入：

```typescript
// PHP API
import { apiMobileTaroRequest } from '@dhbfront-utils/taro-utils'

// BFF 服务
import { bffGoodsTaroRequest } from '@dhbfront-utils/taro-utils'
import { bffOrderTaroRequest } from '@dhbfront-utils/taro-utils'
import { bffPaymentTaroRequest } from '@dhbfront-utils/taro-utils'
import { bffUserTaroRequest } from '@dhbfront-utils/taro-utils'
import { bffWarehouseTaroRequest } from '@dhbfront-utils/taro-utils'
```

## curl 解析示例

### 示例 1：PHP API
```bash
curl 'https://api.newdhb.com/api.php?c=DingHuo&a=shareGoods' \
  -X POST \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-raw 'a=shareGoods&c=DingHuo&val={"goods_id":"1876608","skey":"xxx"}'
```

**解析结果**：
- 服务：PHP API (`apiMobileTaroRequest`)
- Controller：`DingHuo`
- Action：`shareGoods`
- 参数：`goods_id`

### 示例 2：BFF 服务
```bash
curl 'https://bff-goods.newdhb.com/aiPoster/generateQRCode' \
  -X POST \
  -H 'Content-Type: application/json' \
  -H 'authorization: Bearer xxx' \
  --data '{"text":"https://example.com","size":200,"margin":1}'
```

**解析结果**：
- 服务：BFF Goods (`bffGoodsTaroRequest`)
- URL：`/aiPoster/generateQRCode`
- 参数：`text`, `size`, `margin`

## 注意事项

1. **认证处理**：skey 和 authorization 由框架自动注入，不需要在代码中手动传递
2. **类型定义**：始终为请求参数和响应定义 TypeScript 接口
3. **错误处理**：在调用处处理错误，service 层只负责请求
4. **code 类型**：PHP API 返回 string 类型 `"100"`，BFF 返回 number 类型 `200`
