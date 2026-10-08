import React, { useState } from 'react';
import { api, handleApiError } from '../utils/api';
import { User, Briefcase, Eye, EyeOff, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react';

function Register({ onLogin, onSuccess, onBackToLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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

      // 2. Automatically log in the user
      const loginData = await api.login({
        email: form.email,
        password: form.password
      });

      setSuccess('Account created successfully! Launching portal...');

      // Redirect directly to dashboard via onLogin
      if (onLogin) {
        setTimeout(() => {
          onLogin(loginData.data.user, loginData.data.token);
        }, 400);
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      handleApiError(err, setError);
    } finally {
      setLoading(false);
    }
  };

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
          <AlertCircle size={16} />
          <span style={{ flex: 1 }}>{error}</span>
        </div>
      )}

      {success && (
        <div style={{
          padding: '0.85rem 1rem',
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          color: '#065F46',
          borderRadius: '10px',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <CheckCircle2 size={16} />
          <span style={{ flex: 1 }}>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
            Full Legal Name
          </label>
          <input
            name="name"
            type="text"
            required
            disabled={loading}
            placeholder="e.g. John Doe"
            value={form.name}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.75rem 0.95rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.92rem',
              boxSizing: 'border-box',
              background: '#FFFFFF'
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
            Email Address
          </label>
          <input
            name="email"
            type="email"
            required
            disabled={loading}
            placeholder="e.g. name@domain.com"
            value={form.email}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.75rem 0.95rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.92rem',
              boxSizing: 'border-box',
              background: '#FFFFFF'
            }}
          />
        </div>

        <div style={{ marginBottom: form.role === 'agent' ? '1rem' : '1.35rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
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
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            disabled={loading}
            placeholder="Min 6 alphanumeric characters"
            value={form.password}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '0.75rem 0.95rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.92rem',
              boxSizing: 'border-box',
              background: '#FFFFFF'
            }}
          />
        </div>

        {form.role === 'agent' && (
          <div style={{ marginBottom: '1.35rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Official Contact Phone
            </label>
            <input
              name="phone"
              type="tel"
              required
              disabled={loading}
              placeholder="e.g. 9876543210"
              value={form.phone}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem 0.95rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.92rem',
                boxSizing: 'border-box',
                background: '#FFFFFF'
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
              <span>Registering Account...</span>
            </>
          ) : (
            <>
              <UserPlus size={16} />
              <span>Complete Registration</span>
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
