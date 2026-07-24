// 一键启动脚本：同时拉起后端和商家后台
// 用法：
//   方式 1：直接 node start.js
//   方式 2：npm run dev
//
// 启动后会打印三个访问地址（顾客端预览 / 商家后台 / 后端 API）

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

function getLanIP() {
  const ifaces = os.networkInterfaces();
  for (const list of Object.values(ifaces)) {
    for (const i of list || []) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return 'localhost';
}

const lan = getLanIP();
const COLOR = {
  server: '\x1b[36m', // cyan
  admin: '\x1b[35m',  // magenta
  reset: '\x1b[0m',
};

function run(label, color, cwd, cmd, args) {
  const child = spawn(cmd, args, { cwd, shell: true, env: process.env });
  const prefix = `${color}[${label}]${COLOR.reset}`;
  child.stdout.on('data', (d) => process.stdout.write(d.toString().split('\n').map(l => l ? `${prefix} ${l}` : '').join('\n') + '\n'));
  child.stderr.on('data', (d) => process.stderr.write(d.toString().split('\n').map(l => l ? `${prefix} ${l}` : '').join('\n') + '\n'));
  child.on('exit', (code) => console.log(`${prefix} 退出（${code}）`));
  return child;
}

const root = __dirname;
const procs = [
  run('后端', COLOR.server, path.join(root, 'server'), 'npm', ['start']),
  run('后台', COLOR.admin, path.join(root, 'admin-web'), 'npm', ['run', 'dev']),
];

setTimeout(() => {
  console.log('\n========================================');
  console.log('  🍜 早餐店点餐系统已启动');
  console.log('========================================');
  console.log(`  顾客端预览：  http://localhost:3000/preview`);
  console.log(`  顾客端(同网)：http://${lan}:3000/preview`);
  console.log(`  商家后台：    http://localhost:5173   (admin / admin123)`);
  console.log(`  后端 API：    http://localhost:3000/api`);
  console.log('========================================\n');
}, 4000);

process.on('SIGINT', () => {
  console.log('\n正在关闭…');
  procs.forEach((p) => p.kill('SIGINT'));
  setTimeout(() => process.exit(0), 500);
});