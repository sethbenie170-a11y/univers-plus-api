'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      provider: {
        type: Sequelize.ENUM('stripe', 'paypal', 'orange_money', 'mtn_money', 'moov_money', 'wave'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('En attente', 'Payé', 'Échoué'),
        allowNull: false, defaultValue: 'En attente',
      },
      amount: { type: Sequelize.INTEGER, allowNull: false },
      currency: { type: Sequelize.STRING, allowNull: false, defaultValue: 'XOF' },
      providerReference: { type: Sequelize.STRING, allowNull: true },
      rawResponse: { type: Sequelize.TEXT, allowNull: true },
      orderId: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE',
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('payments');
  },
};
