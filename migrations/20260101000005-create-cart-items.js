'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cart_items', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      userId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
      },
      productId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'products', key: 'id' }, onDelete: 'CASCADE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('cart_items', ['userId', 'productId'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('cart_items');
  },
};
