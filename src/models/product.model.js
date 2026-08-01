const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    brand: { type: DataTypes.STRING, allowNull: true },
    price: { type: DataTypes.INTEGER, allowNull: false }, // FCFA, montant entier
    oldPrice: { type: DataTypes.INTEGER, allowNull: true },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    rating: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    reviewsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    imageEmoji: { type: DataTypes.STRING, allowNull: true, defaultValue: '📦' },
    imageUrl: { type: DataTypes.STRING, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'products',
    timestamps: true,
    indexes: [{ fields: ['categoryId'] }, { fields: ['isActive'] }],
  }
);

module.exports = Product;
