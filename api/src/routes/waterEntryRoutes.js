const { Router } = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/waterEntryController');
const { authenticate } = require('../middlewares/authenticate');
const { validate } = require('../middlewares/validate');
const { asyncHandler } = require('../utils/asyncHandler');

const MAX_AMOUNT_ML = 5000;

const router = Router();
router.use(authenticate);

const idRule = param('id').isInt({ min: 1 }).withMessage('Identificador inválido.');
const entryRules = [
  body('amount_ml')
    .isInt({ min: 1, max: MAX_AMOUNT_ML })
    .withMessage(`A quantidade deve estar entre 1 e ${MAX_AMOUNT_ML} ml.`)
    .toInt(),
  body('note').optional({ nullable: true }).isString().isLength({ max: 200 })
    .withMessage('A observação deve ter até 200 caracteres.'),
  body('created_at').optional({ nullable: true }).isISO8601()
    .withMessage('Data inválida.'),
];

// Rotas de resumo devem vir antes de "/:id" para não serem tratadas como identificador.
router.get('/summary/today', asyncHandler(controller.summaryToday));
router.get('/summary/weekly', asyncHandler(controller.summaryWeekly));

router.get('/', asyncHandler(controller.list));
router.post('/', entryRules, validate, asyncHandler(controller.create));
router.get('/:id', idRule, validate, asyncHandler(controller.getById));
router.put('/:id', idRule, entryRules, validate, asyncHandler(controller.update));
router.delete('/:id', idRule, validate, asyncHandler(controller.remove));

module.exports = router;
