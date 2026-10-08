import { useState, useEffect } from 'react';
import './App.css';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import './AppHeader.css';
import sessionManager from './utils/sessionManager';

import { Landmark, LogOut } from 'lucide-react';

function App() {
  const [user, setUser] = useState(() => {
    // Check if session is valid on app load
    if (sessionManager.isSessionValid()) {
      const session = sessionManager.getSession();
      return session.userData;
    }
    return null;
  });

  useEffect(() => {
    // Listen for session expiration events
    const handleSessionExpired = () => {
      setUser(null);
      alert('Your session has expired due to inactivity. Please log in again.');
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    // Check session validity periodically (every minute)
    const sessionCheckInterval = setInterval(() => {
      if (user && !sessionManager.isSessionValid()) {
        setUser(null);
        alert('Your session has expired. Please log in again.');
      }
    }, 60000); // Check every minute

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
      clearInterval(sessionCheckInterval);
    };
  }, [user]);

  const handleLogin = (userData, token) => {
    setUser(userData);
    sessionManager.initSession(token, userData);
    // Keep the old localStorage for backward compatibility
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    sessionManager.clearSession();
  };

  if (!user) {
    return <Home onLogin={handleLogin} />;
  }

  // Authenticated view
  return (
    <div className="app-bg">
      <header className="app-header">
        <div className="brand-area" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
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
          <span className="brand-logo-text" style={{ letterSpacing: '-0.02em', fontWeight: 800 }}>
            Credence<span style={{ color: '#38BDF8' }}>OS</span>
          </span>
          <span className="brand-badge">NBFC Core</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div className="user-info">
            <div className="user-avatar">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="user-name">
              {user.name} <span className="user-role">{user.role}</span>
            </span>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign out of CredenceOS" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>
      <Dashboard user={user} />
    </div>
  );
}

export default App;
