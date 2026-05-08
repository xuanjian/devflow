# Skill: 根据 curl 生成接口 Mock

## 触发提示词

```
mock 这个 curl: {粘贴 curl 命令}
```

**示例：**
```
mock 这个 curl:
curl 'https://api.example.com/api.php?c=DingHuo&a=goodsList' \
  -H 'Content-Type: application/json' \
  -d '{"page": 1, "size": 20}'
```

---

## 工作流程

### Step 1: 用户提供 curl 命令

用户粘贴 curl 命令后，AI 需要解析：
- **请求 URL**：提取接口路径和查询参数
- **请求方法**：GET/POST/PUT/DELETE 等
- **请求头**：Content-Type 等
- **请求体**：JSON 数据

### Step 2: AI 自动执行 curl 获取返回数据

**直接执行用户提供的 curl 命令**，获取接口返回数据。

- 如果请求成功且有数据返回 → 直接生成 mock 文件
- 如果请求失败或无数据 → 询问用户提供返回数据

### Step 3: AI 生成 Mock 文件

根据解析结果和返回数据生成 mock 文件：

---

## Mock 文件结构

```
{domainName}/packages/taro-dev-webpack/local/mock/
├── data/
│   └── {接口路径}/
│       └── {method}.json          # mock 数据文件
├── mockConfig.json                # mock 开关配置
└── updateMockConfig.js            # 更新配置脚本
```

### 文件命名规则

**接口路径转目录名：**
- URL: `/api.php?c=DingHuo&a=goodsList`
- 目录: `data/api.php?c=DingHuo&a=goodsList/`
- 文件: `post.json` 或 `get.json`（根据请求方法）

---

## 生成文件示例

### 1. Mock 数据文件

位置：`local/mock/data/{接口路径}/{method}.json`

```json
{
  "code": "100",
  "action_time": 1768988654,
  "message": "",
  "data": {
    // 用户提供的返回数据
  }
}
```

### 2. 更新 mockConfig.json

在 `local/mock/mockConfig.json` 中添加接口配置：

```json
{
  "/api.php?c=DingHuo&a=goodsList": {
    "post": true
  }
}
```

**配置说明：**
- `true`：启用 mock，返回本地数据
- `false`：禁用 mock，请求真实接口

---

## curl 解析规则

### 解析 URL

```bash
curl 'https://api.example.com/api.php?c=DingHuo&a=goodsList'
```

提取：
- 接口路径：`/api.php?c=DingHuo&a=goodsList`

### 解析请求方法

```bash
curl -X POST ...        # 显式指定 POST
curl -d '...'           # 有 -d 参数默认是 POST
curl ...                # 无特殊参数默认是 GET
```

### 解析请求体

```bash
curl -d '{"page": 1}'                    # -d 参数
curl --data '{"page": 1}'                # --data 参数
curl --data-raw '{"page": 1}'            # --data-raw 参数
```

---

## 完整示例

### 用户输入

```
mock 这个 curl:
curl 'https://m.dhb.cn/api.php?c=DingHuo&a=getGoodsList' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer token123' \
  --data-raw '{"categoryId": 1, "page": 1, "size": 20}'
```

### AI 自动执行

AI 直接执行 curl 命令获取返回数据：

```bash
# AI 执行用户的 curl 命令
curl 'https://m.dhb.cn/api.php?c=DingHuo&a=getGoodsList' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer token123' \
  --data-raw '{"categoryId": 1, "page": 1, "size": 20}'
```

**情况 A：请求成功**
- 获取到返回数据 → 直接生成 mock 文件

**情况 B：请求失败**
- 网络错误/无权限/超时等 → 询问用户提供返回数据

### AI 生成文件

**1. 创建目录和数据文件：**

`local/mock/data/api.php?c=DingHuo&a=getGoodsList/post.json`

```json
{
  "code": "100",
  "message": "success",
  "data": {
    "list": [
      {"id": 1, "name": "商品1", "price": 100},
      {"id": 2, "name": "商品2", "price": 200}
    ],
    "total": 100
  }
}
```

**2. 更新 mockConfig.json：**

```json
{
  "/api.php?c=DingHuo&a=bindDevice": {
    "post": false
  },
  "/api.php?c=DingHuo&a=getGoodsList": {
    "post": true
  }
}
```

### AI 回复

```
已创建 mock 文件：
- 数据文件：local/mock/data/api.php?c=DingHuo&a=getGoodsList/post.json
- 配置已更新：mockConfig.json（已启用）

重启开发服务后生效。如需禁用此 mock，将 mockConfig.json 中对应的值改为 false。
```

---

## 注意事项

1. **接口路径**：只提取 path 和 query 部分，不包含域名
2. **请求方法**：文件名使用小写（`post.json`、`get.json`）
3. **启用 mock**：默认设为 `true`，需要时可手动改为 `false`
4. **重启生效**：修改 mock 文件后需重启开发服务
5. **仅 H5 生效**：mock 功能只在 H5 开发模式下生效

---

## 快速提示词模板

```
mock 这个 curl:
{粘贴你的 curl 命令}
```

然后按提示提供返回数据即可。
