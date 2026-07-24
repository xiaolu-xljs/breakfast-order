// Express 应用配置
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

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

// 静态资源
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/qrcodes', express.static(path.join(__dirname, '../public/qrcodes')));

const publicDir = path.join(__dirname, '../public');

// 商家后台 SPA（Vue 3，客户端路由 history 模式）
app.use('/admin/assets', express.static(path.join(publicDir, 'admin/assets')));
app.use('/admin', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin/index.html'));
});

// 顾客点餐页
app.use('/preview', express.static(path.join(publicDir, 'preview')));

// 根路径：点餐页（方便用户直接打开）
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'preview/index.html'));
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