import React, { useState, useContext } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { DashboardOverview } from './DashboardOverview';
import { BillingView } from './BillingView';
import { RefundManager } from './RefundManager';
import { CustomerDatabaseView } from './CustomerDatabaseView';
import { MenuManager } from './MenuManager';
import { TableQRManager } from './TableQRManager';
import { StaffApprovalManager } from './StaffApprovalManager';
import { InventoryManager } from './InventoryManager';
import { CouponManager } from './CouponManager';
import { ReportsView } from './ReportsView';
import { SettingsForm } from './SettingsForm';
import { AuthContext } from '../../context/AuthContext';
import { Shield, Lock } from 'lucide-react';

export const AdminPanel = () => {
  const { user, login } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');

  // Staff Login State for Admin / Cashier
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await login(username, password);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  if (!user || !['admin', 'cashier'].includes(user.role)) {
    return (
      <div className="container" style={{ maxWidth: '420px', padding: '3rem 1rem' }}>
        <div className="glass-card animate-slide-up" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: '#fff' }}>
              <Shield size={24} />
            </div>
            <h2 style={{ fontSize: '1.4rem' }}>Management Dashboard</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Authorized Admin & Cashier Sign-in
            </p>
          </div>

          {loginError && (
            <div style={{ padding: '0.65rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="input-field" placeholder="e.g. admin or cashier1" />
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
        </div>
      </div>
    );
  }

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview': return <DashboardOverview />;
      case 'billing': return <BillingView />;
      case 'refunds': return <RefundManager />;
      case 'customers': return <CustomerDatabaseView />;
      case 'menu': return <MenuManager />;
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
