const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');

beforeAll(async () => {
  // Base SQLite en mémoire, recréée à chaque exécution des tests (voir package.json → "test").
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Authentification', () => {
  const user = {
    name: 'Fatou Bamba',
    email: 'fatou.test@example.ci',
    password: 'motdepasse123',
    phone: '+225 07 12 34 56 78',
  };

  let accessToken;
  let refreshToken;

  test("POST /api/auth/register crée un compte et renvoie des tokens", async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(user.email.toLowerCase());
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  test('POST /api/auth/register refuse un e-mail déjà utilisé', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(409);
  });

  test('POST /api/auth/register refuse un mot de passe trop court', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...user, email: 'autre@example.ci', password: '123' });
    expect(res.status).toBe(422);
  });

  test('POST /api/auth/login refuse un mauvais mot de passe', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'mauvais-mot-de-passe' });
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/login réussit avec les bons identifiants', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  test('GET /api/auth/me refuse une requête sans token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me renvoie le profil avec un token valide', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email.toLowerCase());
  });

  test('POST /api/auth/refresh renvoie une nouvelle paire de tokens', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.refreshToken).not.toBe(refreshToken); // rotation : l'ancien token est invalidé
  });

  test("l'ancien refresh token ne fonctionne plus après rotation", async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/logout révoque le refresh token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: user.password });
    const logout = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken: login.body.refreshToken });
    expect(logout.status).toBe(200);

    const retry = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.refreshToken });
    expect(retry.status).toBe(401);
  });
});
