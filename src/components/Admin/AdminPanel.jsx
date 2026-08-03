import React, { useState, useContext } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { DashboardOverview } from './DashboardOverview';
import { BillingView } from './BillingView';
import { RefundManager } from './RefundManager';
import { CustomerDatabaseView } from './CustomerDatabaseView';
import { MenuManager } from './MenuManager';
import { AdminLiveOrdersDrawer } from './AdminLiveOrdersDrawer';
import { ItemReviewsView } from './ItemReviewsView';
import { TableQRManager } from './TableQRManager';
import { StaffApprovalManager } from './StaffApprovalManager';
import { InventoryManager } from './InventoryManager';
import { CouponManager } from './CouponManager';
import { ReportsView } from './ReportsView';
import { SettingsForm } from './SettingsForm';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../utils/api';
import { Shield, Lock } from 'lucide-react';

export const AdminPanel = () => {
  const { user, login } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');

  // Staff Auth State
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'request'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('cashier'); // 'cashier', 'chef', 'admin'
  const [loginError, setLoginError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await login(username, password);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleStaffRequestSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setRequestSuccess('');
    try {
      const res = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, name, role })
      });
      setRequestSuccess(res.message || 'Staff account request submitted! Pending Main Admin approval.');
      setUsername('');
      setPassword('');
      setName('');
      setEmail('');
    } catch (err) {
      setLoginError(err.message);
    }
  };

  if (!user || !['admin', 'cashier'].includes(user.role)) {
    return (
      <div className="container" style={{ maxWidth: '440px', padding: '3rem 1rem' }}>
        <div className="glass-card animate-slide-up" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: '#fff' }}>
              <Shield size={24} />
            </div>
            <h2 style={{ fontSize: '1.4rem' }}>Management Dashboard</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Authorized Staff & Admin Sign-In Portal
            </p>
          </div>

          {/* Sub-Tabs: Sign In vs Request Account */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'var(--bg-surface-elevated)', padding: '0.3rem', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setLoginError(''); setRequestSuccess(''); }}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '6px',
                border: 'none',
                background: authMode === 'login' ? 'var(--brand-primary)' : 'transparent',
                color: authMode === 'login' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('request'); setLoginError(''); setRequestSuccess(''); }}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '6px',
                border: 'none',
                background: authMode === 'request' ? 'var(--brand-primary)' : 'transparent',
                color: authMode === 'request' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Request Account
            </button>
          </div>

          {loginError && (
            <div style={{ padding: '0.65rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {loginError}
            </div>
          )}

          {requestSuccess && (
            <div style={{ padding: '0.65rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {requestSuccess}
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Username or Email</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="input-field" placeholder="admin or user@domain.com" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-field" placeholder="••••••••" />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Sign In to Dashboard</button>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', background: 'var(--bg-surface-elevated)', padding: '0.6rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                <div>Demo Credentials:</div>
                <div>Owner Admin: <b>admin</b> / <b>admin123</b></div>
                <div>Cashier: <b>cashier1</b> / <b>cashier123</b></div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStaffRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.8rem' }}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="input-field" placeholder="e.g. Vikram Malhotra" style={{ fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.8rem' }}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input-field" placeholder="vikram@restaurant.com" style={{ fontSize: '0.85rem' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.8rem' }}>Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="input-field" placeholder="vikram123" style={{ fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.8rem' }}>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-field" placeholder="••••••••" style={{ fontSize: '0.85rem' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.8rem' }}>Requested Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="input-field" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  <option value="cashier">Billing Cashier</option>
                  <option value="chef">Kitchen Chef</option>
                  <option value="admin">Sub-Admin</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.5rem' }}>Submit Staff Account Request</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview': return <DashboardOverview />;
      case 'live_orders': return <AdminLiveOrdersDrawer />;
      case 'billing': return <BillingView />;
      case 'refunds': return <RefundManager />;
      case 'customers': return <CustomerDatabaseView />;
      case 'menu': return <MenuManager />;
      case 'item_reviews': return <ItemReviewsView />;
      case 'tables': return <TableQRManager />;
      case 'staff': return <StaffApprovalManager />;
      case 'inventory': return <InventoryManager />;
      case 'coupons': return <CouponManager />;
      case 'reports': return <ReportsView />;
      case 'settings': return <SettingsForm />;
      default: return <DashboardOverview />;
    }
  };

  return (
    <div className="container" style={{ padding: '1.5rem 1rem 4rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          role={user.role}
        />
        <div>
          {renderActiveTabContent()}
        </div>
      </div>
    </div>
  );
};
