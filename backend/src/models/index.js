const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'false' ? false : {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else if (process.env.DB_DIALECT === 'sqlite') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './credence_dev.sqlite',
    logging: false
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'credence_nbfc',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'postgres',
      port: process.env.DB_PORT || 5432,
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

// Define Entities
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { 
    type: DataTypes.ENUM('admin', 'agent', 'customer', 'loan_officer', 'collection_agent'), 
    allowNull: false 
  },
}, { timestamps: true });

const Customer = sequelize.define('Customer', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING },
}, { timestamps: true });

const Agent = sequelize.define('Agent', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  phone: { type: DataTypes.STRING, allowNull: false },
}, { timestamps: true });

const Loan = sequelize.define('Loan', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  interestRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  termMonths: { type: DataTypes.INTEGER, allowNull: false },
  status: { 
    type: DataTypes.ENUM(
      'DRAFT',
      'SUBMITTED',
      'UNDER_REVIEW',
      'APPROVED',
      'REJECTED',
      'DISBURSED',
      'ACTIVE',
      'OVERDUE',
      'CLOSED',
      'CANCELLED'
    ), 
    defaultValue: 'SUBMITTED' 
  },
  monthlyEMI: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  totalPayable: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  outstandingPrincipal: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  startDate: { type: DataTypes.DATE, allowNull: true },
  disbursedDate: { type: DataTypes.DATE, allowNull: true },
  endDate: { type: DataTypes.DATE, allowNull: true },
  agentId: { type: DataTypes.INTEGER, allowNull: true },
  assignedOfficerId: { type: DataTypes.INTEGER, allowNull: true },
  recoveryStatus: { type: DataTypes.STRING, allowNull: true },
}, { timestamps: true });

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  loanId: { type: DataTypes.INTEGER, allowNull: false },
  repaymentScheduleId: { type: DataTypes.INTEGER, allowNull: true },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  paymentDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  transactionReference: { type: DataTypes.STRING, allowNull: false, unique: true },
  idempotencyKey: { type: DataTypes.STRING, allowNull: true },
  paymentMethod: { type: DataTypes.STRING, defaultValue: 'MOCK_UPI' },
  status: { 
    type: DataTypes.ENUM('INITIATED', 'PENDING', 'SUCCESS', 'FAILED'), 
    defaultValue: 'INITIATED' 
  },
  reconciled: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { timestamps: true });

const KYC = sequelize.define('KYC', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  panNumber: { type: DataTypes.STRING, allowNull: false },
  aadhaarLastFour: { type: DataTypes.STRING(4), allowNull: false },
  dateOfBirth: { type: DataTypes.DATEONLY, allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  status: { 
    type: DataTypes.ENUM('NOT_STARTED', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'), 
    defaultValue: 'SUBMITTED' 
  },
  submittedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  reviewedAt: { type: DataTypes.DATE, allowNull: true },
  reviewerId: { type: DataTypes.INTEGER, allowNull: true },
  rejectionReason: { type: DataTypes.TEXT, allowNull: true }
}, { timestamps: true });

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
}, { timestamps: true });

const UnderwritingRecord = sequelize.define('UnderwritingRecord', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  loanId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  monthlyIncome: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  existingMonthlyDebt: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  dtiPercent: { type: DataTypes.FLOAT, allowNull: false },
  creditScore: { type: DataTypes.INTEGER, allowNull: false },
  employmentType: { type: DataTypes.STRING, defaultValue: 'SALARIED' },
  riskScore: { type: DataTypes.INTEGER, allowNull: false },
  riskCategory: { type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'), allowNull: false },
  recommendation: { type: DataTypes.STRING, allowNull: false },
  contributingFactors: { type: DataTypes.JSONB, allowNull: true },
  assessorId: { type: DataTypes.INTEGER, allowNull: true },
  assessorNotes: { type: DataTypes.TEXT, allowNull: true }
}, { timestamps: true });

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  actorId: { type: DataTypes.INTEGER, allowNull: true },
  actorRole: { type: DataTypes.STRING, allowNull: true },
  action: { type: DataTypes.STRING, allowNull: false },
  entityType: { type: DataTypes.STRING, allowNull: false },
  entityId: { type: DataTypes.INTEGER, allowNull: true },
  previousState: { type: DataTypes.JSONB, allowNull: true },
  newState: { type: DataTypes.JSONB, allowNull: true },
  metadata: { type: DataTypes.JSONB, allowNull: true },
  ipAddress: { type: DataTypes.STRING, allowNull: true }
}, { timestamps: true, updatedAt: false });

const IdempotencyKey = sequelize.define('IdempotencyKey', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  key: { type: DataTypes.STRING, allowNull: false, unique: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  endpoint: { type: DataTypes.STRING, allowNull: false },
  responseStatus: { type: DataTypes.INTEGER, allowNull: true },
  responseBody: { type: DataTypes.JSONB, allowNull: true },
  status: { type: DataTypes.ENUM('PROCESSING', 'COMPLETED', 'FAILED'), defaultValue: 'PROCESSING' }
}, { timestamps: true });

// Associations
Customer.hasOne(KYC, { foreignKey: 'customerId' });
KYC.belongsTo(Customer, { foreignKey: 'customerId' });

Loan.belongsTo(Customer, { foreignKey: 'customerId' });
Customer.hasMany(Loan, { foreignKey: 'customerId' });

Loan.belongsTo(Agent, { foreignKey: 'agentId' });
Agent.hasMany(Loan, { foreignKey: 'agentId' });

Loan.hasMany(RepaymentSchedule, { foreignKey: 'loanId' });
RepaymentSchedule.belongsTo(Loan, { foreignKey: 'loanId' });

Loan.hasMany(Payment, { foreignKey: 'loanId' });
Payment.belongsTo(Loan, { foreignKey: 'loanId' });

Loan.hasOne(UnderwritingRecord, { foreignKey: 'loanId' });
UnderwritingRecord.belongsTo(Loan, { foreignKey: 'loanId' });

module.exports = {
  sequelize,
  User,
  Customer,
  Agent,
  Loan,
  Payment,
  KYC,
  RepaymentSchedule,
  UnderwritingRecord,
  AuditLog,
  IdempotencyKey
};
