import React, { useState, useEffect, useContext, useCallback } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatTime } from '../../utils/formatters';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import { PageSkeleton } from '../Common/PageSkeleton';
import { StaffLoginView } from '../Common/StaffLoginView';
import { playWaiterVibrationAndChime } from '../../utils/sound';
import { UserCheck, Bell, CheckCircle2, Clock, RefreshCw, Filter, Smartphone, Volume2 } from 'lucide-react';

export const WaiterPanel = ({ setActivePanel }) => {
  const { user } = useContext(AuthContext);
  const { socket, joinRoom } = useContext(SocketContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('ready');
  const [lastVibratedTable, setLastVibratedTable] = useState(null);

  const loadOrders = useCallback(() => {
    setLoading(true);
    fetchAPI('/orders/kitchen')
      .then(data => setOrders(data || []))
      .catch(err => console.error('Failed to load waiter orders:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) loadOrders();
  }, [user, loadOrders]);

  useEffect(() => {
    if (!socket || !user) return;
    joinRoom('kitchen');

    const handleOrderUpdate = (data) => {
      loadOrders();
      if (data && (data.status === 'ready' || (data.items && data.items.some(i => i.status === 'ready')))) {
        const tableNum = data.table_number || data.tableNumber;
        setLastVibratedTable(tableNum || 'Active Table');
        try { playWaiterVibrationAndChime(tableNum); } catch (e) {}
      }
    };

    const handleItemStatusUpdated = (data) => {
      loadOrders();
      if (data && (data.status === 'ready' || data.newStatus === 'ready')) {
        const tableNum = data.table_number || data.tableNumber;
        setLastVibratedTable(tableNum || 'Active Table');
        try { playWaiterVibrationAndChime(tableNum); } catch (e) {}
      }
    };

    socket.on('new_order', handleOrderUpdate);
    socket.on('order_updated', handleOrderUpdate);
    socket.on('item_status_updated', handleItemStatusUpdated);
    socket.on('table_order_updated', handleOrderUpdate);

    return () => {
      socket.off('new_order', handleOrderUpdate);
      socket.off('order_updated', handleOrderUpdate);
      socket.off('item_status_updated', handleItemStatusUpdated);
      socket.off('table_order_updated', handleOrderUpdate);
    };
  }, [socket, user, joinRoom, loadOrders]);

  const handleMarkServed = async (itemId) => {
    try {
      await fetchAPI(`/orders/items/${itemId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'served' }) });
      loadOrders();
    } catch (err) { alert(`Failed: ${err.message}`); }
  };

  const handleMarkAllOrderServed = async (orderId, items) => {
    try {
      const toServe = items.filter(i => ['ready', 'preparing', 'accepted'].includes(i.status));
      for (const item of toServe) {
        await fetchAPI(`/orders/items/${item.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'served' }) });
      }
      loadOrders();
    } catch (err) { alert(`Failed: ${err.message}`); }
  };

  if (!user) {
    return <StaffLoginView defaultRole="waiter" onLoginSuccess={(target) => setActivePanel && setActivePanel(target)} />;
  }

  let filteredOrders = [...orders];
  if (tableFilter !== 'all') filteredOrders = filteredOrders.filter(o => o.table_number === tableFilter);

  const readyForDeliveryOrders = filteredOrders.filter(o => o.items && o.items.some(i => i.status === 'ready'));
  const cookingOrders = filteredOrders.filter(o =>
    o.items && o.items.some(i => ['pending', 'preparing', 'accepted', 'cooling'].includes(i.status)) &&
    !o.items.some(i => i.status === 'ready')
  );
  const deliveredOrders = filteredOrders.filter(o => o.items && o.items.length > 0 && o.items.every(i => ['served', 'rejected'].includes(i.status)));
  const uniqueTables = Array.from(new Set(orders.map(o => o.table_number))).sort();

  // Reusable table layout for each tab
  const renderOrderTable = (ordList, mode) => {
    if (ordList.length === 0) {
      const msgs = {
        ready: { icon: '🔔', title: 'No Orders Ready for Delivery', sub: 'When the chef marks dishes ready, they pop up here instantly!' },
        cooking: { icon: '🔥', title: 'No Orders Cooking Right Now', sub: 'Active kitchen orders will appear here.' },
        delivered: { icon: '✅', title: 'No Delivered Orders Yet', sub: 'Completed orders will be logged here.' },
      };
      const m = msgs[mode];
      return (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{m.icon}</div>
          <h3>{m.title}</h3>
          <p style={{ fontSize: '0.85rem' }}>{m.sub}</p>
        </div>
      );
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem 0.6rem', width: '140px' }}>Order # &amp; Table</th>
              <th style={{ padding: '0.5rem 0.6rem', width: '75px' }}>Time</th>
              <th style={{ padding: '0.5rem 0.6rem' }}>Dishes &amp; {mode === 'ready' ? 'Deliver Actions' : 'Status'}</th>
              <th style={{ padding: '0.5rem 0.6rem', width: '120px' }}>Order Status</th>
              {mode === 'ready' && <th style={{ padding: '0.5rem 0.6rem', width: '130px', textAlign: 'center' }}>Deliver All</th>}
            </tr>
          </thead>
          <tbody>
            {ordList.map(ord => {
              const items = ord.items || [];
              const elapsed = Math.floor((Date.now() - new Date(ord.created_at).getTime()) / 60000);

              let badge = { label: 'ACTIVE', color: 'var(--text-muted)', bg: 'var(--bg-surface-elevated)' };
              if (mode === 'delivered') badge = { label: '✅ DELIVERED', color: 'var(--success)', bg: 'var(--success-bg)' };
              else if (mode === 'ready') badge = { label: '🔔 READY', color: '#ea580c', bg: 'rgba(249,115,22,0.12)' };
              else badge = { label: '🔥 COOKING', color: 'var(--warning)', bg: 'var(--warning-bg)' };

              return (
                <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {/* Order # & Table */}
                  <td style={{ padding: '0.55rem 0.6rem', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.83rem', color: 'var(--brand-primary)' }}>#{ord.order_number}</div>
                    <div style={{ marginTop: '3px' }}>
                      <span className="badge badge-dinein" style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.35rem' }}>Table #{ord.table_number}</span>
                    </div>
                  </td>

                  {/* Time */}
                  <td style={{ padding: '0.55rem 0.6rem', verticalAlign: 'top', fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    <div>{formatTime(ord.created_at)}</div>
                    <div style={{ fontWeight: 700 }}>{elapsed}m ago</div>
                  </td>

                  {/* Dishes & Actions */}
                  <td style={{ padding: '0.55rem 0.6rem', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {items.map(item => {
                        const statusColors = {
                          pending:   { color: 'var(--danger)',  bg: 'var(--danger-bg)' },
                          accepted:  { color: '#d97706',        bg: '#fef3c7' },
                          preparing: { color: 'var(--warning)', bg: 'var(--warning-bg)' },
                          cooling:   { color: '#0284c7',        bg: '#e0f2fe' },
                          ready:     { color: '#ea580c',        bg: 'rgba(249,115,22,0.12)' },
                          served:    { color: 'var(--success)', bg: 'var(--success-bg)' },
                          rejected:  { color: 'var(--danger)',  bg: 'var(--danger-bg)' },
                        };
                        const sc = statusColors[item.status] || statusColors.pending;

                        return (
                          <div
                            key={item.id}
                            style={{
                              display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem',
                              padding: '0.28rem 0.55rem',
                              background: 'var(--bg-surface-elevated)',
                              border: `1px solid ${sc.color}28`,
                              borderLeft: `3px solid ${sc.color}`,
                              borderRadius: '7px',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: '110px' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{item.quantity}× {item.item_name}</span>
                              {item.variant_name && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '4px' }}>({item.variant_name})</span>}
                              <span style={{ marginLeft: '5px', fontSize: '0.64rem', background: item.fulfillment_type === 'dine_in' ? '#dbeafe' : '#fef3c7', color: item.fulfillment_type === 'dine_in' ? '#1d4ed8' : '#b45309', borderRadius: '4px', padding: '0 5px', fontWeight: 700 }}>
                                {item.fulfillment_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}
                              </span>
                            </div>

                            {/* Status badge */}
                            <span style={{ background: sc.bg, color: sc.color, borderRadius: '5px', fontSize: '0.65rem', fontWeight: 800, padding: '1px 7px', whiteSpace: 'nowrap' }}>
                              {item.status.toUpperCase()}
                            </span>

                            {/* Deliver button — only for ready items in ready tab */}
                            {mode === 'ready' && item.status === 'ready' && (
                              <button
                                onClick={() => handleMarkServed(item.id)}
                                style={{ border: 'none', borderRadius: '7px', padding: '0.22rem 0.55rem', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', background: 'var(--success)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap' }}
                              >
                                <CheckCircle2 size={12} /> Deliver
                              </button>
                            )}
                            {mode === 'ready' && item.status === 'served' && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--success)', fontWeight: 800 }}>✅ Delivered</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '0.55rem 0.6rem', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                    <span style={{ background: badge.bg, color: badge.color, borderRadius: '7px', fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.5rem', display: 'inline-block' }}>
                      {badge.label}
                    </span>
                  </td>

                  {/* Deliver All button */}
                  {mode === 'ready' && (
                    <td style={{ padding: '0.55rem 0.6rem', verticalAlign: 'middle', textAlign: 'center' }}>
                      <button
                        onClick={() => handleMarkAllOrderServed(ord.id, items)}
                        style={{ border: 'none', borderRadius: '9px', padding: '0.35rem 0.65rem', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer', background: 'var(--success)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}
                      >
                        <CheckCircle2 size={14} /> Deliver All
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container" style={{ padding: '1.5rem 1rem 4rem' }}>
      {/* Alert Banner */}
      {lastVibratedTable && (
        <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: '0.85rem 1.25rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 25px rgba(16,185,129,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '0.95rem' }}>
            <Smartphone size={22} />
            <Volume2 size={22} />
            <span>📳 CHEF ALERT: Dish Ready — Table #{lastVibratedTable}! (Device Alerting)</span>
          </div>
          <button onClick={() => setLastVibratedTable(null)} style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.3rem 0.6rem', fontWeight: 800, cursor: 'pointer' }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Header Card */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--brand-primary), #ea580c)', color: '#fff', padding: '0.6rem', borderRadius: '12px', display: 'flex' }}>
              <UserCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem' }}>Waiter &amp; Server Delivery Portal</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Staff: <strong>{user.name || user.username}</strong> • {readyForDeliveryOrders.length} Orders Ready to Deliver
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <Filter size={16} style={{ color: 'var(--brand-primary)' }} />
              <select value={tableFilter} onChange={(e) => setTableFilter(e.target.value)} className="input-field" style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}>
                <option value="all">All Tables</option>
                {uniqueTables.map(t => <option key={t} value={t}>Table #{t}</option>)}
              </select>
            </div>
            <button onClick={loadOrders} className="btn btn-secondary btn-sm" title="Refresh"><RefreshCw size={16} /></button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button onClick={() => setActiveTab('ready')} className={`btn ${activeTab === 'ready' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.9rem', gap: '0.4rem' }}>
          <Bell size={16} /> Ready for Delivery ({readyForDeliveryOrders.length})
        </button>
        <button onClick={() => setActiveTab('cooking')} className={`btn ${activeTab === 'cooking' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.9rem', gap: '0.4rem' }}>
          <Clock size={16} /> In Kitchen Prep ({cookingOrders.length})
        </button>
        <button onClick={() => setActiveTab('delivered')} className={`btn ${activeTab === 'delivered' ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize: '0.9rem', gap: '0.4rem' }}>
          <CheckCircle2 size={16} /> Delivered Log ({deliveredOrders.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <PageSkeleton title="Connecting Live Waiter KDS..." icon={UserCheck} />
      ) : (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          {activeTab === 'ready'     && renderOrderTable(readyForDeliveryOrders, 'ready')}
          {activeTab === 'cooking'   && renderOrderTable(cookingOrders, 'cooking')}
          {activeTab === 'delivered' && renderOrderTable(deliveredOrders, 'delivered')}
        </div>
      )}
    </div>
  );
};
