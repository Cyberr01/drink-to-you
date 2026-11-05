const { Router } = require('express');
const controller = require('../controllers/achievementController');
const { authenticate } = require('../middlewares/authenticate');
const { asyncHandler } = require('../utils/asyncHandler');

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(controller.list));

module.exports = router;
