// 微信订阅消息服务（设计）
//
// 当前为「mock 模式」：仅打印日志，不实际发送。
// 上线时配置 WX_SUBSCRIBE_ENABLED=true + 真实小程序 AppID 即可激活。
//
// 使用流程：
//   1. 在小程序后台申请订阅消息模板（订单状态通知类），拿到模板 ID
//   2. 顾客下单时/状态变更前，小程序调用 wx.requestSubscribeMessage 让用户授权
//   3. 后端在状态变更时调用 sendOrderUpdate() 推送消息

const ENABLED = process.env.WX_SUBSCRIBE_ENABLED === 'true';
const APPID = process.env.WECHAT_APPID || '';
const SECRET = process.env.WECHAT_SECRET || '';

const TEMPLATE_ID = process.env.WX_TEMPLATE_ORDER_UPDATE || ''; // 订单状态模板 ID

// 内存里的 access_token 缓存
let _tokenCache = { token: null, expireAt: 0 };

/**
 * 推送订单状态变更
 * @param {object} order
 * @param {string} order.openid 顾客的 openid（需先通过 wx.login 拿到）
 * @param {string} order.orderNo
 * @param {string} order.tableNo
 * @param {string} order.status
 * @param {array} order.items
 */
async function sendOrderUpdate(order) {
  if (!order.openid) {
    console.log('[subscribeMessage] 订单无 openid，跳过推送');
    return;
  }

  if (!ENABLED) {
    console.log('[subscribeMessage] mock 模式，假装推送：', {
      openid: order.openid,
      orderNo: order.orderNo,
      status: order.status,
    });
    return;
  }

  // 真模式：调微信接口
  try {
    const accessToken = await getAccessToken();
    const statusText = {
      paid: '已收到订单，商家正在备餐',
      preparing: '您的餐正在制作中',
      served: '您的餐已出餐，请到取餐',
      completed: '订单已完成，欢迎再次光临',
    }[order.status] || order.status;

    await fetch(
      `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touser: order.openid,
          template_id: TEMPLATE_ID,
          page: `pages/order-status/order-status?orderNo=${order.orderNo}`,
          data: {
            // 模板字段（需与申请时一致）
            character_string1: { value: order.orderNo },
            phrase2: { value: statusText },
            phrase3: { value: '桌号 ' + order.tableNo },
            amount4: { value: Number(order.totalAmount).toFixed(2) },
            thing5: { value: order.items.map((i) => i.productName).join('、') },
          },
        }),
      }
    );
  } catch (err) {
    console.error('[subscribeMessage] 推送失败：', err);
  }
}

async function getAccessToken() {
  if (_tokenCache.token && Date.now() < _tokenCache.expireAt - 60000) {
    return _tokenCache.token;
  }
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.errcode) throw new Error(`获取 access_token 失败：${data.errmsg}`);
  _tokenCache = {
    token: data.access_token,
    expireAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

module.exports = { sendOrderUpdate, ENABLED };