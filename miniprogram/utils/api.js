// utils/api.js — 后端 API 封装
const app = getApp();

function request(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.apiBase + url,
      method,
      data,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(res.data || { message: '请求失败' });
        }
      },
      fail: (err) => reject({ message: err.errMsg || '网络错误' }),
    });
  });
}

module.exports = {
  // 菜单
  getMenu: () => request('/categories?onlyActive=true'),
  getProducts: (categoryId) =>
    request('/products?onlyAvailable=true' + (categoryId ? '&categoryId=' + categoryId : '')),
  // 餐桌
  getTableByNo: (tableNo) => request('/tables/by-no/' + encodeURIComponent(tableNo)),
  // 订单
  createOrder: (data) => request('/orders', 'POST', data),
  getOrderByNo: (orderNo) => request('/orders/by-no/' + orderNo),
  // 支付
  createPay: (data) => request('/pay', 'POST', data),
};