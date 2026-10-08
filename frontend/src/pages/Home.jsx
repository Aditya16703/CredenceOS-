import React, { useState } from 'react';
import Register from './Register';
import { api, handleApiError } from '../utils/api';
import { 
  Landmark, 
  ShieldAlert, 
  Briefcase, 
  UserCheck, 
  Zap, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  BarChart3, 
  TrendingUp, 
  Lock, 
  FileCheck,
  CheckCircle2,
  Database,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';

function Home({ onLogin }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePersona, setActivePersona] = useState(null);

  // Quick 1-Click Persona Login
  const handlePersonaLogin = async (role) => {
    setError('');
    setActivePersona(role);
    setLoading(true);

    let creds = { email: '', password: '' };
    if (role === 'admin') {
      creds = { email: 'admin@example.com', password: 'admin123' };
    } else if (role === 'agent') {
      creds = { email: 'agent@example.com', password: 'agent123' };
    } else {
      creds = { email: 'customer@example.com', password: 'customer123' };
    }

    setEmail(creds.email);
    setPassword(creds.password);

    try {
      const data = await api.login(creds);
      onLogin(data.data.user, data.data.token);
    } catch (err) {
      handleApiError(err, setError);
    } finally {
      setLoading(false);
      setActivePersona(null);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both institutional email and security passcode.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await api.login({ email, password });
      onLogin(data.data.user, data.data.token);
    } catch (err) {
      handleApiError(err, setError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      {/* Top Institutional Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 3rem',
        background: '#0B132B',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 20px rgba(11, 19, 43, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(37, 99, 235, 0.25))',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.2)'
          }}>
            <Landmark size={20} color="#38BDF8" />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em' }}>
            Credence<span style={{ color: '#38BDF8' }}>OS</span>
          </span>
          <span style={{
            background: 'rgba(37, 99, 235, 0.2)',
            color: '#60A5FA',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.2rem 0.55rem',
            borderRadius: '4px',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            letterSpacing: '0.05em'
          }}>
            LENDING OPERATING SYSTEM
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.06)',
            padding: '0.4rem 0.8rem',
            borderRadius: '20px',
            fontSize: '0.78rem',
            color: '#94A3B8',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }}></span>
            <span>API v2.4 Online (Neon PostgreSQL)</span>
          </div>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}>
            <button
              onClick={() => { setAuthMode('login'); setError(''); }}
              style={{
                background: authMode === 'login' ? '#2563EB' : 'transparent',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                padding: '0.45rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease'
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('register'); setError(''); }}
              style={{
                background: authMode === 'register' ? '#2563EB' : 'transparent',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 600,
                padding: '0.45rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease'
              }}
            >
              Register
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Split */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 2rem',
        maxWidth: 1320,
        margin: '0 auto',
        width: '100%',
        gap: '3.5rem',
        boxSizing: 'border-box'
      }}>
        {/* Left Side: Institutional Product Positioning */}
        <div style={{ flex: 1.25 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            borderRadius: '999px',
            color: '#2563EB',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            marginBottom: '1.25rem'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}></span>
            RESERVE BANK OF INDIA COMPLIANT NBFC CORE
          </div>

          <h1 style={{
            fontSize: '3rem',
            lineHeight: 1.15,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#0F172A',
            marginBottom: '1.2rem'
          }}>
            Institutional Lending Lifecycle. <br />
            <span style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Zero Ambiguity.
            </span>
          </h1>

          <p style={{
            fontSize: '1.05rem',
            lineHeight: 1.6,
            color: '#475569',
            marginBottom: '2rem',
            maxWidth: 600
          }}>
            CredenceOS provides enterprise-grade digital credit rails for Non-Banking Financial Companies: deterministic state machines, mathematical reducing-balance amortization, automated DTI underwriting, and tamper-proof compliance ledgers.
          </p>

          {/* Core Feature Matrix */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              padding: '1.1rem',
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 4px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#0F172A', fontSize: '0.92rem', marginBottom: '0.35rem' }}>
                <BarChart3 size={17} color="#2563EB" />
                <span>Explainable Underwriting</span>
              </div>
              <div style={{ color: '#64748B', fontSize: '0.82rem', lineHeight: 1.45 }}>
                Real-time Debt-to-Income (DTI) evaluation with multi-factor risk categorization.
              </div>
            </div>

            <div style={{
              padding: '1.1rem',
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 4px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#0F172A', fontSize: '0.92rem', marginBottom: '0.35rem' }}>
                <TrendingUp size={17} color="#2563EB" />
                <span>Reducing-Balance EMI</span>
              </div>
              <div style={{ color: '#64748B', fontSize: '0.82rem', lineHeight: 1.45 }}>
                Precision monthly amortization schedules with cent-level closing reconciliation.
              </div>
            </div>

            <div style={{
              padding: '1.1rem',
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 4px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#0F172A', fontSize: '0.92rem', marginBottom: '0.35rem' }}>
                <Lock size={17} color="#2563EB" />
                <span>Payment Idempotency</span>
              </div>
              <div style={{ color: '#64748B', fontSize: '0.82rem', lineHeight: 1.45 }}>
                Double-debit protection utilizing unique cryptographic transaction headers.
              </div>
            </div>

            <div style={{
              padding: '1.1rem',
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 4px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#0F172A', fontSize: '0.92rem', marginBottom: '0.35rem' }}>
                <FileCheck size={17} color="#2563EB" />
                <span>Immutable Audit Trails</span>
              </div>
              <div style={{ color: '#64748B', fontSize: '0.82rem', lineHeight: 1.45 }}>
                Append-only event sourcing capturing actor, IP, timestamp, and state diffs.
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            background: '#F1F5F9',
            borderRadius: '12px',
            border: '1px solid #CBD5E1'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Database size={12} color="#2563EB" /> Database
              </div>
              <div style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 700 }}>Neon PostgreSQL (SSL)</div>
            </div>
            <div style={{ height: 28, width: 1, background: '#CBD5E1' }}></div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cpu size={12} color="#2563EB" /> Underwriting
              </div>
              <div style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 700 }}>Rule-Based (DTI Engine)</div>
            </div>
            <div style={{ height: 28, width: 1, background: '#CBD5E1' }}></div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Layers size={12} color="#2563EB" /> Architecture
              </div>
              <div style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 700 }}>Docker Multi-Container</div>
            </div>
          </div>
        </div>

        {/* Right Side: Elite Auth Hub */}
        <div style={{ flex: 0.95, maxWidth: 480, width: '100%' }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '18px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 35px -5px rgba(15, 23, 42, 0.08), 0 10px 15px -5px rgba(15, 23, 42, 0.04)',
            padding: '2.25rem',
            boxSizing: 'border-box'
          }}>
            {/* Segmented Auth Mode Switcher */}
            <div style={{
              display: 'flex',
              background: '#F1F5F9',
              padding: '4px',
              borderRadius: '10px',
              marginBottom: '1.75rem',
              border: '1px solid #E2E8F0'
            }}>
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '0.65rem 0',
                  border: 'none',
                  borderRadius: '7px',
                  background: authMode === 'login' ? '#FFFFFF' : 'transparent',
                  color: authMode === 'login' ? '#0F172A' : '#64748B',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: authMode === 'login' ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setError(''); }}
                style={{
                  flex: 1,
                  padding: '0.65rem 0',
                  border: 'none',
                  borderRadius: '7px',
                  background: authMode === 'register' ? '#FFFFFF' : 'transparent',
                  color: authMode === 'register' ? '#0F172A' : '#64748B',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: authMode === 'register' ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <UserPlus size={15} />
                <span>Create Account</span>
              </button>
            </div>

            {authMode === 'register' ? (
              <Register
                onLogin={onLogin}
                onSuccess={() => setAuthMode('login')}
                onBackToLogin={() => setAuthMode('login')}
              />
            ) : (
              <div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.3rem 0' }}>
                    Welcome to CredenceOS
                  </h2>
                  <p style={{ margin: 0, color: '#64748B', fontSize: '0.88rem' }}>
                    Sign in with institutional credentials or test with evaluator personas.
                  </p>
                </div>

                {/* 1-Click Instant Persona Sign-in */}
                <div style={{
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid #E2E8F0',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: '#64748B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <Zap size={14} color="#F59E0B" /> 1-Click Evaluator Login
                    </span>
                    <span style={{ color: '#2563EB', fontWeight: 600 }}>Instant Access</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handlePersonaLogin('admin')}
                      style={{
                        padding: '0.6rem 0.4rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: activePersona === 'admin' ? '#1E293B' : '#0B132B',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(11, 19, 43, 0.15)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <ShieldAlert size={14} color="#38BDF8" />
                      <span>Admin</span>
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handlePersonaLogin('agent')}
                      style={{
                        padding: '0.6rem 0.4rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: activePersona === 'agent' ? '#2563EB' : '#1C2541',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(28, 37, 65, 0.15)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <Briefcase size={14} color="#60A5FA" />
                      <span>Officer</span>
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handlePersonaLogin('customer')}
                      style={{
                        padding: '0.6rem 0.4rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: activePersona === 'customer' ? '#1D4ED8' : '#2563EB',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <UserCheck size={14} color="#93C5FD" />
                      <span>Borrower</span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{
                    padding: '0.85rem 1rem',
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    color: '#991B1B',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}>
                    <AlertCircle size={16} color="#991B1B" />
                    <span style={{ flex: 1 }}>{error}</span>
                    <button
                      type="button"
                      onClick={() => setError('')}
                      style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', fontWeight: 700 }}
                    >
                      ×
                    </button>
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                      Institutional Email Address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. admin@example.com"
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.92rem',
                          boxSizing: 'border-box',
                          background: '#FFFFFF'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                        Security Passcode
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563EB',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        {showPassword ? <><EyeOff size={13} style={{ marginRight: 4 }} /> Hide</> : <><Eye size={13} style={{ marginRight: 4 }} /> Show</>}
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{
                          width: '100%',
                          padding: '0.8rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          fontSize: '0.92rem',
                          boxSizing: 'border-box',
                          background: '#FFFFFF'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      background: 'var(--primary-blue)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      opacity: loading ? 0.75 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {loading ? (
                      <>
                        <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spinSlow 0.8s linear infinite' }}></span>
                        <span>Authenticating Session...</span>
                      </>
                    ) : (
                      <>
                        <LogIn size={16} />
                        <span>Sign In to CredenceOS</span>
                      </>
                    )}
                  </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', paddingTop: '1.2rem', borderTop: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748B' }}>First time here? </span>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setError(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563EB',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      padding: 0
                    }}
                  >
                    Open Borrower Account →
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