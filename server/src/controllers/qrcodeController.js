// 二维码控制器
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const prisma = require('../db');

const QR_DIR = path.join(__dirname, '../../public/qrcodes');
if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true });

/**
 * 构造二维码内容
 * - 优先用小程序 scheme（上线后用）
 * - 没有配置就用预览 URL（本地/测试）
 *
 * 配置项（在 .env）：
 *   MINI_PROGRAM_PATH = pages/menu/menu    小程序落地页路径
 *   MINI_PROGRAM_SCHEME = weixin://dl/business/?appid=xxx  完整 scheme（可选）
 *   PREVIEW_BASE_URL = http://localhost:3000/preview        预览地址（开发期）
 */
function buildQrContent(tableNo) {
  if (process.env.MINI_PROGRAM_SCHEME) {
    // 真小程序 scheme（需要先调用 wxacode.getUnlimited 拿到真实链接）
    return `${process.env.MINI_PROGRAM_SCHEME}&path=${encodeURIComponent(process.env.MINI_PROGRAM_PATH || 'pages/menu/menu')}?table=${encodeURIComponent(tableNo)}`;
  }
  // 预览模式
  const base = process.env.PREVIEW_BASE_URL || 'http://localhost:3000/preview';
  return `${base}?table=${encodeURIComponent(tableNo)}`;
}

/**
 * 生成/获取某张桌的二维码（PNG 文件 + 返回 URL）
 * GET /api/admin/tables/:id/qrcode
 */
async function generate(req, res, next) {
  try {
    const id = Number(req.params.id);
    const table = await prisma.table.findUnique({ where: { id } });
    if (!table) return res.status(404).json({ code: 404, message: '餐桌不存在' });

    const content = buildQrContent(table.tableNo);
    const filename = `table-${table.id}-${table.tableNo}.png`;
    const filepath = path.join(QR_DIR, filename);

    // 生成 PNG（300x300，白底）
    await QRCode.toFile(filepath, content, {
      type: 'png',
      width: 400,
      margin: 2,
      color: { dark: '#000', light: '#fff' },
    });

    // 把二维码内容存到 table.qrContent（首次生成）
    if (table.tableNo) {
      await prisma.table.update({
        where: { id: table.id },
        data: {}, // 占位，后续可加 qrContent 字段
      });
    }

    res.json({
      data: {
        tableId: table.id,
        tableNo: table.tableNo,
        url: `/qrcodes/${filename}`,
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
        const filename = `table-${table.id}-${table.tableNo}.png`;
        const filepath = path.join(QR_DIR, filename);
        await QRCode.toFile(filepath, content, {
          type: 'png',
          width: 400,
          margin: 2,
          color: { dark: '#000', light: '#fff' },
        });
        return {
          tableId: table.id,
          tableNo: table.tableNo,
          url: `/qrcodes/${filename}`,
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