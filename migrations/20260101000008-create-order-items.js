'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_items', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      productName: { type: Sequelize.STRING, allowNull: false },
      unitPrice: { type: Sequelize.INTEGER, allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false },
      lineTotal: { type: Sequelize.INTEGER, allowNull: false },
      orderId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE',
      },
      productId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'products', key: 'id' }, onDelete: 'RESTRICT',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('order_items');
  },
};
