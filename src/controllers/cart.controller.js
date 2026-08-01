const { CartItem, Product, Category } = require('../models');

const SHIPPING_THRESHOLD = 50000;
const SHIPPING_FEE = 2500;

async function buildCartResponse(userId) {
  const items = await CartItem.findAll({
    where: { userId },
    include: [{ model: Product, include: [{ model: Category, attributes: ['id', 'name', 'slug', 'emoji'] }] }],
    order: [['createdAt', 'ASC']],
  });

  const lines = items
    .filter((item) => item.Product) // ignore les lignes dont le produit aurait été supprimé
    .map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      product: item.Product,
      lineTotal: item.Product.price * item.quantity,
    }));

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const shippingFee = subtotal === 0 ? 0 : subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  return {
    items: lines,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
  };
}

async function getCart(req, res, next) {
  try {
    const cart = await buildCartResponse(req.user.id);
    return res.json(cart);
  } catch (err) {
    return next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId || quantity < 1) {
      return res.status(422).json({ message: 'Produit et quantité valide requis.' });
    }
    const product = await Product.findByPk(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Produit introuvable.' });
    }

    let item = await CartItem.findOne({ where: { userId: req.user.id, productId } });
    const desiredQty = (item ? item.quantity : 0) + Number(quantity);
    if (desiredQty > product.stock) {
      return res.status(409).json({ message: `Stock insuffisant : il ne reste que ${product.stock} unité(s) de "${product.name}".` });
    }

    if (item) {
      item.quantity = desiredQty;
      await item.save();
    } else {
      item = await CartItem.create({ userId: req.user.id, productId, quantity: Number(quantity) });
    }

    const cart = await buildCartResponse(req.user.id);
    return res.status(201).json(cart);
  } catch (err) {
    return next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const { productId } = req.params;
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(422).json({ message: 'La quantité doit être un entier positif.' });
    }
    const item = await CartItem.findOne({ where: { userId: req.user.id, productId } });
    if (!item) return res.status(404).json({ message: 'Cet article ne figure pas dans votre panier.' });

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Produit introuvable.' });
    if (quantity > product.stock) {
      return res.status(409).json({ message: `Stock insuffisant : il ne reste que ${product.stock} unité(s).` });
    }

    item.quantity = quantity;
    await item.save();
    const cart = await buildCartResponse(req.user.id);
    return res.json(cart);
  } catch (err) {
    return next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const { productId } = req.params;
    await CartItem.destroy({ where: { userId: req.user.id, productId } });
    const cart = await buildCartResponse(req.user.id);
    return res.json(cart);
  } catch (err) {
    return next(err);
  }
}

async function clearCart(req, res, next) {
  try {
    await CartItem.destroy({ where: { userId: req.user.id } });
    return res.json({ items: [], subtotal: 0, shippingFee: 0, total: 0 });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, buildCartResponse, SHIPPING_THRESHOLD, SHIPPING_FEE };
