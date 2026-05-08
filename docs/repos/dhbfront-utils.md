# dhbfront-utils

## 基本信息

- repoKey: `dhbfront-utils`
- path: `/Users/xj/Documents/frontend/dhbfront-utils`
- technologyFamilyId: `frontend`
- technologyFamilyName: `前端`
- repoType: `shared-library`
- package: `dhbfront-utils`
- runtime: Volta `node@22.18.0`、`npm@9.9.3`

## 项目定位

DHB 前端公共工具库 monorepo，承载多项目复用的域名、mock、npm 校验、Taro 工具、Dify 等基础能力。它是共享库仓库，不是业务页面仓库。

## 技术栈/关键目录

- Lerna monorepo：`lerna.json`、`packages/`。
- 构建/监听：`npm run build`、`npm run watch`，实际执行 `lerna run build/watch`。
- 发布：`npm run lerna:version`、`npm run lerna:publish`。
- 关键包目录：
  - `packages/domain/`：前端域名/环境相关能力。
  - `packages/mock/`：mock 辅助能力。
  - `packages/npm_verify/`：npm/包校验能力。
  - `packages/shell_env/`：脚本环境变量能力。
  - `packages/taro-dev/`、`packages/taro-utils/`：Taro 开发工具。
  - `packages/dify/`：Dify 相关工具。

## 典型使用场景

- 修改多个前端项目共用的域名解析、环境切换或 mock 能力。
- 维护 Taro 项目的公共工具函数。
- 调整 npm 发布校验或脚本环境工具。
- 排查前端项目依赖 `@dhbfront-utils/*` 后出现的构建/运行差异。

## 与其他项目关系

- `dhb-manager`、`dhb-mobile-index`、`dhbfront-manager-mobile`、`dhbfront-cash-mini` 等项目都可能依赖这里的包。
- 改共享库时需要评估下游项目版本、发布标签和兼容性。

## 读取建议

- 先读 `config/projects/dhbfront-utils.json` 和本文件，确定是否真要改共享库而不是下游项目本地配置。
- 进入具体 `packages/<name>/` 后再读该包的 `package.json`、入口文件和构建脚本。
- 对共享库改动要优先考虑下游验证范围，避免只在一个业务项目里验证。

## 默认场景

- `single-repo-change` - 默认单仓修改场景

## 标签

- `dhb`
- `frontend`
- `shared-library`
