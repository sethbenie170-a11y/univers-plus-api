const { sequelize, CartItem, Product, Order, OrderItem, PromoCode, User } = require('../models');
const { ORDER_STATUSES } = require('../models/order.model');
const { SHIPPING_THRESHOLD, SHIPPING_FEE } = require('./cart.controller');

function generateOrderNumber() {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `UP-${digits}`;
}

async function checkPromoCode(code) {
  if (!code) return { discountPercent: 0, code: null };
  const promo = await PromoCode.findOne({ where: { code: String(code).toUpperCase() } });
  if (!promo || !promo.active) {
    const err = new Error('Code promo invalide ou expiré.');
    err.status = 422;
    throw err;
  }
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    const err = new Error('Ce code promo a expiré.');
    err.status = 422;
    throw err;
  }
  return { discountPercent: promo.discountPercent, code: promo.code };
}

// ---------- Checkout : transforme le panier en commande ----------
async function createOrder(req, res, next) {
  const { paymentMethod, promoCode, shippingName, shippingPhone, shippingCity, shippingCommune, shippingDetails } = req.body;

  if (!paymentMethod) return res.status(422).json({ message: 'Le moyen de paiement est requis.' });
  if (!shippingName || !shippingPhone || !shippingCity) {
    return res.status(422).json({ message: "L'adresse de livraison est incomplète (nom, téléphone et ville requis)." });
  }

  const t = await sequelize.transaction();
  try {
    const cartItems = await CartItem.findAll({
      where: { userId: req.user.id },
      include: [Product],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!cartItems.length) {
      await t.rollback();
      return res.status(400).json({ message: 'Votre panier est vide.' });
    }

    // Vérification du stock pour chaque article avant toute écriture.
    for (const item of cartItems) {
      if (!item.Product || !item.Product.isActive) {
        await t.rollback();
        return res.status(409).json({ message: "Un produit de votre panier n'est plus disponible." });
      }
      if (item.quantity > item.Product.stock) {
        await t.rollback();
        return res.status(409).json({
          message: `Stock insuffisant pour "${item.Product.name}" (${item.Product.stock} disponible(s)).`,
        });
      }
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.Product.price * item.quantity, 0);

    let discountPercent = 0;
    let appliedCode = null;
    if (promoCode) {
      const result = await checkPromoCode(promoCode);
      discountPercent = result.discountPercent;
      appliedCode = result.code;
    }
    const discount = Math.round((subtotal * discountPercent) / 100);
    const afterDiscount = subtotal - discount;
    const shippingFee = afterDiscount >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = afterDiscount + shippingFee;

    // Génère un numéro de commande unique (collision extrêmement improbable, mais on vérifie).
    let orderNumber = generateOrderNumber();
    // eslint-disable-next-line no-await-in-loop
    while (await Order.findOne({ where: { orderNumber }, transaction: t })) {
      orderNumber = generateOrderNumber();
    }

    const order = await Order.create(
      {
        orderNumber,
        userId: req.user.id,
        status: 'Préparation',
        paymentMethod,
        paymentStatus: 'En attente',
        promoCode: appliedCode,
        subtotal,
        discount,
        shippingFee,
        total,
        shippingName,
        shippingPhone,
        shippingCity,
        shippingCommune: shippingCommune || null,
        shippingDetails: shippingDetails || null,
      },
      { transaction: t }
    );

    for (const item of cartItems) {
      // eslint-disable-next-line no-await-in-loop
      await OrderItem.create(
        {
          orderId: order.id,
          productId: item.productId,
          productName: item.Product.name,
          unitPrice: item.Product.price,
          quantity: item.quantity,
          lineTotal: item.Product.price * item.quantity,
        },
        { transaction: t }
      );
      item.Product.stock -= item.quantity;
      // eslint-disable-next-line no-await-in-loop
      await item.Product.save({ transaction: t });
    }

    await CartItem.destroy({ where: { userId: req.user.id }, transaction: t });

    await t.commit();

    const fullOrder = await Order.findByPk(order.id, { include: [OrderItem] });
    return res.status(201).json({ message: 'Commande créée avec succès.', order: fullOrder });
  } catch (err) {
    await t.rollback();
    return next(err);
  }
}

// ---------- Historique des commandes ----------
async function listOrders(req, res, next) {
  try {
    const { status, page = 1, limit = 10, all } = req.query;
    const where = {};
    if (status) where.status = status;

    // Un admin peut consulter toutes les commandes avec ?all=true ; sinon on ne voit que les siennes.
    if (!(req.user.role === 'admin' && all === 'true')) {
      where.userId = req.user.id;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));

    const { rows, count } = await Order.findAndCountAll({
      where,
      include: [OrderItem, { model: User, attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });

    return res.json({
      orders: rows,
      pagination: { page: pageNum, limit: limitNum, total: count, totalPages: Math.ceil(count / limitNum) },
    });
  } catch (err) {
    return next(err);
  }
}

async function getOrder(req, res, next) {
  try {
    const order = await Order.findByPk(req.params.id, { include: [OrderItem, { model: User, attributes: ['id', 'name', 'email'] }] });
    if (!order) return res.status(404).json({ message: 'Commande introuvable.' });
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Vous n'avez pas accès à cette commande." });
    }
    return res.json({ order });
  } catch (err) {
    return next(err);
  }
}

// ---------- Mise à jour du statut (admin) ----------
async function updateStatus(req, res, next) {
  const { status } = req.body;
  if (!ORDER_STATUSES.includes(status)) {
    return res.status(422).json({ message: `Statut invalide. Valeurs possibles : ${ORDER_STATUSES.join(', ')}.` });
  }

  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { include: [OrderItem], transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Commande introuvable.' });
    }

    const wasAlreadyCancelled = order.status === 'Annulée';

    // Si on annule une commande qui ne l'était pas déjà, on remet les articles en stock.
    if (status === 'Annulée' && !wasAlreadyCancelled) {
      for (const item of order.OrderItems) {
        // eslint-disable-next-line no-await-in-loop
        await Product.increment('stock', { by: item.quantity, where: { id: item.productId }, transaction: t });
      }
    }

    // Génère un numéro de suivi dès le passage à "Expédiée" s'il n'en a pas encore.
    if (status === 'Expédiée' && !order.trackingNumber) {
      order.trackingNumber = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
    }
    if (status === 'Livrée' && order.paymentStatus === 'En attente') {
      order.paymentStatus = 'Payé';
    }

    order.status = status;
    await order.save({ transaction: t });
    await t.commit();

    return res.json({ message: 'Statut de la commande mis à jour.', order });
  } catch (err) {
    await t.rollback();
    return next(err);
  }
}

module.exports = { createOrder, listOrders, getOrder, updateStatus };
