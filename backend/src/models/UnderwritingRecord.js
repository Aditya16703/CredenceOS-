const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const UnderwritingRecord = sequelize.define('UnderwritingRecord', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  loanId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  monthlyIncome: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  existingMonthlyDebt: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  dtiPercent: { type: DataTypes.FLOAT, allowNull: false },
  creditScore: { type: DataTypes.INTEGER, allowNull: false },
  employmentType: { type: DataTypes.STRING, defaultValue: 'SALARIED' },
  riskScore: { type: DataTypes.INTEGER, allowNull: false },
  riskCategory: { 
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'), 
    allowNull: false 
  },
  recommendation: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  contributingFactors: { type: DataTypes.JSONB, allowNull: true },
  assessorId: { type: DataTypes.INTEGER, allowNull: true },
  assessorNotes: { type: DataTypes.TEXT, allowNull: true }
}, {
  timestamps: true
});

module.exports = UnderwritingRecord;
