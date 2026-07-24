// pages/menu/menu.js
const api = require('../../utils/api.js');
const format = require('../../utils/format.js');
const app = getApp();

Page({
  data: {
    categories: [],
    products: [],
    activeCategoryId: null,
    tableNo: '',
    cartCount: 0,
    cartTotal: 0,
    showCart: false,
  },

  onLoad(options) {
    // 解析扫码传入的桌号
    const tableNo = options.table || '';
    if (!tableNo) {
      wx.showModal({
        title: '提示',
        content: '未识别到桌号，请联系服务员',
        showCancel: false,
      });
      return;
    }
    this.setData({ tableNo });
    app.globalData.tableNo = tableNo;
    app.loadCart();

    this.fetchTableId(tableNo).then(() => this.loadMenu());
  },

  onShow() {
    this.refreshCart();
  },

  async fetchTableId(tableNo) {
    try {
      const res = await api.getTableByNo(tableNo);
      app.globalData.tableId = res.data.id;
    } catch (err) {
      wx.showToast({ title: err.message || '桌号无效', icon: 'none' });
    }
  },

  async loadMenu() {
    try {
      const cats = await api.getMenu();
      const active = cats.data[0]?.id || null;
      const prods = active ? await api.getProducts(active) : { data: [] };
      this.setData({
        categories: cats.data,
        products: prods.data,
        activeCategoryId: active,
      });
    } catch (err) {
      wx.showToast({ title: err.message || '加载菜单失败', icon: 'none' });
    }
  },

  async onCategoryTap(e) {
    const id = e.currentTarget.dataset.id;
    if (id === this.data.activeCategoryId) return;
    this.setData({ activeCategoryId: id });
    try {
      const res = await api.getProducts(id);
      this.setData({ products: res.data });
    } catch (err) {
      wx.showToast({ title: err.message, icon: 'none' });
    }
  },

  onAdd(e) {
    const product = e.currentTarget.dataset.product;
    app.addToCart(product, 1);
    this.refreshCart();
  },

  onMinus(e) {
    const product = e.currentTarget.dataset.product;
    app.addToCart(product, -1);
    this.refreshCart();
  },

  refreshCart() {
    this.setData({
      cartCount: app.cartCount(),
      cartTotal: app.cartTotal(),
    });
  },

  openCart() {
    this.setData({ showCart: true });
  },

  closeCart() {
    this.setData({ showCart: false });
  },

  onCartItemChange(e) {
    const { productId, delta } = e.currentTarget.dataset;
    const item = app.globalData.cart.find((it) => it.productId === productId);
    if (item) {
      app.addToCart(item, delta);
      this.refreshCart();
      // 如果购物车清空了，关闭弹层
      if (app.globalData.cart.length === 0) this.setData({ showCart: false });
    }
  },

  goConfirm() {
    if (app.globalData.cart.length === 0) return;
    wx.navigateTo({ url: '/pages/order-confirm/order-confirm' });
  },
});