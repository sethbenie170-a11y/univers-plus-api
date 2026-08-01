const { PromoCode } = require('../models');

async function list(req, res, next) {
  try {
    const promos = await PromoCode.findAll({ order: [['createdAt', 'DESC']] });
    return res.json({ promotions: promos });
  } catch (err) {
    return next(err);
  }
}

// Route publique utilisée par le panier pour vérifier un code avant de finaliser la commande.
async function validateCode(req, res, next) {
  try {
    const { code } = req.body;
    if (!code) return res.status(422).json({ message: 'Le code promo est requis.' });
    const promo = await PromoCode.findOne({ where: { code: String(code).toUpperCase() } });
    if (!promo || !promo.active) {
      return res.status(404).json({ message: 'Code promo invalide ou inactif.' });
    }
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return res.status(410).json({ message: 'Ce code promo a expiré.' });
    }
    return res.json({
      code: promo.code,
      discountPercent: promo.discountPercent,
      description: promo.description,
    });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const { code, discountPercent, description, active, expiresAt } = req.body;
    const upperCode = String(code).toUpperCase();
    const existing = await PromoCode.findOne({ where: { code: upperCode } });
    if (existing) return res.status(409).json({ message: 'Ce code promo existe déjà.' });

    const promo = await PromoCode.create({
      code: upperCode,
      discountPercent,
      description: description || null,
      active: active === undefined ? true : Boolean(active),
      expiresAt: expiresAt || null,
    });
    return res.status(201).json({ message: 'Promotion créée.', promotion: promo });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const promo = await PromoCode.findByPk(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Promotion introuvable.' });

    const fields = ['discountPercent', 'description', 'active', 'expiresAt'];
    for (const field of fields) {
      if (req.body[field] !== undefined) promo[field] = req.body[field];
    }
    if (req.body.code) promo.code = String(req.body.code).toUpperCase();

    await promo.save();
    return res.json({ message: 'Promotion mise à jour.', promotion: promo });
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const promo = await PromoCode.findByPk(req.params.id);
    if (!promo) return res.status(404).json({ message: 'Promotion introuvable.' });
    await promo.destroy();
    return res.json({ message: 'Promotion supprimée.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, validateCode, create, update, remove };
