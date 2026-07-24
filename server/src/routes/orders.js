const router = require('express').Router();
const ctrl = require('../controllers/orderController');
const { authRequired } = require('../middleware/auth');

// 顾客端（公开）
router.post('/', ctrl.create);
router.get('/by-no/:orderNo', ctrl.detailByOrderNo);

// 后台
router.get('/', authRequired, ctrl.adminList);
router.get('/:id', authRequired, ctrl.adminDetail);
router.patch('/:id/status', authRequired, ctrl.updateStatus);

module.exports = router;