---
alwaysApply: true
---
# dhbfront-cash-mini 开发规范

**技术栈**: Taro 3.6.32 + React 18 + TypeScript + Sass

## 组件开发规则

1. **跨平台支持**:
   - 所有组件必须同时支持 H5 和小程序平台
   - 使用 Taro 提供的跨平台 API，避免使用平台特定 API
   - 组件必须导出到 `src/index.ts` 中

2. **环境变量**:
   - 使用 `--env-prefix DHB_APP_` 前缀设置环境变量
   - 环境变量主要用于构建时配置，运行时环境由引用项目决定

3. **打包和发布**:
   - 开发模式: `npm run dev:h5` 或 `npm run dev:weapp`
   - 打包组件: `npm run pack:build`
   - 发布测试: `npm run publish:test`
   - 发布正式: `npm run publish:prod`

4. **输出目录**:
   - `dist/weapp` - 小程序组件
   - `dist/h5` - H5 组件

5. **配置文件**:
   - `config/dev.ts` - 开发环境配置
   - `config/prod.ts` - 生产环境配置
   - `config/index.ts` - 主配置文件

## 注意事项

- 修改组件后必须重新打包才能在其他项目中使用
- 发布前确保所有平台都能正常构建
- 使用 `patches/` 目录管理依赖补丁
- 组件必须经过充分测试后再发布
