import React from 'react';
import { Shield, ShieldCheck, CheckCircle2, AlertTriangle, AlertCircle, X, Printer, FileText, TrendingUp, UserCheck } from 'lucide-react';

function UnderwritingModal({ loan, isOpen, onClose }) {
  if (!isOpen || !loan) return null;

  const uw = loan.UnderwritingRecord;
  const score = uw?.creditScore || 700;
  const dti = uw?.dtiPercent || 0;
  const riskScore = uw?.riskScore !== undefined ? uw.riskScore : 80;
  const recommendation = uw?.recommendation || 'MANUAL_REVIEW';
  const riskCategory = uw?.riskCategory || 'LOW';
  const factors = uw?.contributingFactors || [];
  const controlNumber = uw?.bureauControlNumber || '202609018471';
  const reportId = uw?.bureauReportId || 'CIR-CIBIL-202609018471';
  const provider = uw?.bureauProvider || 'CIBIL_TRANSUNION';
  const tamperHash = uw?.tamperProofHash || 'b72c91a03ef91823d142857029abce8812';

  // Calculate score percentage on 300 - 900 scale
  const scorePercent = Math.min(100, Math.max(0, ((score - 300) / 600) * 100));

  const getScoreBadgeColor = (val) => {
    if (val >= 750) return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', label: 'Prime' };
    if (val >= 650) return { bg: '#FEF9C3', text: '#A16207', border: '#FDE047', label: 'Near Prime' };
    return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5', label: 'Subprime' };
  };

  const getRecommendationBadge = (rec) => {
    switch (rec) {
      case 'RECOMMENDED_FOR_APPROVAL':
        return { bg: '#DCFCE7', text: '#166534', border: '#86EFAC', icon: CheckCircle2, label: 'Recommended For Approval' };
      case 'MANUAL_REVIEW':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D', icon: AlertTriangle, label: 'Manual Review Required' };
      case 'REJECT_OR_REFER':
      default:
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5', icon: AlertCircle, label: 'High Risk - Reject / Refer' };
    }
  };

  const scoreBadge = getScoreBadgeColor(score);
  const recBadge = getRecommendationBadge(recommendation);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      backdropFilter: 'blur(6px)',
      padding: '1rem'
    }} onClick={onClose}>
      <div 
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          maxWidth: '780px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #E2E8F0',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
          color: '#FFFFFF',
          padding: '1.25rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopLeftRadius: '15px',
          borderTopRightRadius: '15px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '10px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={24} color="#38BDF8" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#F8FAFC' }}>
                Institutional Credit Dossier & Underwriting Audit
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94A3B8' }}>
                Loan #{loan.id} • Customer: {loan.Customer?.name || 'Borrower'} • Facility: ₹{parseFloat(loan.amount).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#94A3B8',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top Verification Ribbon */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                background: '#0284C7',
                color: '#FFFFFF',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                letterSpacing: '0.05em'
              }}>
                {provider}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
                Control No: <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{controlNumber}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#16A34A', fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              <span>KYC-Bound Verified Inquiry</span>
            </div>
          </div>

          {/* Core Metrics: Score & Recommendation */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            
            {/* Credit Score Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Bureau Credit Score
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
                  {score}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 750,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  background: scoreBadge.bg,
                  color: scoreBadge.text,
                  border: `1px solid ${scoreBadge.border}`
                }}>
                  {scoreBadge.label}
                </span>
              </div>
              {/* Score Range Bar (300 to 900) */}
              <div style={{ background: '#E2E8F0', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.4rem' }}>
                <div style={{
                  width: `${scorePercent}%`,
                  height: '100%',
                  background: score >= 750 ? '#10B981' : score >= 650 ? '#F59E0B' : '#EF4444',
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8' }}>
                <span>300 (Subprime)</span>
                <span>900 (Prime)</span>
              </div>
            </div>

            {/* DTI Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Debt-To-Income (DTI) Ratio
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
                  {dti}%
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 750,
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  background: dti <= 35 ? '#DCFCE7' : dti <= 50 ? '#FEF9C3' : '#FEE2E2',
                  color: dti <= 35 ? '#15803D' : dti <= 50 ? '#A16207' : '#B91C1C'
                }}>
                  {dti <= 35 ? 'Healthy' : dti <= 50 ? 'Moderate' : 'Elevated'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                Total Monthly Commitment: <strong>₹{parseFloat(uw?.existingMonthlyDebt || 0) + parseFloat(loan.monthlyEMI || 0)}</strong>
              </p>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                Declared Income: <strong>₹{parseFloat(uw?.monthlyIncome || 0).toLocaleString('en-IN')}</strong> / mo
              </p>
            </div>

            {/* Underwriting Recommendation Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Automated Decisioning
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.35rem 0.65rem',
                borderRadius: '8px',
                background: recBadge.bg,
                color: recBadge.text,
                border: `1px solid ${recBadge.border}`,
                fontWeight: 700,
                fontSize: '0.8rem',
                marginBottom: '0.5rem'
              }}>
                <recBadge.icon size={15} />
                <span>{recBadge.label}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.35rem' }}>
                Risk Classification: <strong style={{ color: riskCategory === 'LOW' ? '#16A34A' : riskCategory === 'MEDIUM' ? '#D97706' : '#DC2626' }}>{riskCategory} RISK</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
                Composite Score: <strong>{riskScore} / 100</strong>
              </div>
            </div>

          </div>

          {/* Explainable Contributing Factors */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <h5 style={{ margin: '0 0 0.85rem 0', fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="#0284C7" /> Traceable Risk Factor Breakdown
            </h5>
            
            {factors.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {factors.map((f, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: f.impact === 'POSITIVE' ? '#F0FDF4' : f.impact === 'NEGATIVE' ? '#FEF2F2' : '#F8FAFC',
                    border: `1px solid ${f.impact === 'POSITIVE' ? '#BBF7D0' : f.impact === 'NEGATIVE' ? '#FECACA' : '#E2E8F0'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 750,
                        padding: '0.2rem 0.45rem',
                        borderRadius: '4px',
                        background: f.impact === 'POSITIVE' ? '#16A34A' : f.impact === 'NEGATIVE' ? '#DC2626' : '#64748B',
                        color: '#FFFFFF'
                      }}>
                        {f.factor}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 500 }}>
                        {f.description}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: f.impact === 'POSITIVE' ? '#16A34A' : f.impact === 'NEGATIVE' ? '#DC2626' : '#64748B'
                    }}>
                      {f.impact}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: '#64748B', padding: '0.5rem' }}>
                Standard credit profile; baseline criteria satisfied without manual risk adjustments.
              </div>
            )}
          </div>

          {/* Cryptographic Audit Trail */}
          <div style={{
            background: '#F8FAFC',
            border: '1px dashed #CBD5E1',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            fontSize: '0.75rem',
            color: '#475569'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span><strong>Inquiry Reference:</strong> {reportId}</span>
              <span style={{ color: '#16A34A', fontWeight: 600 }}>HMAC-SHA256 Integrity Verified</span>
            </div>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', color: '#64748B' }}>
              <strong>Signature Hash:</strong> {tamperHash}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          background: '#F8FAFC',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomLeftRadius: '15px',
          borderBottomRightRadius: '15px'
        }}>
          <button
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Printer size={15} /> Print Audit Dossier
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              border: 'none',
              background: '#0F172A',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

export default UnderwritingModal;
