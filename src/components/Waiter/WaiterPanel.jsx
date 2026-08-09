import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatTime } from '../../utils/formatters';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import { PageSkeleton } from '../Common/PageSkeleton';
import { StaffLoginView } from '../Common/StaffLoginView';
import { playWaiterVibrationAndChime } from '../../utils/sound';
import { UserCheck, Bell, CheckCircle2, Clock, RefreshCw, Filter, Smartphone, Volume2, X, MessageCircle } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

export const WaiterPanel = ({ setActivePanel }) => {
  const { user } = useContext(AuthContext);
  const { socket, joinRoom } = useContext(SocketContext);
  const isMobile = useIsMobile(768);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('ready');
  const [lastVibratedTable, setLastVibratedTable] = useState(null);
  // Deduplicate waiter chime — key = orderId+status to prevent repeated alerts
  const lastAlertedKey = useRef(null);
  // In-panel toast notifications
  const [waiterToasts, setWaiterToasts] = useState([]);
  // WhatsApp number from settings
  const [waiterWhatsapp, setWaiterWhatsapp] = useState('');

  const loadOrders = useCallback(() => {
    setLoading(true);
    fetchAPI('/orders/kitchen')
      .then(data => setOrders(data || []))
      .catch(err => console.error('Failed to load waiter orders:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      loadOrders();
      // Fetch whatsapp number from settings if available
      fetchAPI('/settings').then(s => {
        if (s && s.waiter_whatsapp_number) setWaiterWhatsapp(s.waiter_whatsapp_number);
      }).catch(() => {});
    }
  }, [user, loadOrders]);

  const addToast = (toast) => {
    const id = Date.now();
    setWaiterToasts(prev => [{ ...toast, id }, ...prev.slice(0, 2)]);
    setTimeout(() => setWaiterToasts(prev => prev.filter(t => t.id !== id)), 8000);
  };

  useEffect(() => {
    if (!socket || !user) return;
    joinRoom('kitchen');

    const handleNewOrder = (data) => {
      loadOrders();
      const tableNum = data?.table_number || data?.tableNumber;
      const items = (data?.items || []).map(i => i.item_name || i.name).filter(Boolean);
      const itemSummary = items.slice(0, 3).join(', ') + (items.length > 3 ? '...' : '');
      addToast({
        type: 'new_order',
        title: '🔔 New Order Received!',
        message: `Table #${tableNum || '?'} • ${items.length} item${items.length !== 1 ? 's' : ''}`,
        detail: itemSummary,
        tableNum,
        orderData: data
      });
    };

    const handleOrderUpdate = (data) => {
      loadOrders();
      if (data && (data.status === 'ready' || (data.items && data.items.some(i => i.status === 'ready')))) {
        const tableNum = data.table_number || data.tableNumber;
        const alertKey = `${data.id || data.order_number}_ready`;
        if (lastAlertedKey.current === alertKey) return;
        lastAlertedKey.current = alertKey;
        setLastVibratedTable(tableNum || 'Active Table');
        try { playWaiterVibrationAndChime(tableNum); } catch (e) {}
        addToast({
          type: 'ready',
          title: '🚀 Ready for Delivery!',
          message: `Order is ready — Table #${tableNum || '?'}`,
          tableNum,
          orderData: data
        });
      }
    };

    const handleItemStatusUpdated = (data) => {
      loadOrders();
      if (data && (data.status === 'ready' || data.newStatus === 'ready')) {
        const tableNum = data.table_number || data.tableNumber;
        const alertKey = `item_${data.itemId || data.id}_ready`;
        if (lastAlertedKey.current === alertKey) return;
        lastAlertedKey.current = alertKey;
        setLastVibratedTable(tableNum || 'Active Table');
        try { playWaiterVibrationAndChime(tableNum); } catch (e) {}
        addToast({
          type: 'ready',
          title: '🚀 Order Ready for Delivery!',
          message: `New order is ready — Table #${tableNum || '?'}`,
          tableNum,
          itemName: data.itemName || data.item_name
        });
      }
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_updated', handleOrderUpdate);
    socket.on('item_status_updated', handleItemStatusUpdated);
    socket.on('table_order_updated', handleOrderUpdate);

    return () => {
      socket.off('new_order', handleNewOrder);
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
    return <StaffLoginView defaultRole="waiter" onLoginSuccess={(target, loggedUser) => {
      if (loggedUser && setActivePanel) setActivePanel(target);
    }} />;
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

    return isMobile ? (
      /* MOBILE STACKED TICKET CARDS FOR WAITER PANEL (below 768px) */
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {ordList.map(ord => {
          const items = ord.items || [];
          const elapsed = Math.floor((Date.now() - new Date(ord.created_at).getTime()) / 60000);

          let badge = { label: 'ACTIVE', color: 'var(--text-muted)', bg: 'var(--bg-surface-elevated)' };
          if (mode === 'delivered') badge = { label: '✅ DELIVERED', color: 'var(--success)', bg: 'var(--success-bg)' };
          else if (mode === 'ready') badge = { label: '🔔 READY', color: '#ea580c', bg: 'rgba(249,115,22,0.12)' };
          else badge = { label: '🔥 COOKING', color: 'var(--warning)', bg: 'var(--warning-bg)' };

          return (
            <div key={ord.id} className="glass-card" style={{ padding: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--brand-primary)' }}>#{ord.order_number}</span>
                  <span className="badge badge-dinein" style={{ fontSize: '0.72rem', fontWeight: 800 }}>Table #{ord.table_number}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    {formatTime(ord.created_at)} ({elapsed}m ago)
                  </span>
                  <span style={{ background: badge.bg, color: badge.color, borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.45rem' }}>
                    {badge.label}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
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
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem',
                        padding: '0.45rem 0.65rem',
                        background: 'var(--bg-surface-elevated)',
                        border: `1px solid ${sc.color}28`,
                        borderLeft: `3px solid ${sc.color}`,
                        borderRadius: '7px',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{item.quantity}× {item.item_name}</span>
                        {item.variant_name && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '4px' }}>({item.variant_name})</span>}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ background: sc.bg, color: sc.color, borderRadius: '5px', fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.45rem' }}>
                          {item.status.toUpperCase()}
                        </span>

                        {mode === 'ready' && item.status === 'ready' && (
                          <button
                            onClick={() => handleMarkServed(item.id)}
                            className="btn btn-success btn-sm"
                            style={{ height: '38px', padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: 800 }}
                          >
                            <CheckCircle2 size={14} /> Deliver
                          </button>
                        )}
                        {mode === 'ready' && item.status === 'served' && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 800 }}>✅ Delivered</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Deliver All Button */}
              {mode === 'ready' && (
                <div style={{ marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleMarkAllOrderServed(ord.id, items)}
                    className="btn btn-success"
                    style={{ width: '100%', height: '42px', fontSize: '0.85rem', fontWeight: 800, justifyContent: 'center' }}
                  >
                    <CheckCircle2 size={16} /> Deliver All Items for Table #{ord.table_number}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    ) : (
      /* DESKTOP TABLE (>=768px) — EXACT ORIGINAL TABLE RENDERING */
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
      {/* Toast Notification Stack */}
      {waiterToasts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
          {waiterToasts.map(toast => (
            <div
              key={toast.id}
              className="animate-slide-in"
              style={{
                background: toast.type === 'new_order'
                  ? 'linear-gradient(135deg, #f97316, #ea580c)'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                borderRadius: '14px',
                padding: '0.85rem 1.1rem',
                boxShadow: toast.type === 'new_order'
                  ? '0 8px 25px rgba(249,115,22,0.45)'
                  : '0 8px 25px rgba(16,185,129,0.4)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem'
              }}
            >
              <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                {toast.type === 'new_order' ? '🔔' : '🚀'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{toast.title}</div>
                <div style={{ fontSize: '0.82rem', opacity: 0.95, marginTop: '0.15rem' }}>{toast.message}</div>
                {toast.detail && (
                  <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.1rem', fontStyle: 'italic' }}>{toast.detail}</div>
                )}
                {toast.type === 'new_order' && waiterWhatsapp && (
                  <a
                    href={`https://wa.me/${waiterWhatsapp.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(`🔔 New Order Alert!
Table: #${toast.tableNum || '?'}
${toast.detail ? 'Items: ' + toast.detail : ''}
Please prepare for delivery.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      marginTop: '0.4rem',
                      background: 'rgba(255,255,255,0.2)', color: '#fff',
                      borderRadius: '8px', padding: '0.3rem 0.7rem',
                      textDecoration: 'none', fontWeight: 800, fontSize: '0.78rem'
                    }}
                  >
                    <MessageCircle size={14} />
                    Open WhatsApp
                  </a>
                )}
              </div>
              <button
                onClick={() => setWaiterToasts(prev => prev.filter(t => t.id !== toast.id))}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '7px', color: '#fff', cursor: 'pointer', padding: '0.25rem 0.5rem', fontWeight: 800, flexShrink: 0 }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
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
