// 图片上传控制器
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// 确保上传目录存在
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // 随机文件名 + 原后缀
    const ext = path.extname(file.originalname).toLowerCase();
    const name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
    cb(ok ? null : new Error('只支持 jpg/png/webp/gif 图片'), ok);
  },
});

function singleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ code: 400, message: err.message });
    }
    next();
  });
}

async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 400, message: '请选择文件' });
    }
    // 返回相对路径，前端拼接 host 即可显示
    const url = `/uploads/${req.file.filename}`;
    res.json({ data: { url, filename: req.file.filename } });
  } catch (err) {
    next(err);
  }
}

module.exports = { singleUpload, uploadImage };