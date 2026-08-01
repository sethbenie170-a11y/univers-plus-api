'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('promo_codes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      discountPercent: { type: Sequelize.INTEGER, allowNull: false },
      description: { type: Sequelize.STRING, allowNull: true },
      active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      expiresAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('promo_codes');
  },
};
