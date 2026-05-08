# dhb-manager

## 基本信息

- repoKey: `dhb-manager`
- path: `/Users/xj/Documents/frontend/dhb-manager`
- technologyFamilyId: `frontend`
- technologyFamilyName: `前端`
- repoType: `web-app`
- package: `react_project`
- runtime: Volta `node@12.20.0`、`npm@6.14.11`

## 项目定位

DHB 管理端 PC React 项目，承载后台管理、商品、订单、客户、配置、打印和 AI 组件等 PC 管理工作台能力。

这个仓库属于老 Webpack + React 技术栈，业务面宽，很多问题需要结合 BFF 接口、PC 交互和历史公共组件一起看。

## 技术栈/关键目录

- React + DVA + Ant Design + Webpack，构建脚本在 `webpack.*.js`。
- 启动/构建：`npm run start`、`npm run dev`、`npm run build`、`npm run dll`。
- 源码入口：`src/index.js`、`src/app.js`、`src/router/`。
- 业务目录：`src/model/`、`src/services/`、`src/components/`、`src/config/`、`src/utils/`。
- 打印相关：`src/CustomPrint/`。
- 本地环境配置：`local/`。
- 本地包依赖：`DHBStatement/` 通过 `package.json` 本地路径引入。

## 典型使用场景

- 管理端 PC 页面开发、表单/表格/弹窗/打印功能调整。
- PC 管理端和 BFF 接口联调，尤其是商品、订单、客户、报表等后台业务。
- 排查 Webpack 老项目构建、DLL、私有包或本地配置问题。
- 对比移动管理端功能口径时，作为 PC 端参考实现。

## 与其他项目关系

- BFF 侧常联动 `bff-goods`、`bff-order`、`bff-user`、`bff-warehouse`。
- 移动管理端能力可能与 `dhbfront-manager-mobile` 共享业务口径，但 UI 和技术栈不同。
- 公共工具来自 `dhbfront-utils`，部分 AI 图片能力来自 `@dhb-components/image-ai`。

## 读取建议

- 先读 `config/projects/dhb-manager.json` 和本文件确认仓库边界。
- 改页面时按路由定位 `src/router/`、`src/model/`、`src/services/` 和具体页面组件。
- 遇到接口字段口径，不要只看前端展示；同步查对应 BFF 或 PC 历史服务调用。

## 默认场景

- `single-repo-change` - 默认单仓修改场景

## 标签

- `dhb`
- `frontend`
- `manager`
