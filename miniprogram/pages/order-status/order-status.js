// pages/order-status/order-status.js
const api = require('../../utils/api.js');
const format = require('../../utils/format.js');

Page({
  data: {
    order: null,
    statusText: '',
    stepIndex: 0,
    polling: false,
  },

  _timer: null,

  onLoad(options) {
    this.orderNo = options.orderNo;
    this.fetch();
    this.startPolling();
  },

  onUnload() {
    this.stopPolling();
  },

  onPullDownRefresh() {
    this.fetch().then(() => wx.stopPullDownRefresh());
  },

  async fetch() {
    try {
      const res = await api.getOrderByNo(this.orderNo);
      const status = res.data.status;
      const stepIndex = format.ORDER_STATUS_INDEX.indexOf(status);
      this.setData({
        order: res.data,
        statusText: format.ORDER_STATUS_TEXT[status] || status,
        stepIndex: stepIndex < 0 ? 0 : stepIndex,
      });
      // 已完成或取消则停止轮询
      if (['completed', 'cancelled'].includes(status)) {
        this.stopPolling();
      }
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' });
    }
  },

  startPolling() {
    this.setData({ polling: true });
    this._timer = setInterval(() => this.fetch(), 5000);
  },

  stopPolling() {
    this.setData({ polling: false });
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  callWaiter() {
    wx.showModal({
      title: '已通知服务员',
      content: '服务员将尽快到您桌前',
      showCancel: false,
    });
  },

  reorder() {
    wx.reLaunch({ url: '/pages/menu/menu?table=' + this.data.order.tableNo });
  },
});