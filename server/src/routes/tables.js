const router = require('express').Router();
const ctrl = require('../controllers/tableController');
const qrCtrl = require('../controllers/qrcodeController');
const { authRequired } = require('../middleware/auth');

// 餐桌 CRUD
router.get('/', ctrl.list);
router.get('/:id', ctrl.detail);
router.get('/by-no/:tableNo', ctrl.detailByTableNo);
router.post('/', authRequired, ctrl.create);
router.put('/:id', authRequired, ctrl.update);
router.delete('/:id', authRequired, ctrl.remove);

// 二维码（后台）
router.get('/qrcode/batch', authRequired, qrCtrl.batchGenerate);
router.get('/:id/qrcode', authRequired, qrCtrl.generate);

module.exports = router;