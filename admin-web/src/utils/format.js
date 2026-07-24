// 公共格式化函数
export function formatMoney(n) {
  if (n == null) return '0.00';
  return Number(n).toFixed(2);
}

export function formatDateTime(s) {
  if (!s) return '';
  const d = new Date(s);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatTime(s) {
  if (!s) return '';
  const d = new Date(s);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const ORDER_STATUS = {
  paid: { label: '待处理', type: 'warning' },
  preparing: { label: '制作中', type: 'primary' },
  served: { label: '已出餐', type: 'success' },
  completed: { label: '已完成', type: 'info' },
  cancelled: { label: '已取消', type: 'danger' },
};

export const STATUS_NEXT = {
  paid: { value: 'preparing', label: '开始制作' },
  preparing: { value: 'served', label: '已出餐' },
  served: { value: 'completed', label: '已完成' },
};