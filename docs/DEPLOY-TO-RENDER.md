# 部署到 Render 完整教程（图文版）

> 目标：把代码部署到 Render，获得一个永久免费的网址，让任何人扫码访问。
> 全程大约 30-45 分钟。

---

## 0. 一图看懂

```
[顾客手机] → 扫码 → 打开 https://breakfast-xxx.onrender.com/preview
                                  ↓
                          [Render 云服务器]
                          ├─ 后端 API
                          ├─ 顾客端网页
                          ├─ 商家后台（暂未部署，需要再开一个服务）
                          └─ PostgreSQL 数据库（Neon）
```

部署后你会得到 2 个网址：
- `https://breakfast-order-api.onrender.com` → 后端 + 顾客端 + 商家后台入口
- `https://breakfast-order-admin.onrender.com` → 商家管理后台（独立部署）

---

## 1. 你需要注册的账号（5 分钟）

打开以下链接，分别注册。**全程免费**：

| 序号 | 网站 | 用途 |
|---|---|---|
| 1 | https://github.com | 存代码（如果你有就跳过） |
| 2 | https://render.com | 部署后端 + 商家后台 |
| 3 | https://neon.tech | 免费 PostgreSQL 数据库 |

注册都很简单，邮箱验证即可。

---

## 2. 把代码上传到 GitHub

### 2.1 创建新仓库

1. 登录 GitHub → 右上角 `+` → `New repository`
2. 名称：`breakfast-order`
3. 选 `Public`（免费账户必须）
4. **不要**勾选 "Add a README file"
5. 点 `Create repository`

### 2.2 把代码 push 上去

打开终端（cmd），运行：

```bash
cd "c:/Users/23590/Desktop/breakfast-order"

git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/你的用户名/breakfast-order.git
git push -u origin main
```

> 注：第一次 push 会要求输入 GitHub 账号密码，建议用 Personal Access Token（在 GitHub Settings → Developer settings → Personal access tokens 生成）。

---

## 3. 创建数据库（Neon）

1. 登录 https://neon.tech → 点 `Create a project`
2. 名字随便填（如 `breakfast-order-db`）
3. 区域选 `Singapore`（离中国大陆近）
4. 创建完成后，在 Dashboard 看到 `Connection string`，形如：

```
postgresql://用户名:密码@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

5. **复制这串**（含 `?sslmode=require`）

---

## 4. 部署到 Render

### 4.1 部署后端

1. 登录 https://render.com → 点 `New` → `Blueprint`
2. 选 `Connect` 你的 GitHub 仓库 `breakfast-order`
3. Render 会自动识别 `render.yaml` 文件，显示要创建的服务
4. 点 `Apply` → 开始部署

### 4.2 配置环境变量

部署开始后：

1. 点进 `breakfast-order-api` 服务
2. 左菜单 `Environment` → 添加：

| Key | Value |
|---|---|
| `DATABASE_URL` | 粘贴你刚才复制的 Neon 连接串 |
| `PREVIEW_BASE_URL` | 先填 `https://breakfast-order-api.onrender.com/preview`（部署完拿到真地址再改） |

3. 点 `Save Changes` → 服务会自动重启

### 4.3 等待首次部署完成

第一次部署大约 3-5 分钟。看 Logs 看到 `🚀 早餐店点餐 API 已启动` 就是成功了。

### 4.4 获取你的网址

部署成功后，Render 会给你一个地址，比如：

```
https://breakfast-order-api.onrender.com
```

访问 https://breakfast-order-api.onrender.com/preview → 应该看到点餐页 ✅

---

## 5. 部署商家后台

商家后台是 Vue 项目，需要单独部署。

### 5.1 修改商家后台的 API 地址

编辑 `admin-web/.env.production`（如果没有就创建）：

```bash
VITE_API_BASE=https://breakfast-order-api.onrender.com/api
```

如果文件不存在，告诉我，我帮你建。

### 5.2 在 Render 创建静态站点

1. Render Dashboard → `New` → `Static Site`
2. 选 GitHub 仓库 `breakfast-order`
3. 配置：

| 字段 | 值 |
|---|---|
| Name | `breakfast-order-admin` |
| Root Directory | `admin-web` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

4. 点 `Create Static Site`

### 5.3 配置环境变量

Static Site → `Environment`：

| Key | Value |
|---|---|
| `VITE_API_BASE` | `https://breakfast-order-api.onrender.com/api` |

5. 部署完后访问 `https://breakfast-order-admin.onrender.com` → 用 admin/admin123 登录

---

## 6. 配置二维码

部署完成后，商家后台「餐桌管理」点「批量生成二维码」，所有二维码会指向：

```
https://breakfast-order-api.onrender.com/preview?table=A01
```

发给顾客扫码即可。

---

## 7. 部署完成清单

部署完确认这些都能用：

- [ ] `https://breakfast-order-api.onrender.com/health` 返回 `{"status":"ok"}`
- [ ] `https://breakfast-order-api.onrender.com/preview` 能看到菜单
- [ ] `https://breakfast-order-admin.onrender.com` 能登录后台
- [ ] 商家后台能加商品、餐桌
- [ ] 顾客端能下单
- [ ] 商家后台能看到订单
- [ ] 二维码扫了能用

---

## 8. 常见问题

### 部署失败：数据库连接不上
- 检查 Neon URL 是否正确复制（含 `?sslmode=require`）
- 在 Render Environment 看 DATABASE_URL 是否设置

### 顾客端加载菜单失败
- 检查后端 `/api/categories` 是否能直接访问
- 看 Render 后端 Logs 是否有报错

### 商家后台登录失败
- 商家后台是静态站点，登录请求会发到后端
- 检查浏览器 Console 看 CORS 错误
- 看后端 Logs 是否收到请求

### 服务"睡着"了
- Render 免费版 15 分钟无访问会休眠
- 下次访问要等 30 秒唤醒
- 想避免：升级到 $7/月

---

## 9. 升级路径

上线跑通后，可以按需升级：

- **加微信支付**：去 pay.weixin.qq.com 申请商户号 → 改 Render 环境变量
- **加小程序**：把 miniprogram/ 上传到微信开发者工具 → 审核发布
- **加订阅消息**：申请小程序模板 → 改 Render 环境变量

---

## 10. 现在的状态

我已经准备好这些文件：

- ✅ `render.yaml`（一键部署配置）
- ✅ `prisma/schema.prisma`（已改 PostgreSQL）
- ✅ `package.json`（加了 postinstall）
- ✅ `.gitignore`

代码层就绪，剩下的是**你按本文档点鼠标**的事。

---

## 11. 接下来怎么跟我协作

每完成一步告诉我，我们一起排查：

1. **注册 3 个账号** → 告诉我注册好了
2. **代码 push 到 GitHub** → 把 GitHub 仓库 URL 发给我
3. **拿到 Neon 连接串** → 发给我，我帮你配 Render
4. **部署后端** → 访问 `/health` 看是否成功
5. **部署商家后台** → 验证能登录
6. **生成二维码** → 扫码测试

任何一步报错，把报错截图发给我，我帮你解决。