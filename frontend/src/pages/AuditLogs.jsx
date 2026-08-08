import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = filterAction ? `action=${filterAction}` : '';
      const res = await api.getAuditLogs(params);
      setLogs(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch audit log trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem', background: '#fff', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #edf2f7', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1a202c', fontSize: '1.6rem' }}>📜 Compliance Audit Trail</h2>
          <p style={{ margin: '4px 0 0 0', color: '#718096', fontSize: '0.95rem' }}>
            Append-only tamper-resistant system log recording state transitions, underwriting events, and financial activities.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <select 
            value={filterAction} 
            onChange={(e) => setFilterAction(e.target.value)}
            style={{ padding: '0.5rem 0.8rem', borderRadius: 8, border: '1px solid #cbd5e0' }}
          >
            <option value="">All Audit Actions</option>
            <option value="KYC_SUBMIT">KYC_SUBMIT</option>
            <option value="KYC_VERIFIED">KYC_VERIFIED</option>
            <option value="LOAN_SUBMISSION">LOAN_SUBMISSION</option>
            <option value="LOAN_STATUS_APPROVED">LOAN_STATUS_APPROVED</option>
            <option value="PAYMENT_RECEIVED">PAYMENT_RECEIVED</option>
          </select>
          <button onClick={fetchLogs} style={{ padding: '0.5rem 1rem', background: '#edf2f7', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && <div style={{ padding: '0.75rem', background: '#fed7d7', color: '#742a2a', borderRadius: 8, marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <p style={{ color: '#718096', textAlign: 'center', padding: '2rem' }}>Loading immutable audit entries...</p>
      ) : logs.length === 0 ? (
        <p style={{ color: '#718096', textAlign: 'center', padding: '2rem', background: '#f7fafc', borderRadius: 8 }}>
          No audit records found matching current query.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.75rem' }}>Timestamp</th>
                <th style={{ padding: '0.75rem' }}>Actor</th>
                <th style={{ padding: '0.75rem' }}>Action</th>
                <th style={{ padding: '0.75rem' }}>Entity</th>
                <th style={{ padding: '0.75rem' }}>State Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '0.75rem', color: '#718096', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <strong>User #{log.actorId || 'SYS'}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>({log.actorRole || 'SYSTEM'})</div>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <code style={{ background: '#edf2f7', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 600, color: '#2b6cb0' }}>
                      {log.action}
                    </code>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {log.entityType} #{log.entityId}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <details style={{ cursor: 'pointer' }}>
                      <summary style={{ color: '#3182ce', fontWeight: 500 }}>View Payload</summary>
                      <pre style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: 6, fontSize: '0.75rem', overflowX: 'auto', maxHeight: 150 }}>
                        {JSON.stringify({ previous: log.previousState, current: log.newState, metadata: log.metadata }, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
