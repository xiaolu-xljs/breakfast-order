// 订单控制器
const { z } = require('zod');
const prisma = require('../db');
const subscribeMessage = require('../services/subscribeMessage');

// 生成订单号：YYYYMMDDHHMMSS + 4位随机
function genOrderNo() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const ts =
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds());
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${ts}${rand}`;
}

// 订单项格式化（items 数组，每个控制器都用了同样的映射）
function formatItem(it) {
  return {
    productName: it.productName,
    price: it.price,
    quantity: it.quantity,
    subtotal: it.subtotal,
  };
}

// 输入校验
const createSchema = z.object({
  tableId: z.number().int().positive(),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, '至少要 1 个商品'),
  openid: z.string().optional().nullable(),
});

// 顾客端：创建订单
async function create(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
    const table = await prisma.table.findUnique({ where: { id: body.tableId } });
    if (!table || !table.isActive) {
      return res.status(400).json({ code: 400, message: '桌号无效' });
    }

    // 查询所有商品并计算价格
    const products = await prisma.product.findMany({
      where: {
        id: { in: body.items.map((i) => i.productId) },
        isAvailable: true,
      },
    });
    if (products.length !== body.items.length) {
      return res.status(400).json({ code: 400, message: '部分商品已下架' });
    }

    // 构造订单项（冗余商品名/单价）
    const productMap = new Map(products.map((p) => [p.id, p]));
    let total = 0;
    const itemsData = body.items.map((i) => {
      const p = productMap.get(i.productId);
      const subtotal = p.price * i.quantity;
      total += subtotal;
      return {
        productId: p.id,
        productName: p.name,
        price: p.price,
        quantity: i.quantity,
        subtotal,
      };
    });

    const orderNo = genOrderNo();
    const order = await prisma.order.create({
      data: {
        orderNo,
        tableId: table.id,
        totalAmount: total,
        // mock 模式下创建即视为已付（方便演示）；真支付模式下应为 'pending_payment'
        status: process.env.WECHAT_PAY_ENABLED === 'true' ? 'pending_payment' : 'paid',
        paidAt: process.env.WECHAT_PAY_ENABLED === 'true' ? null : new Date(),
        openid: body.openid || null,
        items: { create: itemsData },
      },
      include: { items: true, table: true },
    });

    res.status(201).json({
      data: {
        id: order.id,
        orderNo: order.orderNo,
        totalAmount: order.totalAmount,
        status: order.status,
        tableNo: order.table.tableNo,
        items: order.items.map((it) => ({ productId: it.productId, ...formatItem(it) })),
      },
    });
  } catch (err) {
    next(err);
  }
}

// 顾客端：查询订单（按 orderNo）
async function detailByOrderNo(req, res, next) {
  try {
    const { orderNo } = req.params;
    const order = await prisma.order.findUnique({
      where: { orderNo },
      include: { items: true, table: true },
    });
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }
    res.json({
      data: {
        id: order.id,
        orderNo: order.orderNo,
        totalAmount: order.totalAmount,
        status: order.status,
        tableNo: order.table.tableNo,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
        items: order.items.map(formatItem),
      },
    });
  } catch (err) {
    next(err);
  }
}

// 后台：订单列表（支持筛选）
async function adminList(req, res, next) {
  try {
    const { status, startDate, endDate, tableId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (tableId) where.tableId = Number(tableId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { id: 'desc' },
      include: {
        table: { select: { tableNo: true } },
        items: true,
      },
      take: 500, // 防止一次拉太多
    });

    res.json({
      data: orders.map((o) => ({
        id: o.id,
        orderNo: o.orderNo,
        tableNo: o.table.tableNo,
        totalAmount: o.totalAmount,
        status: o.status,
        createdAt: o.createdAt,
        paidAt: o.paidAt,
        items: o.items.map(formatItem),
      })),
    });
  } catch (err) {
    next(err);
  }
}

// 后台：订单详情
async function adminDetail(req, res, next) {
  try {
    const id = Number(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, table: true },
    });
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }
    res.json({
      data: {
        ...order,
        totalAmount: order.totalAmount,
        // items 已在 include 中，Decimal 已由中间件自动转换
      },
    });
  } catch (err) {
    next(err);
  }
}

// 后台：更新订单状态
const STATUS_NEXT = {
  pending_payment: ['paid', 'cancelled'],  // 支付成功后会先走到 paid
  paid: ['preparing', 'cancelled'],
  preparing: ['served', 'cancelled'],
  served: ['completed'],
  completed: [],
  cancelled: [],
};

const updateStatusSchema = z.object({
  status: z.enum(['pending_payment', 'paid', 'preparing', 'served', 'completed', 'cancelled']),
});

async function updateStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status } = updateStatusSchema.parse(req.body);
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ code: 404, message: '订单不存在' });
    }
    const allowed = STATUS_NEXT[order.status] || [];
    if (!allowed.includes(status)) {
      return res
        .status(409)
        .json({ code: 409, message: `订单当前状态 ${order.status} 不能切换为 ${status}` });
    }
    const updated = await prisma.order.update({
      where: { id },
      data: { status },
    });

    // 状态变更后推送订阅消息（mock 模式仅打日志）
    const full = await prisma.order.findUnique({
      where: { id },
      include: { items: true, table: true },
    });
    subscribeMessage.sendOrderUpdate(full).catch(() => {});

    res.json({ data: { id: updated.id, status: updated.status } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  detailByOrderNo,
  adminList,
  adminDetail,
  updateStatus,
  STATUS_NEXT,
};