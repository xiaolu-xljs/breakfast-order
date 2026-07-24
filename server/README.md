# 后端 API 服务

早餐店扫码点餐系统的服务端。基于 Node.js + Express + Prisma + SQLite（开发期）。

## 目录结构

```
server/
├── prisma/
│   ├── schema.prisma   # 数据库 schema
│   ├── seed.js         # 种子数据脚本
│   └── dev.db          # SQLite 数据库文件（运行后生成）
├── src/
│   ├── server.js       # 服务入口
│   ├── app.js          # Express 应用配置
│   ├── db.js           # Prisma 客户端
│   ├── routes/         # 路由
│   ├── controllers/    # 业务逻辑
│   └── middleware/     # 中间件
├── .env                # 环境变量（含数据库连接串）
└── package.json
```

## 第一次启动（开发期）

```bash
# 1. 进入目录
cd server

# 2. 安装依赖（首次需要）
npm install

# 3. 初始化数据库（生成迁移 + 建表）
npx prisma migrate dev --name init

# 4. 填充种子数据（创建几个分类、商品、餐桌）
npm run seed

# 5. 启动开发服务（代码改动自动重启）
npm run dev
```

看到 `🚀 早餐店点餐 API 已启动` 就成功了。

## 日常开发

```bash
npm run dev             # 启动开发服务
npm run prisma:studio   # 打开 Prisma 可视化数据库工具（浏览器）
npm run seed            # 重置并填充种子数据
```

## 接口列表

启动后访问 `http://localhost:3000`

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/health` | 健康检查 |
| GET | `/api/categories` | 分类列表（`?onlyActive=true` 只返回启用的） |
| GET | `/api/categories/:id` | 分类详情（含商品） |
| POST | `/api/categories` | 新建分类 |
| PUT | `/api/categories/:id` | 更新分类 |
| DELETE | `/api/categories/:id` | 删除分类（需先移除商品） |
| GET | `/api/products` | 商品列表（`?categoryId=&onlyAvailable=true`） |
| GET | `/api/products/:id` | 商品详情 |
| POST | `/api/products` | 新建商品 |
| PUT | `/api/products/:id` | 更新商品 |
| DELETE | `/api/products/:id` | 删除商品 |
| GET | `/api/tables` | 餐桌列表 |
| GET | `/api/tables/:id` | 餐桌详情（按 ID） |
| GET | `/api/tables/by-no/:tableNo` | 餐桌详情（按桌号，二维码扫码用） |
| POST | `/api/tables` | 新建餐桌 |
| PUT | `/api/tables/:id` | 更新餐桌 |
| DELETE | `/api/tables/:id` | 删除餐桌 |

## 响应格式

```json
// 成功
{ "data": ... }

// 失败
{ "code": 400, "message": "...", "errors": [...] }
```

## 上线部署（暂未做）

阶段 8 会切到 MySQL 并部署到云开发，详见 `../docs/DESIGN.md`。