// 路由聚合
const router = require('express').Router();

const auth = require('./auth');
const categories = require('./categories');
const products = require('./products');
const tables = require('./tables');
const orders = require('./orders');
const upload = require('./upload');
const stats = require('./stats');
const pay = require('./pay');

router.use('/auth', auth);
router.use('/categories', categories);
router.use('/products', products);
router.use('/tables', tables);
router.use('/orders', orders);
router.use('/upload', upload);
router.use('/stats', stats);
router.use('/pay', pay);

module.exports = router;