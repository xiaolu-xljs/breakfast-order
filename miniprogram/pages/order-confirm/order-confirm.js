// pages/order-confirm/order-confirm.js
const api = require('../../utils/api.js');
const app = getApp();

Page({
  data: {
    tableNo: '',
    items: [],
    total: 0,
    submitting: false,
  },

  onLoad() {
    this.setData({
      tableNo: app.globalData.tableNo,
      items: app.globalData.cart,
      total: app.cartTotal(),
    });
  },

  async onSubmit() {
    if (this.data.submitting) return;
    if (!this.data.items.length) {
      wx.showToast({ title: '购物车为空', icon: 'none' });
      return;
    }
    if (!app.globalData.tableId) {
      wx.showToast({ title: '桌号无效', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    try {
      const payload = {
        tableId: app.globalData.tableId,
        items: this.data.items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
        })),
      };
      const res = await api.createOrder(payload);
      app.clearCart();
      // 跳到支付页（阶段 5 接真微信支付；目前先 mock，直接跳订单状态）
      wx.redirectTo({
        url: `/pages/pay/pay?orderNo=${res.data.orderNo}&total=${res.data.totalAmount}`,
      });
    } catch (err) {
      wx.showToast({ title: err.message || '下单失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});