const request = require('supertest');
const app = require('../src/app');
const { sequelize, User } = require('../src/models');
const bcrypt = require('bcrypt');

let adminToken;
let categoryId;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Crée directement un compte admin en base (plus rapide qu'un register + promotion manuelle).
  const passwordHash = await bcrypt.hash('adminpass123', 12);
  await User.create({
    name: 'Admin Test',
    email: 'admin.test@example.ci',
    passwordHash,
    role: 'admin',
  });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin.test@example.ci', password: 'adminpass123' });
  adminToken = login.body.accessToken;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Catégories', () => {
  test('POST /api/categories refuse un utilisateur non authentifié', async () => {
    const res = await request(app).post('/api/categories').send({ name: 'Électronique' });
    expect(res.status).toBe(401);
  });

  test('POST /api/categories crée une catégorie (admin)', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Électronique', emoji: '🔌' });
    expect(res.status).toBe(201);
    expect(res.body.category.slug).toBe('electronique');
    categoryId = res.body.category.id;
  });

  test('GET /api/categories est accessible publiquement', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.categories.length).toBeGreaterThan(0);
  });
});

describe('Produits', () => {
  let productId;

  test('POST /api/products refuse un prix négatif', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Casque Test', price: -100, categoryId });
    expect(res.status).toBe(422);
  });

  test('POST /api/products crée un produit (admin)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Casque Sans Fil Test', price: 24990, stock: 10, categoryId });
    expect(res.status).toBe(201);
    expect(res.body.product.slug).toBe('casque-sans-fil-test');
    productId = res.body.product.id;
  });

  test('GET /api/products liste les produits publiquement, avec pagination', async () => {
    const res = await request(app).get('/api/products?limit=5&page=1');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeGreaterThan(0);
    expect(res.body.pagination.page).toBe(1);
  });

  test('GET /api/products filtre par catégorie', async () => {
    const res = await request(app).get('/api/products?category=electronique');
    expect(res.status).toBe(200);
    expect(res.body.products.every((p) => p.Category.slug === 'electronique')).toBe(true);
  });

  test('GET /api/products/:id renvoie le détail', async () => {
    const res = await request(app).get(`/api/products/${productId}`);
    expect(res.status).toBe(200);
    expect(res.body.product.name).toBe('Casque Sans Fil Test');
  });

  test('DELETE /api/products/:id refuse un client non-admin', async () => {
    const clientRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Client Test', email: 'client.test@example.ci', password: 'motdepasse123' });
    const res = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${clientRes.body.accessToken}`);
    expect(res.status).toBe(403);
  });
});
