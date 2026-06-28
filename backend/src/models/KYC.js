const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const KYC = sequelize.define('KYC', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  panNumber: { type: DataTypes.STRING, allowNull: false }, // Masked in response (e.g., ABCDE****F)
  aadhaarLastFour: { type: DataTypes.STRING(4), allowNull: false }, // Only last 4 digits stored for compliance
  dateOfBirth: { type: DataTypes.DATEONLY, allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  documentType: { type: DataTypes.STRING, defaultValue: 'PAN_AND_AADHAAR' },
  documentUrl: { type: DataTypes.STRING, allowNull: true },
  status: { 
    type: DataTypes.ENUM('NOT_STARTED', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'), 
    defaultValue: 'SUBMITTED' 
  },
  submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  reviewedAt: { type: DataTypes.DATE, allowNull: true },
  reviewerId: { type: DataTypes.INTEGER, allowNull: true },
  rejectionReason: { type: DataTypes.TEXT, allowNull: true }
}, {
  timestamps: true
});

module.exports = KYC;
