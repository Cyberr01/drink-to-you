const { Router } = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/challengeController');
const { authenticate } = require('../middlewares/authenticate');
const { validate } = require('../middlewares/validate');
const { asyncHandler } = require('../utils/asyncHandler');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const router = Router();
router.use(authenticate);

const idRule = param('id').isInt({ min: 1 }).withMessage('Identificador inválido.');

router.get('/', asyncHandler(controller.list));

router.post(
  '/',
  body('name')
    .trim()
    .isLength({ min: 3, max: 60 })
    .withMessage('O nome da sala deve ter entre 3 e 60 caracteres.'),
  body('description')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 240 })
    .withMessage('A descrição deve ter até 240 caracteres.'),
  body('prize')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 140 })
    .withMessage('A premiação deve ter até 140 caracteres.'),
  body('daily_goal_ml')
    .isInt({ min: 500, max: 10000 })
    .withMessage('A meta da sala deve estar entre 500 e 10000 ml.')
    .toInt(),
  body('start_date').matches(DATE_PATTERN).withMessage('Data inicial inválida (YYYY-MM-DD).'),
  body('end_date').matches(DATE_PATTERN).withMessage('Data final inválida (YYYY-MM-DD).'),
  body('lock_after_start').optional().isBoolean().toBoolean(),
  validate,
  asyncHandler(controller.create),
);

router.post(
  '/join',
  body('code').trim().isLength({ min: 4, max: 20 }).withMessage('Informe o código da sala.'),
  validate,
  asyncHandler(controller.join),
);

router.get('/:id', idRule, validate, asyncHandler(controller.details));
router.delete('/:id/leave', idRule, validate, asyncHandler(controller.leave));

router.post(
  '/:id/checkins',
  idRule,
  body('photo_data')
    .isString()
    .isLength({ min: 30, max: 2_500_000 })
    .withMessage('Foto de comprovação inválida ou muito grande.'),
  body('caption')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 160 })
    .withMessage('A legenda deve ter até 160 caracteres.'),
  validate,
  asyncHandler(controller.createCheckin),
);

router.post(
  '/:id/checkins/:checkinId/react',
  idRule,
  param('checkinId').isInt({ min: 1 }).withMessage('Check-in inválido.'),
  validate,
  asyncHandler(controller.toggleReaction),
);

module.exports = router;
