# 商家管理后台

早餐店扫码点餐系统的商家后台，基于 Vue 3 + Vite + Element Plus。

## 功能页面

| 路径 | 页面 |
|---|---|
| `/login` | 登录 |
| `/dashboard` | 数据概览（今日订单/营业额/待处理/热销 TOP） |
| `/orders` | 订单管理（实时轮询 + 状态切换 + 可选声音提醒） |
| `/categories` | 菜单分类 CRUD |
| `/products` | 商品管理（CRUD + 图片上传 + 上/下架） |
| `/tables` | 餐桌管理（CRUD，二维码阶段 6 启用） |

## 启动

```bash
# 1. 先启动后端（另一个终端）
cd ../server
npm run dev

# 2. 启动前台
cd ../admin-web
npm install        # 首次
npm run dev        # 默认 http://localhost:5173
```

打开浏览器访问 http://localhost:5173，使用 admin / admin123 登录。

## 技术栈

- Vue 3 + Composition API
- Vite 6
- Element Plus 2.x
- Pinia（状态管理，仅用于登录态）
- Vue Router 4
- Axios（开发期代理 /api 和 /uploads 到后端 3000 端口）

## 与后端对接

- 开发期通过 Vite proxy：所有 `/api/*` 转发到 `http://localhost:3000`
- 生产期需要把 Vite 构建产物部署到静态托管，把 `/api` 指向真实后端域名

## 后续阶段

- 阶段 6：餐桌二维码生成
- 阶段 7：营业统计图表、订单订阅消息
- 阶段 8：部署上线