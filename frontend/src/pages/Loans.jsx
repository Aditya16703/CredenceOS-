import React, { useEffect, useState } from 'react';
import { Shield, Landmark, Send, BarChart3, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import Agents from './Agents';
import UnderwritingModal from '../components/UnderwritingModal';
import { api, handleApiError, handleApiSuccess, handleTokenExpiration } from '../utils/api';

function Loans({ user }) {
  const [loans, setLoans] = useState([]);
  const [paymentsByLoan, setPaymentsByLoan] = useState({});
  const [editingRecovery, setEditingRecovery] = useState({}); // { [loanId]: true/false }
  const [selectedRecovery, setSelectedRecovery] = useState({}); // { [loanId]: value }
  const [error, setError] = useState('');
  const [form, setForm] = useState({ amount: '', interestRate: '', termMonths: '', monthlyIncome: '', existingDebts: '' });
  const [success, setSuccess] = useState('');
  const [assignAgentId, setAssignAgentId] = useState({});
  const [selectedUnderwritingLoan, setSelectedUnderwritingLoan] = useState(null);

  // Calculate interest rate based on amount and term
  const calculateInterestRate = (amount, term) => {
    if (!amount || !term) return '';
    const amt = parseFloat(amount);
    const t = parseInt(term);
    let baseRate = 2.5;
    if (amt >= 10000) baseRate -= 0.5;
    if (t >= 12) baseRate -= 0.3;
    if (amt >= 20000) baseRate -= 0.3;
    // Add a small random variation for realism
    const random = Math.random() * 0.4;
    let rate = baseRate + random;
    rate = Math.max(1.5, Math.min(rate, 3.5));
    return rate.toFixed(1);
  };

  // Update interest rate when amount or term changes
  const handleFormChange = e => {
    const { name, value } = e.target;
    let newForm = { ...form, [name]: value };
    if (name === 'amount' || name === 'termMonths') {
      newForm.interestRate = calculateInterestRate(
        name === 'amount' ? value : form.amount,
        name === 'termMonths' ? value : form.termMonths
      );
    }
    setForm(newForm);
  };

  // Fetch loans for current user
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

  useEffect(() => {
    // Fetch payments for each loan
    if (!loans.length) return;
    
    const fetchPayments = async () => {
      const paymentsMap = {};
      for (const loan of loans) {
        try {
          const data = await api.getPaymentsByLoan(loan.id);
          paymentsMap[loan.id] = Array.isArray(data.data) ? data.data : [];
        } catch (err) {
          if (err.status === 401) {
            handleTokenExpiration();
            return;
          }
          paymentsMap[loan.id] = [];
        }
      }
      setPaymentsByLoan(paymentsMap);
    };
    
    fetchPayments();
  }, [loans]);

  // Customer loan application
  const handleApply = async e => {
    e.preventDefault();
    setError(''); 
    setSuccess('');
    
    try {
      // Convert form data to correct data types (creditScore is retrieved server-side from Bureau API)
      const loanData = {
        customerId: user.id,
        amount: parseFloat(form.amount),
        interestRate: parseFloat(form.interestRate),
        termMonths: parseInt(form.termMonths),
        monthlyIncome: parseFloat(form.monthlyIncome) || 50000,
        existingMonthlyDebt: parseFloat(form.existingDebts) || 0,
        employmentType: 'SALARIED',
        bureauConsent: true
      };
      
      const res = await api.createLoan(loanData);
      const bureauInfo = res?.data?.bureauVerification;
      const successMessage = bureauInfo
        ? `Application submitted! Bureau Verified: ${bureauInfo.provider} (Score: ${bureauInfo.verifiedScore}, Tier: ${bureauInfo.scoreTier})`
        : 'Loan application submitted!';
      handleApiSuccess(successMessage, setSuccess);
      setForm({ amount: '', interestRate: '', termMonths: '', monthlyIncome: '', existingDebts: '' });
      
      // Refresh loans list
      const loansData = await api.getLoansByCustomer(user.id);
      setLoans(Array.isArray(loansData.data.loans) ? loansData.data.loans : []);
    } catch (err) {
      if (err.status === 401) {
        handleTokenExpiration();
      } else {
        handleApiError(err, setError);
      }
    }
  };

  // Approve/Reject loan
  const handleStatus = async (id, status) => {
    setError(''); 
    setSuccess('');
    
    try {
      await api.updateLoanStatus(id, status);
      handleApiSuccess('Loan status updated!', setSuccess);
      
      // Refresh loans list
      let loansData;
      if (user.role === 'customer') {
        loansData = await api.getLoansByCustomer(user.id);
      } else if (user.role === 'agent') {
        loansData = await api.getLoansByAgent(user.id);
      } else {
        loansData = await api.getAllLoans();
      }
      setLoans(Array.isArray(loansData.data.loans) ? loansData.data.loans : []);
    } catch (err) {
      if (err.status === 401) {
        handleTokenExpiration();
      } else {
        handleApiError(err, setError);
      }
    }
  };

  // Assign agent
  const handleAssignAgent = async (id, agentId) => {
    setError(''); 
    setSuccess('');
    
    console.log('Assigning agent:', { loanId: id, agentId: agentId }); // Debug log
    
    try {
      const response = await api.assignAgent(id, agentId);
      console.log('Agent assignment response:', response); // Debug log
      handleApiSuccess('Agent assigned!', setSuccess);
      
      // Refresh loans list
      const loansData = await api.getAllLoans();
      console.log('Refreshed loans data:', loansData); // Debug log
      setLoans(Array.isArray(loansData.data.loans) ? loansData.data.loans : []);
    } catch (err) {
      console.error('Agent assignment error:', err); // Debug log
      if (err.status === 401) {
        handleTokenExpiration();
      } else {
        handleApiError(err, setError);
      }
    }
  };

  // Agent: Update recovery status
  const handleRecoveryStatus = async (id, recoveryStatus) => {
    setError(''); 
    setSuccess('');
    
    try {
      await api.updateRecoveryStatus(id, recoveryStatus);
      handleApiSuccess('Recovery status updated!', setSuccess);
    } catch (err) {
      if (err.status === 401) {
        handleTokenExpiration();
      } else {
        handleApiError(err, setError);
      }
    }
  };

  const handleRecoverySelect = (loanId, value) => {
    setSelectedRecovery(prev => ({ ...prev, [loanId]: value }));
    setEditingRecovery(prev => ({ ...prev, [loanId]: true }));
  };

  const handleRecoverySave = async (loanId) => {
    try {
      console.log('Saving recovery status:', { loanId, recoveryStatus: selectedRecovery[loanId], userRole: user.role });
      await api.updateRecoveryStatus(loanId, selectedRecovery[loanId]);
      
      // Update the loan in the local state
      setLoans(loans.map(loan => 
        loan.id === loanId 
          ? { ...loan, recoveryStatus: selectedRecovery[loanId] }
          : loan
      ));
      
      // Clear the editing state and selected recovery for this loan
      setEditingRecovery(prev => ({ ...prev, [loanId]: false }));
      setSelectedRecovery(prev => ({ ...prev, [loanId]: '' }));
      handleApiSuccess('Recovery status updated successfully', setSuccess);
    } catch (err) {
      console.error('Error updating recovery status:', err);
      if (err.status === 401) {
        handleTokenExpiration();
      } else {
        handleApiError(err, setError);
      }
    }
  };

  const handleRecoveryEdit = (loanId) => {
    setEditingRecovery(prev => ({ ...prev, [loanId]: true }));
  };

  // Delete loan (only for rejected loans)
  const handleDeleteLoan = async (id) => {
    setError(''); 
    setSuccess('');
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this rejected loan? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.deleteLoan(id);
      handleApiSuccess('Loan deleted successfully!', setSuccess);
      
      // Refresh loans list
      let loansData;
      if (user.role === 'customer') {
        loansData = await api.getLoansByCustomer(user.id);
      } else if (user.role === 'agent') {
        loansData = await api.getLoansByAgent(user.id);
      } else {
        loansData = await api.getAllLoans();
      }
      setLoans(Array.isArray(loansData.data.loans) ? loansData.data.loans : []);
    } catch (err) {
      if (err.status === 401) {
        handleTokenExpiration();
      } else {
        handleApiError(err, setError);
      }
    }
  };

  // Helper: Calculate EMI and balance for a loan (copied from Payments.jsx)
  function getLoanDetails(loan, payments) {
    if (!loan) return { emi: '', balance: '' };
    const principal = parseFloat(loan.amount);
    const rate = parseFloat(loan.interestRate) / 100 / 12;
    const n = parseInt(loan.termMonths);
    const emi = rate === 0 ? (principal / n) : (principal * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
    // Calculate total paid
    const paid = payments && payments.length ? payments.reduce((sum, p) => sum + parseFloat(p.amount), 0) : 0;
    const totalDue = emi * n;
    const balance = Math.max(0, totalDue - paid);
    
    // Consider fully paid if balance is less than ₹1
    const finalBalance = balance < 1 ? 0 : balance;
    
    return { emi: emi.toFixed(2), balance: finalBalance.toFixed(2) };
  }

  // Helper: Format recovery status text
  const formatRecoveryStatus = (status) => {
    if (!status) return '-';
    const statusMap = {
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'recovered': 'Recovered'
    };
    return statusMap[status] || status;
  };

  // Helper: Calculate payment progress (payments made vs total term)
  const getPaymentProgress = (loan) => {
    const payments = paymentsByLoan[loan.id] || [];
    const paymentsMade = payments.length;
    const totalTerm = loan.termMonths;
    const progressPercentage = totalTerm > 0 ? (paymentsMade / totalTerm) * 100 : 0;
    return {
      text: `${paymentsMade}/${totalTerm}`,
      percentage: progressPercentage,
      isGood: progressPercentage >= 50 // Green if 50% or more payments done
    };
  };

  // Helper: High-contrast status pill badge
  const renderStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    let bg = '#F1F5F9';
    let color = '#334155';
    let border = '#CBD5E1';
    let label = status || '-';

    if (s === 'APPROVED' || s === 'ACTIVE' || s === 'DISBURSED') {
      bg = '#DCFCE7';
      color = '#15803D';
      border = '#86EFAC';
      label = s === 'ACTIVE' ? 'Active' : s === 'APPROVED' ? 'Approved' : 'Disbursed';
    } else if (s === 'SUBMITTED' || s === 'PENDING' || s === 'UNDER_REVIEW') {
      bg = '#FEF3C7';
      color = '#B45309';
      border = '#FCD34D';
      label = s === 'SUBMITTED' ? 'Submitted' : s === 'UNDER_REVIEW' ? 'Under Review' : 'Pending';
    } else if (s === 'REJECTED' || s === 'CANCELLED') {
      bg = '#FEE2E2';
      color = '#B91C1C';
      border = '#FCA5A5';
      label = s === 'REJECTED' ? 'Rejected' : 'Cancelled';
    } else if (s === 'OVERDUE') {
      bg = '#FFE4E6';
      color = '#BE123C';
      border = '#FDA4AF';
      label = 'Overdue';
    } else if (s === 'CLOSED') {
      bg = '#E0F2FE';
      color = '#0369A1';
      border = '#7DD3FC';
      label = 'Closed';
    }

    return (
      <span style={{
        fontSize: '0.72rem',
        fontWeight: 700,
        padding: '0.22rem 0.6rem',
        borderRadius: '6px',
        background: bg,
        color: color,
        border: `1px solid ${border}`,
        display: 'inline-block',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap'
      }}>
        {label}
      </span>
    );
  };

  // Helper: High-contrast recovery badge
  const renderRecoveryBadge = (recoveryStatus) => {
    const r = (recoveryStatus || '').toLowerCase();
    let bg = '#F8FAFC';
    let color = '#334155';
    let border = '#CBD5E1';

    if (r === 'recovered') {
      bg = '#DCFCE7';
      color = '#15803D';
      border = '#86EFAC';
    } else if (r === 'in_progress' || r.includes('assigned')) {
      bg = '#E0F2FE';
      color = '#0369A1';
      border = '#7DD3FC';
    } else if (r === 'pending') {
      bg = '#FEF3C7';
      color = '#B45309';
      border = '#FCD34D';
    }

    return (
      <span style={{
        fontSize: '0.72rem',
        fontWeight: 650,
        padding: '0.2rem 0.55rem',
        borderRadius: '6px',
        background: bg,
        color: color,
        border: `1px solid ${border}`,
        display: 'inline-block',
        whiteSpace: 'nowrap'
      }}>
        {formatRecoveryStatus(recoveryStatus)}
      </span>
    );
  };

  // Helper: Prominent high-contrast CIR Audit button
  const renderCIRAuditButton = (loan) => (
    <button
      type="button"
      onClick={() => setSelectedUnderwritingLoan(loan)}
      title="View CIBIL Bureau & Underwriting Audit Dossier"
      style={{
        fontSize: '0.74rem',
        padding: '0.3rem 0.65rem',
        borderRadius: '6px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '5px',
        fontWeight: 700,
        border: '1px solid #0284C7',
        color: '#FFFFFF',
        background: '#0284C7',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 5px rgba(2, 132, 199, 0.25)',
        transition: 'all 0.15s ease'
      }}
    >
      <Shield size={13} color="#FFFFFF" />
      <span>CIR Audit</span>
    </button>
  );

  return (
    <div style={{ width: '100%' }}>
      {/* Agent view: show only relevant fields */}
      {user.role === 'agent' ? (
        <div style={{ 
          background: '#fff', 
          borderRadius: '16px', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
          overflow: 'hidden', 
          border: '1px solid #e9ecef'
        }}>
          {/* Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, #0B132B 0%, #1E293B 100%)', 
            color: 'white', 
            padding: '1.75rem', 
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 0.35rem 0', fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Shield size={22} color="#38BDF8" /> Portfolio Recovery Desk
            </h3>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.9rem' }}>
              Manage delinquency stages, agent assignments, and collections status
            </p>
          </div>

          {/* Table Content */}
          <div style={{ padding: '0', overflowX: 'auto' }}>
            {loans.length > 0 ? (
              <table className="table table-hover mb-0" style={{ margin: 0, minWidth: '1050px', width: '100%' }}>
                <thead style={{ 
                  background: '#F8FAFC', 
                  borderBottom: '1px solid #E2E8F0'
                }}>
                  <tr>
                    <th style={{ 
                      padding: '0.85rem 0.75rem', 
                      fontWeight: 700, 
                      color: '#334155',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      textAlign: 'center',
                      minWidth: '70px'
                    }}>Loan ID</th>
                    <th style={{ 
                      padding: '0.85rem 0.75rem', 
                      fontWeight: 700, 
                      color: '#334155',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      minWidth: '120px'
                    }}>Customer</th>
                    <th style={{ 
                      padding: '0.85rem 0.75rem', 
                      fontWeight: 700, 
                      color: '#334155',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      textAlign: 'right',
                      minWidth: '95px'
                    }}>Amount</th>
                    <th style={{ 
                      padding: '0.85rem 0.75rem', 
                      fontWeight: 700, 
                      color: '#334155',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      textAlign: 'center',
                      minWidth: '80px'
                    }}>Interest</th>
                    <th style={{ 
                      padding: '0.85rem 0.75rem', 
                      fontWeight: 700, 
                      color: '#334155',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      textAlign: 'center',
                      minWidth: '70px'
                    }}>Term</th>
                    <th style={{ 
                      padding: '0.85rem 0.75rem', 
                      fontWeight: 700, 
                      color: '#334155',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      textAlign: 'center',
                      minWidth: '105px'
                    }}>Status</th>
                    <th style={{ 
                      padding: '0.85rem 0.75rem', 
                      fontWeight: 700, 
                      color: '#334155',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      textAlign: 'center',
                      minWidth: '110px'
                    }}>Recovery</th>
                    <th style={{ 
                      padding: '0.85rem 0.75rem', 
                      fontWeight: 700, 
                      color: '#334155',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      textAlign: 'center',
                      minWidth: '110px'
                    }}>Progress</th>
                    <th style={{ 
                      padding: '0.85rem 0.75rem', 
                      fontWeight: 700, 
                      color: '#334155',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      textAlign: 'right',
                      minWidth: '100px'
                    }}>Balance</th>
                    <th style={{ 
                      padding: '0.85rem 0.75rem', 
                      fontWeight: 700, 
                      color: '#334155',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      textAlign: 'center',
                      minWidth: '150px'
                    }}>Actions &amp; Recovery</th>
              </tr>
            </thead>
            <tbody>
              {[...loans].sort((a, b) => {
                const aRej = (a.status || '').toUpperCase() === 'REJECTED';
                const bRej = (b.status || '').toUpperCase() === 'REJECTED';
                if (aRej && !bRej) return 1;
                if (!aRej && bRej) return -1;
                return 0;
                  }).map((loan, index) => (
                    <tr key={loan.id} style={{ 
                      borderBottom: index < loans.length - 1 ? '1px solid #F1F5F9' : 'none'
                    }}>
                      <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        <div style={{ 
                          background: '#0F172A', 
                          color: '#FFFFFF', 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '8px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '0.75rem', 
                          fontWeight: 750,
                          margin: '0 auto'
                        }}>
                          #{loan.id}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 650, color: '#0F172A', fontSize: '0.88rem' }}>
                          {loan.Customer ? loan.Customer.name : '-'}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                          ₹{parseFloat(loan.amount).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        <div style={{ 
                          fontSize: '0.82rem', 
                          color: '#334155', 
                          fontWeight: 600
                        }}>
                          {parseFloat(loan.interestRate).toFixed(1)}%
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        <div style={{ 
                          fontSize: '0.82rem', 
                          color: '#334155', 
                          fontWeight: 600
                        }}>
                          {loan.termMonths}m
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        {renderStatusBadge(loan.status)}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        {renderRecoveryBadge(loan.recoveryStatus)}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        <div style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 500,
                          padding: '0.2rem 0.45rem',
                          borderRadius: '8px',
                          display: 'inline-block',
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          whiteSpace: 'nowrap'
                        }}>
                          <div style={{ 
                            fontSize: '0.68rem', 
                            fontWeight: 700,
                            marginBottom: '0.2rem',
                            color: '#334155'
                          }}>
                            {getPaymentProgress(loan).text}
                          </div>
                          <div style={{ 
                            width: '100%', 
                            minWidth: '80px', 
                            height: '5px', 
                            background: '#E2E8F0', 
                            borderRadius: '3px', 
                            overflow: 'hidden' 
                          }}>
                            <div style={{ 
                              width: `${Math.min(getPaymentProgress(loan).percentage, 100)}%`,
                              height: '100%',
                              background: getPaymentProgress(loan).isGood ? '#10B981' : '#EF4444',
                              borderRadius: '3px',
                              transition: 'width 0.3s ease'
                            }}></div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ 
                          fontWeight: 750, 
                          fontSize: '0.88rem',
                          color: getLoanDetails(loan, paymentsByLoan[loan.id] || []).balance === "0.00" ? '#10B981' : '#DC2626'
                        }}>
                          {getLoanDetails(loan, paymentsByLoan[loan.id] || []).balance === "0.00" ? (
                            <span style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#15803D', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>Fully Paid</span>
                          ) : (
                            `₹${getLoanDetails(loan, paymentsByLoan[loan.id] || []).balance}`
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'center' }}>
                          {/* Always accessible CIR Audit button */}
                          {renderCIRAuditButton(loan)}

                          {loan.agentId === user.id && (
                            editingRecovery[loan.id] ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <select 
                                  className="form-control form-control-sm" 
                                  value={selectedRecovery[loan.id] || ''}
                                  onChange={e => handleRecoverySelect(loan.id, e.target.value)}
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '0.2rem 0.4rem',
                                    borderRadius: '6px',
                                    border: '1px solid #CBD5E1',
                                    color: '#0F172A'
                                  }}
                                >
                                  <option value="">Select Status</option>
                                  <option value="pending">Pending</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="recovered">Recovered</option>
                                </select>
                                {selectedRecovery[loan.id] && (
                                  <button 
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleRecoverySave(loan.id)}
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '0.2rem 0.5rem',
                                      borderRadius: '6px',
                                      fontWeight: 650
                                    }}
                                  >
                                    Save
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button 
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => handleRecoveryEdit(loan.id)}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  color: '#475569',
                                  border: '1px solid #CBD5E1'
                                }}
                              >
                                Edit Recovery
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#666' }}>
                <div style={{ marginBottom: '1rem', opacity: 0.4 }}><Search size={44} color="#64748B" /></div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#333', fontWeight: 600 }}>No Assigned Loans</h4>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  No loans have been assigned to you for recovery yet
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Customer and Admin view */}
          {/* Customer Loan Application Section */}
          {user.role === 'customer' && (
            <div style={{ 
              background: '#fff', 
              borderRadius: '16px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
              overflow: 'hidden', 
              border: '1px solid #e9ecef',
              marginBottom: '2rem'
            }}>
              {/* Header */}
              <div style={{ 
                background: 'linear-gradient(135deg, #0B132B 0%, #1E293B 100%)', 
                color: 'white', 
                padding: '1.75rem', 
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 0.35rem 0', fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Landmark size={22} color="#38BDF8" /> Credit Facility Application
                </h3>
                <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.9rem' }}>
                  Submit credit parameters for real-time automated underwriting and reducing-balance amortization
                </p>
              </div>

              {/* Form Content */}
              <div style={{ padding: '2rem' }}>
                <form onSubmit={handleApply} style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '1rem', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginBottom: '1.5rem' 
                }}>
                  <input 
                    className="form-control" 
                    style={{ 
                      minWidth: 200, 
                      fontSize: '1rem', 
                      flex: 1,
                      padding: '0.875rem 1rem',
                      borderRadius: '8px',
                      border: '2px solid #e9ecef',
                      transition: 'border-color 0.3s ease'
                    }} 
                    name="amount" 
                    placeholder="Loan Amount (₹)" 
                    type="number"
                    min="5000"
                    max="2500000"
                    value={form.amount} 
                    onChange={handleFormChange} 
                    required 
                  />
                  <input 
                    className="form-control" 
                    style={{ 
                      minWidth: 200, 
                      fontSize: '1rem', 
                      flex: 1,
                      padding: '0.875rem 1rem',
                      borderRadius: '8px',
                      border: '2px solid #e9ecef',
                      transition: 'border-color 0.3s ease'
                    }} 
                    name="monthlyIncome" 
                    placeholder="Monthly Income (₹)" 
                    type="number"
                    min="1000"
                    value={form.monthlyIncome} 
                    onChange={handleFormChange} 
                    required 
                  />
                  <input 
                    className="form-control" 
                    style={{ 
                      minWidth: 200, 
                      fontSize: '1rem', 
                      flex: 1,
                      padding: '0.875rem 1rem',
                      borderRadius: '8px',
                      border: '2px solid #e9ecef',
                      transition: 'border-color 0.3s ease'
                    }} 
                    name="existingDebts" 
                    placeholder="Existing Monthly Debts (₹)" 
                    type="number"
                    min="0"
                    value={form.existingDebts} 
                    onChange={handleFormChange} 
                  />
                  <select 
                    className="form-control" 
                    style={{ 
                      minWidth: 200, 
                      fontSize: '1rem', 
                      flex: 1,
                      padding: '0.875rem 1rem',
                      borderRadius: '8px',
                      border: '2px solid #e9ecef',
                      transition: 'border-color 0.3s ease'
                    }} 
                    name="termMonths" 
                    value={form.termMonths} 
                    onChange={handleFormChange} 
                    required
                  >
                <option value="" disabled>Term (months)</option>
                    <option value="3">3 months</option>
                    <option value="6">6 months</option>
                    <option value="9">9 months</option>
                    <option value="12">12 months</option>
                    <option value="15">15 months</option>
                    <option value="18">18 months</option>
                    <option value="24">24 months</option>
              </select>
                  <input 
                    className="form-control" 
                    style={{ 
                      minWidth: 200, 
                      fontSize: '1rem', 
                      flex: 1,
                      padding: '0.875rem 1rem',
                      borderRadius: '8px',
                      border: '2px solid #e9ecef',
                      background: '#f8f9fa',
                      color: '#396afc',
                      fontWeight: 600,
                      cursor: 'not-allowed'
                    }} 
                    name="interestRate" 
                    placeholder="Interest Rate (%)" 
                    value={form.interestRate} 
                    readOnly 
                  />
                  <button 
                    className="btn btn-primary" 
                    style={{ 
                      fontSize: '0.95rem', 
                      padding: '0.875rem 2rem', 
                      minWidth: 150,
                      borderRadius: '8px',
                      fontWeight: 700,
                      background: 'var(--primary-blue)',
                      border: 'none',
                      color: '#FFFFFF',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                      cursor: 'pointer'
                    }} 
                    type="submit"
                  >
                    <Send size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Submit Application
                  </button>
            </form>

            {/* Bureau Consent & Real-time Underwriting Notice */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0.6rem 1rem',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              color: '#166534',
              fontSize: '0.82rem',
              fontWeight: 500,
              marginBottom: '1rem'
            }}>
              <Shield size={16} color="#16A34A" />
              <span>
                <strong>Regulated Bureau Pull:</strong> By submitting, you authorize CredenceOS to pull your official Credit Information Report (CIR via CIBIL/Experian). Scores are securely authenticated server-side.
              </span>
            </div>

                {/* Error and Success Messages */}
                {error && (
                  <div style={{ 
                    marginTop: '1rem',
                    padding: '1rem 1.5rem',
                    background: 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)',
                    color: '#721c24',
                    borderRadius: '8px',
                    border: '1px solid #f5c6cb',
                    fontSize: '0.95rem',
                    fontWeight: 500
                  }}>
                    <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: '0.5rem' }}></i>
                    {error}
                  </div>
                )}
                {success && (
                  <div style={{ 
                    marginTop: '1rem',
                    padding: '1rem 1.5rem',
                    background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
                    color: '#155724',
                    borderRadius: '8px',
                    border: '1px solid #c3e6cb',
                    fontSize: '0.95rem',
                    fontWeight: 500
                  }}>
                    <i className="bi bi-check-circle-fill" style={{ marginRight: '0.5rem' }}></i>
                    {success}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Loans Table Section */}
      <div style={{ 
        background: '#fff', 
        borderRadius: '16px', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
        overflow: 'hidden', 
        border: '1px solid #e9ecef'
      }}>
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #0B132B 0%, #1E293B 100%)', 
          color: 'white', 
          padding: '1.75rem', 
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 0.35rem 0', fontWeight: 700, fontSize: '1.4rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <BarChart3 size={22} color="#38BDF8" /> Active Credit Registry & Underwriting Status
          </h3>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.9rem' }}>
            {user.role === 'customer' ? 'Your active facilities, approved applications, and repayment schedules' : 
             user.role === 'agent' ? 'Assigned delinquent accounts and recovery pipeline' : 
             'Institutional credit ledger and underwriting decisioning stream'}
          </p>
        </div>

        {/* Table Content */}
        <div style={{ padding: '0', overflowX: 'auto' }}>
          {loans.length > 0 ? (
            <table className="table table-hover mb-0" style={{ margin: 0, minWidth: '1150px', width: '100%' }}>
              <thead style={{ 
                background: '#F8FAFC', 
                borderBottom: '1px solid #E2E8F0'
              }}>
                <tr>
                  <th style={{ 
                    padding: '0.85rem 0.75rem', 
                    fontWeight: 700, 
                    color: '#334155',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                    width: '7%'
                  }}>Loan ID</th>
                  {(user.role === 'admin' || user.role === 'agent') && (
                    <th style={{ 
                      padding: '0.85rem 0.75rem', 
                      fontWeight: 700, 
                      color: '#334155',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      width: '12%'
                    }}>Customer</th>
                  )}
                  <th style={{ 
                    padding: '0.85rem 0.75rem', 
                    fontWeight: 700, 
                    color: '#334155',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'right',
                    width: '10%'
                  }}>Amount</th>
                  <th style={{ 
                    padding: '0.85rem 0.75rem', 
                    fontWeight: 700, 
                    color: '#334155',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                    width: '8%'
                  }}>Interest</th>
                  <th style={{ 
                    padding: '0.85rem 0.75rem', 
                    fontWeight: 700, 
                    color: '#334155',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                    width: '7%'
                  }}>Tenure</th>
                  <th style={{ 
                    padding: '0.85rem 0.75rem', 
                    fontWeight: 700, 
                    color: '#334155',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                    width: '10%'
                  }}>Status</th>
                  {(user.role === 'admin' || user.role === 'agent') && (
                    <th style={{ 
                      padding: '0.85rem 0.75rem', 
                      fontWeight: 700, 
                      color: '#334155',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      textAlign: 'center',
                      width: '11%'
                    }}>Recovery Agent</th>
                  )}
                  <th style={{ 
                    padding: '0.85rem 0.75rem', 
                    fontWeight: 700, 
                    color: '#334155',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                    width: '9%'
                  }}>Recovery</th>
                  <th style={{ 
                    padding: '0.85rem 0.75rem', 
                    fontWeight: 700, 
                    color: '#334155',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                    width: '10%'
                  }}>EMIs Repaid</th>
                  <th style={{ 
                    padding: '0.85rem 0.75rem', 
                    fontWeight: 700, 
                    color: '#334155',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'right',
                    width: '12%'
                  }}>Outstanding Balance</th>
                  <th style={{ 
                    padding: '0.85rem 0.75rem', 
                    fontWeight: 700, 
                    color: '#334155',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                    width: '14%'
                  }}>Bureau & Actions</th>
                </tr>
              </thead>
              <tbody>
              {[...loans].sort((a, b) => {
                const isARejected = (a.status || '').toUpperCase() === 'REJECTED';
                const isBRejected = (b.status || '').toUpperCase() === 'REJECTED';
                if (isARejected && !isBRejected) return 1;
                if (!isARejected && isBRejected) return -1;
                return 0;
                }).map((loan, index) => (
                  <tr key={loan.id} style={{ 
                    borderBottom: index < loans.length - 1 ? '1px solid #F1F5F9' : 'none'
                  }}>
                    <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'center' }}>
                      <div style={{ 
                        background: '#0F172A', 
                        color: '#38BDF8', 
                        padding: '0.22rem 0.5rem', 
                        borderRadius: '6px', 
                        display: 'inline-block',
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        border: '1px solid #1E293B'
                      }}>
                        #{loan.id}
                      </div>
                    </td>
                    {(user.role === 'admin' || user.role === 'agent') && (
                      <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 650, color: '#0F172A', fontSize: '0.86rem' }}>
                          {loan.Customer ? loan.Customer.name : '-'}
                        </div>
                        {loan.Customer?.phone && (
                          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            {loan.Customer.phone}
                          </div>
                        )}
                      </td>
                    )}
                    <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                        ₹{Number(loan.amount).toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '0.82rem', 
                        color: '#1E293B', 
                        fontWeight: 600
                      }}>
                        {parseFloat(loan.interestRate).toFixed(1)}% p.a.
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '0.82rem', 
                        color: '#334155', 
                        fontWeight: 600
                      }}>
                        {loan.termMonths}m
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'center' }}>
                      {renderStatusBadge(loan.status)}
                    </td>
                    {(user.role === 'admin' || user.role === 'agent') && (
                      <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.82rem' }}>
                          {loan.Agent ? loan.Agent.name : <span style={{ color: '#94A3B8' }}>Unassigned</span>}
                        </div>
                        {/* Show assign agent select for approved loans without agent */}
                        {user.role === 'admin' && (['APPROVED', 'approved', 'ACTIVE', 'SUBMITTED'].includes(loan.status)) && !loan.Agent && (
                          <div style={{ marginTop: '0.35rem' }}>
                            <Agents onSelect={agentId => setAssignAgentId(prev => ({ ...prev, [loan.id]: agentId }))} />
                            <button 
                              className="btn btn-primary btn-sm mt-1" 
                              disabled={!assignAgentId[loan.id]} 
                              onClick={() => handleAssignAgent(loan.id, assignAgentId[loan.id])}
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.2rem 0.45rem',
                                borderRadius: '4px',
                                fontWeight: 600
                              }}
                            >
                              Assign
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                    <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'center' }}>
                      {renderRecoveryBadge(loan.recoveryStatus)}
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 500,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        display: 'inline-block',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        whiteSpace: 'nowrap'
                      }}>
                        <div style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 700,
                          marginBottom: '0.25rem',
                          color: '#334155'
                        }}>
                          {getPaymentProgress(loan).text} EMIs
                        </div>
                        <div style={{ 
                          width: '100%', 
                          minWidth: '85px',
                          height: '5px', 
                          background: '#E2E8F0', 
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            width: `${Math.min(getPaymentProgress(loan).percentage, 100)}%`,
                            height: '100%',
                            background: getPaymentProgress(loan).isGood ? '#16A34A' : '#E11D48',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ 
                        fontWeight: 750, 
                        fontSize: '0.88rem',
                        color: getLoanDetails(loan, paymentsByLoan[loan.id] || []).balance === "0.00" ? '#16A34A' : '#BE123C'
                      }}>
                      {getLoanDetails(loan, paymentsByLoan[loan.id] || []).balance === "0.00" ? (
                          <span style={{ 
                            background: '#DCFCE7', 
                            color: '#15803D', 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '5px', 
                            fontSize: '0.72rem', 
                            fontWeight: 700,
                            border: '1px solid #86EFAC'
                          }}>
                            Paid in Full
                          </span>
                      ) : (
                          `₹${Number(getLoanDetails(loan, paymentsByLoan[loan.id] || []).balance).toLocaleString('en-IN')}`
                      )}
                      </div>
                    </td>
                    {/* Unified Actions Column for all roles */}
                    <td style={{ padding: '0.85rem 0.75rem', verticalAlign: 'middle', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
                        {/* Bureau CIR & Underwriting Audit Button */}
                        {renderCIRAuditButton(loan)}

                        {/* Approve/Reject buttons for submitted/pending loans */}
                        {(['SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'pending'].includes(loan.status)) && user.role !== 'agent' && user.role !== 'customer' && (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={() => handleStatus(loan.id, 'APPROVED')}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.22rem 0.55rem',
                                borderRadius: '5px',
                                fontWeight: 700,
                                background: '#16A34A',
                                border: 'none',
                                boxShadow: '0 1px 3px rgba(22, 163, 74, 0.3)'
                              }}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleStatus(loan.id, 'REJECTED')}
                              style={{
                                fontSize: '0.72rem',
                                padding: '0.22rem 0.55rem',
                                borderRadius: '5px',
                                fontWeight: 700,
                                background: '#DC2626',
                                border: 'none',
                                boxShadow: '0 1px 3px rgba(220, 38, 38, 0.3)'
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        
                        {/* Recovery status update */}
                        {(user.role === 'admin' || (user.role === 'agent' && loan.agentId === user.id)) && (
                          <div>
                            {editingRecovery[loan.id] ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <select 
                                  className="form-control form-control-sm" 
                                  value={selectedRecovery[loan.id] || ''}
                                  onChange={e => handleRecoverySelect(loan.id, e.target.value)}
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '0.2rem 0.4rem',
                                    borderRadius: '5px',
                                    borderColor: '#CBD5E1'
                                  }}
                                >
                                  <option value="">Select Status</option>
                                  <option value="pending">Pending</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="recovered">Recovered</option>
                                </select>
                                {selectedRecovery[loan.id] && (
                                  <button 
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleRecoverySave(loan.id)}
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '0.18rem 0.45rem',
                                      borderRadius: '4px',
                                      fontWeight: 650
                                    }}
                                  >
                                    Save
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button 
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => handleRecoveryEdit(loan.id)}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '0.18rem 0.5rem',
                                  borderRadius: '5px',
                                  fontWeight: 600,
                                  color: '#334155',
                                  borderColor: '#CBD5E1'
                                }}
                              >
                                Edit Recovery
                              </button>
                            )}
                          </div>
                        )}
                        
                        {/* Delete button for rejected loans */}
                        {((loan.status || '').toUpperCase() === 'REJECTED') && (
                          <button 
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDeleteLoan(loan.id)}
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              fontWeight: 600
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#666' }}>
              <div style={{ marginBottom: '1rem', opacity: 0.4 }}><BarChart3 size={44} color="#64748B" /></div>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#333', fontWeight: 600 }}>
                {user.role === 'customer' ? 'No Loans Yet' : 'No Loans Found'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                {user.role === 'customer' ? 'Apply for your first loan above' : 
                 user.role === 'agent' ? 'No loans have been assigned to you yet' : 
                 'No loan applications in the system'}
              </p>
            </div>
          )}
        </div>
          </div>
        </>
      )}

      {/* Underwriting & Bureau Audit Dossier Modal */}
      <UnderwritingModal
        loan={selectedUnderwritingLoan}
        isOpen={!!selectedUnderwritingLoan}
        onClose={() => setSelectedUnderwritingLoan(null)}
      />
    </div>
  );
}

export default Loans;
