import React from 'react';
import { LayoutDashboard, Utensils, QrCode, Users, Package, Tag, FileText, Settings, CreditCard, RotateCcw, ShoppingBag, Star } from 'lucide-react';

export const AdminSidebar = ({ activeTab, setActiveTab, role, setActivePanel }) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'cashier'] },
    { id: 'billing', label: 'Invoices', icon: CreditCard, roles: ['admin', 'cashier'] },
    { id: 'refunds', label: 'Refunds', icon: RotateCcw, roles: ['admin', 'cashier'] },
    { id: 'menu', label: 'Menu Manager', icon: Utensils, roles: ['admin'] },
    { id: 'tables', label: 'Table & QR Manager', icon: QrCode, roles: ['admin'] },
    { id: 'staff', label: 'Staff Approvals', icon: Users, roles: ['admin'] },
    { id: 'inventory', label: 'Stock & Inventory', icon: Package, roles: ['admin', 'cashier'] },
    { id: 'coupons', label: 'Discounts & Coupons', icon: Tag, roles: ['admin'] },
    { id: 'customers', label: 'Customer Database', icon: Users, roles: ['admin', 'cashier'] },
    { id: 'item_reviews', label: 'Reviews & Ratings', icon: Star, roles: ['admin', 'cashier'] },
    { id: 'reports', label: 'Reports & Exports', icon: FileText, roles: ['admin'] },
    { id: 'settings', label: 'Restaurant Settings', icon: Settings, roles: ['admin'] },
  ];

  return (
    <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {navItems.filter(item => item.roles.includes(role)).map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <React.Fragment key={item.id}>
            <button
              onClick={() => setActiveTab(item.id)}
              className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                justifyContent: 'flex-start',
                border: 'none',
                borderRadius: 'var(--border-radius-sm)',
                padding: '0.65rem 0.9rem',
                fontSize: '0.9rem',
                gap: '0.6rem'
              }}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
            {item.id === 'overview' && setActivePanel && (
              <button
                onClick={() => setActivePanel('customer')}
                className="btn btn-secondary"
                style={{
                  justifyContent: 'flex-start',
                  border: '1px solid var(--brand-primary)',
                  color: 'var(--brand-primary)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: '0.65rem 0.9rem',
                  fontSize: '0.88rem',
                  gap: '0.6rem',
                  fontWeight: 700,
                  marginTop: '0.1rem',
                  marginBottom: '0.2rem'
                }}
              >
                <Utensils size={18} />
                <span>Menu</span>
              </button>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
