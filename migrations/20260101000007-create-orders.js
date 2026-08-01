'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      orderNumber: { type: Sequelize.STRING, allowNull: false, unique: true },
      status: {
        type: Sequelize.ENUM('Préparation', 'Expédiée', 'En livraison', 'Livrée', 'Annulée'),
        allowNull: false, defaultValue: 'Préparation',
      },
      paymentMethod: { type: Sequelize.STRING, allowNull: false },
      paymentStatus: {
        type: Sequelize.ENUM('En attente', 'Payé', 'Échoué'),
        allowNull: false, defaultValue: 'En attente',
      },
      promoCode: { type: Sequelize.STRING, allowNull: true },
      subtotal: { type: Sequelize.INTEGER, allowNull: false },
      discount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      shippingFee: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      total: { type: Sequelize.INTEGER, allowNull: false },
      trackingNumber: { type: Sequelize.STRING, allowNull: true },
      shippingName: { type: Sequelize.STRING, allowNull: false },
      shippingPhone: { type: Sequelize.STRING, allowNull: false },
      shippingCity: { type: Sequelize.STRING, allowNull: false },
      shippingCommune: { type: Sequelize.STRING, allowNull: true },
      shippingDetails: { type: Sequelize.STRING, allowNull: true },
      userId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'RESTRICT',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('orders');
  },
};
