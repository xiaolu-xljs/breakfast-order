# 顾客端 — 微信小程序

微信小程序（原生开发），顾客扫码 → 菜单 → 购物车 → 下单 → 订单状态。

## 在微信开发者工具中打开

1. 下载并安装微信开发者工具：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. 打开微信开发者工具 → 选择「导入项目」
3. 项目目录选择 `breakfast-order/miniprogram`
4. AppID 选择「测试号」（无 AppID 时也行，先体验用）
5. 项目名称随便填

## 配置 API 地址

打开 `app.js`，修改 `globalData.apiBase`：

```js
apiBase: 'http://192.168.x.x:3000/api',  // 改成你电脑的局域网 IP
```

> 注意：小程序里不能用 `localhost`，必须用 IP。微信开发者工具可以关闭「不校验合法域名」临时使用 HTTP。

## 体验流程

1. 工具栏点击「编译」会打开模拟器
2. 在模拟器里，地址栏加上参数模拟扫码：`pages/menu/menu?table=A01`
3. 操作：浏览菜单 → 加入购物车 → 结算 → 提交 → 看订单状态
4. 后台窗口登录 http://localhost:5173，可以看到新订单

## 调试模式

微信开发者工具 → 详情 → 本地设置 → 勾选「不校验合法域名...」，这样可以访问本地 HTTP。

## 后续阶段

- 阶段 5：在 `pay.js` 里调用 `wx.requestPayment` 接真实微信支付
- 阶段 6：上线后用 `wxacode.getUnlimited` 生成餐桌二维码
- 阶段 7：在状态变更时通过订阅消息推送给顾客