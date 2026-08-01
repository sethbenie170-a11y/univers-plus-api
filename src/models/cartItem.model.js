const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CartItem = sequelize.define(
  'CartItem',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  },
  {
    tableName: 'cart_items',
    timestamps: true,
    indexes: [{ unique: true, fields: ['userId', 'productId'] }],
  }
);

module.exports = CartItem;
