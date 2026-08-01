const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const paymentController = require('../controllers/payment.controller');

const router = express.Router();

// Toutes les routes ci-dessous nécessitent d'être connecté.
// Le webhook Stripe (/api/payments/stripe/webhook) n'est PAS ici : il est monté
// directement dans app.js, avant express.json(), car Stripe exige le corps brut
// de la requête pour vérifier la signature.
router.use(requireAuth);

router.post('/stripe/create-session', paymentController.stripeCreateSession);

router.post('/paypal/create-order', paymentController.paypalCreateOrder);
router.post('/paypal/capture/:paypalOrderId', paymentController.paypalCapture);

router.post('/mobile-money/initiate', paymentController.mobileMoneyInitiate);
router.post('/mobile-money/:paymentId/confirm', requireRole('admin'), paymentController.mobileMoneyConfirm);

router.get('/order/:orderId', paymentController.listForOrder);

module.exports = router;
