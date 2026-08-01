const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const promoRoutes = require('./routes/promo.routes');
const paymentRoutes = require('./routes/payment.routes');
const { stripeWebhook } = require('./controllers/payment.controller');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));

// IMPORTANT : le webhook Stripe doit être monté AVANT express.json(), avec un
// parseur "raw", car Stripe vérifie la signature sur le corps brut de la requête.
// Si express.json() passe en premier, la vérification de signature échoue toujours.
app.post('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'univers-plus-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/promotions', promoRoutes);
app.use('/api/payments', paymentRoutes);

// 404 pour toute route non définie
app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable.' });
});

// Doit rester le dernier middleware
app.use(errorHandler);

module.exports = app;
