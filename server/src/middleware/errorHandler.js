// 统一错误处理中间件
const { ZodError } = require('zod');

function errorHandler(err, req, res, next) {
  // 参数校验错误
  if (err instanceof ZodError) {
    return res.status(400).json({
      code: 400,
      message: '参数校验失败',
      errors: err.issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Prisma 已知错误
  if (err.code === 'P2002') {
    const target = err.meta?.target || '字段';
    return res.status(409).json({ code: 409, message: `${target} 已存在` });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ code: 404, message: '记录不存在' });
  }

  // 自定义错误（带 statusCode）
  if (err.statusCode) {
    return res
      .status(err.statusCode)
      .json({ code: err.statusCode, message: err.message });
  }

  // 兜底
  console.error('[未捕获的错误]', err);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
}

module.exports = errorHandler;