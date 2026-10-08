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
  ArrowRight,
  Calculator,
  ShieldCheck,
  Workflow,
  Users,
  Server,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  GitBranch,
  KeyRound,
  FileCode2,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

function Home({ onLogin }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePersona, setActivePersona] = useState(null);

  // Interactive Public Amortization Calculator State
  const [calcAmount, setCalcAmount] = useState(250000);
  const [calcRate, setCalcRate] = useState(10.5);
  const [calcTenure, setCalcTenure] = useState(24);

  const calculateEMI = (P, annualRate, tenureMonths) => {
    if (!P || !tenureMonths) return { emi: 0, totalInterest: 0, totalAmount: 0 };
    const r = annualRate / 12 / 100;
    if (r === 0) {
      const emi = P / tenureMonths;
      return { emi: Math.round(emi), totalInterest: 0, totalAmount: P };
    }
    const emi = (P * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
    const totalAmount = emi * tenureMonths;
    const totalInterest = totalAmount - P;
    return {
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalAmount: Math.round(totalAmount)
    };
  };

  const { emi, totalInterest, totalAmount } = calculateEMI(calcAmount, calcRate, calcTenure);

  const generateAmortizationPreview = (P, annualRate, tenureMonths, emiVal) => {
    const schedule = [];
    let currentBalance = P;
    const monthlyRate = annualRate / 12 / 100;
    for (let month = 1; month <= Math.min(3, tenureMonths); month++) {
      const interestPart = currentBalance * monthlyRate;
      const principalPart = emiVal - interestPart;
      const closing = Math.max(0, currentBalance - principalPart);
      schedule.push({
        month,
        opening: Math.round(currentBalance),
        emi: Math.round(emiVal),
        principal: Math.round(principalPart),
        interest: Math.round(interestPart),
        closing: Math.round(closing)
      });
      currentBalance = closing;
    }
    return schedule;
  };

  const sampleSchedule = generateAmortizationPreview(calcAmount, calcRate, calcTenure, emi);

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

        {/* Navigation Anchors */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          <button
            onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s', padding: 0 }}
            onMouseEnter={(e) => e.target.style.color = '#38BDF8'}
            onMouseLeave={(e) => e.target.style.color = '#94A3B8'}
          >
            Amortization Engine
          </button>
          <button
            onClick={() => document.getElementById('pipeline')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s', padding: 0 }}
            onMouseEnter={(e) => e.target.style.color = '#38BDF8'}
            onMouseLeave={(e) => e.target.style.color = '#94A3B8'}
          >
            Credit Lifecycle
          </button>
          <button
            onClick={() => document.getElementById('personas')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s', padding: 0 }}
            onMouseEnter={(e) => e.target.style.color = '#38BDF8'}
            onMouseLeave={(e) => e.target.style.color = '#94A3B8'}
          >
            Role Matrix
          </button>
          <button
            onClick={() => document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s', padding: 0 }}
            onMouseEnter={(e) => e.target.style.color = '#38BDF8'}
            onMouseLeave={(e) => e.target.style.color = '#94A3B8'}
          >
            Compliance & Specs
          </button>
        </nav>

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

      {/* SECTION 1: INTERACTIVE AMORTIZATION & EMI CALCULATOR */}
      <section id="calculator" style={{
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        borderBottom: '1px solid #E2E8F0',
        padding: '4.5rem 2rem'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.35rem 0.85rem',
              background: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: '999px',
              color: '#2563EB',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              marginBottom: '0.85rem'
            }}>
              <Calculator size={14} /> INSTITUTIONAL FINANCIAL ENGINE
            </div>
            <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', margin: '0 0 0.6rem 0' }}>
              Reducing-Balance Amortization Calculator
            </h2>
            <p style={{ color: '#64748B', fontSize: '1.05rem', margin: 0, maxWidth: 640, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
              Test loan parameters in real-time. Calculate precise monthly EMI installments, total interest costs, and transparent principal reduction schedules.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '2.5rem',
            alignItems: 'start'
          }}>
            {/* Calculator Controls */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '2rem'
            }}>
              {/* Amount Slider */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1E293B' }}>Loan Principal Amount</label>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563EB' }}>
                    ₹{calcAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="25000"
                  max="1000000"
                  step="25000"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#2563EB' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  {[50000, 100000, 250000, 500000, 1000000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCalcAmount(preset)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: calcAmount === preset ? '1px solid #2563EB' : '1px solid #CBD5E1',
                        background: calcAmount === preset ? '#EFF6FF' : '#FFFFFF',
                        color: calcAmount === preset ? '#2563EB' : '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      ₹{(preset / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Interest Rate Slider */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1E293B' }}>Annual Interest Rate</label>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563EB' }}>
                    {calcRate}% p.a.
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="24"
                  step="0.5"
                  value={calcRate}
                  onChange={(e) => setCalcRate(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#2563EB' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {[8.5, 10.5, 12.0, 14.5].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCalcRate(preset)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: calcRate === preset ? '1px solid #2563EB' : '1px solid #CBD5E1',
                        background: calcRate === preset ? '#EFF6FF' : '#FFFFFF',
                        color: calcRate === preset ? '#2563EB' : '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Tenure Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1E293B' }}>Amortization Tenure</label>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563EB' }}>
                    {calcTenure} Months <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>({(calcTenure / 12).toFixed(1)} yrs)</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="60"
                  step="6"
                  value={calcTenure}
                  onChange={(e) => setCalcTenure(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer', accentColor: '#2563EB' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {[12, 24, 36, 48, 60].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCalcTenure(preset)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: calcTenure === preset ? '1px solid #2563EB' : '1px solid #CBD5E1',
                        background: calcTenure === preset ? '#EFF6FF' : '#FFFFFF',
                        color: calcTenure === preset ? '#2563EB' : '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      {preset} Mo
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Display */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '2rem',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05)'
            }}>
              {/* EMI Highlight Card */}
              <div style={{
                background: 'linear-gradient(135deg, #0B132B 0%, #1E293B 100%)',
                color: '#FFFFFF',
                borderRadius: '12px',
                padding: '1.75rem',
                textAlign: 'center',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 15px rgba(11, 19, 43, 0.15)'
              }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                  Calculated Monthly EMI
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
                  ₹{emi.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#CBD5E1' }}>
                  Fixed reducing-balance monthly installment
                </div>
              </div>

              {/* Metrics Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: '0.2rem' }}>Principal</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>₹{calcAmount.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: '0.2rem' }}>Total Interest</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#EA580C' }}>₹{totalInterest.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '10px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: '0.2rem' }}>Total Payable</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#2563EB' }}>₹{totalAmount.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Progress Proportions */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  <span style={{ color: '#2563EB' }}>Principal: {((calcAmount / totalAmount) * 100).toFixed(0)}%</span>
                  <span style={{ color: '#EA580C' }}>Interest: {((totalInterest / totalAmount) * 100).toFixed(0)}%</span>
                </div>
                <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${(calcAmount / totalAmount) * 100}%`, background: '#2563EB' }}></div>
                  <div style={{ width: `${(totalInterest / totalAmount) * 100}%`, background: '#EA580C' }}></div>
                </div>
              </div>

              {/* First 3 Months Amortization Preview */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} color="#2563EB" /> Initial 3-Month Amortization Schedule
                </div>
                <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                        <th style={{ padding: '0.45rem 0.6rem', textAlign: 'left' }}>Mo</th>
                        <th style={{ padding: '0.45rem 0.6rem' }}>Opening</th>
                        <th style={{ padding: '0.45rem 0.6rem' }}>Principal</th>
                        <th style={{ padding: '0.45rem 0.6rem' }}>Interest</th>
                        <th style={{ padding: '0.45rem 0.6rem' }}>Closing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleSchedule.map((row) => (
                        <tr key={row.month} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '0.45rem 0.6rem', textAlign: 'left', fontWeight: 600 }}>#{row.month}</td>
                          <td style={{ padding: '0.45rem 0.6rem', color: '#64748B' }}>₹{row.opening.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '0.45rem 0.6rem', fontWeight: 600, color: '#16A34A' }}>₹{row.principal.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '0.45rem 0.6rem', color: '#EA580C' }}>₹{row.interest.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '0.45rem 0.6rem', fontWeight: 600, color: '#0F172A' }}>₹{row.closing.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Apply CTA */}
              <button
                type="button"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setAuthMode('register');
                }}
                style={{
                  width: '100%',
                  marginTop: '1.25rem',
                  padding: '0.85rem',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>Apply for This Credit Facility</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: END-TO-END CREDIT LIFECYCLE (PIPELINE) */}
      <section id="pipeline" style={{
        background: '#F8FAFC',
        padding: '5rem 2rem'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.35rem 0.85rem',
              background: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: '999px',
              color: '#2563EB',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              marginBottom: '0.85rem'
            }}>
              <Workflow size={14} /> DETERMINISTIC CREDIT RAILS
            </div>
            <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', margin: '0 0 0.6rem 0' }}>
              End-to-End Institutional Lending Lifecycle
            </h2>
            <p style={{ color: '#64748B', fontSize: '1.05rem', margin: 0, maxWidth: 680, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
              From initial borrower regulatory verification to automated underwriting and portfolio recovery, every credit facility follows deterministic state machines.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Step 1 */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '1.75rem',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  background: 'rgba(37, 99, 235, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB'
                }}>
                  <ShieldCheck size={22} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8' }}>PHASE 01</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                Identity & KYC Masking
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: 1.55, flex: 1, margin: 0 }}>
                Regulatory compliance portal verifying 10-char PAN format and tokenizing Aadhaar credentials. Personal identity data is masked before underwriting review.
              </p>
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9', fontSize: '0.78rem', color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> RBI Regulatory Mandate
              </div>
            </div>

            {/* Step 2 */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '1.75rem',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  background: 'rgba(37, 99, 235, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB'
                }}>
                  <Cpu size={22} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8' }}>PHASE 02</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                Automated DTI Underwriting
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: 1.55, flex: 1, margin: 0 }}>
                Algorithmic Debt-to-Income evaluation engine. Computes total debt load against declared monthly income to produce instant transparent risk ratings.
              </p>
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9', fontSize: '0.78rem', color: '#2563EB', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> Deterministic Rules Engine
              </div>
            </div>

            {/* Step 3 */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '1.75rem',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  background: 'rgba(37, 99, 235, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB'
                }}>
                  <TrendingUp size={22} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8' }}>PHASE 03</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                Amortization & Repayment
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: 1.55, flex: 1, margin: 0 }}>
                Precision reducing-balance amortization schedules. Borrowers process EMI installments protected by cryptographic idempotency keys to eliminate double-charges.
              </p>
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9', fontSize: '0.78rem', color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> Idempotent Transactions
              </div>
            </div>

            {/* Step 4 */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '1.75rem',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  background: 'rgba(37, 99, 235, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB'
                }}>
                  <ShieldAlert size={22} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8' }}>PHASE 04</span>
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                Portfolio Recovery Desk
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#64748B', lineHeight: 1.55, flex: 1, margin: 0 }}>
                Delinquent facilities are automatically assigned to recovery officers. Agents track status transitions, record borrower settlements, and reconcile outstanding dues.
              </p>
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9', fontSize: '0.78rem', color: '#EA580C', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={13} /> Real-Time Event Sourcing
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: MULTI-PERSONA ROLE MATRIX */}
      <section id="personas" style={{
        background: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        padding: '5rem 2rem'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.35rem 0.85rem',
              background: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: '999px',
              color: '#2563EB',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              marginBottom: '0.85rem'
            }}>
              <Users size={14} /> ACCESS CONTROL & GOVERNANCE
            </div>
            <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', margin: '0 0 0.6rem 0' }}>
              Multi-Role Persona Matrix
            </h2>
            <p style={{ color: '#64748B', fontSize: '1.05rem', margin: 0, maxWidth: 660, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
              CredenceOS is architected for strict institutional segregation of duties. Experience the platform from any stakeholder perspective with 1-click test access.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem'
          }}>
            {/* Persona 1: Admin */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '2.25rem',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'rgba(37, 99, 235, 0.1)',
                  color: '#2563EB'
                }}>
                  <ShieldAlert size={24} />
                </div>
                <span style={{
                  background: '#EFF6FF',
                  color: '#2563EB',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px'
                }}>
                  FULL GOVERNANCE
                </span>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.4rem 0' }}>
                Institutional Admin & Underwriter
              </h3>
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
                admin@example.com
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.86rem', color: '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#16A34A" /> Approves or rejects customer credit facilities
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#16A34A" /> Inspects tamper-evident system audit ledgers
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#16A34A" /> Verifies customer PAN and masked Aadhaar documents
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#16A34A" /> Oversees recovery officer assignments
                </li>
              </ul>
              <button
                type="button"
                onClick={() => handlePersonaLogin('admin')}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  background: 'linear-gradient(135deg, #0B132B 0%, #1E293B 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Zap size={14} color="#38BDF8" /> Test as Admin
              </button>
            </div>

            {/* Persona 2: Agent */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '2.25rem',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'rgba(234, 88, 12, 0.1)',
                  color: '#EA580C'
                }}>
                  <Briefcase size={24} />
                </div>
                <span style={{
                  background: '#FFF7ED',
                  color: '#EA580C',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px'
                }}>
                  COLLECTIONS DESK
                </span>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.4rem 0' }}>
                Portfolio Recovery Officer
              </h3>
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
                agent@example.com
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.86rem', color: '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#16A34A" /> Accesses dedicated delinquent loans workbench
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#16A34A" /> Updates recovery staging (Pending → Recovered)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#16A34A" /> Inspects individual customer repayment progress
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#16A34A" /> Logs collection timestamps and status notes
                </li>
              </ul>
              <button
                type="button"
                onClick={() => handlePersonaLogin('agent')}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  background: 'linear-gradient(135deg, #0B132B 0%, #1E293B 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Zap size={14} color="#38BDF8" /> Test as Recovery Agent
              </button>
            </div>

            {/* Persona 3: Borrower */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '2.25rem',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  padding: '10px',
                  borderRadius: '10px',
                  background: 'rgba(22, 163, 74, 0.1)',
                  color: '#16A34A'
                }}>
                  <UserCheck size={24} />
                </div>
                <span style={{
                  background: '#F0FDF4',
                  color: '#16A34A',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px'
                }}>
                  CUSTOMER SELF-SERVICE
                </span>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.4rem 0' }}>
                Borrower / Retail Applicant
              </h3>
              <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
                customer@example.com
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.86rem', color: '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#16A34A" /> Submits masked PAN & Aadhaar regulatory verification
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#16A34A" /> Applies for reducing-balance credit facilities
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#16A34A" /> Receives instant underwriting decisioning feedback
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#16A34A" /> Processes monthly EMI repayments via payment gateway
                </li>
              </ul>
              <button
                type="button"
                onClick={() => handlePersonaLogin('customer')}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  background: 'linear-gradient(135deg, #0B132B 0%, #1E293B 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Zap size={14} color="#38BDF8" /> Test as Borrower
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: SECURITY & COMPLIANCE ARCHITECTURE */}
      <section id="security" style={{
        background: '#0B132B',
        color: '#FFFFFF',
        padding: '5rem 2rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.35rem 0.85rem',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '999px',
              color: '#38BDF8',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              marginBottom: '0.85rem'
            }}>
              <Lock size={14} /> SECURITY & COMPLIANCE INFRASTRUCTURE
            </div>
            <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', margin: '0 0 0.6rem 0' }}>
              Institutional Financial Architecture
            </h2>
            <p style={{ color: '#94A3B8', fontSize: '1.05rem', margin: 0, maxWidth: 660, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
              Engineered with modern defense-in-depth principles, cryptographic payment protection, and compliance-first auditing.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '1.75rem'
            }}>
              <div style={{ color: '#38BDF8', marginBottom: '1rem' }}>
                <KeyRound size={24} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 0.4rem 0' }}>
                Identity Masking & PII Protection
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#94A3B8', lineHeight: 1.55, margin: 0 }}>
                Masks PAN documents and tokenizes 12-digit Aadhaar numbers to ensure sensitive data is not exposed in underwriting screens or logs.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '1.75rem'
            }}>
              <div style={{ color: '#38BDF8', marginBottom: '1rem' }}>
                <Lock size={24} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 0.4rem 0' }}>
                Cryptographic Payment Idempotency
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#94A3B8', lineHeight: 1.55, margin: 0 }}>
                Unique transaction key hashing ensures zero duplicate debiting. In-flight retries return identical cached responses without executing secondary debits.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '1.75rem'
            }}>
              <div style={{ color: '#38BDF8', marginBottom: '1rem' }}>
                <FileCheck size={24} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 0.4rem 0' }}>
                Tamper-Proof Audit Trails
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#94A3B8', lineHeight: 1.55, margin: 0 }}>
                Append-only event sourcing tracks every credit transition, actor ID, client IP, timestamp, and metadata diff directly in PostgreSQL.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '1.75rem'
            }}>
              <div style={{ color: '#38BDF8', marginBottom: '1rem' }}>
                <Database size={24} />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 0.4rem 0' }}>
                Neon PostgreSQL Relational Core
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#94A3B8', lineHeight: 1.55, margin: 0 }}>
                Serverless cloud PostgreSQL with SSL encryption, ACID transactions, and foreign key integrity guaranteeing balance consistency.
              </p>
            </div>
          </div>

          {/* Technical Architecture Strip */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '1.25rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Runtime Engine</div>
              <div style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600 }}>Node.js 20 LTS (Node:Test Suite)</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Client Application</div>
              <div style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600 }}>React 19 + Vite 7 (Vercel Edge)</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Containerization</div>
              <div style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600 }}>Docker Multi-Stage (Nginx Alpine)</div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>CI/CD Pipeline</div>
              <div style={{ fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600 }}>GitHub Actions (4 Automated Jobs)</div>
            </div>
          </div>
        </div>
      </section>

      {/* INSTITUTIONAL FOOTER */}
      <footer style={{
        background: '#060A17',
        color: '#94A3B8',
        padding: '3.5rem 2rem 2rem 2rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2.5rem', marginBottom: '3rem' }}>
            <div style={{ maxWidth: 360 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(37, 99, 235, 0.25))',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  padding: '5px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Landmark size={18} color="#38BDF8" />
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  Credence<span style={{ color: '#38BDF8' }}>OS</span>
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                Enterprise digital credit rails for Non-Banking Financial Companies. Deterministic state machines, explainable underwriting, and reducing-balance amortization.
              </p>
            </div>

            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                Navigation
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <li>
                  <button
                    onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                  >
                    Amortization Calculator
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => document.getElementById('pipeline')?.scrollIntoView({ behavior: 'smooth' })}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                  >
                    Credit Lifecycle Rails
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => document.getElementById('personas')?.scrollIntoView({ behavior: 'smooth' })}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                  >
                    Role Matrix & Sandbox
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' })}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                  >
                    Compliance Architecture
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                System Telemetry
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }}></span>
                  <span>Render API: 99.98% Uptime</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }}></span>
                  <span>Vercel Edge CDN: Active</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }}></span>
                  <span>Neon PostgreSQL: SSL Connected</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }}></span>
                  <span>GitHub Actions CI/CD: Passing</span>
                </li>
              </ul>
            </div>

            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.05em' }}>
                Open Source & Repo
              </div>
              <a
                href="https://github.com/Aditya16703/CredenceOS-"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
              >
                <GitBranch size={15} />
                <span>GitHub Repository</span>
                <ExternalLink size={12} />
              </a>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.6rem' }}>
                MIT Licensed • v2.4.0 Production
              </div>
            </div>
          </div>

          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.78rem',
            color: '#64748B'
          }}>
            <div>
              © 2026 CredenceOS Financial Technologies. Crafted for institutional NBFC lending operations.
            </div>
            <div>
              Designed with React 19, Vite, and Lucide Vector Icons.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;