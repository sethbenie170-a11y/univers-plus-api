const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PromoCode = sequelize.define(
  'PromoCode',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING, allowNull: false, unique: true },
    discountPercent: { type: DataTypes.INTEGER, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'promo_codes',
    timestamps: true,
  }
);

module.exports = PromoCode;
