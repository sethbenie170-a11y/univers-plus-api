const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { requireAuth, requireRole } = require('../middleware/auth.middleware');
const categoryController = require('../controllers/category.controller');

const router = express.Router();

router.get('/', categoryController.list);

router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  [body('name').trim().notEmpty().withMessage('Le nom de la catégorie est requis.')],
  validate,
  categoryController.create
);

router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  categoryController.update
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  categoryController.remove
);

module.exports = router;
