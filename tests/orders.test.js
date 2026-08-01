const request = require('supertest');
const app = require('../src/app');
const { sequelize, User, Category, Product } = require('../src/models');
const bcrypt = require('bcrypt');

let clientToken;
let adminToken;
let productId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const category = await Category.create({ name: 'Sport', slug: 'sport', emoji: '🧘' });
  const product = await Product.create({
    name: 'Tapis de Yoga Test',
    slug: 'tapis-de-yoga-test',
    price: 10000,
    stock: 5,
    categoryId: category.id,
  });
  productId = product.id;

  const passwordHash = await bcrypt.hash('adminpass123', 12);
  await User.create({ name: 'Admin', email: 'admin.orders@example.ci', passwordHash, role: 'admin' });
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin.orders@example.ci', password: 'adminpass123' });
  adminToken = adminLogin.body.accessToken;

  const clientRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Client Orders', email: 'client.orders@example.ci', password: 'motdepasse123' });
  clientToken = clientRes.body.accessToken;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Panier', () => {
  test('POST /api/cart/items refuse une quantité supérieure au stock', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ productId, quantity: 99 });
    expect(res.status).toBe(409);
  });

  test('POST /api/cart/items ajoute un article valide', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ productId, quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.subtotal).toBe(20000);
  });

  test('GET /api/cart renvoie le panier avec les totaux', async () => {
    const res = await request(app).get('/api/cart').set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.shippingFee).toBe(2500); // sous le seuil de livraison gratuite (50 000 FCFA)
  });
});

describe('Commandes', () => {
  const shippingAddress = {
    shippingName: 'Fatou Bamba',
    shippingPhone: '+225 07 12 34 56 78',
    shippingCity: 'Abidjan',
    shippingCommune: 'Cocody',
  };

  test('POST /api/orders refuse une commande sans adresse complète', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ paymentMethod: 'Orange Money' });
    expect(res.status).toBe(422);
  });

  test('POST /api/orders transforme le panier en commande et décrémente le stock', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ paymentMethod: 'Orange Money', ...shippingAddress });
    expect(res.status).toBe(201);
    expect(res.body.order.status).toBe('Préparation');
    expect(res.body.order.total).toBe(22500); // 20000 + 2500 de livraison

    const product = await Product.findByPk(productId);
    expect(product.stock).toBe(3); // 5 - 2
  });

  test('le panier est vidé après la commande', async () => {
    const res = await request(app).get('/api/cart').set('Authorization', `Bearer ${clientToken}`);
    expect(res.body.items).toHaveLength(0);
  });

  test('POST /api/orders refuse une commande sur un panier vide', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ paymentMethod: 'Orange Money', ...shippingAddress });
    expect(res.status).toBe(400);
  });

  test('GET /api/orders renvoie les commandes du client connecté', async () => {
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
  });

  test("PUT /api/orders/:id/status refuse un client (réservé à l'admin)", async () => {
    const orders = await request(app).get('/api/orders').set('Authorization', `Bearer ${clientToken}`);
    const orderId = orders.body.orders[0].id;
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'Expédiée' });
    expect(res.status).toBe(403);
  });

  test('PUT /api/orders/:id/status passe la commande à "Expédiée" et génère un numéro de suivi', async () => {
    const orders = await request(app).get('/api/orders').set('Authorization', `Bearer ${clientToken}`);
    const orderId = orders.body.orders[0].id;
    const res = await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Expédiée' });
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('Expédiée');
    expect(res.body.order.trackingNumber).toMatch(/^TRK-/);
  });

  test('annuler une commande remet le stock', async () => {
    const orders = await request(app).get('/api/orders').set('Authorization', `Bearer ${clientToken}`);
    const orderId = orders.body.orders[0].id;
    await request(app)
      .put(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'Annulée' });

    const product = await Product.findByPk(productId);
    expect(product.stock).toBe(5); // remis à son niveau initial
  });
});

describe('Codes promo', () => {
  test('POST /api/promotions/validate refuse un code inexistant', async () => {
    const res = await request(app).post('/api/promotions/validate').send({ code: 'INEXISTANT' });
    expect(res.status).toBe(404);
  });
});
