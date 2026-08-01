const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const promoController = require('../controllers/promo.controller');

const router = express.Router();

// Vérification publique d'un code (utilisée depuis le panier avant paiement).
router.post(
  '/validate',
  [body('code').trim().notEmpty().withMessage('Le code promo est requis.')],
  validate,
  promoController.validateCode
);

// Gestion complète réservée aux admins.
router.get('/', requireAuth, requireRole('admin'), promoController.list);

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  [
    body('code').trim().notEmpty().withMessage('Le code est requis.'),
    body('discountPercent').isInt({ min: 1, max: 100 }).withMessage('La réduction doit être comprise entre 1 et 100.'),
  ],
  validate,
  promoController.create
);

router.put('/:id', requireAuth, requireRole('admin'), promoController.update);
router.delete('/:id', requireAuth, requireRole('admin'), promoController.remove);

module.exports = router;
