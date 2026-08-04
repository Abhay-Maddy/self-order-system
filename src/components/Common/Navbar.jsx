import React, { useContext, useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { LangToggle } from './LangToggle';
import { UserProfileModal } from './UserProfileModal';
import { StaffLoginModal } from './StaffLoginModal';
import { AuthContext } from '../../context/AuthContext';
import { LanguageContext } from '../../context/LanguageContext';
import { Utensils, ChefHat, LayoutDashboard, LogOut, Settings, Lock } from 'lucide-react';

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

        {/* Panel Switcher Nav - Only shown when staff is logged in */}
        {user ? (
          <nav style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-surface-elevated)', padding: '0.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <button
              onClick={() => setActivePanel('customer')}
              className={`btn btn-sm ${activePanel === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.85rem' }}
            >
              <Utensils size={14} />
              <span>{t('customerMenu')}</span>
            </button>

            {/* Kitchen Pass: Available for Chef, Cashier/Waiter, and Admin */}
            <button
              onClick={() => setActivePanel('kitchen')}
              className={`btn btn-sm ${activePanel === 'kitchen' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.85rem' }}
            >
              <ChefHat size={14} />
              <span>{t('kitchenPass')}</span>
            </button>

            {/* Admin Portal: Strictly restricted to Admin role ONLY */}
            {user.role === 'admin' && (
              <button
                onClick={() => setActivePanel('admin')}
                className={`btn btn-sm ${activePanel === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', fontSize: '0.85rem' }}
              >
                <LayoutDashboard size={14} />
                <span>{t('adminPortal')}</span>
              </button>
            )}
          </nav>
        ) : null}

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={() => setIsProfileOpen(true)}
                className="btn btn-secondary btn-sm"
                title="Edit My Profile & Credentials"
                style={{ fontSize: '0.8rem', fontWeight: 600, gap: '0.3rem' }}
              >
                <Settings size={13} />
                <span>{user.name}</span>
              </button>
              <button onClick={logout} className="btn btn-secondary btn-sm" title="Log Out">
                <LogOut size={14} />
              </button>
            </div>
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
