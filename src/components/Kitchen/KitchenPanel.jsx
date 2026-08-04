import React, { useState, useEffect, useContext, useCallback } from 'react';
import { KitchenHeader } from './KitchenHeader';
import { TicketCard } from './TicketCard';
import { RejectionReasonModal } from './RejectionReasonModal';
import { KOTPrintView } from './KOTPrintView';
import { fetchAPI } from '../../utils/api';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import { playKitchenChime } from '../../utils/sound';
import { PageSkeleton } from '../Common/PageSkeleton';
import { StaffLoginView } from '../Common/StaffLoginView';
import { ChefHat } from 'lucide-react';

export const KitchenPanel = () => {
  const { user } = useContext(AuthContext);
  const { socket, joinRoom } = useContext(SocketContext);

  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [printingOrder, setPrintingOrder] = useState(null);

  // K7 Controls
  const [tableFilter, setTableFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('oldest');

  // Load Active Kitchen Orders
  const loadActiveOrders = useCallback(() => {
    setLoading(true);
    fetchAPI('/orders/kitchen')
      .then(data => {
        setOrders(data || []);
      })
      .catch(err => console.error('Failed to load kitchen orders:', err))
      .finally(() => setLoading(false));

    fetchAPI('/tables')
      .then(data => setTables(data || []))
      .catch(err => console.error('Failed to load tables:', err));

    fetchAPI('/inventory')
      .then(data => {
        const low = (data || []).filter(i => i.is_out_of_stock === 1 || i.stock_quantity <= 5);
        setLowStockItems(low);
      })
      .catch(err => console.error('Failed to load inventory:', err));
  }, []);

  useEffect(() => {
    if (user) {
      loadActiveOrders();
    }
  }, [user, loadActiveOrders]);

  // Join Kitchen WebSocket Room & Listen for Live Orders
  useEffect(() => {
    if (!socket || !user) return;

    joinRoom('kitchen');

    const handleNewOrder = (newOrder) => {
      try { playKitchenChime(); } catch (e) {}
      setOrders(prev => {
        const exists = prev.some(o => o.id === newOrder.id);
        if (exists) {
          return prev.map(o => o.id === newOrder.id ? newOrder : o);
        }
        return [newOrder, ...prev];
      });
    };

    const handleOrderUpdated = (updatedOrder) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_updated', handleOrderUpdated);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_updated', handleOrderUpdated);
    };
  }, [socket, user, joinRoom]);

  // Handle Item Status Change (K4, K5, K6)
  const handleItemStatusChange = async (itemId, newStatus, rejectionReason = null) => {
    try {
      await fetchAPI(`/orders/items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, rejection_reason: rejectionReason })
      });
      // Refresh local order list
      loadActiveOrders();
    } catch (err) {
      alert(`Failed to update item status: ${err.message}`);
    }
  };

  // Staff Approval Guard
  if (!user) {
    return <StaffLoginView defaultRole="chef" />;
  }

  // Filter & Sort orders (K7)
  let processedOrders = [...orders];
  if (tableFilter !== 'all') {
    processedOrders = processedOrders.filter(o => o.table_number === tableFilter);
  }
  if (sortOrder === 'oldest') {
    processedOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else {
    processedOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // Filter orders by active kitchen status
  const pendingOrders = processedOrders.filter(o => o.items && o.items.some(i => i.status === 'pending'));
  const preparingOrders = processedOrders.filter(o => o.items && o.items.some(i => i.status === 'preparing' || i.status === 'accepted'));
  const readyOrders = processedOrders.filter(o => o.items && o.items.some(i => i.status === 'ready'));

  return (
    <div className="container" style={{ padding: '1.5rem 1rem 4rem' }}>
      <KitchenHeader
        activeCount={orders.length}
        onRefresh={loadActiveOrders}
        user={user}
        tableFilter={tableFilter}
        setTableFilter={setTableFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        tables={tables}
        lowStockItems={lowStockItems}
      />

      {loading ? (
        <PageSkeleton title="Connecting Live Kitchen KDS..." icon={ChefHat} />
      ) : (
        /* 3-Column KDS Board */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Column 1: New / Pending */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.5rem 0.8rem', background: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)' }}></span>
                New Orders ({pendingOrders.length})
              </h3>
            </div>
            {pendingOrders.map(ord => (
              <TicketCard
                key={ord.id}
                order={ord}
                onItemStatusChange={handleItemStatusChange}
                onPrintKOT={(o) => setPrintingOrder(o)}
                onOpenRejectModal={(item) => setRejectingItem(item)}
              />
            ))}
          </div>

          {/* Column 2: In Cooking / Preparing */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.5rem 0.8rem', background: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)' }}></span>
                Cooking / Prep ({preparingOrders.length})
              </h3>
            </div>
            {preparingOrders.map(ord => (
              <TicketCard
                key={ord.id}
                order={ord}
                onItemStatusChange={handleItemStatusChange}
                onPrintKOT={(o) => setPrintingOrder(o)}
                onOpenRejectModal={(item) => setRejectingItem(item)}
              />
            ))}
          </div>

          {/* Column 3: Ready to Serve */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.5rem 0.8rem', background: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }}></span>
                Ready to Pass ({readyOrders.length})
              </h3>
            </div>
            {readyOrders.map(ord => (
              <TicketCard
                key={ord.id}
                order={ord}
                onItemStatusChange={handleItemStatusChange}
                onPrintKOT={(o) => setPrintingOrder(o)}
                onOpenRejectModal={(item) => setRejectingItem(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <RejectionReasonModal
        item={rejectingItem}
        isOpen={Boolean(rejectingItem)}
        onClose={() => setRejectingItem(null)}
        onConfirmReject={(itemId, reason) => handleItemStatusChange(itemId, 'rejected', reason)}
      />

      <KOTPrintView
        order={printingOrder}
        isOpen={Boolean(printingOrder)}
        onClose={() => setPrintingOrder(null)}
      />
    </div>
  );
};
