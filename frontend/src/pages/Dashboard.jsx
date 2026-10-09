import React, { useState, useEffect } from 'react';
import Loans from './Loans';
import Payments from './Payments';
import Reports from './Reports';
import KYC from './KYC';
import AuditLogs from './AuditLogs';
import Notifications from '../components/Notifications';
import { api } from '../utils/api';
import { Building2, CreditCard, ShieldCheck, BarChart3, History, Bell, Shield } from 'lucide-react';

function Dashboard({ user }) {
  const [page, setPage] = useState('loans');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count for agents
  const fetchUnreadCount = async () => {
    if (user.role !== 'agent') return;
    try {
      const data = await api.getUnreadCount();
      setUnreadCount(data.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleNav = (e) => {
      if (e.detail && e.detail.page) {
        setPage(e.detail.page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('navigatePage', handleNav);
    return () => window.removeEventListener('navigatePage', handleNav);
  }, []);

  const navItems = [
    { id: 'loans', label: 'Loan Portfolios', icon: Building2, roles: ['admin', 'agent', 'customer'] },
    { id: 'payments', label: 'Repayments & Ledger', icon: CreditCard, roles: ['admin', 'agent', 'customer'] },
    { id: 'kyc', label: 'KYC & Compliance', icon: ShieldCheck, roles: ['admin', 'agent', 'customer'] },
    { id: 'reports', label: 'Financial Analytics', icon: BarChart3, roles: ['admin'] },
    { id: 'audit', label: 'Immutable Audit Trail', icon: History, roles: ['admin'] }
  ];

  return (
    <div style={{ width: '100%', maxWidth: 1400, margin: '0 auto', padding: '1.5rem 2rem', boxSizing: 'border-box' }}>
      {/* Institutional Top Navigation Bar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
        marginBottom: '1.75rem',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          {navItems
            .filter(item => item.roles.includes(user.role))
            .map(item => {
              const isActive = page === item.id;
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    border: '1px solid',
                    borderColor: isActive ? 'transparent' : '#E2E8F0',
                    background: isActive ? '#0B132B' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#475569',
                    boxShadow: isActive ? '0 4px 12px rgba(11, 19, 43, 0.2)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#F8FAFC';
                      e.currentTarget.style.color = '#0F172A';
                      e.currentTarget.style.borderColor = '#CBD5E1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#FFFFFF';
                      e.currentTarget.style.color = '#475569';
                      e.currentTarget.style.borderColor = '#E2E8F0';
                    }
                  }}
                >
                  <IconComponent size={17} color={isActive ? '#38BDF8' : '#64748B'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
        </div>

        {/* Right Info: Role Badge & Notifications */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.8rem',
            background: '#F1F5F9',
            borderRadius: '999px',
            border: '1px solid #E2E8F0',
            fontSize: '0.78rem',
            color: '#475569',
            fontWeight: 600
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 5px #10B981' }}></span>
            <span>
              {user.role === 'admin' ? 'Executive Workspace' : user.role === 'agent' ? 'Collections Desk' : 'Borrower Portal'}
            </span>
          </div>

          {/* Agent Notifications Bell */}
          {user.role === 'agent' && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(true)}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '10px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '1px solid #CBD5E1',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#2563EB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
                title="Agent Notifications"
              >
                <Bell size={18} color="#475569" />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    borderRadius: '999px',
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    border: '2px solid #FFFFFF',
                    padding: '0 4px'
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Canvas */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '18px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
        padding: '2.25rem',
        minHeight: '620px',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {page === 'loans' && <Loans user={user} onNavigate={setPage} />}
        {page === 'payments' && <Payments user={user} onNavigate={setPage} />}
        {page === 'kyc' && <KYC user={user} onNavigate={setPage} />}
        {page === 'reports' && user.role === 'admin' && <Reports user={user} onNavigate={setPage} />}
        {page === 'audit' && user.role === 'admin' && <AuditLogs user={user} onNavigate={setPage} />}
      </div>

      {/* Notifications Modal */}
      <Notifications
        user={user}
        isOpen={showNotifications}
        onClose={() => {
          setShowNotifications(false);
          fetchUnreadCount();
        }}
      />
    </div>
  );
}

export default Dashboard;
