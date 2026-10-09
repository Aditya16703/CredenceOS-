import React, { useEffect, useState, useMemo } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { 
  CreditCard, 
  Clock, 
  Receipt, 
  ShieldCheck, 
  CheckCircle2, 
  TrendingUp, 
  Wallet, 
  Landmark, 
  Search, 
  ArrowUpRight, 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  AlertCircle,
  Calendar,
  Layers,
  Printer,
  X
} from 'lucide-react';
import { api, handleApiError, handleApiSuccess, handleTokenExpiration } from '../utils/api';

function Payments({ user }) {
  const [payments, setPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [form, setForm] = useState({ loanId: '', amount: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [copiedTxn, setCopiedTxn] = useState(null);
  const [filterLoanId, setFilterLoanId] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Helper: Calculate EMI, balance, and repayment progress
  const getLoanDetails = loanId => {
    const loan = loans.find(l => l.id === parseInt(loanId));
    if (!loan) return { emi: '0.00', balance: '0.00', totalDue: '0.00', paid: '0.00', progressPct: 0 };
    const principal = parseFloat(loan.amount);
    const rate = parseFloat(loan.interestRate) / 100 / 12;
    const n = parseInt(loan.termMonths);
    // Standard Reducing Amortization EMI formula
    const emi = rate === 0 ? (principal / n) : (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
    
    // Calculate total paid across ledger
    const paid = allPayments.length > 0
      ? allPayments.filter(p => p.loanId === loan.id).reduce((sum, p) => sum + parseFloat(p.amount), 0)
      : payments.filter(p => p.loanId === loan.id).reduce((sum, p) => sum + parseFloat(p.amount), 0);
    
    const totalDue = emi * n;
    const balance = Math.max(0, totalDue - paid);
    const finalBalance = balance < 1 ? 0 : balance;
    const progressPct = totalDue > 0 ? Math.min(100, Math.round((paid / totalDue) * 100)) : 0;
    
    return { 
      emi: emi.toFixed(2), 
      balance: finalBalance.toFixed(2),
      totalDue: totalDue.toFixed(2),
      paid: paid.toFixed(2),
      progressPct
    };
  };

  // Sync amount when loan changes
  useEffect(() => {
    if (!form.loanId) return;
    const { emi } = getLoanDetails(form.loanId);
    setForm(f => ({ ...f, amount: emi }));
  }, [form.loanId, loans]);

  // Fetch loans for payment (role-based)
  useEffect(() => {
    if (!user) return;
    
    const fetchLoans = async () => {
      try {
        let data;
        if (user.role === 'customer') {
          data = await api.getLoansByCustomer(user.id);
        } else if (user.role === 'agent') {
          data = await api.getLoansByAgent(user.id);
        } else {
          data = await api.getAllLoans();
        }
        setLoans(Array.isArray(data.data.loans) ? data.data.loans : []);
      } catch (err) {
        if (err.status === 401) {
          handleTokenExpiration();
        } else {
          handleApiError(err, setError);
        }
        setLoans([]);
      }
    };
    
    fetchLoans();
  }, [user]);

  // Fetch master ledger and loan-specific payments
  const fetchAllPayments = async () => {
    try {
      if (user.role === 'admin' || user.role === 'agent') {
        const res = await api.getPayments();
        if (res && res.data) {
          const list = Array.isArray(res.data) ? res.data : [];
          setAllPayments(list);
          if (!form.loanId) setPayments(list);
        }
      } else if (user.role === 'customer') {
        // Collect payments for all customer's loans
        const customerLoans = loans.length > 0 ? loans : [];
        if (customerLoans.length > 0) {
          const paymentPromises = customerLoans.map(l => api.getPaymentsByLoan(l.id).catch(() => ({ data: [] })));
          const results = await Promise.all(paymentPromises);
          const combined = results.flatMap(r => Array.isArray(r.data) ? r.data : []);
          // Deduplicate by ID
          const uniqueMap = new Map();
          combined.forEach(p => uniqueMap.set(p.id, p));
          const uniqueList = Array.from(uniqueMap.values());
          setAllPayments(uniqueList);
          if (!form.loanId) setPayments(uniqueList);
        }
      }
    } catch {
      // Ignore initial master load errors
    }
  };

  useEffect(() => {
    if (loans.length > 0) {
      fetchAllPayments();
    }
  }, [loans, user]);

  // Fetch payments for selected loan
  useEffect(() => {
    if (!form.loanId) {
      if (allPayments.length > 0) {
        setPayments(allPayments);
      }
      return;
    }
    
    const fetchPayments = async () => {
      try {
        const data = await api.getPaymentsByLoan(form.loanId);
        const list = Array.isArray(data.data) ? data.data : [];
        setPayments(list);
      } catch (err) {
        if (err.status === 401) {
          handleTokenExpiration();
        } else {
          handleApiError(err, setError);
        }
        setPayments([]);
      }
    };
    
    fetchPayments();
  }, [form.loanId]);

  const handlePay = async e => {
    e.preventDefault();
    setError(''); 
    setSuccess('');
    setLoading(true);
    setShowSuccessAnimation(false);
    
    try {
      const res = await api.createPayment({ 
        loanId: form.loanId, 
        amount: form.amount,
        paymentMethod: 'UPI_AUTOPAY' 
      });
      
      setShowSuccessAnimation(true);
      setSuccess('Settlement verified! EMI recorded in immutable ledger.');
      
      // Refresh payment history and master ledger
      const data = await api.getPaymentsByLoan(form.loanId);
      setPayments(Array.isArray(data.data) ? data.data : []);
      fetchAllPayments();
      
      // Auto dismiss success animation
      setTimeout(() => {
        setShowSuccessAnimation(false);
        setSuccess('');
      }, 3500);
    } catch (err) {
      if (err.status === 401) {
        handleTokenExpiration();
      } else {
        handleApiError(err, setError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedTxn(id);
    setTimeout(() => setCopiedTxn(null), 2000);
  };

  // Master KPI computations
  const kpis = useMemo(() => {
    const validLoans = loans.filter(l => ['APPROVED', 'ACTIVE', 'OVERDUE', 'DISBURSED', 'CLOSED'].includes(l.status));
    const totalPrincipal = validLoans.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
    const totalRepaid = allPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const activeCount = validLoans.filter(l => ['APPROVED', 'ACTIVE', 'OVERDUE', 'DISBURSED'].includes(l.status)).length;
    const recoveryRate = totalPrincipal > 0 ? Math.min(100, Math.round((totalRepaid / totalPrincipal) * 100)) : 0;

    return {
      totalPrincipal,
      totalRepaid,
      activeCount,
      recoveryRate,
      txnCount: allPayments.length
    };
  }, [loans, allPayments]);

  // Filtered payments list
  const filteredPayments = useMemo(() => {
    let list = payments.length > 0 ? payments : allPayments;
    if (filterLoanId !== 'ALL') {
      list = list.filter(p => String(p.loanId) === String(filterLoanId));
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p => 
        String(p.id).includes(q) ||
        String(p.loanId).includes(q) ||
        (p.transactionReference && p.transactionReference.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [payments, allPayments, filterLoanId, searchTerm]);

  const activeLoans = loans.filter(l => ['APPROVED', 'ACTIVE', 'OVERDUE', 'DISBURSED'].includes(l.status));
  const currentLoanDetails = form.loanId ? getLoanDetails(form.loanId) : null;
  const isFullyPaid = currentLoanDetails && currentLoanDetails.balance === "0.00";

  return (
    <div style={{ width: '100%', maxWidth: '1240px', margin: '0 auto', color: '#0F172A' }}>
      
      {/* Institutional Core Banking Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #060D1E 0%, #0F172A 50%, #1E293B 100%)',
        borderRadius: '20px',
        padding: '2.25rem 2.5rem',
        color: '#FFFFFF',
        marginBottom: '2rem',
        boxShadow: '0 20px 40px -15px rgba(2, 6, 23, 0.4)',
        border: '1px solid #1E293B',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative background circles */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: '20%',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)'
              }}>
                <Landmark size={24} color="#38BDF8" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                  Treasury Clearing & Repayments Desk
                </h2>
                <p style={{ margin: '3px 0 0 0', color: '#94A3B8', fontSize: '0.92rem' }}>
                  Automated reducing-balance amortization ledger & real-time NACH/UPI settlement gateway
                </p>
              </div>
            </div>

            {/* Compliance badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34D399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <ShieldCheck size={13} /> NPCI / NACH Instant Clearing
              </span>
              <span style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Sparkles size={13} /> ISO 20022 Idempotent Ledger
              </span>
            </div>
          </div>

          {/* Real-time KPI Ribbon */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.65)',
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#94A3B8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Principal Serviced
                </span>
                <TrendingUp size={16} color="#10B981" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10B981', letterSpacing: '-0.02em' }}>
                ₹{kpis.totalRepaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                Reconciled across {kpis.txnCount} transactions
              </div>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.65)',
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#94A3B8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Credit Facilities
                </span>
                <CreditCard size={16} color="#38BDF8" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                {kpis.activeCount} <span style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500 }}>Facilities</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                ₹{kpis.totalPrincipal.toLocaleString('en-IN')} approved exposure
              </div>
            </div>

            <div style={{
              background: 'rgba(15, 23, 42, 0.65)',
              padding: '1rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#94A3B8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Portfolio Recovery Rate
                </span>
                <Layers size={16} color="#F59E0B" />
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#F59E0B', letterSpacing: '-0.02em' }}>
                {kpis.recoveryRate}%
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
                marginTop: '6px'
              }}>
                <div style={{
                  width: `${kpis.recoveryRate}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #F59E0B, #10B981)',
                  borderRadius: '2px'
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Payment Action Console & Amortization Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: form.loanId ? '1.15fr 0.85fr' : '1fr', gap: '1.75rem', marginBottom: '2rem' }}>
        
        {/* Terminal Execution Card */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '18px',
          boxShadow: '0 4px 25px rgba(15, 23, 42, 0.06)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #F1F5F9',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="#0284C7" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                Process Installment Settlement
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', background: '#FFFFFF', padding: '0.2rem 0.55rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              Atomic Safe-Settle
            </span>
          </div>

          <div style={{ padding: '1.75rem' }}>
            <form onSubmit={handlePay}>
              {/* Facility Selection */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Select Credit Facility Account
                </label>
                <select
                  className="form-control"
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    borderRadius: '10px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: '#0F172A',
                    background: '#F8FAFC',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  name="loanId"
                  value={form.loanId}
                  onChange={handleFormChange}
                  required
                >
                  {loans.length === 0 ? (
                    <option value="" disabled>No loans found — Apply for a loan first</option>
                  ) : activeLoans.length === 0 ? (
                    <option value="" disabled>No active credit facilities ({loans.length} under review)</option>
                  ) : (
                    <>
                      <option value="">Choose an active loan account...</option>
                      {activeLoans.map(l => (
                        <option key={l.id} value={l.id}>
                          Loan #{l.id} — Principal: ₹{Number(l.amount).toLocaleString('en-IN')} ({l.status}) | Term: {l.termMonths} mos
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Amount input & Quick Chips */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Installment Amount (INR)
                  </label>
                  {form.loanId && currentLoanDetails && !isFullyPaid && (
                    <span style={{ fontSize: '0.78rem', color: '#0284C7', fontWeight: 600 }}>
                      Standard EMI: ₹{Number(currentLoanDetails.emi).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#64748B'
                  }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="form-control"
                    style={{
                      width: '100%',
                      padding: '0.8rem 1rem 0.8rem 2.2rem',
                      borderRadius: '10px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '1.05rem',
                      fontWeight: 750,
                      color: '#0F172A',
                      background: isFullyPaid ? '#F1F5F9' : '#FFFFFF',
                      outline: 'none'
                    }}
                    name="amount"
                    placeholder="Enter amount to pay"
                    value={form.amount}
                    onChange={handleFormChange}
                    required
                    disabled={!form.loanId || isFullyPaid}
                  />
                </div>

                {/* Quick Payment Preset Chips */}
                {form.loanId && currentLoanDetails && !isFullyPaid && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, amount: currentLoanDetails.emi }))}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #BAE6FD',
                        background: '#F0F9FF',
                        color: '#0369A1',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Exact EMI (₹{currentLoanDetails.emi})
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, amount: (parseFloat(currentLoanDetails.emi) * 2).toFixed(2) }))}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        background: '#F8FAFC',
                        color: '#334155',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      2x EMI Prepayment
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, amount: currentLoanDetails.balance }))}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #BBF7D0',
                        background: '#F0FDF4',
                        color: '#15803D',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Full Payoff (₹{currentLoanDetails.balance})
                    </button>
                  </div>
                )}
              </div>

              {/* Status & Messages */}
              {error && (
                <div style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#991B1B',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '1.25rem'
                }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  color: '#166534',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '1.25rem'
                }}>
                  <CheckCircle2 size={18} />
                  <span>{success}</span>
                </div>
              )}

              {/* Role disclaimer if administrative execution */}
              {user.role !== 'customer' && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.8rem',
                  color: '#64748B',
                  marginBottom: '1.25rem'
                }}>
                  <strong>Operational Audit Mode:</strong> Logged in as <em>{user.role}</em>. Payment submission executes a verified field collection credit.
                </div>
              )}

              {/* Action Buttons */}
              <button
                type="submit"
                disabled={!form.loanId || isFullyPaid || loading}
                style={{
                  width: '100%',
                  padding: '0.95rem 1.5rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: isFullyPaid 
                    ? '#94A3B8' 
                    : 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.98rem',
                  fontWeight: 750,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: (!form.loanId || isFullyPaid || loading) ? 'not-allowed' : 'pointer',
                  boxShadow: (!form.loanId || isFullyPaid || loading) ? 'none' : '0 4px 15px rgba(2, 132, 199, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? (
                  <>
                    <Clock size={18} className="animate-spin" /> Verifying Clearing House...
                  </>
                ) : isFullyPaid ? (
                  <>
                    <CheckCircle2 size={18} /> Credit Facility Fully Settled
                  </>
                ) : (
                  <>
                    <ArrowUpRight size={18} /> Authorize & Settle Installment (₹{form.amount || '0.00'})
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Dynamic Facility Amortization Dossier (When loan selected) */}
        {form.loanId && currentLoanDetails && (
          <div style={{
            background: '#FFFFFF',
            borderRadius: '18px',
            boxShadow: '0 4px 25px rgba(15, 23, 42, 0.06)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '1.25rem 1.75rem',
              borderBottom: '1px solid #F1F5F9',
              background: '#F8FAFC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={18} color="#10B981" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                  Facility #{form.loanId} Ledger Snapshot
                </h3>
              </div>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: isFullyPaid ? '#15803D' : '#0369A1',
                background: isFullyPaid ? '#DCFCE7' : '#E0F2FE',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px'
              }}>
                {isFullyPaid ? 'CLOSED / SETTLED' : 'ACTIVE SERVICING'}
              </span>
            </div>

            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {/* Progress bar */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px' }}>
                    <span style={{ color: '#64748B' }}>Repayment Progress</span>
                    <span style={{ color: '#0F172A' }}>{currentLoanDetails.progressPct}% Serviced</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '4px',
                    background: '#F1F5F9',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${currentLoanDetails.progressPct}%`,
                      height: '100%',
                      background: currentLoanDetails.progressPct >= 100 ? '#10B981' : 'linear-gradient(90deg, #38BDF8, #0284C7)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>

                {/* 2x2 Financial Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div style={{ background: '#F8FAFC', padding: '0.9rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Monthly EMI</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginTop: '3px' }}>
                      ₹{Number(currentLoanDetails.emi).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '0.9rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Remaining Debt</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: isFullyPaid ? '#10B981' : '#E11D48', marginTop: '3px' }}>
                      {isFullyPaid ? '₹0.00' : `₹${Number(currentLoanDetails.balance).toLocaleString('en-IN')}`}
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '0.9rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Total Settled</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10B981', marginTop: '3px' }}>
                      ₹{Number(currentLoanDetails.paid).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '0.9rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Total Liability</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#334155', marginTop: '3px' }}>
                      ₹{Number(currentLoanDetails.totalDue).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security guarantee note */}
              <div style={{
                marginTop: '1.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.76rem',
                color: '#0369A1'
              }}>
                <ShieldCheck size={16} />
                <span>All settlements update the borrower's CIC Bureau tradeline within 24 hours.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Institutional Double-Entry Transaction Ledger Section */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '18px',
        boxShadow: '0 4px 25px rgba(15, 23, 42, 0.06)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        {/* Ledger Header & Controls */}
        <div style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Receipt size={20} color="#0F172A" />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                Double-Entry Settlement Ledger
              </h3>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.85rem' }}>
              Showing {filteredPayments.length} authenticated clearing entries
            </p>
          </div>

          {/* Filter & Search Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
            {/* Filter by facility */}
            <select
              style={{
                padding: '0.55rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#334155',
                background: '#FFFFFF',
                outline: 'none'
              }}
              value={filterLoanId}
              onChange={e => setFilterLoanId(e.target.value)}
            >
              <option value="ALL">All Credit Facilities</option>
              {loans.map(l => (
                <option key={l.id} value={l.id}>Facility #{l.id}</option>
              ))}
            </select>

            {/* Quick search input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search Txn UTR / ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.55rem 0.9rem 0.55rem 2rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.82rem',
                  outline: 'none',
                  width: '200px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div style={{ overflowX: 'auto' }}>
          {filteredPayments.length > 0 ? (
            <table className="table table-hover mb-0" style={{ margin: 0, minWidth: '1050px', width: '100%' }}>
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <tr>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Transaction Reference
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                    Facility
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                    Payment Rail
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                    Clearing Status
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                    Serviced Amount
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                    Timestamp
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                    Receipt
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p, index) => {
                  const txRef = p.transactionReference || `TXN-2026-0${p.id}A9`;
                  return (
                    <tr key={p.id} style={{ borderBottom: index < filteredPayments.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      
                      {/* Transaction Reference & Quick Copy */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontFamily: 'Consolas, monospace',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: '#0F172A',
                            background: '#F1F5F9',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px'
                          }}>
                            {txRef}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(txRef, p.id)}
                            title="Copy Transaction Reference"
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              padding: '2px',
                              color: copiedTxn === p.id ? '#10B981' : '#94A3B8'
                            }}
                          >
                            {copiedTxn === p.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>

                      {/* Facility Account */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        <span style={{
                          background: '#0F172A',
                          color: '#38BDF8',
                          padding: '0.22rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700
                        }}>
                          #{p.loanId}
                        </span>
                      </td>

                      {/* Payment Rail */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.74rem',
                          fontWeight: 650,
                          color: '#334155',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px'
                        }}>
                          {p.paymentMethod || 'UPI Auto-Debit'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        <span style={{
                          background: '#DCFCE7',
                          color: '#15803D',
                          border: '1px solid #86EFAC',
                          padding: '0.22rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <CheckCircle2 size={12} /> SETTLED
                        </span>
                      </td>

                      {/* Serviced Amount */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <span style={{
                          fontSize: '0.96rem',
                          fontWeight: 800,
                          color: '#15803D',
                          fontFamily: 'system-ui, sans-serif'
                        }}>
                          ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'center', color: '#475569', fontSize: '0.82rem' }}>
                        {new Date(p.createdAt || p.paymentDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>

                      {/* Action: View Receipt Modal */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(p)}
                          style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            background: '#FFFFFF',
                            color: '#334155',
                            fontSize: '0.74rem',
                            fontWeight: 650,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <FileText size={12} color="#0284C7" /> Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
              <div style={{ opacity: 0.35, marginBottom: '1rem' }}>
                <Receipt size={48} color="#64748B" />
              </div>
              <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: '#0F172A' }}>
                No Repayments Recorded in Ledger
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
                Select an active facility above to execute your first amortized installment.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Official Transaction Voucher Modal */}
      {selectedReceipt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
            border: '1px solid #E2E8F0'
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0B132B 0%, #1E293B 100%)',
              color: '#FFFFFF',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Landmark size={20} color="#38BDF8" />
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  Official Repayment Voucher
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '2rem' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: '#DCFCE7',
                  border: '2px solid #86EFAC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px auto'
                }}>
                  <CheckCircle2 size={28} color="#15803D" />
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A' }}>
                  ₹{Number(selectedReceipt.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.84rem', color: '#16A34A', fontWeight: 700, marginTop: '2px' }}>
                  SETTLEMENT COMPLETED & RECONCILED
                </div>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '1.25rem', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748B' }}>Transaction Reference</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}>
                    {selectedReceipt.transactionReference || `TXN-0${selectedReceipt.id}A9`}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748B' }}>Credit Facility ID</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>Loan #{selectedReceipt.loanId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748B' }}>Value Date</span>
                  <span style={{ fontWeight: 650, color: '#0F172A' }}>
                    {new Date(selectedReceipt.createdAt || selectedReceipt.paymentDate).toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span style={{ color: '#64748B' }}>Clearing Channel</span>
                  <span style={{ fontWeight: 650, color: '#0284C7' }}>
                    {selectedReceipt.paymentMethod || 'NPCI UPI Auto-Debit'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <Printer size={16} /> Print Official Banking Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Animation Modal */}
      {showSuccessAnimation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
            maxWidth: '420px',
            width: '90%',
            border: '1px solid #E2E8F0'
          }}>
            <DotLottieReact
              src="https://lottie.host/9701ac69-f35b-46ed-9f46-e58f84ffa77c/QUVXQRcA8Y.lottie"
              style={{ width: '180px', height: '180px', margin: '0 auto' }}
              loop={false}
              autoplay
            />
            <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>
              Installment Cleared!
            </h3>
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>
              Repayment entry successfully stamped in the core banking ledger.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

export default Payments;
