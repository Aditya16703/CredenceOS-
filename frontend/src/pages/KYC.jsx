import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileCheck2, 
  Lock, 
  Landmark, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  AlertCircle, 
  Fingerprint, 
  UserCheck, 
  Sparkles, 
  Printer, 
  FileText,
  Search,
  BadgeCheck
} from 'lucide-react';
import { api } from '../utils/api';

export default function KYC({ user, onNavigate }) {
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingList, setPendingList] = useState([]);
  const [formData, setFormData] = useState({
    panNumber: '',
    aadhaarNumber: '',
    dateOfBirth: '',
    address: ''
  });
  const [consentChecked, setConsentChecked] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('Identity credentials could not be validated against national registry');

  const isCustomer = user.role === 'customer';
  const isOfficerOrAdmin = ['admin', 'loan_officer', 'agent'].includes(user.role);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError('');
      if (isCustomer) {
        const res = await api.getKYCStatus();
        setKycData(res.data);
      } else if (isOfficerOrAdmin) {
        const res = await api.getPendingKYC();
        setPendingList(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load KYC compliance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consentChecked) {
      setError('Regulatory consent is required to verify identity against national registries.');
      return;
    }
    
    // PAN format check: 5 letters, 4 numbers, 1 letter
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(formData.panNumber.trim().toUpperCase())) {
      setError('Invalid PAN format. Must be 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)');
      return;
    }

    if (formData.aadhaarNumber.replace(/\D/g, '').length !== 12) {
      setError('Aadhaar number must be exactly 12 numeric digits');
      return;
    }

    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const res = await api.submitKYC({
        ...formData,
        panNumber: formData.panNumber.trim().toUpperCase(),
        aadhaarNumber: formData.aadhaarNumber.replace(/\D/g, '')
      });
      setMessage(res.message || 'Identity credentials submitted! Queued for underwriting review.');
      fetchStatus();
    } catch (err) {
      setError(err.message || 'Failed to submit KYC. Please verify PAN and Aadhaar format.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id, status, reason = '') => {
    try {
      await api.reviewKYC(id, { status, rejectionReason: reason });
      setMessage(`KYC #${id} updated to ${status}`);
      setShowRejectModal(null);
      fetchStatus();
    } catch (err) {
      setError(err.message || 'Failed to update KYC compliance record');
    }
  };

  const isPanValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.trim().toUpperCase());
  const isAadhaarValid = formData.aadhaarNumber.replace(/\D/g, '').length === 12;

  // Filtered queue for officer
  const filteredQueue = pendingList.filter(item => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (item.customerName && item.customerName.toLowerCase().includes(q)) ||
      (item.customerEmail && item.customerEmail.toLowerCase().includes(q)) ||
      (item.maskedPAN && item.maskedPAN.toLowerCase().includes(q)) ||
      String(item.id).includes(q)
    );
  });

  return (
    <div style={{ width: '100%', maxWidth: '1240px', margin: '0 auto', color: '#0F172A' }}>
      
      {/* Elite Regulatory Compliance Hero Banner */}
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
        {/* Background ambient lighting */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
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
                <ShieldCheck size={26} color="#38BDF8" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                  Regulatory Identity & Compliance Desk
                </h2>
                <p style={{ margin: '3px 0 0 0', color: '#94A3B8', fontSize: '0.92rem' }}>
                  CBDT PAN Authentication • UIDAI Masked Aadhaar Vault • C-KYCR National Registry Integration
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={fetchStatus}
                disabled={loading}
                style={{
                  padding: '0.55rem 1rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontSize: '0.82rem',
                  fontWeight: 650,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Sync
              </button>
            </div>
          </div>

          {/* Compliance Framework Badges */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
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
              <CheckCircle2 size={13} /> RBI KYC Master Direction 2016
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
              <Lock size={13} /> UIDAI Aadhaar Vault (SHA-256 Masked)
            </span>
            <span style={{
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#FBBF24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '0.35rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <Fingerprint size={13} /> C-KYCR Registry Standard
            </span>
            <span style={{
              background: 'rgba(129, 140, 248, 0.15)',
              color: '#A5B4FC',
              border: '1px solid rgba(129, 140, 248, 0.3)',
              padding: '0.35rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <FileCheck2 size={13} /> PMLA Rule 9 Identity Standard
            </span>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {message && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          color: '#166534',
          fontSize: '0.88rem',
          fontWeight: 650,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 10px rgba(22, 101, 52, 0.05)'
        }}>
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: '12px',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          color: '#991B1B',
          fontSize: '0.88rem',
          fontWeight: 650,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '1.5rem',
          boxShadow: '0 2px 10px rgba(153, 27, 27, 0.05)'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: CUSTOMER VIEW */}
      {isCustomer && (
        <div>
          {/* Case A: KYC Verified */}
          {kycData && kycData.status === 'VERIFIED' ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 4px 30px rgba(15, 23, 42, 0.06)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden'
            }}>
              {/* Card Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)',
                padding: '2rem 2.5rem',
                color: '#FFFFFF',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#DCFCE7',
                    border: '3px solid #86EFAC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 25px rgba(220, 252, 231, 0.4)'
                  }}>
                    <BadgeCheck size={32} color="#15803D" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 800 }}>
                        Customer Profile Fully Verified
                      </h3>
                      <span style={{
                        background: '#DCFCE7',
                        color: '#15803D',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.74rem',
                        fontWeight: 800
                      }}>
                        ACTIVE
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', color: '#D1FAE5', fontSize: '0.9rem' }}>
                      Central KYC Registry (CKYC) accreditation verified • Authorized for institutional credit facilities
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={16} /> Print Compliance Pass
                </button>
              </div>

              {/* Verified Digital Identity Holographic Card */}
              <div style={{ padding: '2.5rem' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  borderRadius: '18px',
                  padding: '2rem',
                  color: '#FFFFFF',
                  boxShadow: '0 15px 35px rgba(15, 23, 42, 0.2)',
                  border: '1px solid #334155',
                  maxWidth: '700px',
                  margin: '0 auto 2rem auto',
                  position: 'relative'
                }}>
                  {/* Watermark / Logo */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Landmark size={22} color="#38BDF8" />
                      <span style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                        CREDENCE NATIONAL COMPLIANCE PASS
                      </span>
                    </div>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '0.78rem',
                      color: '#34D399',
                      background: 'rgba(16, 185, 129, 0.2)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px'
                    }}>
                      KIN-IND-2026-00{user.id}
                    </span>
                  </div>

                  {/* Identity Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                        Masked Income Tax PAN
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: '#38BDF8', marginTop: '2px' }}>
                        {kycData.maskedPAN || 'ABCDE****F'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                        Masked UIDAI Aadhaar Vault
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace', color: '#FFFFFF', marginTop: '2px' }}>
                        {kycData.maskedAadhaar || 'XXXX-XXXX-1234'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                        Date of Birth
                      </div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#F1F5F9', marginTop: '2px' }}>
                        {kycData.dateOfBirth || '-'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                        Verification Authority
                      </div>
                      <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#34D399', marginTop: '2px' }}>
                        Central KYC Registry (C-KYCR)
                      </div>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 600 }}>
                        Verified Residential Address
                      </div>
                      <div style={{ fontSize: '0.92rem', color: '#E2E8F0', marginTop: '2px', lineHeight: 1.4 }}>
                        {kycData.address || 'Standard Registered Residence'}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '1.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.72rem',
                    color: '#64748B'
                  }}>
                    <span>Compliant with Prevention of Money Laundering Act (PMLA 2002)</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>• Tamper Seal Valid</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate('loans');
                      } else {
                        window.dispatchEvent(new CustomEvent('navigatePage', { detail: { page: 'loans' } }));
                      }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '0.85rem 2rem',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: '0.95rem',
                      fontWeight: 750,
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Proceed to Credit Facility Application &rarr;
                  </button>
                </div>
              </div>
            </div>
          ) : kycData && (kycData.status === 'SUBMITTED' || kycData.status === 'UNDER_REVIEW') ? (
            /* Case B: Under Review */
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '2.5rem',
              boxShadow: '0 4px 30px rgba(15, 23, 42, 0.06)',
              border: '1px solid #E2E8F0',
              textAlign: 'center'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#FEF3C7',
                border: '3px solid #FCD34D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto'
              }}>
                <Clock size={32} color="#B45309" />
              </div>

              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
                KYC Dossier Queued for Underwriting Review
              </h3>
              <p style={{ margin: '0 auto 1.5rem auto', maxWidth: '580px', color: '#64748B', fontSize: '0.95rem', lineHeight: 1.5 }}>
                Your PAN and Aadhaar identity tokens have been received and are undergoing automated registry verification by our regulatory compliance officer.
              </p>

              <div style={{
                background: '#F8FAFC',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #E2E8F0',
                maxWidth: '500px',
                margin: '0 auto 2rem auto',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.86rem' }}>
                  <span style={{ color: '#64748B' }}>Submitted PAN:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}>{kycData.maskedPAN}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.86rem' }}>
                  <span style={{ color: '#64748B' }}>Masked Aadhaar:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0F172A' }}>{kycData.maskedAadhaar}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.86rem' }}>
                  <span style={{ color: '#64748B' }}>Submission Timestamp:</span>
                  <span style={{ fontWeight: 650, color: '#0F172A' }}>
                    {new Date(kycData.submittedAt || Date.now()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                  <span style={{ color: '#64748B' }}>Estimated SLA:</span>
                  <span style={{ fontWeight: 700, color: '#B45309' }}>Within 2 Business Hours</span>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchStatus}
                style={{
                  padding: '0.75rem 1.75rem',
                  borderRadius: '10px',
                  background: '#0F172A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Check Latest Verification Status
              </button>
            </div>
          ) : (
            /* Case C: Submission Form */
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              boxShadow: '0 4px 30px rgba(15, 23, 42, 0.06)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                background: '#F8FAFC',
                padding: '1.75rem 2rem',
                borderBottom: '1px solid #E2E8F0'
              }}>
                <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.3rem', fontWeight: 800, color: '#0F172A' }}>
                  Submit Regulatory Identity Credentials
                </h3>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.88rem' }}>
                  Mandatory identity verification under RBI KYC Master Direction 2016 before applying for credit facilities.
                </p>
              </div>

              <div style={{ padding: '2rem' }}>
                {kycData?.status === 'REJECTED' && (
                  <div style={{
                    padding: '1rem 1.25rem',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '12px',
                    marginBottom: '1.75rem',
                    color: '#991B1B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <AlertTriangle size={20} color="#DC2626" />
                    <div>
                      <strong>Previous Submission Disapproved:</strong> {kycData.rejectionReason || 'Identity credentials could not be validated. Please submit authenticated documents.'}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    
                    {/* PAN Input */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Permanent Account Number (PAN)
                        </label>
                        {formData.panNumber && (
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isPanValid ? '#16A34A' : '#DC2626' }}>
                            {isPanValid ? '✓ Valid PAN Format' : '✗ 10 Alphanumeric Req'}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. ABCDE1234F"
                        maxLength={10}
                        required
                        value={formData.panNumber}
                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          border: `1.5px solid ${formData.panNumber ? (isPanValid ? '#86EFAC' : '#FCA5A5') : '#CBD5E1'}`,
                          fontSize: '0.98rem',
                          fontWeight: 750,
                          fontFamily: 'monospace',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          outline: 'none',
                          background: '#F8FAFC'
                        }}
                      />
                      <small style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                        Required for CIBIL / Experian automated bureau score pulls (5 letters, 4 digits, 1 letter)
                      </small>
                    </div>

                    {/* Aadhaar Input */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Aadhaar Number (12 Digits)
                        </label>
                        {formData.aadhaarNumber && (
                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: isAadhaarValid ? '#16A34A' : '#DC2626' }}>
                            {isAadhaarValid ? '✓ 12 Digits Verified' : `✗ ${formData.aadhaarNumber.length}/12 Digits`}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 5412 8901 2345"
                        maxLength={12}
                        required
                        value={formData.aadhaarNumber}
                        onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value.replace(/\D/g, '') })}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          border: `1.5px solid ${formData.aadhaarNumber ? (isAadhaarValid ? '#86EFAC' : '#FCA5A5') : '#CBD5E1'}`,
                          fontSize: '0.98rem',
                          fontWeight: 750,
                          fontFamily: 'monospace',
                          letterSpacing: '0.05em',
                          outline: 'none',
                          background: '#F8FAFC'
                        }}
                      />
                      <small style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                        Protected by UIDAI Masked Aadhaar Vault (only the last 4 digits are retained)
                      </small>
                    </div>

                    {/* Date of Birth */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                        Date of Birth (As per PAN Card)
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          border: '1.5px solid #CBD5E1',
                          fontSize: '0.94rem',
                          fontWeight: 650,
                          outline: 'none',
                          background: '#F8FAFC'
                        }}
                      />
                      <small style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                        Applicant must be at least 18 years old for credit underwriting
                      </small>
                    </div>

                    {/* Residential Address */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                        Current Residential Address
                      </label>
                      <input
                        type="text"
                        placeholder="Complete residential address with Pin Code"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.85rem 1rem',
                          borderRadius: '10px',
                          border: '1.5px solid #CBD5E1',
                          fontSize: '0.94rem',
                          fontWeight: 600,
                          outline: 'none',
                          background: '#F8FAFC'
                        }}
                      />
                      <small style={{ color: '#64748B', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                        Used for geo-demographic bureau reconciliation and communications
                      </small>
                    </div>
                  </div>

                  {/* Regulatory Consent Checkbox */}
                  <div style={{
                    padding: '1rem 1.25rem',
                    background: '#F8FAFC',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    marginBottom: '1.75rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <input
                      type="checkbox"
                      id="consentCheck"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      style={{ marginTop: '3px', cursor: 'pointer', transform: 'scale(1.15)' }}
                    />
                    <label htmlFor="consentCheck" style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5, cursor: 'pointer', margin: 0 }}>
                      <strong>Consent for Regulatory Inquiries:</strong> I hereby declare that the PAN and Aadhaar details provided belong to me. I authorize CredenceOS NBFC and its authorized credit bureau partners (CIBIL / Experian) to retrieve my credit profile and authenticate identity credentials under RBI regulations and the Credit Information Companies (Regulation) Act, 2005.
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || !consentChecked}
                    style={{
                      padding: '0.95rem 2.5rem',
                      background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 750,
                      fontSize: '0.96rem',
                      cursor: (submitting || !consentChecked) ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 15px rgba(2, 132, 199, 0.35)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" /> Authenticating Registry...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} /> Submit Credentials for Regulatory Review
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: OFFICER & ADMIN VERIFICATION QUEUE */}
      {isOfficerOrAdmin && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 4px 30px rgba(15, 23, 42, 0.06)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}>
          {/* Header & Search */}
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
                <UserCheck size={20} color="#0F172A" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  KYC Verification & Underwriting Queue
                </h3>
              </div>
              <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.85rem' }}>
                Review pending customer identity applications against CBDT & UIDAI registry criteria
              </p>
            </div>

            {/* Search filter */}
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search Applicant / PAN..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  padding: '0.55rem 0.9rem 0.55rem 2rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.82rem',
                  outline: 'none',
                  width: '220px'
                }}
              />
            </div>
          </div>

          {/* Review Table */}
          <div style={{ overflowX: 'auto' }}>
            {filteredQueue.length === 0 ? (
              <div style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
                <div style={{ opacity: 0.35, marginBottom: '1rem' }}>
                  <ShieldCheck size={48} color="#64748B" />
                </div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: '#0F172A' }}>
                  No KYC Applications Pending Verification
                </h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748B' }}>
                  All customer onboarding dossiers have been audited and reconciled.
                </p>
              </div>
            ) : (
              <table className="table table-hover mb-0" style={{ margin: 0, minWidth: '1050px', width: '100%' }}>
                <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  <tr>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Customer Profile
                    </th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Income Tax PAN
                    </th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Masked Aadhaar Vault
                    </th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                      Audit Status
                    </th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                      Submitted At
                    </th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                      Underwriting Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: index < filteredQueue.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      
                      {/* Customer Name */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                          {item.customerName || `Customer #${item.customerId}`}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#64748B' }}>
                          {item.customerEmail || 'Registered Portal User'}
                        </div>
                      </td>

                      {/* PAN */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <span style={{
                          fontFamily: 'Consolas, monospace',
                          fontWeight: 750,
                          fontSize: '0.86rem',
                          color: '#0284C7',
                          background: '#F0F9FF',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #BAE6FD'
                        }}>
                          {item.maskedPAN}
                        </span>
                      </td>

                      {/* Aadhaar */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                        <span style={{
                          fontFamily: 'Consolas, monospace',
                          fontWeight: 700,
                          fontSize: '0.86rem',
                          color: '#334155',
                          background: '#F8FAFC',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid #E2E8F0'
                        }}>
                          {item.maskedAadhaar}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.22rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 750,
                          background: item.status === 'VERIFIED' ? '#DCFCE7' : item.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                          color: item.status === 'VERIFIED' ? '#15803D' : item.status === 'REJECTED' ? '#B91C1C' : '#B45309',
                          border: item.status === 'VERIFIED' ? '1px solid #86EFAC' : item.status === 'REJECTED' ? '1px solid #FCA5A5' : '1px solid #FCD34D'
                        }}>
                          {item.status}
                        </span>
                      </td>

                      {/* Submitted At */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'center', fontSize: '0.82rem', color: '#475569' }}>
                        {new Date(item.submittedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        {item.status !== 'VERIFIED' && (
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleReview(item.id, 'VERIFIED')}
                              style={{
                                padding: '0.3rem 0.75rem',
                                background: '#16A34A',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Check size={13} /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowRejectModal(item.id)}
                              style={{
                                padding: '0.3rem 0.75rem',
                                background: '#DC2626',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.76rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <X size={13} /> Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Reject Reason Confirmation Modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '18px',
            padding: '2rem',
            width: '90%',
            maxWidth: '460px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
            border: '1px solid #E2E8F0'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#991B1B' }}>
              Reject Regulatory KYC Application
            </h4>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748B' }}>
              State the regulatory compliance reason for audit trail documentation:
            </p>

            <textarea
              rows={3}
              className="form-control"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.88rem',
                marginBottom: '1.25rem',
                outline: 'none'
              }}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowRejectModal(null)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontWeight: 650,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReview(showRejectModal, 'REJECTED', rejectReason)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 750,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
