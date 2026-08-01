const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// On ne stocke jamais le jeton en clair : uniquement son empreinte SHA-256 (voir utils/hash.js).
const RefreshToken = sequelize.define(
  'RefreshToken',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tokenHash: { type: DataTypes.STRING, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    tableName: 'refresh_tokens',
    timestamps: true,
  }
);

module.exports = RefreshToken;
