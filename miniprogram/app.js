// app.js
App({
  globalData: {
    // 后端 API 地址
    // 开发期填本地 IP（注意不是 localhost，模拟器访问宿主机需要 IP）
    apiBase: 'http://localhost:3000/api',
    // 当前桌号
    tableId: null,
    tableNo: '',
    // 购物车：[{ productId, name, price, quantity, imageUrl }]
    cart: [],
  },

  onLaunch() {
    // 解析扫码进入的桌号（在页面 onLoad 里也会再读一次，更可靠）
  },

  // 添加商品到购物车
  addToCart(product, delta = 1) {
    const cart = this.globalData.cart;
    const exist = cart.find((it) => it.productId === product.id);
    if (exist) {
      exist.quantity += delta;
      if (exist.quantity <= 0) {
        const idx = cart.indexOf(exist);
        cart.splice(idx, 1);
      }
    } else if (delta > 0) {
      cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: delta,
      });
    }
    this.saveCart();
  },

  // 清空购物车
  clearCart() {
    this.globalData.cart = [];
    this.saveCart();
  },

  // 购物车小计
  cartTotal() {
    return this.globalData.cart.reduce((sum, it) => sum + it.price * it.quantity, 0);
  },

  // 购物车件数
  cartCount() {
    return this.globalData.cart.reduce((sum, it) => sum + it.quantity, 0);
  },

  // 持久化到本地（下次打开还在）
  saveCart() {
    try {
      wx.setStorageSync('cart', this.globalData.cart);
    } catch (e) {}
  },

  loadCart() {
    try {
      const cached = wx.getStorageSync('cart');
      if (Array.isArray(cached)) this.globalData.cart = cached;
    } catch (e) {}
  },
});