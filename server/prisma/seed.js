// 种子数据：初始化一些分类、商品、餐桌、管理员账号，方便联调
// 运行：npm run seed
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123',
  name: '店主',
};

async function main() {
  console.log('🌱 开始填充种子数据...\n');

  // 清空（仅在开发期）
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.admin.deleteMany();

  // 分类
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: '包子类', sortOrder: 1 },
    }),
    prisma.category.create({
      data: { name: '饮品类', sortOrder: 2 },
    }),
    prisma.category.create({
      data: { name: '主食类', sortOrder: 3 },
    }),
    prisma.category.create({
      data: { name: '小菜类', sortOrder: 4 },
    }),
  ]);
  console.log(`✅ 创建分类 ${categories.length} 个`);

  // 商品
  const [bao, yin, zhu, xiao] = categories;
  const products = await Promise.all([
    // 包子类
    prisma.product.create({
      data: { categoryId: bao.id, name: '鲜肉包', price: 2.5, sortOrder: 1 },
    }),
    prisma.product.create({
      data: { categoryId: bao.id, name: '菜包', price: 2.0, sortOrder: 2 },
    }),
    prisma.product.create({
      data: { categoryId: bao.id, name: '豆沙包', price: 2.5, sortOrder: 3 },
    }),
    prisma.product.create({
      data: { categoryId: bao.id, name: '小笼包(6个)', price: 8.0, sortOrder: 4 },
    }),
    // 饮品类
    prisma.product.create({
      data: { categoryId: yin.id, name: '豆浆', price: 3.0, sortOrder: 1 },
    }),
    prisma.product.create({
      data: { categoryId: yin.id, name: '豆腐脑', price: 5.0, sortOrder: 2 },
    }),
    prisma.product.create({
      data: { categoryId: yin.id, name: '小米粥', price: 4.0, sortOrder: 3 },
    }),
    prisma.product.create({
      data: { categoryId: yin.id, name: '牛奶', price: 5.0, sortOrder: 4 },
    }),
    // 主食类
    prisma.product.create({
      data: { categoryId: zhu.id, name: '鸡蛋灌饼', price: 6.0, sortOrder: 1 },
    }),
    prisma.product.create({
      data: { categoryId: zhu.id, name: '手抓饼', price: 5.0, sortOrder: 2 },
    }),
    prisma.product.create({
      data: { categoryId: zhu.id, name: '茶叶蛋', price: 2.0, sortOrder: 3 },
    }),
    // 小菜类
    prisma.product.create({
      data: { categoryId: xiao.id, name: '凉拌黄瓜', price: 4.0, sortOrder: 1 },
    }),
    prisma.product.create({
      data: { categoryId: xiao.id, name: '辣白菜', price: 3.0, sortOrder: 2 },
    }),
  ]);
  console.log(`✅ 创建商品 ${products.length} 个`);

  // 餐桌
  const tables = await Promise.all([
    prisma.table.create({ data: { tableNo: 'A01' } }),
    prisma.table.create({ data: { tableNo: 'A02' } }),
    prisma.table.create({ data: { tableNo: 'A03' } }),
    prisma.table.create({ data: { tableNo: 'B01' } }),
    prisma.table.create({ data: { tableNo: 'B02' } }),
  ]);
  console.log(`✅ 创建餐桌 ${tables.length} 张`);

  // 默认管理员账号
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
  const admin = await prisma.admin.create({
    data: {
      username: DEFAULT_ADMIN.username,
      passwordHash,
      name: DEFAULT_ADMIN.name,
    },
  });
  console.log(`✅ 创建管理员账号: ${admin.username} / ${DEFAULT_ADMIN.password}`);

  console.log('\n🎉 种子数据填充完成！');
  console.log('   现在可以启动服务：npm run dev');
  console.log(`   商家后台初始账号: ${DEFAULT_ADMIN.username} / ${DEFAULT_ADMIN.password}\n`);
}

main()
  .catch((e) => {
    console.error('❌ 种子失败：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });