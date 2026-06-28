const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const RepaymentSchedule = sequelize.define('RepaymentSchedule', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  loanId: { type: DataTypes.INTEGER, allowNull: false },
  installmentNumber: { type: DataTypes.INTEGER, allowNull: false },
  dueDate: { type: DataTypes.DATEONLY, allowNull: false },
  openingPrincipal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  principalComponent: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  interestComponent: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  totalEMI: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  closingPrincipal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  status: { 
    type: DataTypes.ENUM('SCHEDULED', 'PAID', 'OVERDUE', 'PARTIALLY_PAID', 'WAIVED'),
    defaultValue: 'SCHEDULED' 
  },
  paidDate: { type: DataTypes.DATE, allowNull: true },
  paymentReference: { type: DataTypes.STRING, allowNull: true }
}, {
  timestamps: true,
  indexes: [
    { fields: ['loanId', 'installmentNumber'], unique: true }
  ]
});

module.exports = RepaymentSchedule;
