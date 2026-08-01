const { Category, Product } = require('../models');
const { slugify } = require('../utils/slugify');

async function list(req, res, next) {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    const counts = await Product.findAll({
      attributes: ['categoryId', [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'count']],
      group: ['categoryId'],
      raw: true,
    });
    const countMap = Object.fromEntries(counts.map((c) => [c.categoryId, Number(c.count)]));
    return res.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        emoji: c.emoji,
        productCount: countMap[c.id] || 0,
      })),
    });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const { name, emoji } = req.body;
    const slug = slugify(name);
    const existing = await Category.findOne({ where: { slug } });
    if (existing) {
      return res.status(409).json({ message: 'Une catégorie avec ce nom existe déjà.' });
    }
    const category = await Category.create({ name, slug, emoji: emoji || '🛍️' });
    return res.status(201).json({ message: 'Catégorie créée.', category });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Catégorie introuvable.' });
    const { name, emoji } = req.body;
    if (name) {
      const slug = slugify(name);
      const existing = await Category.findOne({ where: { slug } });
      if (existing && existing.id !== category.id) {
        return res.status(409).json({ message: 'Une catégorie avec ce nom existe déjà.' });
      }
      category.name = name;
      category.slug = slug;
    }
    if (emoji) category.emoji = emoji;
    await category.save();
    return res.json({ message: 'Catégorie mise à jour.', category });
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Catégorie introuvable.' });
    const productCount = await Product.count({ where: { categoryId: category.id } });
    if (productCount > 0) {
      return res.status(409).json({
        message: `Impossible de supprimer : ${productCount} produit(s) utilisent encore cette catégorie.`,
      });
    }
    await category.destroy();
    return res.json({ message: 'Catégorie supprimée.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, create, update, remove };
