// Configuration lue par Sequelize CLI (npx sequelize-cli db:migrate, etc.).
// Ce fichier est séparé de src/config/database.js (utilisé par l'application elle-même)
// car le CLI attend un format spécifique (un objet par environnement).
require('dotenv').config();

const sqlite = {
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || './data/dev.sqlite',
  logging: false,
};

const postgres = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: false,
};

const base = process.env.DB_DIALECT === 'sqlite' ? sqlite : postgres;

module.exports = {
  development: base,
  test: { dialect: 'sqlite', storage: ':memory:', logging: false },
  production: {
    ...postgres,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  },
};
