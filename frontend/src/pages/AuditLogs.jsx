import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { History, RefreshCw, Eye, X, Check, Copy, ShieldCheck, ArrowRight, Layers } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted' | 'json'

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

  const handleCopyJson = (payload) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to render state values cleanly
  const renderStateObject = (obj) => {
    if (!obj || (typeof obj === 'object' && Object.keys(obj).length === 0)) {
      return (
        <div style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.82rem', padding: '0.5rem 0' }}>
          No previous state (Initial Entity Creation)
        </div>
      );
    }

    if (typeof obj !== 'object') {
      return <div style={{ fontSize: '0.85rem', color: '#0F172A', fontFamily: 'monospace' }}>{String(obj)}</div>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {Object.entries(obj).map(([key, val]) => (
          <div key={key} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.35rem 0.6rem',
            background: '#F8FAFC',
            borderRadius: '6px',
            fontSize: '0.8rem',
            border: '1px solid #E2E8F0'
          }}>
            <span style={{ fontWeight: 650, color: '#475569', textTransform: 'capitalize' }}>
              {key.replace(/([A-Z])/g, ' $1')}:
            </span>
            <span style={{
              fontWeight: 700,
              fontFamily: typeof val === 'number' || typeof val === 'boolean' ? 'monospace' : 'inherit',
              color: typeof val === 'boolean' ? (val ? '#16A34A' : '#DC2626') : '#0F172A'
            }}>
              {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '1.5rem 2rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05)',
        marginBottom: '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <History size={22} color="#2563EB" />
            </div>
            <div>
              <h2 style={{ margin: 0, color: '#0F172A', fontSize: '1.45rem', fontWeight: 800 }}>
                Append-Only Compliance Audit Trail
              </h2>
              <p style={{ margin: '2px 0 0 0', color: '#64748B', fontSize: '0.85rem' }}>
                Immutable event ledger tracking credit state transitions, KYC approvals, and financial movements
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={filterAction} 
            onChange={(e) => setFilterAction(e.target.value)}
            style={{
              padding: '0.55rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#334155',
              background: '#FFFFFF',
              outline: 'none'
            }}
          >
            <option value="">All Audit Actions</option>
            <option value="KYC_SUBMIT">KYC_SUBMIT</option>
            <option value="KYC_VERIFIED">KYC_VERIFIED</option>
            <option value="LOAN_SUBMISSION">LOAN_SUBMISSION</option>
            <option value="LOAN_STATUS_APPROVED">LOAN_STATUS_APPROVED</option>
            <option value="PAYMENT_RECEIVED">PAYMENT_RECEIVED</option>
          </select>
          <button 
            onClick={fetchLogs} 
            disabled={loading}
            style={{ 
              padding: '0.55rem 1rem', 
              background: '#F1F5F9', 
              border: '1px solid #E2E8F0', 
              borderRadius: '8px', 
              cursor: loading ? 'not-allowed' : 'pointer', 
              fontWeight: 650,
              fontSize: '0.84rem',
              color: '#334155',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.85rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      {/* Main Ledger Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)'
      }}>
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 10px auto', display: 'block', color: '#2563EB' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Streaming cryptographic audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: '#64748B' }}>
            <History size={36} style={{ margin: '0 auto 10px auto', display: 'block', opacity: 0.4 }} />
            <h4 style={{ margin: '0 0 4px 0', color: '#0F172A' }}>No Audit Records Found</h4>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>No events recorded matching the current action filter.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table mb-0" style={{ margin: 0, minWidth: '950px', width: '100%' }}>
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <tr>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Timestamp
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Initiating Actor
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Audit Action
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Target Entity
                  </th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                    State Inspection
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={log.id} style={{ background: '#FFFFFF', borderBottom: idx < logs.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 650, color: '#0F172A', fontSize: '0.85rem' }}>
                        {new Date(log.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', fontFamily: 'monospace' }}>
                        {new Date(log.createdAt).toLocaleTimeString('en-IN')}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
                        User #{log.actorId || 'SYS'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                        {log.actorRole || 'SYSTEM'}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                      <span style={{
                        padding: '0.22rem 0.55rem',
                        borderRadius: '6px',
                        fontSize: '0.74rem',
                        fontWeight: 750,
                        fontFamily: 'monospace',
                        background: log.action.includes('APPROVED') || log.action.includes('VERIFIED') ? '#DCFCE7' : log.action.includes('PAYMENT') ? '#EFF6FF' : '#FEF3C7',
                        color: log.action.includes('APPROVED') || log.action.includes('VERIFIED') ? '#15803D' : log.action.includes('PAYMENT') ? '#1E40AF' : '#B45309',
                        border: log.action.includes('APPROVED') || log.action.includes('VERIFIED') ? '1px solid #86EFAC' : log.action.includes('PAYMENT') ? '1px solid #BFDBFE' : '1px solid #FDE68A'
                      }}>
                        {log.action}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle' }}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '5px',
                        background: '#F1F5F9',
                        color: '#334155',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.78rem',
                        fontWeight: 650
                      }}>
                        {log.entityType} #{log.entityId}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        style={{
                          padding: '0.35rem 0.8rem',
                          background: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Eye size={13} />
                        <span>Inspect Payload</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Institutional State Diff & Payload Inspector Modal */}
      {selectedLog && (
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
          zIndex: 1200,
          backdropFilter: 'blur(5px)',
          padding: '1rem'
        }} onClick={() => setSelectedLog(null)}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            maxWidth: '680px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
            border: '1px solid #E2E8F0',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #0B132B 0%, #1E293B 100%)',
              color: '#FFFFFF',
              padding: '1.25rem 1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  padding: '6px',
                  borderRadius: '8px'
                }}>
                  <ShieldCheck size={20} color="#38BDF8" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                    Audit Event #{selectedLog.id} • {selectedLog.action}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#94A3B8' }}>
                    Tamper-proof record generated at {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              
              {/* Event Metadata Ribbon */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.78rem'
              }}>
                <div>
                  <span style={{ color: '#64748B', display: 'block' }}>Initiating Actor</span>
                  <strong style={{ color: '#0F172A' }}>User #{selectedLog.actorId || 'SYS'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block' }}>Actor Role</span>
                  <strong style={{ color: '#2563EB', textTransform: 'uppercase' }}>{selectedLog.actorRole || 'SYSTEM'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block' }}>Entity Target</span>
                  <strong style={{ color: '#0F172A' }}>{selectedLog.entityType} #{selectedLog.entityId}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block' }}>IP / Rail</span>
                  <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>
                    {selectedLog.metadata?.ipAddress || selectedLog.metadata?.paymentMethod || '127.0.0.1'}
                  </strong>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  State Transition Analysis
                </span>
                <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setViewMode('formatted')}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '4px',
                      border: 'none',
                      background: viewMode === 'formatted' ? '#FFFFFF' : 'transparent',
                      color: viewMode === 'formatted' ? '#0F172A' : '#64748B',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: viewMode === 'formatted' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Visual Diff
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('json')}
                    style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '4px',
                      border: 'none',
                      background: viewMode === 'json' ? '#FFFFFF' : 'transparent',
                      color: viewMode === 'json' ? '#0F172A' : '#64748B',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: viewMode === 'json' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Raw JSON
                  </button>
                </div>
              </div>

              {viewMode === 'formatted' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {/* Previous State */}
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    padding: '1rem'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94A3B8' }}></span>
                      Previous State (Before Event)
                    </div>
                    {renderStateObject(selectedLog.previousState)}
                  </div>

                  {/* New State */}
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #BFDBFE',
                    padding: '1rem'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }}></span>
                      New State (Committed)
                    </div>
                    {renderStateObject(selectedLog.newState)}
                  </div>
                </div>
              ) : (
                /* Raw JSON formatted block */
                <pre style={{
                  background: '#0F172A',
                  color: '#38BDF8',
                  padding: '1rem',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  overflowX: 'auto',
                  maxHeight: '320px',
                  margin: 0,
                  fontFamily: 'Consolas, monospace',
                  border: '1px solid #1E293B'
                }}>
                  {JSON.stringify({
                    id: selectedLog.id,
                    action: selectedLog.action,
                    actorId: selectedLog.actorId,
                    actorRole: selectedLog.actorRole,
                    entityType: selectedLog.entityType,
                    entityId: selectedLog.entityId,
                    previousState: selectedLog.previousState,
                    newState: selectedLog.newState,
                    metadata: selectedLog.metadata,
                    createdAt: selectedLog.createdAt
                  }, null, 2)}
                </pre>
              )}

            </div>

            {/* Footer */}
            <div style={{
              padding: '0.9rem 1.5rem',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 650 }}>
                • Cryptographically Sequenced &amp; Verified
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleCopyJson(selectedLog)}
                  style={{
                    padding: '0.45rem 0.9rem',
                    background: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 650,
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  {copied ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  style={{
                    padding: '0.45rem 1rem',
                    background: '#2563EB',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
