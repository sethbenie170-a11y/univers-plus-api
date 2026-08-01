const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { requireAuth } = require('../middleware/auth.middleware');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// Limite les tentatives de connexion/inscription pour freiner les attaques par force brute.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Trop de tentatives, veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Le nom est requis.'),
    body('email').isEmail().withMessage("L'adresse e-mail n'est pas valide."),
    body('password').isLength({ min: 8 }).withMessage('Le mot de passe doit contenir au moins 8 caractères.'),
    body('phone').optional({ checkFalsy: true }).isString(),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage("L'adresse e-mail n'est pas valide."),
    body('password').notEmpty().withMessage('Le mot de passe est requis.'),
  ],
  validate,
  authController.login
);

router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
