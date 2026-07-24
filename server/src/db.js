// Prisma 客户端单例
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Prisma Decimal → number 统一转换
// 避免每个控制器重复写 Number(price)、Number(totalAmount)
prisma.$use(async (params, next) => {
  const result = await next(params);
  return deepConvertDecimals(result);
});

function deepConvertDecimals(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  // duck-typing: Prisma Decimal 有 toNumber 方法
  if (typeof obj.toNumber === 'function') return Number(obj);
  if (Array.isArray(obj)) return obj.map(deepConvertDecimals);
  for (const key of Object.keys(obj)) {
    obj[key] = deepConvertDecimals(obj[key]);
  }
  return obj;
}

module.exports = prisma;