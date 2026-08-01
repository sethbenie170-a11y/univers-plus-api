const { Order, Payment } = require('../models');
const stripe = require('../config/stripe');
const paypalService = require('../services/paypal.service');
const { toStripeAmount } = require('../utils/currency');

const MOBILE_MONEY_PROVIDERS = ['orange_money', 'mtn_money', 'moov_money', 'wave'];
const PROVIDER_LABELS = {
  orange_money: 'Orange Money',
  mtn_money: 'MTN Money',
  moov_money: 'Moov Money',
  wave: 'Wave',
};

async function getOrderForUser(orderId, user) {
  const order = await Order.findByPk(orderId);
  if (!order) return { error: { status: 404, message: 'Commande introuvable.' } };
  if (order.userId !== user.id && user.role !== 'admin') {
    return { error: { status: 403, message: "Vous n'avez pas accès à cette commande." } };
  }
  return { order };
}

/* ============================================================
 * STRIPE (mode test)
 * ============================================================ */
async function stripeCreateSession(req, res, next) {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(422).json({ message: 'orderId est requis.' });

    const { order, error } = await getOrderForUser(orderId, req.user);
    if (error) return res.status(error.status).json({ message: error.message });
    if (order.paymentStatus === 'Payé') {
      return res.status(409).json({ message: 'Cette commande est déjà payée.' });
    }

    const currency = process.env.PAYMENT_CURRENCY || 'xof';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: `Commande UNIVERS PLUS ${order.orderNumber}` },
            unit_amount: toStripeAmount(order.total, currency),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/paiement/succes?order=${order.orderNumber}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/paiement/annule?order=${order.orderNumber}`,
      metadata: { orderId: String(order.id), orderNumber: order.orderNumber },
    });

    await Payment.create({
      orderId: order.id,
      provider: 'stripe',
      status: 'En attente',
      amount: order.total,
      currency,
      providerReference: session.id,
    });

    return res.status(201).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    return next(err);
  }
}

// Reçoit les événements Stripe. Doit être monté AVANT express.json() avec un parseur
// "raw", car la vérification de signature exige le corps brut de la requête (voir app.js).
async function stripeWebhook(req, res) {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Signature de webhook Stripe invalide :', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      const payment = await Payment.findOne({ where: { providerReference: session.id } });
      if (payment) {
        payment.status = 'Payé';
        payment.rawResponse = JSON.stringify(session);
        await payment.save();

        const order = await Order.findByPk(payment.orderId);
        if (order && order.paymentStatus !== 'Payé') {
          order.paymentStatus = 'Payé';
          await order.save();
        }
      }
    } catch (err) {
      console.error('Erreur lors du traitement du webhook Stripe :', err);
    }
  }

  return res.json({ received: true });
}

/* ============================================================
 * PAYPAL (sandbox)
 * ============================================================ */
async function paypalCreateOrder(req, res, next) {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(422).json({ message: 'orderId est requis.' });

    const { order, error } = await getOrderForUser(orderId, req.user);
    if (error) return res.status(error.status).json({ message: error.message });
    if (order.paymentStatus === 'Payé') {
      return res.status(409).json({ message: 'Cette commande est déjà payée.' });
    }

    // PayPal ne prend pas en charge le FCFA (XOF). On convertit vers une devise
    // supportée (USD par défaut) avec un taux fixe — à remplacer par un vrai taux
    // de change à jour en production.
    const currency = process.env.PAYPAL_CURRENCY || 'USD';
    const rate = Number(process.env.PAYPAL_XOF_TO_USD_RATE || 0.0017);
    const convertedAmount = currency === 'XOF' ? order.total : (order.total * rate).toFixed(2);

    const paypalOrder = await paypalService.createOrder(convertedAmount, currency);

    await Payment.create({
      orderId: order.id,
      provider: 'paypal',
      status: 'En attente',
      amount: order.total,
      currency,
      providerReference: paypalOrder.id,
    });

    return res.status(201).json({ id: paypalOrder.id, approveUrl: paypalOrder.approveUrl });
  } catch (err) {
    return next(err);
  }
}

async function paypalCapture(req, res, next) {
  try {
    const { paypalOrderId } = req.params;
    const result = await paypalService.captureOrder(paypalOrderId);

    const payment = await Payment.findOne({ where: { providerReference: paypalOrderId } });
    if (!payment) {
      return res.status(404).json({ message: 'Paiement introuvable pour cette commande PayPal.' });
    }

    const completed = result.status === 'COMPLETED';
    payment.status = completed ? 'Payé' : 'Échoué';
    payment.rawResponse = JSON.stringify(result);
    await payment.save();

    if (completed) {
      const order = await Order.findByPk(payment.orderId);
      if (order && order.paymentStatus !== 'Payé') {
        order.paymentStatus = 'Payé';
        await order.save();
      }
    }

    return res.json({
      message: completed ? 'Paiement PayPal confirmé.' : 'Paiement PayPal non finalisé.',
      status: result.status,
    });
  } catch (err) {
    return next(err);
  }
}

/* ============================================================
 * MOBILE MONEY (Orange / MTN / Moov / Wave) — SIMULATION
 * ------------------------------------------------------------
 * ⚠️ Aucune passerelle réelle n'est branchée ici : ces opérateurs exigent un compte
 * marchand agréé, obtenu directement auprès d'eux (démarches administratives, pas
 * une simple clé API publique). Ce flux simule le parcours utilisateur — à remplacer
 * par leurs API officielles une fois votre compte marchand actif.
 * ============================================================ */
async function mobileMoneyInitiate(req, res, next) {
  try {
    const { orderId, provider } = req.body;
    if (!MOBILE_MONEY_PROVIDERS.includes(provider)) {
      return res.status(422).json({ message: 'Opérateur Mobile Money invalide.' });
    }
    const { order, error } = await getOrderForUser(orderId, req.user);
    if (error) return res.status(error.status).json({ message: error.message });
    if (order.paymentStatus === 'Payé') {
      return res.status(409).json({ message: 'Cette commande est déjà payée.' });
    }

    const reference = `MM-${Math.floor(100000 + Math.random() * 900000)}`;
    const payment = await Payment.create({
      orderId: order.id,
      provider,
      status: 'En attente',
      amount: order.total,
      currency: 'XOF',
      providerReference: reference,
    });

    return res.status(201).json({
      message: `Simulation : une demande de paiement ${PROVIDER_LABELS[provider]} a été envoyée. Confirmez-la depuis votre téléphone.`,
      paymentId: payment.id,
      reference,
    });
  } catch (err) {
    return next(err);
  }
}

// Simule la confirmation qui arriverait normalement via le webhook de l'opérateur.
// Réservé aux admins tant qu'aucune vraie intégration n'est branchée (aucune signature à vérifier ici).
async function mobileMoneyConfirm(req, res, next) {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ message: 'Paiement introuvable.' });

    payment.status = 'Payé';
    await payment.save();

    const order = await Order.findByPk(payment.orderId);
    if (order && order.paymentStatus !== 'Payé') {
      order.paymentStatus = 'Payé';
      await order.save();
    }

    return res.json({ message: 'Paiement confirmé (simulation).', payment });
  } catch (err) {
    return next(err);
  }
}

/* ============================================================
 * CONSULTATION
 * ============================================================ */
async function listForOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { order, error } = await getOrderForUser(orderId, req.user);
    if (error) return res.status(error.status).json({ message: error.message });
    const payments = await Payment.findAll({ where: { orderId: order.id }, order: [['createdAt', 'DESC']] });
    return res.json({ payments });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  stripeCreateSession,
  stripeWebhook,
  paypalCreateOrder,
  paypalCapture,
  mobileMoneyInitiate,
  mobileMoneyConfirm,
  listForOrder,
};
