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

// 静态资源：商品图片（仅本地开发有效，Vercel 没有持久磁盘）
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// 静态资源：餐桌二维码（同上）
app.use('/qrcodes', express.static(path.join(__dirname, '../public/qrcodes')));

// 注：顾客端预览（/preview/index.html）由 Vercel 的 public 目录自动服务

// 根路径说明
app.get('/', (req, res) => {
  res.json({
    name: '早餐店点餐 API',
    version: '0.1.0',
    endpoints: {
      api: '/api',
      health: '/health',
      uploads: '/uploads',
      customerPreview: '/preview',
      merchantAdmin: '见 admin-web 项目（npm run dev → http://localhost:5173）',
    },
  });
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