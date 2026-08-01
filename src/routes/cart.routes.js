const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const cartController = require('../controllers/cart.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:productId', cartController.updateItem);
router.delete('/items/:productId', cartController.removeItem);
router.delete('/', cartController.clearCart);

module.exports = router;
