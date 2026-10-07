import React, { useState } from 'react';
import Register from './Register';
import { api, handleApiError } from '../utils/api';

function Home({ onLogin }) {
  const [showForm, setShowForm] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login({ email, password });
      setError('');
      onLogin(data.data.user, data.data.token);
    } catch (err) {
      handleApiError(err, setError);
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (userRole) => {
    setShowForm(true);
    setShowRegister(false);
    setError('');
    if (userRole === 'admin') {
      setEmail('admin@example.com');
      setPassword('admin123');
    } else if (userRole === 'agent') {
      setEmail('agent@example.com');
      setPassword('agent123');
    } else {
      setEmail('customer@example.com');
      setPassword('customer123');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Top Institutional Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.2rem 3.5rem',
        background: '#0B192C',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            🏛️ CredenceOS
          </span>
          <span style={{
            background: 'rgba(0, 102, 255, 0.2)',
            color: '#60A5FA',
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            border: '1px solid rgba(96, 165, 250, 0.3)'
          }}>
            LENDING OPERATING SYSTEM
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => { setShowForm(true); setShowRegister(false); setError(''); }}
            style={{
              background: showForm && !showRegister ? '#0066FF' : 'transparent',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              fontWeight: 600,
              padding: '0.65rem 1.4rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
          >
            Portal Login
          </button>
          <button
            onClick={() => { setShowForm(true); setShowRegister(true); setError(''); }}
            style={{
              background: '#0066FF',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 600,
              padding: '0.65rem 1.4rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(0, 102, 255, 0.3)'
            }}
          >
            Register Account
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
        maxWidth: 1300,
        margin: '0 auto',
        width: '100%',
        gap: '4rem'
      }}>
        {/* Left Side: Product Positioning & Real Capabilities */}
        <div style={{ flex: 1.2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.8rem',
            background: 'rgba(0, 102, 255, 0.08)',
            border: '1px solid rgba(0, 102, 255, 0.15)',
            borderRadius: '20px',
            color: '#0066FF',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '1.5rem'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }}></span>
            ENTERPRISE CREDIT & UNDERWRITING INFRASTRUCTURE
          </div>

          <h1 style={{
            fontSize: '3.2rem',
            lineHeight: 1.15,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#0F172A',
            marginBottom: '1.25rem'
          }}>
            Institutional lending lifecycle. <br />
            <span style={{ color: '#0066FF' }}>Zero ambiguity.</span>
          </h1>

          <p style={{
            fontSize: '1.1rem',
            lineHeight: 1.6,
            color: '#475569',
            marginBottom: '2.5rem',
            maxWidth: 580
          }}>
            CredenceOS powers end-to-end digital credit delivery for regulated NBFCs: deterministic finite state machines, mathematical reducing-balance amortization, transparent DTI underwriting, and immutable audit logs.
          </p>

          {/* Core Feature Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.2rem', marginBottom: '2.5rem' }}>
            <div style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem', marginBottom: '0.3rem' }}>📊 Explainable Underwriting</div>
              <div style={{ color: '#64748B', fontSize: '0.85rem' }}>Automated Debt-to-Income (DTI) computation with rule-based credit scoring.</div>
            </div>
            <div style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem', marginBottom: '0.3rem' }}>📈 Precision Amortization</div>
              <div style={{ color: '#64748B', fontSize: '0.85rem' }}>Reducing-balance monthly schedules with final-installment cent reconciliation.</div>
            </div>
            <div style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem', marginBottom: '0.3rem' }}>🔒 Payment Idempotency</div>
              <div style={{ color: '#64748B', fontSize: '0.85rem' }}>Atomic transactional boundaries preventing double-debits on retry.</div>
            </div>
            <div style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem', marginBottom: '0.3rem' }}>📜 Tamper-Proof Audit Trail</div>
              <div style={{ color: '#64748B', fontSize: '0.85rem' }}>Append-only compliance ledger tracking actor, IP, and state deltas.</div>
            </div>
          </div>

          {/* Quick Demo Switcher */}
          <div style={{ padding: '1.25rem', background: '#F1F5F9', borderRadius: '10px', border: '1px solid #CBD5E1' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
              ⚡ Quick Fill Demo Credentials (For Evaluators)
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setDemoCredentials('admin')}
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', fontWeight: 600, background: '#0F172A', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Admin (Full Access)
              </button>
              <button
                onClick={() => setDemoCredentials('agent')}
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', fontWeight: 600, background: '#1E3E62', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Recovery Officer
              </button>
              <button
                onClick={() => setDemoCredentials('customer')}
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', fontWeight: 600, background: '#0066FF', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Borrower / Customer
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div style={{ flex: 0.9, maxWidth: 460, width: '100%' }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
            padding: '2.5rem'
          }}>
            {showRegister ? (
              <Register
                onLogin={onLogin}
                onSuccess={() => { setShowRegister(false); setShowForm(true); }}
                onBackToLogin={() => setShowRegister(false)}
              />
            ) : (
              <div>
                <div style={{ marginBottom: '1.75rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.35rem 0' }}>
                    Access CredenceOS Portal
                  </h2>
                  <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>
                    Enter institutional credentials or select an evaluator profile.
                  </p>
                </div>

                {error && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#991B1B',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem'
                  }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                      Institutional Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. admin@example.com"
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.95rem',
                        boxSizing: 'border-box',
                        background: '#F8FAFC'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                      Security Passcode
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '8px',
                        border: '1px solid #CBD5E1',
                        fontSize: '0.95rem',
                        boxSizing: 'border-box',
                        background: '#F8FAFC'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      background: '#0066FF',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(0, 102, 255, 0.25)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {loading ? 'Authenticating...' : 'Sign In to Portal'}
                  </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', paddingTop: '1.25rem', borderTop: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Need an account? </span>
                  <button
                    onClick={() => setShowRegister(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0066FF',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      padding: 0
                    }}
                  >
                    Register as borrower
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;