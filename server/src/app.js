// Express 应用配置
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const rootDir = path.join(__dirname, '..');

// 中间件
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS 配置
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  })
);

// 访问日志
app.use(morgan('dev'));

// ====== Vercel CDN 直接分发的静态文件 ======
// admin/ 、 preview/ 、 /uploads、/qrcodes 由 Vercel CDN 直接处理
// 这些路径不会到达 Express，除非走 fallback（如 SPA 客户端路由）
// 见 server/vercel.json 的 rewrites 配置

// 商家后台 SPA 客户端路由 fallback
// （真正的静态文件如 index.html、assets/* 已被 Vercel CDN 直接返回）
app.use('/admin', (req, res, next) => {
  // /admin/assets/* 已经被 Vercel CDN 拦截，不会到这里
  // 只有 /admin/xxx（无对应文件）才会到此处
  res.sendFile(path.join(rootDir, 'admin/index.html'));
});

// 根路径：顾客点餐页（直接返回）
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'preview/index.html'));
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 业务路由
app.use('/api', routes);

// 404
app.use((req, res) => {
  res.status(404).json({ code: 404, message: `路径不存在：${req.method} ${req.path}` });
});

// 错误处理
app.use(errorHandler);

module.exports = app;