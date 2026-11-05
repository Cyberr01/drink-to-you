const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/preferencesController');
const { authenticate } = require('../middlewares/authenticate');
const { validate } = require('../middlewares/validate');
const { asyncHandler } = require('../utils/asyncHandler');

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(controller.get));

router.put(
  '/',
  body('daily_goal_ml').isInt({ min: 500, max: 10000 })
    .withMessage('A meta deve estar entre 500 e 10000 ml.').toInt(),
  body('reminders_enabled').isBoolean().withMessage('Valor de lembretes inválido.').toBoolean(),
  body('reminder_interval_minutes').isInt({ min: 15, max: 720 })
    .withMessage('O intervalo deve estar entre 15 e 720 minutos.').toInt(),
  body('reminder_start_time').matches(TIME_PATTERN).withMessage('Horário inicial inválido (HH:MM).'),
  body('reminder_end_time').matches(TIME_PATTERN).withMessage('Horário final inválido (HH:MM).'),
  validate,
  asyncHandler(controller.update),
);

module.exports = router;
