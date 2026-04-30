# 网络请求规范更新说明 (v2.1)

## 更新日期
2025-11-11

## 更新内容

### 1. 明确 dhb168-api 接口的必填方法 ✅

#### 原规范（错误）
```objc
// ❌ 错误：dhb168-api 不使用 interfaceName
- (NSString *)interfaceName {
    return @"/goods/list";
}
```

#### 新规范（正确）
```objc
// ✅ 正确：dhb168-api 使用 controller + action
- (NSString *)controller {
    return @"cart";  // 控制器名称
}

- (NSString *)action {
    return @"getCart";  // 方法名称
}

- (RequestMethod)method {
    return Post;  // 可选，默认 Post
}
```

### 2. 新增 co_unpack 元组使用方法 ✨

当需要返回多个值时，使用 `COTuple` 和 `co_unpack`。

#### Service 层返回元组

```objc
- (COPromise *)addSkusToCart:(NSArray *)skuArray {
    COPromise *promise = [COPromise promise];
    
    DHBAddCartRequest *request = [[DHBAddCartRequest alloc] init];
    request.skus = skuArray;
    
    [request requestSuccess:^(DHBBaseNetworkRequest *DAO, id res) {
        if ([res[@"code"] intValue] == 200) {
            NSDictionary *data = res[@"data"];
            BOOL canSynCart = NO;
            
            // 使用 co_tuple 返回多个值
            [promise fulfill:co_tuple(@(YES), data, @(canSynCart))];
        } else {
            [promise fulfill:co_tuple(@(NO), res, @(YES))];
        }
    } failure:^(DHBBaseNetworkRequest *DAO, NSError *error) {
        [promise reject:error];
    }];
    
    return promise;
}
```

#### Controller 层使用 co_unpack 解包

```objc
- (void)addToCart {
    __weak typeof(self) weakSelf = self;
    co_launch(^{
        __strong typeof(weakSelf) strongSelf = weakSelf;
        
        @try {
            // await 获取 Promise 结果
            COTuple *result = await([strongSelf.service addSkusToCart:strongSelf.skuArray]);
            
            // 使用 co_unpack 解包多个返回值
            NSNumber *success = @(NO);
            NSDictionary *data = nil;
            NSNumber *canSynCart = @(NO);
            co_unpack(&success, &data, &canSynCart) = result;
            
            // 使用解包后的值
            dispatch_async(dispatch_get_main_queue(), ^{
                if ([success boolValue]) {
                    [SVProgressHUD showSuccessWithStatus:@"添加成功"];
                    strongSelf.cartData = data;
                } else if ([canSynCart boolValue]) {
                    [strongSelf syncCart];
                }
            });
        } @catch(NSError *error) {
            dispatch_async(dispatch_get_main_queue(), ^{
                [SVProgressHUD showErrorWithStatus:error.localizedDescription];
            });
        }
    });
}
```

## 更新的规则文件

### 1. 012-networking.mdc
**更新内容**：
- ✅ 修正 dhb168-api 接口的必填方法（controller + action）
- ✅ 新增 co_unpack 元组使用章节
- ✅ 新增 Service 层返回元组示例
- ✅ 新增 Controller 层解包元组示例
- ✅ 新增实际应用示例（参考 DHBCartManager）
- ✅ 新增 co_tuple 和 co_unpack 详细说明

### 2. 010-page-creation.mdc
**更新内容**：
- ✅ 修正标准 API 接口示例（使用 controller + action）
- ✅ 明确两种接口的必填方法区别
- ✅ 更新完整示例流程

## 接口类型对比

### dhb168-api 标准接口

| 方法 | 必填 | 说明 |
|------|------|------|
| controller | ✅ 是 | 控制器名称（如 "cart"） |
| action | ✅ 是 | 方法名称（如 "getCart"） |
| method | ⚠️ 可选 | 请求方法（默认 Post） |
| value | ⚠️ 可选 | 请求参数 |

**示例**：
```objc
@implementation DHBGetCartRequest
- (NSString *)controller { return @"cart"; }
- (NSString *)action { return @"getCart"; }
@end
```

### Node 层微服务接口

| 方法 | 必填 | 说明 |
|------|------|------|
| interfaceName | ✅ 是 | 接口路径（如 "/StockGoods/list"） |
| value | ✅ 是 | 请求参数 |
| method | ✅ 是 | 请求方法（Get/Post/Put/Delete） |

**示例**：
```objc
@implementation DHBSStockGoodsDetailRequest
- (NSString *)interfaceName { return @"/StockGoods/goodsDetailArr"; }
- (id)value { return @{@"goods_ids": self.goods_ids}; }
- (RequestMethod)method { return Post; }
@end
```

## co_unpack 使用场景

### 场景 1: 返回成功状态 + 数据

```objc
// Service 返回
[promise fulfill:co_tuple(@(YES), responseData)];

// Controller 使用
NSNumber *success = @(NO);
NSDictionary *data = nil;
co_unpack(&success, &data) = await([self.service fetchData]);
```

### 场景 2: 返回成功状态 + 数据 + 额外标志

```objc
// Service 返回
[promise fulfill:co_tuple(@(YES), responseData, @(needSync))];

// Controller 使用
NSNumber *success = @(NO);
NSDictionary *data = nil;
NSNumber *needSync = @(NO);
co_unpack(&success, &data, &needSync) = await([self.service addCart]);
```

### 场景 3: 返回多个业务状态

```objc
// Service 返回
[promise fulfill:co_tuple(@(YES), data, errorArray, @(canRetry))];

// Controller 使用
NSNumber *success = @(NO);
NSDictionary *data = nil;
NSArray *errors = nil;
NSNumber *canRetry = @(NO);
co_unpack(&success, &data, &errors, &canRetry) = await([self.service submit]);

if ([success boolValue]) {
    // 成功处理
} else if (errors.count > 0) {
    // 错误处理
    if ([canRetry boolValue]) {
        // 可以重试
    }
}
```

## co_unpack 注意事项

### ✅ 正确用法

```objc
// 1. 声明变量
NSNumber *success = @(NO);
NSDictionary *data = nil;

// 2. 解包（使用指针 &）
co_unpack(&success, &data) = tuple;

// 3. 使用值
if ([success boolValue]) {
    NSLog(@"%@", data);
}
```

### ❌ 错误用法

```objc
// ❌ 错误1: 不使用指针
NSNumber *success;
NSDictionary *data;
co_unpack(success, data) = tuple;  // 错误：必须使用 &

// ❌ 错误2: 顺序不对应
co_tuple(@(YES), data, @(NO))
co_unpack(&data, &success, &flag) = tuple;  // 错误：顺序必须一致

// ❌ 错误3: 数量不匹配
co_tuple(@(YES), data)
co_unpack(&success, &data, &flag) = tuple;  // 错误：数量必须匹配
```

## 实际应用参考

### DHBCartManager.m 示例

```objc
// 添加商品到购物车
- (void)addSkus:(NSArray *)skuArray complete:(void(^)(COTuple *resp))complete {
    [self.service add:skuArray InCartAdd:NO Complete:^(COTuple *resp) {
        // 解包元组
        NSNumber *success = @(NO);
        NSDictionary *data = nil;
        NSNumber *canSynCart = @(NO);
        co_unpack(&success, &data, &canSynCart) = resp;
        
        if ([success boolValue] && data) {
            // 成功：更新 token 和购物车数据
            self.csrf_token = data[@"csrf_token"];
            self.csrf_version = data[@"csrf_version"];
            self.errors = data[@"errors"];
            [self setTotals:data];
            
            if (complete) complete(co_tuple(success, data));
        } else {
            // 失败：是否需要同步购物车
            if ([canSynCart boolValue]) {
                [self downloadCart:nil];
            }
            if (complete) complete(co_tuple(success, data));
        }
    }];
}
```

## 优势总结

### co_unpack 的优势

1. **类型安全**：编译时检查类型
2. **代码清晰**：明确返回多个值
3. **避免字典**：不需要使用字典的 key-value 方式
4. **性能更好**：比字典访问更快
5. **便于维护**：返回值变更时编译器会提示

### 对比字典方式

```objc
// ❌ 旧方式：使用字典
NSDictionary *result = await([self.service addCart]);
BOOL success = [result[@"success"] boolValue];
NSDictionary *data = result[@"data"];
BOOL needSync = [result[@"needSync"] boolValue];
// 缺点：容易拼错 key，无编译检查

// ✅ 新方式：使用元组
NSNumber *success = @(NO);
NSDictionary *data = nil;
NSNumber *needSync = @(NO);
co_unpack(&success, &data, &needSync) = await([self.service addCart]);
// 优点：类型安全，编译检查，性能更好
```

## 迁移建议

### 1. 新代码
- 所有新的 Request 类按新规范编写
- 使用 co_unpack 处理多返回值场景

### 2. 旧代码
- 不强制修改，逐步迁移
- 优先迁移高频使用的接口
- 购物车、订单等核心模块优先

### 3. 团队协作
- 新成员学习新规范
- Code Review 时检查是否符合规范
- 分享最佳实践案例

## 常见问题

### Q1: 什么时候使用 controller + action？
**A**: 调用 `dhb168-api` (https://api.dhb168.com) 标准接口时使用。

### Q2: 什么时候使用 interfaceName？
**A**: 调用 Node 层微服务接口（bff-order、dhbsrv-print、bff-warehouse 等）时使用。

### Q3: 什么时候使用 co_unpack？
**A**: 当需要返回多个值时（如成功状态 + 数据 + 额外标志）使用元组更清晰。

### Q4: co_unpack 最多支持几个值？
**A**: 理论上无限制，但建议不超过 4-5 个值，否则考虑封装成对象。

### Q5: co_unpack 的性能如何？
**A**: 比字典方式性能更好，无 key 查找开销，编译器优化更好。

## 参考文档

- 规则文件：`.cursor/rules/012-networking.mdc`
- 页面创建规范：`.cursor/rules/010-page-creation.mdc`
- 实际案例：`DHB/订货端/Cart/DHBCartManager.m`
- DHBBaseNetworkRequest：`DHB/公共/Common/NetWorking/DHBBaseNetworkRequest.h`

---

**更新完成日期**: 2025-11-11  
**版本**: v2.1  
**状态**: ✅ 已完成  
**主要改进**: 明确接口类型区别 + co_unpack 元组使用

