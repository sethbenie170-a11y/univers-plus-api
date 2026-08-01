const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// On garde un instantané du nom et du prix au moment de la commande :
// si le produit change de prix ou de nom plus tard, l'historique de commande reste fidèle.
const OrderItem = sequelize.define(
  'OrderItem',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productName: { type: DataTypes.STRING, allowNull: false },
    unitPrice: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    lineTotal: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: 'order_items',
    timestamps: true,
  }
);

module.exports = OrderItem;
