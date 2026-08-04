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
import { StaffLoginView } from '../Common/StaffLoginView';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../utils/api';
import { Shield, Lock } from 'lucide-react';

export const AdminPanel = () => {
  const { user, login } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');

  if (!user || !['admin', 'cashier'].includes(user.role)) {
    return <StaffLoginView defaultRole="admin" />;
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
