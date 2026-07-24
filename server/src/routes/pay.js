const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/payController');

// 微信支付回调：接收微信推送的 XML
router.post('/notify', express.text({ type: '*/*' }), ctrl.notify);

// 创建支付
router.post('/', ctrl.create);

module.exports = router;