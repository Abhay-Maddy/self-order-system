import React from 'react';
import { LayoutDashboard, Utensils, QrCode, Users, Package, Tag, FileText, Settings, CreditCard, RotateCcw } from 'lucide-react';

export const AdminSidebar = ({ activeTab, setActiveTab, role }) => {
  const navItems = [
    { id: 'overview', label: 'Overview & Stats', icon: LayoutDashboard, roles: ['admin', 'cashier'] },
    { id: 'billing', label: 'Invoices & Billing', icon: CreditCard, roles: ['admin', 'cashier'] },
    { id: 'refunds', label: 'Refund Processing', icon: RotateCcw, roles: ['admin', 'cashier'] },
    { id: 'customers', label: 'Customer Database', icon: Users, roles: ['admin', 'cashier'] },
    { id: 'menu', label: 'Menu Catalog Manager', icon: Utensils, roles: ['admin'] },
    { id: 'tables', label: 'Table & QR Manager', icon: QrCode, roles: ['admin'] },
    { id: 'staff', label: 'Staff Approvals', icon: Users, roles: ['admin'] },
    { id: 'inventory', label: 'Stock & Inventory', icon: Package, roles: ['admin', 'cashier'] },
    { id: 'coupons', label: 'Discounts & Coupons', icon: Tag, roles: ['admin'] },
    { id: 'reports', label: 'Reports & Exports', icon: FileText, roles: ['admin'] },
    { id: 'settings', label: 'Restaurant Settings', icon: Settings, roles: ['admin'] },
  ];

  return (
    <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {navItems.filter(item => item.roles.includes(role)).map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
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
        );
      })}
    </div>
  );
};
