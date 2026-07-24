# 部署上线指南

本文档说明如何把当前系统部署到生产环境，让真实顾客能扫码下单。

> **前置说明**：本文档目前为操作手册，不实际部署。代码已经准备好，等你具备以下资质即可按步骤上线：
> - 微信小程序账号（个人/个体户/企业均可）
> - 微信支付商户号（个体户或企业）
> - 一个备案过的域名（小程序要求 HTTPS）
> - 一年几十块的云服务器（腾讯云/阿里云）

---

## 0. 一图看懂部署架构

```
[顾客手机] ─微信扫码─→ [微信小程序]
                         │
                         ↓ HTTPS
                    [你的域名]
                   ┌────┴────┐
                   ↓         ↓
              [后端 API]  [商家后台]
              (3000)       (5173)
                   │         │
                   └────┬────┘
                        ↓
                   [云数据库 MySQL]
                   [云存储 腾讯云 COS]
```

---

## 1. 准备工作清单

### 1.1 你（店主）需要准备的资质

| 资质 | 用途 | 申请地址 | 周期 |
|---|---|---|---|
| 营业执照 | 申请小程序商户号 | - | - |
| 微信小程序账号 | 发布顾客端 | mp.weixin.qq.com | 1 天 |
| 微信支付商户号 | 收款 | pay.weixin.qq.com | 1-3 天 |
| 备案过的域名 | HTTPS 访问 | 阿里云/腾讯云 | 7-20 天 |
| 云服务器 | 跑后端 + 后台 | 阿里云/腾讯云 | 立即 |

### 1.2 推荐配置（最低成本）

- **腾讯云轻量应用服务器**：2 核 4G，约 ¥60/月
- **腾讯云 MySQL**：基础版 1G，约 ¥30/月
- **腾讯云 COS 存储**：前 10G 免费
- **域名**：.cn 域名约 ¥30/年
- **SSL 证书**：Let's Encrypt 免费，或腾讯云免费证书

> 总成本第一年约 ¥1000，之后每年约 ¥1000。
> 也可以用「腾讯云开发 CloudBase」方案，进一步降低成本（每月有免费额度）。

---

## 2. 部署步骤

### 步骤 1：申请小程序账号（你要做）

1. 打开 https://mp.weixin.qq.com → 立即注册
2. 选择「小程序」→ 选主体类型（建议个体工商户，支持微信支付）
3. 填资料、绑定邮箱、验证主体 → 拿到 AppID（小程序的身份证）
4. 设置 → 开发管理 → 记录 AppID 和 AppSecret（用于后端调接口）

### 步骤 2：申请商户号（你要做）

1. 打开 https://pay.weixin.qq.com → 接入微信支付
2. 选择「我是商家」→ 提交营业执照、法人身份证、对公账户（或法人个人银行卡）
3. 1-3 工作日审核通过 → 拿到商户号 MCH_ID
4. 账户中心 → API 安全 → API 密钥 → 设置 32 位密钥（保存好！）

### 步骤 3：买服务器 + 域名（你要做）

1. 腾讯云/阿里云：买 1 台轻量服务器（2 核 4G，按量付费也可）
2. 买 1 个域名（如 `breakfast-order.cn`）
3. 域名做 ICP 备案（国内站点必须）
4. 服务器装 CentOS 7+ 或 Ubuntu 20+

### 步骤 4：部署后端 + 后台到服务器

```bash
# SSH 连上服务器后：
# 1. 安装 Node.js 18+
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 2. 上传代码（用 scp / git clone）
git clone <你的 git 地址> /opt/breakfast-order
cd /opt/breakfast-order

# 3. 装依赖
cd server && npm install
cd ../admin-web && npm install && npm run build

# 4. 修改 server/.env
# - DATABASE_URL 改为 MySQL 连接串
# - WECHAT_PAY_ENABLED=true
# - 填入真实 WECHAT_APPID/WECHAT_MCH_ID/WECHAT_API_KEY
# - JWT_SECRET 改成强随机字符串
# - PREVIEW_BASE_URL 改成你的真实域名

# 5. 切到 MySQL
# server/prisma/schema.prisma 把 provider 改为 mysql
# npx prisma migrate dev --name prod_init

# 6. 用 PM2 启动后端
npm install -g pm2
cd /opt/breakfast-order/server
pm2 start src/server.js --name breakfast-api
pm2 save
pm2 startup

# 7. Nginx 反向代理
# 后端 3000 → api.your-domain.com
# 商家后台 dist/ → admin.your-domain.com
```

### 步骤 5：申请 SSL 证书 + 配置 HTTPS

- 腾讯云/阿里云控制台申请免费 SSL 证书
- 绑定到域名 `api.your-domain.com` 和 `admin.your-domain.com`
- 配置 Nginx HTTPS（参考下方配置示例）

### 步骤 6：配置小程序（你要做）

1. 微信开发者工具打开 `miniprogram/` 目录
2. 详情 → 修改 AppID 为你申请的 AppID
3. 修改 `app.js`：
   ```js
   apiBase: 'https://api.your-domain.com/api'
   ```
4. 上传代码 → 微信公众平台 → 版本管理 → 提交审核
5. 审核通过（约 1-3 天）→ 发布

### 步骤 7：配置支付 + 二维码

1. 在 `server/.env` 设置：
   ```bash
   WECHAT_PAY_ENABLED=true
   WECHAT_APPID=wx...
   WECHAT_MCH_ID=1234567890
   WECHAT_API_KEY=your_32_char_key
   WECHAT_NOTIFY_URL=https://api.your-domain.com/api/pay/notify
   WX_SUBSCRIBE_ENABLED=true
   WECHAT_SECRET=your_app_secret
   MINI_PROGRAM_SCHEME=weixin://dl/business/?appid=wx...
   PREVIEW_BASE_URL=https://api.your-domain.com/preview
   ```
2. 重启后端：`pm2 restart breakfast-api`
3. 商家后台 → 餐桌管理 → 点「二维码」→ 打印贴桌

### 步骤 8：开业测试

- 用顾客手机扫餐桌上的二维码 → 应该打开小程序 → 点单 → 微信支付 → 收到订阅消息
- 商家后台登录 → 看到订单 → 切状态 → 顾客端实时更新
- 跑 1 周 → 确认没问题 → 正式营业 🎉

---

## 3. 关键配置项对照表

| 配置项 | 开发期 | 生产期 |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | `mysql://user:pwd@host:3306/db` |
| `WECHAT_PAY_ENABLED` | `false` | `true` |
| `WECHAT_APPID` | 空 | 你的小程序 AppID |
| `WECHAT_MCH_ID` | 空 | 商户号 |
| `WECHAT_API_KEY` | 空 | 商户平台 API 密钥 |
| `JWT_SECRET` | dev 默认 | 强随机 32 位字符串 |
| `CORS_ORIGIN` | `*` | 具体域名 |
| `PREVIEW_BASE_URL` | `http://localhost:3000/preview` | `https://api.your-domain.com/preview` |

---

## 4. 简化方案：腾讯云开发 CloudBase

如果你不想自己维护服务器，可以用「腾讯云开发」：

- 把 `server/` 改造为云函数（自动弹性扩缩）
- 数据库用云开发 MySQL（自动备份）
- 图片用云开发存储（自动 CDN）
- 域名绑定和 HTTPS 一键搞定

改造量约 1-2 天，运营成本可压到 ¥30/月左右。

---

## 5. 上线后运维清单

- **每天**：商家后台看今日订单 + 营业额是否正常
- **每周**：看数据库空间（订单多了会涨），备份数据
- **每月**：看服务器账单，对账微信收款
- **每季度**：更新一次依赖（`npm outdated`）

---

## 6. 紧急情况处理

| 问题 | 处理 |
|---|---|
| 顾客扫不了码 | 检查服务器是否宕机 → 重启服务 |
| 支付了但订单没生成 | 看服务器日志 → 联系顾客退款 |
| 数据库满了 | 删历史订单备份 → 扩容存储 |
| 小程序审核被拒 | 看拒绝原因 → 改完再提 |

---

## 7. 何时联系 Claude 帮你

- 升级功能（如加会员卡、优惠券）
- 数据迁移到新环境
- 性能优化
- 新增硬件对接（打印机、收款音箱）

把「上线的具体步骤、你的资质情况、预算」告诉 Claude，按本文档逐步推进即可。