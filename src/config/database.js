const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'postgres';

let sequelize;

if (dialect === 'sqlite') {
  // Pratique pour développer/tester rapidement sans installer PostgreSQL.
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './data/dev.sqlite',
    logging: false,
  });
} else {
  // Configuration recommandée pour la production.
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
      dialectOptions:
        process.env.NODE_ENV === 'production'
          ? { ssl: { require: true, rejectUnauthorized: false } }
          : {},
    }
  );
}

module.exports = sequelize;
