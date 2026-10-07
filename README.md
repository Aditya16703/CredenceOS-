# 🏦 CredenceOS — Enterprise NBFC Lending Management Platform

[![CI/CD Pipeline](https://github.com/Aditya16703/CredenceOS-/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/Aditya16703/CredenceOS-/actions/workflows/ci-cd.yml)
[![Docker](https://img.shields.io/badge/Docker-Full--Stack%20Ready-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61dafb.svg)](https://react.dev/)

**CredenceOS** is a modular-monolith lending & debt recovery management platform designed for Non-Banking Financial Companies (NBFCs) and digital credit providers. It covers the full lifecycle of lending: identity verification (KYC), underwriting, reducing-balance amortization schedules, payment processing with idempotency, and regulatory audit trails.

---

## 🌟 Key Features

- **🛡️ Regulated KYC Workflow**: Masked PAN formatting and masked Aadhaar storage ensuring data protection.
- **📊 Rule-Based Underwriting Engine**: Explainable Debt-To-Income (DTI) calculations and transparent risk factor scoring.
- **📈 Reducing-Balance Amortization Engine**: Exact monthly EMI calculations with penny/cent reconciliation on final installments.
- **💳 Payment Idempotency & Webhooks**: Atomic transaction boundaries with `Idempotency-Key` headers preventing duplicate debits.
- **📜 Immutable Audit Trail**: Centralized append-only compliance ledger recording every state change and user action.
- **👥 Role-Based Access Control (RBAC)**: Distinct permissions for `CUSTOMER`, `LOAN_OFFICER`, `COLLECTION_AGENT`, and `ADMIN`.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 19, Vite, Lucide Icons, Lottie animations
- **Backend**: Node.js, Express.js, Sequelize ORM, Winston Logger, Crypto
- **Database**: PostgreSQL with transactional isolation
- **Authentication**: Stateless JWT token authentication with bcrypt password hashing

Detailed architectural specification is documented in [ARCHITECTURE.md](ARCHITECTURE.md) and business lifecycle in [BUSINESS_WORKFLOW.md](BUSINESS_WORKFLOW.md).

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 12+
- npm

### 2. Database Setup
```sql
CREATE DATABASE credence_nbfc;
CREATE USER postgres WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE credence_nbfc TO postgres;
```

### 3. Environment Variables

Create `backend/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=credence_nbfc
DB_USER=postgres
DB_PASS=your_password
JWT_SECRET=your_super_secret_jwt_key
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

### 4. Running the Platform

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in a second terminal)
cd frontend
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## 🧪 Automated Testing

CredenceOS includes unit tests for the core financial and underwriting calculation engines:

```bash
cd backend
npm test
```

---

## 👤 Author

**Aditya Singh Chauhan**
- GitHub: [@Aditya16703](https://github.com/Aditya16703)
- Email: ac3413452@gmail.com

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
