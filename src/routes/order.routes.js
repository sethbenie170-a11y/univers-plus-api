const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const orderController = require('../controllers/order.controller');

const router = express.Router();

router.use(requireAuth);

router.post(
  '/',
  [
    body('paymentMethod').notEmpty().withMessage('Le moyen de paiement est requis.'),
    body('shippingName').notEmpty().withMessage('Le nom du destinataire est requis.'),
    body('shippingPhone').notEmpty().withMessage('Le téléphone est requis.'),
    body('shippingCity').notEmpty().withMessage('La ville est requise.'),
  ],
  validate,
  orderController.createOrder
);

router.get('/', orderController.listOrders);
router.get('/:id', orderController.getOrder);

router.put(
  '/:id/status',
  requireRole('admin'),
  [body('status').notEmpty().withMessage('Le statut est requis.')],
  validate,
  orderController.updateStatus
);

module.exports = router;
