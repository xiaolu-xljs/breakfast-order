// pages/pay/pay.js
const api = require('../../utils/api.js');

Page({
  data: {
    orderNo: '',
    total: 0,
  },

  onLoad(options) {
    this.setData({ orderNo: options.orderNo, total: Number(options.total || 0) });
    this.doPay();
  },

  async doPay() {
    wx.showLoading({ title: '支付中...', mask: true });
    try {
      // 调用后端支付接口
      // mock 模式：后端直接标记 paid，返回 { mode: 'mock' }
      // 真支付模式：后端调微信统一下单，返回 wx.requestPayment 所需参数
      const res = await api.createPay({ orderNo: this.data.orderNo });
      const payload = res.data;

      if (payload.mode === 'mock') {
        // mock 模式：跳过真实支付，直接跳转
        setTimeout(() => {
          wx.hideLoading();
          wx.redirectTo({
            url: `/pages/order-status/order-status?orderNo=${this.data.orderNo}`,
          });
        }, 800);
        return;
      }

      // 真支付模式：调起微信支付
      wx.requestPayment({
        timeStamp: payload.payload.timeStamp,
        nonceStr: payload.payload.nonceStr,
        package: payload.payload.package,
        signType: payload.payload.signType,
        paySign: payload.payload.paySign,
        success: () => {
          wx.hideLoading();
          wx.redirectTo({
            url: `/pages/order-status/order-status?orderNo=${this.data.orderNo}`,
          });
        },
        fail: (err) => {
          wx.hideLoading();
          wx.showModal({
            title: '支付失败',
            content: err.errMsg || '请稍后重试',
            showCancel: false,
          });
        },
      });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '支付失败', icon: 'none' });
    }
  },
});