const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PAYMENT_PROVIDERS = ['stripe', 'paypal', 'orange_money', 'mtn_money', 'moov_money', 'wave'];
const PAYMENT_STATUSES = ['En attente', 'Payé', 'Échoué'];

const Payment = sequelize.define(
  'Payment',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    provider: { type: DataTypes.ENUM(...PAYMENT_PROVIDERS), allowNull: false },
    status: { type: DataTypes.ENUM(...PAYMENT_STATUSES), allowNull: false, defaultValue: 'En attente' },
    amount: { type: DataTypes.INTEGER, allowNull: false }, // toujours en FCFA, quel que soit le fournisseur
    currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'XOF' },
    providerReference: { type: DataTypes.STRING, allowNull: true }, // id de session Stripe, de commande PayPal, etc.
    rawResponse: { type: DataTypes.TEXT, allowNull: true }, // trace brute utile pour le débogage/l'audit
  },
  {
    tableName: 'payments',
    timestamps: true,
  }
);

module.exports = { Payment, PAYMENT_PROVIDERS, PAYMENT_STATUSES };
