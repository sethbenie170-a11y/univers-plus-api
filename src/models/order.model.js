const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ORDER_STATUSES = ['Préparation', 'Expédiée', 'En livraison', 'Livrée', 'Annulée'];
const PAYMENT_STATUSES = ['En attente', 'Payé', 'Échoué'];

const Order = sequelize.define(
  'Order',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    status: { type: DataTypes.ENUM(...ORDER_STATUSES), allowNull: false, defaultValue: 'Préparation' },
    paymentMethod: { type: DataTypes.STRING, allowNull: false },
    paymentStatus: { type: DataTypes.ENUM(...PAYMENT_STATUSES), allowNull: false, defaultValue: 'En attente' },
    promoCode: { type: DataTypes.STRING, allowNull: true },
    subtotal: { type: DataTypes.INTEGER, allowNull: false },
    discount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    shippingFee: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    total: { type: DataTypes.INTEGER, allowNull: false },
    trackingNumber: { type: DataTypes.STRING, allowNull: true },
    shippingName: { type: DataTypes.STRING, allowNull: false },
    shippingPhone: { type: DataTypes.STRING, allowNull: false },
    shippingCity: { type: DataTypes.STRING, allowNull: false },
    shippingCommune: { type: DataTypes.STRING, allowNull: true },
    shippingDetails: { type: DataTypes.STRING, allowNull: true },
  },
  {
    tableName: 'orders',
    timestamps: true,
  }
);

module.exports = { Order, ORDER_STATUSES, PAYMENT_STATUSES };
