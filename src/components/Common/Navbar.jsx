import React, { useContext, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { LangToggle } from './LangToggle';
import { UserProfileModal } from './UserProfileModal';
import { StaffLoginModal } from './StaffLoginModal';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { Utensils, ChefHat, LayoutDashboard, LogOut, Settings, Lock, UserCheck } from 'lucide-react';

export const Navbar = ({ activePanel, setActivePanel }) => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState(false);

  // Check if table parameter is present in URL (e.g. ?table=T-01)
  const hasTableParam = Boolean(new URLSearchParams(window.location.search).get('table'));

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
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }} onClick={() => setActivePanel('customer')}>
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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Self-Ordering Platform</span>
          </div>
        </div>



        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Staff Login Button: Hidden when customer accesses via QR code scan */}
          {!user && !hasTableParam && (
            <button
              onClick={() => setActivePanel('staff-login')}
              className={`btn btn-sm ${activePanel === 'staff-login' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', fontWeight: 700, gap: '0.35rem', borderColor: 'var(--brand-primary)', color: activePanel === 'staff-login' ? '#fff' : 'var(--brand-primary)' }}
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
              const isWaiter = user.role === 'waiter' || (user.name && user.name.toLowerCase().includes('waiter')) || user.username === 'waiter1';
              const isChef = user.role === 'chef' || (user.name && user.name.toLowerCase().includes('chef')) || user.username === 'chef1';
              const targetPanel = isWaiter ? 'waiter' : isChef ? 'kitchen' : 'admin';

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span
                    onClick={() => setActivePanel(targetPanel)}
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
                    onClick={() => setIsProfileOpen(true)}
                    className="btn btn-secondary btn-sm"
                    title="Edit My Profile & Credentials"
                    style={{ fontSize: '0.8rem', fontWeight: 600, gap: '0.3rem', padding: '0.4rem 0.6rem' }}
                  >
                    <Settings size={14} />
                  </button>
                  <button onClick={logout} className="btn btn-secondary btn-sm" title="Log Out" style={{ padding: '0.4rem 0.6rem' }}>
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
        onLoginSuccess={(targetPanel) => setActivePanel(targetPanel)}
      />
    </header>
  );
};
