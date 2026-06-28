const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const IdempotencyKey = sequelize.define('IdempotencyKey', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  key: { type: DataTypes.STRING, allowNull: false, unique: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  endpoint: { type: DataTypes.STRING, allowNull: false },
  responseStatus: { type: DataTypes.INTEGER, allowNull: true },
  responseBody: { type: DataTypes.JSONB, allowNull: true },
  status: { 
    type: DataTypes.ENUM('PROCESSING', 'COMPLETED', 'FAILED'), 
    defaultValue: 'PROCESSING' 
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['key'], unique: true }
  ]
});

module.exports = IdempotencyKey;
