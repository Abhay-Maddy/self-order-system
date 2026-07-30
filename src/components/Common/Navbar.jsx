import React, { useContext } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { LangToggle } from './LangToggle';
import { AuthContext } from '../../context/AuthContext';
import { Utensils, ChefHat, LayoutDashboard, LogOut, LogIn } from 'lucide-react';

export const Navbar = ({ activePanel, setActivePanel }) => {
  const { user, logout } = useContext(AuthContext);

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
            <h2 style={{ fontSize: '1.25rem', lineHeight: '1.1' }}>GourmetBites</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Self-Ordering Platform</span>
          </div>
        </div>

        {/* Panel Switcher Nav - Only visible if logged in or switching panels */}
        {activePanel !== 'customer' || user ? (
          <nav style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-surface-elevated)', padding: '0.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActivePanel('customer')}
              className={`btn btn-sm ${activePanel === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', fontSize: '0.85rem' }}
            >
              <Utensils size={14} />
              <span>Customer Menu</span>
            </button>

            {/* Kitchen Pass: Chef, Admin, Cashier, or unauthenticated staff login */}
            {(!user || ['chef', 'admin', 'cashier'].includes(user.role)) && (
              <button
                onClick={() => setActivePanel('kitchen')}
                className={`btn btn-sm ${activePanel === 'kitchen' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', fontSize: '0.85rem' }}
              >
                <ChefHat size={14} />
                <span>Kitchen Pass</span>
              </button>
            )}

            {/* Admin Portal: Strictly restricted - NEVER visible for Chef role */}
            {(!user || ['admin', 'cashier'].includes(user.role)) && (
              <button
                onClick={() => {
                  if (user && user.role === 'chef') {
                    alert('Access Denied: Kitchen staff accounts cannot access Admin Portal.');
                    return;
                  }
                  setActivePanel('admin');
                }}
                className={`btn btn-sm ${activePanel === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none', fontSize: '0.85rem' }}
              >
                <LayoutDashboard size={14} />
                <span>Admin Portal</span>
              </button>
            )}
          </nav>
        ) : (
          /* Staff Quick Portal Trigger for clean customer view */
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setActivePanel('kitchen')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', opacity: 0.7 }}
              title="Kitchen Staff Portal"
            >
              <ChefHat size={13} />
              <span>Kitchen</span>
            </button>
            <button
              onClick={() => setActivePanel('admin')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', opacity: 0.7 }}
              title="Admin Portal"
            >
              <LayoutDashboard size={13} />
              <span>Admin</span>
            </button>
          </div>
        )}

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <LangToggle />
          <ThemeToggle />
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
                {user.name} ({user.role})
              </span>
              <button onClick={logout} className="btn btn-secondary btn-sm" title="Log Out">
                <LogOut size={14} />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
