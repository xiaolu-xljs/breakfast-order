// 分类控制器
const { z } = require('zod');
const prisma = require('../db');

// 输入校验
const createSchema = z.object({
  name: z.string().min(1).max(20),
  sortOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

const updateSchema = createSchema.partial();

// 列表（支持 ?onlyActive=true 给顾客端用）
async function list(req, res, next) {
  try {
    const onlyActive = req.query.onlyActive === 'true';
    const where = onlyActive ? { isActive: true } : undefined;
    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: {
        _count: { select: { products: true } },
      },
    });
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
}

// 详情（含该分类下的商品）
async function detail(req, res, next) {
  try {
    const id = Number(req.params.id);
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        },
      },
    });
    if (!category) {
      return res.status(404).json({ code: 404, message: '分类不存在' });
    }
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
}

// 新建
async function create(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
    const category = await prisma.category.create({ data: body });
    res.status(201).json({ data: category });
  } catch (err) {
    next(err);
  }
}

// 更新
async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const body = updateSchema.parse(req.body);
    const category = await prisma.category.update({
      where: { id },
      data: body,
    });
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
}

// 删除（如果分类下还有商品，禁止删除）
async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return res.status(409).json({
        code: 409,
        message: `该分类下还有 ${productCount} 个商品，请先移除`,
      });
    }
    await prisma.category.delete({ where: { id } });
    res.json({ data: { id } });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, detail, create, update, remove };