// 后台管理员鉴权
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../db');
const { sign } = require('../utils/jwt');

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

async function login(req, res, next) {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return res.status(401).json({ code: 401, message: '账号或密码错误' });
    }
    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ code: 401, message: '账号或密码错误' });
    }
    const token = sign({ id: admin.id, username: admin.username });
    res.json({
      data: {
        token,
        admin: { id: admin.id, username: admin.username, name: admin.name },
      },
    });
  } catch (err) {
    next(err);
  }
}

// 当前登录管理员信息（用于前端刷新后回显）
async function me(req, res, next) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      select: { id: true, username: true, name: true },
    });
    if (!admin) {
      return res.status(404).json({ code: 404, message: '账号不存在' });
    }
    res.json({ data: admin });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me };