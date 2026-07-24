const router = require('express').Router();
const ctrl = require('../controllers/categoryController');

// 顾客端 / 后台通用
router.get('/', ctrl.list);
router.get('/:id', ctrl.detail);

// 仅后台
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;