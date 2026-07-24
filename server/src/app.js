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
// 静态文件 assets 要先匹配，否则会被 /admin 兜底返回 HTML 导致 404

// 商家后台静态资源
app.use('/admin/assets', express.static(path.join(rootDir, 'admin/assets')));
app.use('/admin', (req, res, next) => {
  // /admin/assets/* 已被上面的 express.static 拦截
  // 只有 /admin/xxx（无对应文件）才会到这里，发给 SPA 做客户端路由
  res.sendFile(path.join(rootDir, 'admin/index.html'));
});

// 根路径：顾客点餐页（直接返回 HTML）
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'preview/index.html'));
});

// 顾客点餐页静态资源（Vercel rewrite 会拦截所有路径，需要显式声明）
app.use('/preview', express.static(path.join(rootDir, 'preview')));

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