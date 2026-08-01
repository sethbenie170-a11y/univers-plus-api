const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone: { type: DataTypes.STRING, allowNull: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: {
      type: DataTypes.ENUM('client', 'admin'),
      defaultValue: 'client',
      allowNull: false,
    },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
  },
  {
    tableName: 'users',
    timestamps: true,
  }
);

module.exports = User;
