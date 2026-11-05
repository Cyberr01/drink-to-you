const { Router } = require('express');
const { body } = require('express-validator');
const controller = require('../controllers/authController');
const { authenticate } = require('../middlewares/authenticate');
const { validate } = require('../middlewares/validate');
const { asyncHandler } = require('../utils/asyncHandler');

const router = Router();

const emailRule = body('email').isEmail().withMessage('Informe um e-mail válido.').normalizeEmail();
const passwordRule = body('password')
  .isLength({ min: 6 })
  .withMessage('A senha deve ter pelo menos 6 caracteres.');

router.post(
  '/register',
  body('name').trim().isLength({ min: 2 }).withMessage('Informe seu nome.'),
  emailRule,
  passwordRule,
  validate,
  asyncHandler(controller.register),
);

router.post('/login', emailRule, passwordRule, validate, asyncHandler(controller.login));

router.get('/me', authenticate, asyncHandler(controller.me));

module.exports = router;
