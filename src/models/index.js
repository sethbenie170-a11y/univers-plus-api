const sequelize = require('../config/database');
const User = require('./user.model');
const RefreshToken = require('./refreshToken.model');
const Category = require('./category.model');
const Product = require('./product.model');
const CartItem = require('./cartItem.model');
const PromoCode = require('./promoCode.model');
const { Order } = require('./order.model');
const OrderItem = require('./orderItem.model');
const { Payment } = require('./payment.model');

User.hasMany(RefreshToken, { foreignKey: 'userId', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

Category.hasMany(Product, { foreignKey: 'categoryId', onDelete: 'RESTRICT' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

User.hasMany(CartItem, { foreignKey: 'userId', onDelete: 'CASCADE' });
CartItem.belongsTo(User, { foreignKey: 'userId' });
Product.hasMany(CartItem, { foreignKey: 'productId', onDelete: 'CASCADE' });
CartItem.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(Order, { foreignKey: 'userId', onDelete: 'RESTRICT' });
Order.belongsTo(User, { foreignKey: 'userId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
Product.hasMany(OrderItem, { foreignKey: 'productId', onDelete: 'RESTRICT' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

Order.hasMany(Payment, { foreignKey: 'orderId', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { foreignKey: 'orderId' });

module.exports = {
  sequelize, User, RefreshToken, Category, Product,
  CartItem, PromoCode, Order, OrderItem, Payment,
};
