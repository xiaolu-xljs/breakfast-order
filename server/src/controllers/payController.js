// 微信支付控制器
const { z } = require('zod');
const prisma = require('../db');
const wxpay = require('../services/wxpay');

// 创建支付（顾客端调起）
const createSchema = z.object({
  orderNo: z.string().min(1),
  openid: z.string().optional().nullable(),
});

async function create(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
    const order = await prisma.order.findUnique({ where: { orderNo: body.orderNo } });
    if (!order) return res.status(404).json({ code: 404, message: '订单不存在' });
    if (order.status !== 'paid' && order.status !== 'pending_payment') {
      return res.status(409).json({ code: 409, message: '订单已处理，无需重复支付' });
    }

    const result = await wxpay.payForOrder({ ...order, openid: body.openid });

    // mock 模式下，模拟支付回调，直接把状态设为 paid
    if (result.mode === 'mock') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'paid', paidAt: new Date() },
      });
    } else {
      // 真支付模式下，订单先标记为 pending_payment，等支付回调改成 paid
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'pending_payment' },
      });
    }

    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// 微信支付成功回调（真支付模式下用）
async function notify(req, res) {
  try {
    // 解析 XML
    const xml = req.body;
    // 实际生产需要校验签名，这里简化为信任回调
    const orderNo = parseXmlField(xml, 'out_trade_no');
    if (!orderNo) {
      return res.send(xmlResponse('FAIL', '参数错误'));
    }

    const order = await prisma.order.findUnique({ where: { orderNo } });
    if (order && order.status !== 'paid') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'paid', paidAt: new Date() },
      });
    }
    res.send(xmlResponse('SUCCESS', 'OK'));
  } catch (err) {
    console.error('[支付回调处理失败]', err);
    res.send(xmlResponse('FAIL', '处理失败'));
  }
}

function parseXmlField(xml, field) {
  const re = new RegExp(`<${field}>([\\s\\S]*?)</${field}>`);
  const m = re.exec(xml);
  return m ? m[1] : null;
}

function xmlResponse(returnCode, returnMsg) {
  return `<xml><return_code><![CDATA[${returnCode}]]></return_code><return_msg><![CDATA[${returnMsg}]]></return_msg></xml>`;
}

module.exports = { create, notify };