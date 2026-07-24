// Vercel Serverless 函数入口
// Vercel 自动识别 /api 路径并把请求路由到这个文件
// 这里把整个 Express 应用导出，由 Vercel 调用

const app = require('../src/app');

module.exports = app;