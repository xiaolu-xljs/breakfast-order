// 统计控制器
const prisma = require('../db');

// 当天 0 点
function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// 商家后台首页：今日概览
async function overview(req, res, next) {
  try {
    const todayStart = startOfDay();
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 3600 * 1000);

    const [
      todayOrderCount,
      pendingCount,
      preparingCount,
      todayPaidAgg,
      productCount,
      tableCount,
      hotProducts,
      todayOrders,
    ] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: todayStart, lt: tomorrowStart } },
      }),
      prisma.order.count({ where: { status: 'paid' } }),
      prisma.order.count({ where: { status: 'preparing' } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: todayStart, lt: tomorrowStart } },
        _sum: { totalAmount: true },
      }),
      prisma.product.count({ where: { isAvailable: true } }),
      prisma.table.count({ where: { isActive: true } }),
      // 热销（按 OrderItem.sum 聚合最近 30 天）
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
        where: {
          order: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 3600 * 1000),
            },
          },
        },
      }),
      // 今日待处理订单列表
      prisma.order.findMany({
        where: {
          status: { in: ['paid', 'preparing'] },
        },
        orderBy: { id: 'desc' },
        take: 10,
        include: { table: true, items: true },
      }),
    ]);

    // 查商品名称
    const productIds = hotProducts.map((h) => h.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const todayRevenue = Number(todayPaidAgg._sum.totalAmount || 0);
    const avgOrder = todayOrderCount > 0 ? todayRevenue / todayOrderCount : 0;

    res.json({
      data: {
        today: {
          orderCount: todayOrderCount,
          revenue: todayRevenue,
          avgOrder: Number(avgOrder.toFixed(2)),
        },
        pendingCount,
        preparingCount,
        productCount,
        tableCount,
        hotProducts: hotProducts.map((h) => ({
          productId: h.productId,
          name: productMap.get(h.productId)?.name || `商品#${h.productId}`,
          quantity: h._sum.quantity,
        })),
        pendingOrders: todayOrders.map((o) => ({
          id: o.id,
          orderNo: o.orderNo,
          tableNo: o.table.tableNo,
          totalAmount: Number(o.totalAmount),
          status: o.status,
          createdAt: o.createdAt,
          itemNames: o.items.map((it) => `${it.productName}×${it.quantity}`),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { overview, range };

/**
 * 时间范围统计
 * GET /api/admin/stats/range?start=YYYY-MM-DD&end=YYYY-MM-DD&granularity=day|hour
 */
async function range(req, res, next) {
  try {
    const start = req.query.start ? new Date(req.query.start) : new Date(Date.now() - 6 * 24 * 3600 * 1000);
    const end = req.query.end ? new Date(req.query.end + 'T23:59:59.999Z') : new Date();
    const granularity = req.query.granularity || 'day';

    // 确保 start 是当天 0 点
    const startDay = new Date(start);
    startDay.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDay, lte: end } },
      select: { totalAmount: true, createdAt: true, status: true, items: true },
    });

    // 按时间分桶
    const buckets = new Map();
    function bucketKey(d) {
      const pad = (n) => String(n).padStart(2, '0');
      if (granularity === 'hour') {
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:00`;
      }
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    for (const o of orders) {
      if (o.status === 'cancelled') continue; // 取消的不计入营收
      const key = bucketKey(new Date(o.createdAt));
      if (!buckets.has(key)) buckets.set(key, { date: key, orderCount: 0, revenue: 0 });
      const b = buckets.get(key);
      b.orderCount += 1;
      b.revenue += Number(o.totalAmount);
    }

    // 补齐空白日期
    const result = [];
    const cur = new Date(startDay);
    while (cur <= end) {
      const key = bucketKey(cur);
      result.push(buckets.get(key) || { date: key, orderCount: 0, revenue: 0 });
      cur.setDate(cur.getDate() + (granularity === 'hour' ? 0 : 1));
      if (granularity === 'hour') cur.setHours(cur.getHours() + 1);
    }

    // 商品销量 TOP
    const itemAgg = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, subtotal: true },
      where: {
        order: {
          createdAt: { gte: startDay, lte: end },
          status: { not: 'cancelled' },
        },
      },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 20,
    });
    const productIds = itemAgg.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    const hotProducts = itemAgg.map((i) => ({
      productId: i.productId,
      name: productMap.get(i.productId)?.name || `商品#${i.productId}`,
      quantity: i._sum.quantity,
      revenue: Number(i._sum.subtotal || 0),
    }));

    res.json({
      data: {
        range: { start: startDay, end },
        granularity,
        series: result,
        hotProducts,
        totals: {
          orderCount: result.reduce((s, r) => s + r.orderCount, 0),
          revenue: result.reduce((s, r) => s + r.revenue, 0),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}