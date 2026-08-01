'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      brand: { type: Sequelize.STRING, allowNull: true },
      price: { type: Sequelize.INTEGER, allowNull: false },
      oldPrice: { type: Sequelize.INTEGER, allowNull: true },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      rating: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      reviewsCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      imageEmoji: { type: Sequelize.STRING, allowNull: true, defaultValue: '📦' },
      imageUrl: { type: Sequelize.STRING, allowNull: true },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      categoryId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'categories', key: 'id' }, onDelete: 'RESTRICT',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('products', ['categoryId']);
    await queryInterface.addIndex('products', ['isActive']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};
