# CredenceOS NBFC Business Workflow Guide

This document explains the real-world operational workflow of digital credit delivery in **CredenceOS**.

---

## 1. Customer Onboarding & KYC
1. **Registration**: Borrower registers an account with email, phone, and password.
2. **KYC Submission**: Borrower submits PAN and Aadhaar last-4 digits along with date of birth and residential address.
3. **Identity Verification**: A Loan Officer inspects the documents and marks status as `VERIFIED` or `REJECTED`. 
   > Note: Credit application is blocked until customer has a `VERIFIED` status.

---

## 2. Loan Origination & Underwriting
1. **Loan Application**: Customer specifies desired amount, tenure (months), and financial declarations (monthly income, existing debts).
2. **Automated Risk Assessment**: The system runs rule-based underwriting:
   - Calculates Debt-To-Income (DTI) ratio.
   - Computes estimated reducing-balance EMI.
   - Evaluates credit score tier and active debt facilities.
   - Tags application with `LOW`, `MEDIUM`, or `HIGH` risk rating with explainable factors.
3. **Credit Decisioning**:
   - Loan Officer reviews application, underwriting scores, and cash flows.
   - Application transitions to `APPROVED` or `REJECTED`.

---

## 3. Disbursement & Amortization
1. **Disbursement**: Loan is marked `DISBURSED`, instantly shifting state to `ACTIVE`.
2. **Amortization Ledger**: System locks in a formal month-by-month repayment schedule with exact principal and interest components.

---

## 4. Repayment & Reconciliation
1. **EMI Payments**: Borrower pays monthly installments via UPI/NetBanking mock portal.
2. **Idempotency Protection**: Client passes `Idempotency-Key` to avoid double-charging during network retries.
3. **Balance Reconciliation**: Each payment atomically decrements `outstandingPrincipal` and marks the installment as `PAID`.
4. **Loan Closure**: When `outstandingPrincipal` reaches 0.00, loan automatically transitions to `CLOSED`.

---

## 5. Delinquency Management & Collections
1. **Delinquency Trigger**: If an installment passes its due date without payment, the loan is marked `OVERDUE`.
2. **Agent Assignment**: Admin assigns loan to a field collection agent.
3. **Recovery Tracking**: Agent logs field visits, promises to pay, and updates recovery status.
