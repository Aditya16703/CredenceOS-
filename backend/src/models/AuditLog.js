const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  actorId: { type: DataTypes.INTEGER, allowNull: true },
  actorRole: { type: DataTypes.STRING, allowNull: true },
  action: { type: DataTypes.STRING, allowNull: false }, // e.g., 'KYC_SUBMIT', 'LOAN_APPROVE', 'PAYMENT_INITIATED'
  entityType: { type: DataTypes.STRING, allowNull: false }, // e.g., 'Loan', 'KYC', 'Payment'
  entityId: { type: DataTypes.INTEGER, allowNull: true },
  previousState: { type: DataTypes.JSONB, allowNull: true },
  newState: { type: DataTypes.JSONB, allowNull: true },
  metadata: { type: DataTypes.JSONB, allowNull: true },
  ipAddress: { type: DataTypes.STRING, allowNull: true }
}, {
  timestamps: true,
  updatedAt: false // Immutable append-only audit trail
});

module.exports = AuditLog;
