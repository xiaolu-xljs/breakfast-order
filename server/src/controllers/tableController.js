// 餐桌控制器
const { z } = require('zod');
const prisma = require('../db');

const createSchema = z.object({
  tableNo: z.string().min(1).max(20),
  isActive: z.boolean().optional().default(true),
});

const updateSchema = createSchema.partial();

// 列表
async function list(req, res, next) {
  try {
    const where = {};
    if (req.query.onlyActive === 'true') where.isActive = true;
    const tables = await prisma.table.findMany({
      where,
      orderBy: { tableNo: 'asc' },
    });
    res.json({ data: tables });
  } catch (err) {
    next(err);
  }
}

// 详情（按 id）
async function detail(req, res, next) {
  try {
    const id = Number(req.params.id);
    const table = await prisma.table.findUnique({ where: { id } });
    if (!table) {
      return res.status(404).json({ code: 404, message: '餐桌不存在' });
    }
    res.json({ data: table });
  } catch (err) {
    next(err);
  }
}

// 详情（按桌号 — 二维码扫描时用）
async function detailByTableNo(req, res, next) {
  try {
    const tableNo = req.params.tableNo;
    const table = await prisma.table.findUnique({ where: { tableNo } });
    if (!table) {
      return res.status(404).json({ code: 404, message: '餐桌不存在' });
    }
    res.json({ data: table });
  } catch (err) {
    next(err);
  }
}

// 新建
async function create(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
    const table = await prisma.table.create({ data: body });
    res.status(201).json({ data: table });
  } catch (err) {
    next(err);
  }
}

// 更新
async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const body = updateSchema.parse(req.body);
    const table = await prisma.table.update({ where: { id }, data: body });
    res.json({ data: table });
  } catch (err) {
    next(err);
  }
}

// 删除
async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    await prisma.table.delete({ where: { id } });
    res.json({ data: { id } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  detail,
  detailByTableNo,
  create,
  update,
  remove,
};