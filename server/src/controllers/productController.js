// 商品控制器
const { z } = require('zod');
const prisma = require('../db');

// 输入校验
const createSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(1).max(50),
  price: z.number().nonnegative(),
  description: z.string().max(200).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  isAvailable: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

const updateSchema = createSchema.partial();

// 列表（支持 ?categoryId / ?onlyAvailable 过滤）
async function list(req, res, next) {
  try {
    const where = {};
    if (req.query.categoryId) where.categoryId = Number(req.query.categoryId);
    if (req.query.onlyAvailable === 'true') where.isAvailable = true;

    const products = await prisma.product.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        category: { select: { id: true, name: true } },
      },
    });
    // 把 Decimal 转成 number
    const data = products.map((p) => ({
      ...p,
      price: Number(p.price),
    }));
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// 详情
async function detail(req, res, next) {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    });
    if (!product) {
      return res.status(404).json({ code: 404, message: '商品不存在' });
    }
    res.json({
      data: { ...product, price: Number(product.price) },
    });
  } catch (err) {
    next(err);
  }
}

// 新建
async function create(req, res, next) {
  try {
    const body = createSchema.parse(req.body);

    // 校验分类存在
    const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
    if (!category) {
      return res.status(400).json({ code: 400, message: '分类不存在' });
    }

    const product = await prisma.product.create({ data: body });
    res.status(201).json({ data: { ...product, price: Number(product.price) } });
  } catch (err) {
    next(err);
  }
}

// 更新
async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const body = updateSchema.parse(req.body);

    if (body.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
      if (!category) {
        return res.status(400).json({ code: 400, message: '分类不存在' });
      }
    }

    const product = await prisma.product.update({ where: { id }, data: body });
    res.json({ data: { ...product, price: Number(product.price) } });
  } catch (err) {
    next(err);
  }
}

// 删除
async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    await prisma.product.delete({ where: { id } });
    res.json({ data: { id } });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, detail, create, update, remove };