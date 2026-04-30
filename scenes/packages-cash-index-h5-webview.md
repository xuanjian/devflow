# Scene: packages-cash-index-h5-webview

## 典型链路

`DHB_PACKAGES -> dhbfront-cash-mini -> dhb-mobile-index -> new_mobile_h5 -> iOS WebView`

## 适用场景

- 分包能力联调
- 商品域模块通过 `DHB_PACKAGES` 接入 `cash-mini` 再进入 H5 / 容器

## 主要仓库

- `DHB_PACKAGES`
- `dhbfront-cash-mini`
- `dhb-mobile-index`
- `new_mobile_h5`
- `DHB`
- `HXB`
- `BrandApp`

## 读取建议

- 优先加载分包、cash、index 三段上下文
- 如涉及小程序或原生容器，再进一步扩展
