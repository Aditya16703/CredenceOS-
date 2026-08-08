import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function KYC({ user }) {
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingList, setPendingList] = useState([]);
  const [formData, setFormData] = useState({
    panNumber: '',
    aadhaarNumber: '',
    dateOfBirth: '',
    address: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
      setError(err.message || 'Failed to load KYC information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const res = await api.submitKYC(formData);
      setMessage(res.message || 'KYC submitted successfully!');
      fetchStatus();
    } catch (err) {
      setError(err.message || 'Failed to submit KYC. Please verify PAN and Aadhaar format.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id, status, rejectionReason = '') => {
    try {
      await api.reviewKYC(id, { status, rejectionReason });
      setMessage(`KYC #${id} updated to ${status}`);
      fetchStatus();
    } catch (err) {
      setError(err.message || 'Failed to update KYC status');
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem', background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #edf2f7', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1a202c', fontSize: '1.6rem' }}>🪪 Customer KYC Verification</h2>
          <p style={{ margin: '4px 0 0 0', color: '#718096', fontSize: '0.95rem' }}>
            Regulatory verification portal for PAN, masked Aadhaar, and identity compliance.
          </p>
        </div>
        <button 
          onClick={fetchStatus} 
          style={{ padding: '0.5rem 1rem', background: '#edf2f7', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
        >
          🔄 Refresh
        </button>
      </div>

      {message && <div style={{ padding: '0.75rem 1rem', background: '#c6f6d5', color: '#22543d', borderRadius: 8, marginBottom: '1rem' }}>{message}</div>}
      {error && <div style={{ padding: '0.75rem 1rem', background: '#fed7d7', color: '#742a2a', borderRadius: 8, marginBottom: '1rem' }}>{error}</div>}

      {isCustomer ? (
        <div>
          {kycData && kycData.status === 'VERIFIED' ? (
            <div style={{ padding: '2rem', background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: 12, textAlign: 'center' }}>
              <h3 style={{ color: '#22543d', margin: '0 0 0.5rem 0' }}>✅ KYC Verified Successfully</h3>
              <p style={{ color: '#276749' }}>Your customer profile is active. You are fully authorized to apply for credit facilities.</p>
              <div style={{ display: 'inline-block', textAlign: 'left', marginTop: '1rem', background: '#fff', padding: '1rem 2rem', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div><strong>Masked PAN:</strong> {kycData.maskedPAN}</div>
                <div><strong>Masked Aadhaar:</strong> {kycData.maskedAadhaar}</div>
                <div><strong>Date of Birth:</strong> {kycData.dateOfBirth}</div>
                <div><strong>Address:</strong> {kycData.address}</div>
              </div>
            </div>
          ) : kycData && (kycData.status === 'SUBMITTED' || kycData.status === 'UNDER_REVIEW') ? (
            <div style={{ padding: '2rem', background: '#feebc8', border: '1px solid #fbd38d', borderRadius: 12 }}>
              <h3 style={{ color: '#7b341e', margin: 0 }}>⏳ KYC Under Review ({kycData.status})</h3>
              <p style={{ color: '#9c4221', marginTop: '0.5rem' }}>
                Your identity documents have been submitted and are queued for verification by our underwriting officer.
              </p>
              <div style={{ marginTop: '1rem', color: '#4a5568' }}>
                <div><strong>Submitted PAN:</strong> {kycData.maskedPAN}</div>
                <div><strong>Aadhaar:</strong> {kycData.maskedAadhaar}</div>
                <div><strong>Submission Date:</strong> {new Date(kycData.submittedAt).toLocaleDateString()}</div>
              </div>
            </div>
          ) : (
            <div>
              {kycData?.status === 'REJECTED' && (
                <div style={{ padding: '1rem', background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, marginBottom: '1.5rem', color: '#9b2c2c' }}>
                  <strong>⚠️ Previous Submission Rejected:</strong> {kycData.rejectionReason || 'Please resubmit valid credentials.'}
                </div>
              )}
              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#4a5568' }}>PAN Number (10 Characters)</label>
                  <input
                    type="text"
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                    required
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #cbd5e0', textTransform: 'uppercase' }}
                  />
                  <small style={{ color: '#718096' }}>Format: 5 letters, 4 digits, 1 letter</small>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#4a5568' }}>Aadhaar Number (12 Digits)</label>
                  <input
                    type="text"
                    placeholder="e.g. 5412 8901 2345"
                    maxLength={12}
                    required
                    value={formData.aadhaarNumber}
                    onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value.replace(/\D/g, '') })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #cbd5e0' }}
                  />
                  <small style={{ color: '#718096' }}>Only the last 4 digits are retained securely</small>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#4a5568' }}>Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #cbd5e0' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#4a5568' }}>Current Residential Address</label>
                  <input
                    type="text"
                    placeholder="Complete residential address"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #cbd5e0' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '0.875rem 2rem',
                      background: 'linear-gradient(135deg, #396afc 0%, #2948ff 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 600,
                      cursor: submitting ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {submitting ? 'Verifying & Submitting...' : 'Submit KYC for Verification'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        /* Officer & Admin View */
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#2d3748' }}>
            KYC Verification Queue ({pendingList.length} applications)
          </h3>
          {pendingList.length === 0 ? (
            <p style={{ color: '#718096', padding: '1rem', background: '#f7fafc', borderRadius: 8 }}>
              No KYC applications pending verification at this moment.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Masked PAN</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Aadhaar Ref</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Submitted At</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingList.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <strong>{item.customerName}</strong>
                        <div style={{ fontSize: '0.85rem', color: '#718096' }}>{item.customerEmail}</div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{item.maskedPAN}</td>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{item.maskedAadhaar}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: 20,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: item.status === 'VERIFIED' ? '#c6f6d5' : item.status === 'REJECTED' ? '#fed7d7' : '#feebc8',
                          color: item.status === 'VERIFIED' ? '#22543d' : item.status === 'REJECTED' ? '#742a2a' : '#7b341e'
                        }}>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                        {new Date(item.submittedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {item.status !== 'VERIFIED' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleReview(item.id, 'VERIFIED')}
                              style={{ padding: '0.4rem 0.8rem', background: '#38a169', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReview(item.id, 'REJECTED', 'Identity details could not be authenticated')}
                              style={{ padding: '0.4rem 0.8rem', background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem' }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
