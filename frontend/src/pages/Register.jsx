import React, { useState, useEffect } from 'react';
import { api, handleApiError } from '../utils/api';
import { 
  User, 
  Briefcase, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  UserPlus, 
  Mail, 
  ShieldCheck, 
  RefreshCw, 
  ArrowLeft 
} from 'lucide-react';

function Register({ onLogin, onSuccess, onBackToLogin }) {
  const [step, setStep] = useState('FORM'); // 'FORM' | 'OTP'
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer', phone: '' });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Manage resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const payload = { ...form };
      if (form.role !== 'agent') {
        delete payload.phone;
      } else if (payload.phone) {
        payload.phone = payload.phone.replace(/[\s\-\(\)]/g, '');
      }

      // 1. Register the user
      await api.register(payload);

      // Transition to OTP verification screen
      setStep('OTP');
      setResendCooldown(60);
      setSuccess('Verification code dispatched! Please check your email inbox.');
    } catch (err) {
      handleApiError(err, setError);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);

    try {
      // 1. Verify OTP
      await api.verifyEmailOTP({
        email: form.email,
        otp: cleanOtp
      });

      setSuccess('Email verified successfully! Launching portal...');

      // 2. Automatically log in user
      const loginData = await api.login({
        email: form.email,
        password: form.password
      });

      if (onLogin) {
        setTimeout(() => {
          onLogin(loginData.data.user, loginData.data.token);
        }, 500);
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      handleApiError(err, setError);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.resendEmailOTP({ email: form.email });
      setSuccess(res.message || 'Fresh verification code dispatched to your email.');
      setResendCooldown(60);
    } catch (err) {
      handleApiError(err, setError);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipOTP = async () => {
    setLoading(true);
    try {
      const loginData = await api.login({
        email: form.email,
        password: form.password
      });
      if (onLogin) {
        onLogin(loginData.data.user, loginData.data.token);
      }
    } catch (err) {
      handleApiError(err, setError);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2: EMAIL OTP VERIFICATION SCREEN
  // -------------------------------------------------------------
  if (step === 'OTP') {
    return (
      <div>
        <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
          <div style={{ 
            width: 52, 
            height: 52, 
            borderRadius: '50%', 
            background: '#EFF6FF', 
            color: '#2563EB', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 0.75rem auto',
            border: '2px solid #DBEAFE'
          }}>
            <Mail size={24} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.3rem 0' }}>
            Verify Your Email
          </h2>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.88rem', lineHeight: 1.5 }}>
            We've sent a 6-digit verification code to<br />
            <strong style={{ color: '#1E293B' }}>{form.email}</strong>
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: '#FEF2F2',
            border: '1px solid #FEE2E2',
            borderRadius: '8px',
            color: '#DC2626',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={16} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
            <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            padding: '0.75rem 1rem',
            background: '#F0FDF4',
            border: '1px solid #DCFCE7',
            borderRadius: '8px',
            color: '#16A34A',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleVerifyOTP}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem', textAlign: 'center' }}>
              Enter 6-Digit OTP Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="••••••"
              autoFocus
              required
              style={{
                width: '100%',
                padding: '0.85rem',
                border: '2px solid #3B82F6',
                borderRadius: '8px',
                fontSize: '1.6rem',
                fontWeight: 800,
                color: '#1E293B',
                textAlign: 'center',
                letterSpacing: '0.45em',
                background: '#F8FAFC',
                fontFamily: 'monospace',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.4rem', textAlign: 'center' }}>
              Code expires in 10 minutes. Check your inbox or local server console.
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            style={{
              width: '100%',
              padding: '0.85rem',
              background: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer',
              opacity: (loading || otp.length !== 6) ? 0.65 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
          >
            {loading ? (
              <span>Verifying Code...</span>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Verify Email &amp; Launch Portal</span>
              </>
            )}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resendCooldown > 0 || loading}
            style={{
              background: 'none',
              border: 'none',
              color: resendCooldown > 0 ? '#94A3B8' : '#2563EB',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: 0
            }}
          >
            <RefreshCw size={13} />
            <span>{resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend Code'}</span>
          </button>

          <button
            type="button"
            onClick={handleSkipOTP}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0
            }}
          >
            Verify Later →
          </button>
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => { setStep('FORM'); setError(''); setSuccess(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <ArrowLeft size={13} /> Edit Registration Info
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 1: INITIAL REGISTRATION FORM
  // -------------------------------------------------------------
  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.3rem 0' }}>
          Create an Account
        </h2>
        <p style={{ margin: 0, color: '#64748B', fontSize: '0.88rem' }}>
          Select your portal role and enter identity details.
        </p>
      </div>

      {/* Role Selector Tabs */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
          Account Type
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, role: 'customer' }))}
            style={{
              padding: '0.75rem',
              borderRadius: '10px',
              border: form.role === 'customer' ? '2px solid #2563EB' : '1px solid #E2E8F0',
              background: form.role === 'customer' ? '#EFF6FF' : '#FFFFFF',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.88rem', color: form.role === 'customer' ? '#1D4ED8' : '#0F172A' }}>
              <User size={16} /> Borrower
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
              Apply &amp; service loans
            </div>
          </button>

          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, role: 'agent' }))}
            style={{
              padding: '0.75rem',
              borderRadius: '10px',
              border: form.role === 'agent' ? '2px solid #2563EB' : '1px solid #E2E8F0',
              background: form.role === 'agent' ? '#EFF6FF' : '#FFFFFF',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.88rem', color: form.role === 'agent' ? '#1D4ED8' : '#0F172A' }}>
              <Briefcase size={16} /> Officer / Agent
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
              Portfolio recovery
            </div>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          background: '#FEF2F2',
          border: '1px solid #FEE2E2',
          borderRadius: '8px',
          color: '#DC2626',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <AlertCircle size={16} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
          <span style={{ whiteSpace: 'pre-line' }}>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          padding: '0.75rem 1rem',
          background: '#F0FDF4',
          border: '1px solid #DCFCE7',
          borderRadius: '8px',
          color: '#16A34A',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
            Full Legal Name
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Vikramaditya Sharma"
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
            Official Email Address
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@example.com"
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              required
              style={{
                width: '100%',
                padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: 0
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {form.role === 'agent' && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
              Field Mobile Contact
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.85rem',
            background: '#2563EB',
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
            <span>Sending Verification Code...</span>
          ) : (
            <>
              <UserPlus size={16} />
              <span>Create Account &amp; Send OTP</span>
            </>
          )}
        </button>
      </form>

      <div style={{ marginTop: '1.35rem', textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
        <span style={{ fontSize: '0.85rem', color: '#64748B' }}>Already registered? </span>
        <button
          type="button"
          onClick={onBackToLogin}
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
          Sign In Instead →
        </button>
      </div>
    </div>
  );
}

export default Register;
