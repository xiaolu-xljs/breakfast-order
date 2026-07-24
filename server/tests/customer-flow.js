// 模拟小程序顾客端完整流程的脚本
// 用法：node tests/customer-flow.js
// 要求：后端已启动（http://localhost:3000）

const BASE = 'http://localhost:3000/api';

function money(n) { return Number(n || 0).toFixed(2); }

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || '请求失败');
  }
  return data;
}

function log(label, value) {
  console.log(`  ${label.padEnd(20)} ${value}`);
}

async function run() {
  console.log('\n========== 顾客端流程模拟 ==========\n');

  // 1. 选桌
  const tables = await api('GET', '/tables?onlyActive=true');
  const table = tables.data[0];
  console.log(`[1] 顾客坐下，扫桌上二维码`);
  log('桌号:', table.tableNo);
  log('桌 ID:', table.id);

  // 2. 解析桌号 → 桌 ID（小程序进入时调用）
  const t = await api('GET', '/tables/by-no/' + encodeURIComponent(table.tableNo));
  const tableId = t.data.id;
  console.log(`\n[2] 小程序解析桌号`);
  log('拿到 tableId:', tableId);

  // 3. 加载菜单（顾客进入落地页）
  const cats = await api('GET', '/categories?onlyActive=true');
  console.log(`\n[3] 进入菜单页，加载分类`);
  cats.data.forEach(c => log(c.name, `商品 ${c._count?.products || 0} 个`));

  // 4. 选择第一个分类，加载商品
  const cat = cats.data[0];
  const prods = await api('GET', '/products?onlyAvailable=true&categoryId=' + cat.id);
  console.log(`\n[4] 进入「${cat.name}」，看到 ${prods.data.length} 个商品`);
  prods.data.slice(0, 3).forEach(p => log(p.name, `¥${money(p.price)}`));

  // 5. 加入购物车：2 个第一个商品 + 1 个第二个
  const cart = [
    { productId: prods.data[0].id, name: prods.data[0].name, price: prods.data[0].price, quantity: 2 },
    { productId: prods.data[1].id, name: prods.data[1].name, price: prods.data[1].price, quantity: 1 },
  ];
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  console.log(`\n[5] 加入购物车`);
  cart.forEach(i => log(`${i.name} × ${i.quantity}`, `¥${money(i.price * i.quantity)}`));
  log('合计:', `¥${money(total)}`);

  // 6. 提交订单
  const order = await api('POST', '/orders', {
    tableId,
    items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
  });
  console.log(`\n[6] 提交订单成功！`);
  log('订单号:', order.data.orderNo);
  log('金额:', `¥${money(order.data.totalAmount)}`);
  log('桌号:', order.data.tableNo);

  // 7. 轮询订单状态（模拟订单状态页）
  console.log(`\n[7] 进入订单状态页，开始轮询…`);
  for (let i = 0; i < 3; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const cur = await api('GET', '/orders/by-no/' + order.data.orderNo);
    console.log(`     ${new Date().toLocaleTimeString()}  →  状态：${cur.data.status}`);
  }

  // 8. 模拟商家后台切状态
  console.log(`\n[8] 模拟商家后台操作订单状态`);
  const tokenRes = await api('POST', '/auth/login', { username: 'admin', password: 'admin123' });
  const token = tokenRes.data.token;
  const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };

  for (const next of ['preparing', 'served']) {
    await fetch(BASE + '/orders/' + order.data.id + '/status', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: next }),
    });
    await new Promise((r) => setTimeout(r, 800));
    const cur = await api('GET', '/orders/by-no/' + order.data.orderNo);
    console.log(`     商家切到「${next}」 → 顾客端看到：${cur.data.status}`);
  }

  console.log('\n========== 流程完成 ==========\n');
}

run().catch((err) => {
  console.error('❌ 测试失败：', err.message);
  process.exit(1);
});