const { Op } = require('sequelize');
const { Product, Category } = require('../models');
const { slugify } = require('../utils/slugify');

const SORT_MAP = {
  price_asc: [['price', 'ASC']],
  price_desc: [['price', 'DESC']],
  newest: [['createdAt', 'DESC']],
  rating: [['rating', 'DESC']],
  popularity: [['reviewsCount', 'DESC']],
};

async function list(req, res, next) {
  try {
    const {
      category, // slug de catégorie
      search,
      brand,
      minPrice,
      maxPrice,
      inStock,
      sort = 'popularity',
      page = 1,
      limit = 12,
    } = req.query;

    const where = { isActive: true };

    if (search) {
      // iLike (insensible à la casse) n'existe que sous PostgreSQL ; on retombe sur like sinon.
      const dialect = Product.sequelize.getDialect();
      const operator = dialect === 'postgres' ? Op.iLike : Op.like;
      where.name = { [operator]: `%${search}%` };
    }
    if (brand) {
      where.brand = brand;
    }
    if (inStock === 'true') {
      where.stock = { [Op.gt]: 0 };
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = Number(minPrice);
      if (maxPrice) where.price[Op.lte] = Number(maxPrice);
    }

    const include = [{ model: Category, attributes: ['id', 'name', 'slug', 'emoji'] }];
    if (category) {
      include[0].where = { slug: category };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(48, Math.max(1, Number(limit) || 12));
    const offset = (pageNum - 1) * limitNum;

    const { rows, count } = await Product.findAndCountAll({
      where,
      include,
      order: SORT_MAP[sort] || SORT_MAP.popularity,
      limit: limitNum,
      offset,
    });

    return res.json({
      products: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages: Math.ceil(count / limitNum),
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: Category, attributes: ['id', 'name', 'slug', 'emoji'] }],
    });
    if (!product) return res.status(404).json({ message: 'Produit introuvable.' });
    return res.json({ product });
  } catch (err) {
    return next(err);
  }
}

async function create(req, res, next) {
  try {
    const {
      name, description, brand, price, oldPrice, stock,
      categoryId, imageEmoji, imageUrl, isActive,
    } = req.body;

    const category = await Category.findByPk(categoryId);
    if (!category) return res.status(422).json({ message: 'Catégorie invalide.' });

    let slug = slugify(name);
    const existing = await Product.findOne({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString().slice(-5)}`;

    const product = await Product.create({
      name, slug, description: description || null, brand: brand || null,
      price, oldPrice: oldPrice || null, stock: stock || 0,
      categoryId, imageEmoji: imageEmoji || '📦', imageUrl: imageUrl || null,
      isActive: isActive === undefined ? true : Boolean(isActive),
    });
    return res.status(201).json({ message: 'Produit créé.', product });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit introuvable.' });

    const fields = ['name', 'description', 'brand', 'price', 'oldPrice', 'stock', 'categoryId', 'imageEmoji', 'imageUrl', 'isActive'];
    if (req.body.categoryId) {
      const category = await Category.findByPk(req.body.categoryId);
      if (!category) return res.status(422).json({ message: 'Catégorie invalide.' });
    }
    for (const field of fields) {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    }
    if (req.body.name) product.slug = slugify(req.body.name);

    await product.save();
    return res.json({ message: 'Produit mis à jour.', product });
  } catch (err) {
    return next(err);
  }
}

async function remove(req, res, next) {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produit introuvable.' });
    await product.destroy();
    return res.json({ message: 'Produit supprimé.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { list, getOne, create, update, remove };
