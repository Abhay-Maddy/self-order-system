import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { StaffLoginView } from '../Common/StaffLoginView';
import { AuthContext } from '../../context/AuthContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Menu, X, ChevronRight } from 'lucide-react';

// Map URL tab slug → component tab key
const TAB_SLUG_MAP = {
  overview:   'overview',
  invoice:    'billing',
  invoices:   'billing',
  billing:    'billing',
  refunds:    'refunds',
  menu:       'menu',
  table:      'tables',
  tables:     'tables',
  staff:      'staff',
  inventory:  'inventory',
  coupons:    'coupons',
  customers:  'customers',
  reviews:    'item_reviews',
  reports:    'reports',
  settings:   'settings',
  edit:       'settings',
};

export const AdminPanel = ({ setActivePanel }) => {
  const { user } = useContext(AuthContext);
  const { name, tab } = useParams();
  const navigate = useNavigate();
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const isMobile = useIsMobile(768);

  // Resolve active tab from URL slug (default to 'overview')
  const activeTab = TAB_SLUG_MAP[tab] || 'overview';

  const basePath = user
    ? (user.role === 'cashier' ? `/cashier/${name}` : `/admin/${name}`)
    : `/admin/${name}`;

  const setActiveTab = (tabKey) => {
    // Map internal key → URL slug
    const slugMap = {
      overview:    'overview',
      billing:     'invoice',
      refunds:     'refunds',
      menu:        'menu',
      tables:      'table',
      staff:       'staff',
      inventory:   'inventory',
      coupons:     'coupons',
      customers:   'customers',
      item_reviews:'reviews',
      reports:     'reports',
      settings:    'settings',
    };
    const slug = slugMap[tabKey] || tabKey;
    navigate(`${basePath}/${slug}`);
    setMobileDrawerOpen(false);
  };

  if (!user || !['admin', 'cashier'].includes(user.role)) {
    if (user && user.role === 'waiter') {
      if (setActivePanel) setActivePanel('waiter');
      return null;
    }
    if (user && user.role === 'chef') {
      if (setActivePanel) setActivePanel('kitchen');
      return null;
    }
    return <StaffLoginView defaultRole="admin" onLoginSuccess={(target, loggedUser) => {
      if (loggedUser) {
        const encodedName = encodeURIComponent((loggedUser.name || loggedUser.username || 'user').toLowerCase().replace(/\s+/g, '-'));
        navigate(loggedUser.role === 'cashier' ? `/cashier/${encodedName}` : `/admin/${encodedName}`);
      }
    }} />;
  }

  const navLabels = {
    overview: 'Overview',
    billing: 'Invoices',
    refunds: 'Refunds',
    menu: 'Menu Manager',
    tables: 'Table & QR Manager',
    staff: 'Staff Approvals',
    inventory: 'Stock & Inventory',
    coupons: 'Discounts & Coupons',
    customers: 'Customer Database',
    item_reviews: 'Reviews & Ratings',
    reports: 'Reports & Exports',
    settings: 'Restaurant Settings',
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'overview': return <DashboardOverview setActivePanel={setActivePanel} />;
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
    <div style={{ padding: isMobile ? '0.5rem 0.25rem 4rem' : '1rem 0.5rem 4rem', maxWidth: '100%' }}>
      {/* Mobile Drawer Trigger Header Bar */}
      {isMobile && (
        <div style={{ marginBottom: '0.6rem' }}>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="btn btn-secondary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              borderRadius: '10px',
              border: '1px solid var(--brand-primary)',
              color: 'var(--brand-primary)',
              fontWeight: 800,
              fontSize: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Menu size={16} />
              <span>{navLabels[activeTab] || 'Overview'}</span>
            </div>
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Mobile Slide-Over Navigation Drawer */}
      {isMobile && mobileDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            justify: 'flex-start'
          }}
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            style={{
              width: '280px',
              maxWidth: '85vw',
              height: '100%',
              background: 'var(--bg-surface)',
              padding: '1rem',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--brand-primary)', fontWeight: 800 }}>Admin Navigation</h3>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: '50%', padding: '0.3rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <AdminSidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              role={user.role}
              setActivePanel={setActivePanel}
            />
          </div>
        </div>
      )}

      {/* Main Grid: Desktop preserves 240px sidebar layout, Mobile renders 100% full width */}
      <div style={{
        display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '240px minmax(0, 1fr)',
        gap: '1rem',
        alignItems: 'start'
      }}>
        {!isMobile && (
          <AdminSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            role={user.role}
            setActivePanel={setActivePanel}
          />
        )}
        <div style={{ width: '100%', minWidth: 0 }}>
          {renderActiveTabContent()}
        </div>
      </div>
    </div>
  );
};
