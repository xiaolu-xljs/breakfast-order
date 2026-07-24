const router = require('express').Router();
const ctrl = require('../controllers/statsController');
const { authRequired } = require('../middleware/auth');

router.get('/overview', authRequired, ctrl.overview);
router.get('/range', authRequired, ctrl.range);

module.exports = router;