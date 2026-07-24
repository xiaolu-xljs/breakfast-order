// 微信支付服务
//
// 当前为「mock 模式」：下单立即返回成功，方便本地联调和演示。
// 上线时配置 WECHAT_PAY_ENABLED=true + 真实商户号/密钥即可激活真支付。
//
// 切换方法：
//   1. 在 .env 写入：
//        WECHAT_PAY_ENABLED=true
//        WECHAT_APPID=wx...           // 你的小程序 AppID
//        WECHAT_MCH_ID=1234567890     // 商户号
//        WECHAT_API_KEY=...           // 32 位 API 密钥（商户平台设置）
//   2. 重启服务，payForOrder() 会自动走真实统一下单流程。

const crypto = require('crypto');

const ENABLED = process.env.WECHAT_PAY_ENABLED === 'true';
const APPID = process.env.WECHAT_APPID || '';
const MCH_ID = process.env.WECHAT_MCH_ID || '';
const API_KEY = process.env.WECHAT_API_KEY || '';

/**
 * 给订单生成支付参数
 * - mock 模式：直接返回成功，小程序端无需真正唤起支付
 * - 真支付模式：调用微信「统一下单」API，返回小程序 wx.requestPayment 所需参数
 *
 * @param {object} order 订单（含 orderNo、totalAmount、openid）
 * @returns {Promise<{mode:'mock'|'real', payload: object}>}
 */
async function payForOrder(order) {
  if (!ENABLED) {
    // mock 模式：返回模拟数据
    return {
      mode: 'mock',
      payload: {
        // 小程序识别到 mode=mock 就跳过 requestPayment，直接跳成功
        orderNo: order.orderNo,
        mock: true,
      },
    };
  }

  // 真实模式：调用微信统一下单 API
  const params = {
    appid: APPID,
    mch_id: MCH_ID,
    nonce_str: crypto.randomBytes(16).toString('hex'),
    body: `早餐店订单-${order.orderNo}`,
    out_trade_no: order.orderNo,
    total_fee: Math.round(Number(order.totalAmount) * 100), // 单位：分
    spbill_create_ip: '127.0.0.1',
    notify_url: process.env.WECHAT_NOTIFY_URL || 'https://your-domain.com/api/pay/notify',
    trade_type: 'JSAPI',
    openid: order.openid,
  };

  // 签名（V2 API）
  params.sign = signV2(params);

  const xml = objectToXml(params);

  const resp = await fetch('https://api.mch.weixin.qq.com/pay/unifiedorder', {
    method: 'POST',
    body: xml,
  });
  const respXml = await resp.text();
  const result = xmlToObject(respXml);

  if (result.return_code !== 'SUCCESS' || result.result_code !== 'SUCCESS') {
    throw new Error(`微信下单失败：${result.return_msg || result.err_code_des}`);
  }

  // 用 prepay_id 构造小程序支付参数
  const timeStamp = String(Math.floor(Date.now() / 1000));
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const pkg = `prepay_id=${result.prepay_id}`;
  const signType = 'MD5';

  const paySign = signV2({
    appId: APPID,
    timeStamp,
    nonceStr,
    package: pkg,
    signType,
  });

  return {
    mode: 'real',
    payload: {
      timeStamp,
      nonceStr,
      package: pkg,
      signType,
      paySign,
    },
  };
}

// === V2 签名 ===
function signV2(params) {
  const sorted = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== '' && k !== 'sign')
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('md5').update(sorted + '&key=' + API_KEY).digest('hex').toUpperCase();
}

function objectToXml(obj) {
  let xml = '<xml>';
  for (const [k, v] of Object.entries(obj)) {
    xml += `<${k}>${escapeXml(String(v))}</${k}>`;
  }
  xml += '</xml>';
  return xml;
}

function escapeXml(s) {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

function xmlToObject(xml) {
  const obj = {};
  const re = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = re.exec(xml))) obj[m[1]] = m[2];
  return obj;
}

module.exports = { payForOrder, ENABLED };