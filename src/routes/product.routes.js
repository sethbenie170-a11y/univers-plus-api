const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const productController = require('../controllers/product.controller');

const router = express.Router();

router.get('/', productController.list);
router.get('/:id', productController.getOne);

const productRules = [
  body('name').trim().notEmpty().withMessage('Le nom du produit est requis.'),
  body('price').isInt({ min: 0 }).withMessage('Le prix doit être un nombre entier positif.'),
  body('oldPrice').optional({ checkFalsy: true }).isInt({ min: 0 }),
  body('stock').optional({ checkFalsy: true }).isInt({ min: 0 }),
  body('categoryId').isInt().withMessage('La catégorie est requise.'),
];

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  productRules,
  validate,
  productController.create
);

router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  productController.update
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  productController.remove
);

module.exports = router;
