// utils/format.js
function formatMoney(n) {
  return Number(n || 0).toFixed(2);
}

const ORDER_STATUS_TEXT = {
  paid: '待商家处理',
  preparing: '制作中',
  served: '已出餐，请到取餐',
  completed: '已完成',
  cancelled: '已取消',
};

const ORDER_STATUS_INDEX = ['paid', 'preparing', 'served', 'completed'];

module.exports = { formatMoney, ORDER_STATUS_TEXT, ORDER_STATUS_INDEX };