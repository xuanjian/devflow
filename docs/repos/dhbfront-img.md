# dhbfront-img

## 基本信息

- repoKey: `dhbfront-img`
- path: `/Users/xj/Documents/frontend/dhbfront-img`
- technologyFamilyId: `frontend`
- technologyFamilyName: `前端`
- repoType: `asset-service`
- package: `dhbfront-img`

## 项目定位

DHB 前端移动端/小程序图片资源仓库，包含本地图片预览服务和需要上传 OSS 的图片包。它更像资源服务仓库，不是业务页面工程。

README 明确说明所有小程序图片包在 `image/` 下，线上通过 `https://img.dhb168.com/mini_program_imgs/{项目名}/` 访问。

## 技术栈/关键目录

- 本地服务：Node + Express，`npm start` 启动 `server.js`。
- 图片根目录：`image/`。
- 本地预览：`imagePreview.html`、`http://127.0.0.1:7007`。
- 图片处理依赖：`sharp`。
- 资源包：`image.zip`。

## 典型使用场景

- 新增、替换或预览小程序/移动端图片资源。
- 本地调试业务项目中的图片地址。
- 准备上传 OSS 的完整 `image/` 图片包。
- 为 `DHB_PACKAGES` 或 `dhbfront-cash-mini` 的移动图标能力提供资源。

## 与其他项目关系

- 下游消费：`dhbfront-cash-mini`、`DHB_PACKAGES`、`customize-mini-program` 和 H5 项目可能引用这里的图片 URL。
- 技能联动：`DHB_PACKAGES` 的 add-mobile-icon 技能会关联本仓库资源。

## 读取建议

- 资源任务先读 `README.md`，确认目录和线上 URL 规则。
- 改图片时看具体 `image/<项目名>/` 子目录，不要把它当常规 React/Vite/Taro 项目处理。
- 上线前需要确认 OSS 上传范围；代码提交本身不等于线上图片已生效。

## 默认场景

- `single-repo-change` - 默认单仓修改场景

## 标签

- `dhb`
- `frontend`
- `assets`
