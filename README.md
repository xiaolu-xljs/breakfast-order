# 早餐店扫码点餐系统

单店堂食场景的扫码点餐小程序 + 商家管理后台。

## 系统组成

```
breakfast-order/
├── server/              # 后端 API (Node.js + Express + Prisma)
├── admin-web/           # 商家管理后台 (Vue 3 + Element Plus)
├── miniprogram/         # 微信小程序（原生）
├── miniprogram-preview/ # 浏览器预览（手机壳样式）
├── docs/                # 设计/部署文档
├── start.js             # 一键启动脚本
└── package.json         # 顶层启动入口
```

## 快速启动

**前提**：电脑已装 Node.js 18+（[下载](https://nodejs.org/)）

```bash
# 安装顶层依赖（仅首次）
npm install

# 同时启动后端 + 商家后台
npm run dev
```

启动后浏览器打开：

| 用途 | 地址 |
|---|---|
| 顾客端预览 | http://localhost:3000/preview |
| 商家后台 | http://localhost:5173（admin / admin123） |
| 后端 API | http://localhost:3000/api |

## 单独启动

```bash
npm run dev:server   # 仅后端（端口 3000）
npm run dev:admin    # 仅后台（端口 5173）
npm run test:flow    # 端到端模拟顾客流程
```

## 文档

- [docs/DESIGN.md](docs/DESIGN.md) — 系统设计（功能/技术/路线）
- [docs/DATABASE.md](docs/DATABASE.md) — 数据库设计 + Prisma schema
- [docs/UI_DESIGN.md](docs/UI_DESIGN.md) — 商家后台 + 顾客界面设计
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — **部署上线指南**

## 当前阶段

✅ 设计 + 全部 8 个开发阶段代码已完成（含 mock 支付 + 真支付切换）

### 主要功能（全部已实现）

- 后端 API（21+ 接口，鉴权、菜单、订单、图片上传、统计）
- 商家后台 7 个页面（登录/概览/订单/分类/商品/餐桌/统计）
- 顾客端 4 个页面（菜单/确认/支付/状态）+ 浏览器预览版
- 微信支付（mock 模式可跑通，真支付填配置即激活）
- 餐桌二维码生成（PNG 文件）
- 订阅消息推送（mock 打日志，真推送填配置即激活）
- 一键启动 + 同源代理（无超时问题）

### 待你做的事情

按 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) 操作：
1. 申请小程序账号（mp.weixin.qq.com）
2. 申请商户号（pay.weixin.qq.com）
3. 买服务器 + 域名
4. 按文档逐步部署

## 重要文件位置

- 后端入口：[server/src/server.js](server/src/server.js)
- 后台入口：[admin-web/src/main.js](admin-web/src/main.js)
- 小程序入口：[miniprogram/app.js](miniprogram/app.js)
- 浏览器预览：[miniprogram-preview/index.html](miniprogram-preview/index.html)
- 数据库 schema：[server/prisma/schema.prisma](server/prisma/schema.prisma)
- 环境变量：[server/.env](server/.env)（含所有可配置项说明）

## 切换到真实支付/推送

编辑 [server/.env](server/.env)：

```bash
WECHAT_PAY_ENABLED=false   # 改为 true 激活真支付
WECHAT_APPID=
WECHAT_MCH_ID=
WECHAT_API_KEY=
WX_SUBSCRIBE_ENABLED=false # 改为 true 激活真推送
WECHAT_SECRET=
```

修改后重启服务即可。