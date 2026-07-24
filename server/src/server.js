// 服务入口
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 早餐店点餐 API 已启动`);
  console.log(`   本地访问：http://localhost:${PORT}`);
  console.log(`   健康检查：http://localhost:${PORT}/health\n`);
});