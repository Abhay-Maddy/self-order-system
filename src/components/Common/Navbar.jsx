import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { LangToggle } from './LangToggle';
import { UserProfileModal } from './UserProfileModal';
import { StaffLoginModal } from './StaffLoginModal';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { getPanelPath } from '../../utils/panelPath';
import { Utensils, LogOut, Settings, Lock } from 'lucide-react';

export const Navbar = ({ setActivePanel }) => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState(false);

  // Check if table parameter is present in URL (e.g. ?table=T-01)
  const hasTableParam = Boolean(new URLSearchParams(window.location.search).get('table'));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isOnLogin = location.pathname === '/login';

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.75rem 0'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo — always goes home */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <div style={{
            background: 'linear-gradient(135deg, var(--brand-primary), #f59e0b)',
            padding: '0.5rem',
            borderRadius: '12px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Utensils size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', lineHeight: '1.1' }}>Aamantran</h2>
            <span className="navbar-subtitle" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Self-Ordering Platform</span>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Staff Login Button: Hidden when customer accesses via QR code scan or already on login page */}
          {!user && !hasTableParam && !isOnLogin && (
            <button
              onClick={() => navigate('/login')}
              className="btn btn-sm btn-secondary"
              style={{ fontSize: '0.8rem', fontWeight: 700, gap: '0.35rem', borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }}
              title="Staff & Admin Portal Sign In"
            >
              <Lock size={13} />
              <span>{t('staffLogin')}</span>
            </button>
          )}

          <LangToggle />
          <ThemeToggle />

          {user ? (
            (() => {
              const panelPath = getPanelPath(user);

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span
                    onClick={() => navigate(panelPath)}
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      color: 'var(--brand-primary)',
                      background: 'var(--bg-surface-elevated)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '20px',
                      border: '1px solid var(--border-color)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer'
                    }}
                    title="Logged in staff user - Click to open your panel"
                  >
                    <span>👋</span>
                    <span>{user.name || user.username}</span>
                  </span>

                  <button
                    onClick={() => navigate('/profile')}
                    className="btn btn-secondary btn-sm"
                    title="Edit My Profile & Credentials"
                    style={{ fontSize: '0.8rem', fontWeight: 600, gap: '0.3rem', padding: '0.4rem 0.6rem' }}
                  >
                    <Settings size={14} />
                  </button>
                  <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log Out" style={{ padding: '0.4rem 0.6rem' }}>
                    <LogOut size={14} />
                  </button>
                </div>
              );
            })()
          ) : null}
        </div>
      </div>

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <StaffLoginModal
        isOpen={isStaffLoginOpen}
        onClose={() => setIsStaffLoginOpen(false)}
        onLoginSuccess={(targetPanel, loggedUser) => {
          setIsStaffLoginOpen(false);
          if (loggedUser) navigate(getPanelPath(loggedUser));
        }}
      />
    </header>
  );
};
