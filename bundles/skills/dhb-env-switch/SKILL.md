---
name: dhb-env-switch
description: 切换 DHB 本地开发环境（测试/预发/线上）。触发词：切环境、切线上、切测试、切预发。
---

# DHB 环境切换（H5 核心链路）

## 作用范围
- dhb-mobile-index
- new_mobile_h5

## 环境对照
- 测试：envCode=test，域名 *.newdhb.com（http）
- 预发：envCode=demo，域名 y*.dhb168.com（https）
- 线上：envCode=online，域名 *.dhb168.com（https）

## 修改位置
1. `new_mobile_h5/local/domainConfig.js`
2. `new_mobile_h5/local/projectConfig.js`
3. `dhb-mobile-index/local/domainConfig.js`
4. `dhb-mobile-index/local/projectConfig.js`

说明：不再修改 `new_mobile_h5/js/common/dhb.js` 的 9009 本地 debug 覆盖逻辑。

## 执行要点
- 所有相关文件必须一致，否则会出现鉴权或接口不匹配
- 修改后需重启对应服务
