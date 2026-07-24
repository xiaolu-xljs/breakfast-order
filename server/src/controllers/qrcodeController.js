// 二维码控制器（Vercel 兼容版）
// 不在本地写文件（Vercel Serverless 无持久磁盘），直接返回 base64 数据
const QRCode = require('qrcode');
const prisma = require('../db');

/**
 * 构造二维码内容
 * - 优先用小程序 scheme（上线后用）
 * - 没有配置就用预览 URL（本地/测试）
 */
function buildQrContent(tableNo) {
  if (process.env.MINI_PROGRAM_SCHEME) {
    return `${process.env.MINI_PROGRAM_SCHEME}&path=${encodeURIComponent(process.env.MINI_PROGRAM_PATH || 'pages/menu/menu')}?table=${encodeURIComponent(tableNo)}`;
  }
  // 预览模式：以当前域名作为 base
  const base = process.env.PREVIEW_BASE_URL || `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}`;
  return `${base}/?table=${encodeURIComponent(tableNo)}`;
}

/**
 * 生成某张桌的二维码（直接返回 base64 PNG 数据，不写磁盘）
 * GET /api/admin/tables/:id/qrcode
 */
async function generate(req, res, next) {
  try {
    const id = Number(req.params.id);
    const table = await prisma.table.findUnique({ where: { id } });
    if (!table) return res.status(404).json({ code: 404, message: '餐桌不存在' });

    const content = buildQrContent(table.tableNo);

    // 生成 base64 PNG（不写磁盘）
    const dataUrl = await QRCode.toDataURL(content, {
      type: 'image/png',
      width: 400,
      margin: 2,
      color: { dark: '#000', light: '#fff' },
    });

    res.json({
      data: {
        tableId: table.id,
        tableNo: table.tableNo,
        // 二维码图片直接以 base64 data URL 返回
        qrcode: dataUrl,
        // 二维码内容（贴桌用）
        content,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 批量生成所有餐桌的二维码
 * GET /api/admin/tables/qrcode/batch
 */
async function batchGenerate(req, res, next) {
  try {
    const tables = await prisma.table.findMany({ where: { isActive: true }, orderBy: { tableNo: 'asc' } });
    const results = await Promise.all(
      tables.map(async (table) => {
        const content = buildQrContent(table.tableNo);
        const dataUrl = await QRCode.toDataURL(content, {
          type: 'image/png',
          width: 400,
          margin: 2,
          color: { dark: '#000', light: '#fff' },
        });
        return {
          tableId: table.id,
          tableNo: table.tableNo,
          qrcode: dataUrl,
          content,
        };
      })
    );
    res.json({ data: results });
  } catch (err) {
    next(err);
  }
}

module.exports = { generate, batchGenerate, buildQrContent };
