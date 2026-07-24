const router = require('express').Router();
const ctrl = require('../controllers/uploadController');
const { authRequired } = require('../middleware/auth');

router.post('/image', authRequired, ctrl.singleUpload, ctrl.uploadImage);

module.exports = router;