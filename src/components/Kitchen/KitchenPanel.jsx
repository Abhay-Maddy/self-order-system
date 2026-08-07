import React, { useState, useEffect, useContext, useCallback } from 'react';
import { KitchenHeader } from './KitchenHeader';
import { RejectionReasonModal } from './RejectionReasonModal';
import { KOTPrintView } from './KOTPrintView';
import { fetchAPI } from '../../utils/api';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import { playKitchenChime } from '../../utils/sound';
import { PageSkeleton } from '../Common/PageSkeleton';
import { StaffLoginView } from '../Common/StaffLoginView';
import { ChefHat, Printer } from 'lucide-react';
import { getTodayDateString, formatTime } from '../../utils/formatters';

export const KitchenPanel = ({ setActivePanel }) => {
  const { user } = useContext(AuthContext);
  const { socket, joinRoom } = useContext(SocketContext);

  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [printingOrder, setPrintingOrder] = useState(null);

  const [tableFilter, setTableFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('oldest');
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());

  const loadActiveOrders = useCallback(() => {
    setLoading(true);
    fetchAPI(`/orders/kitchen?date=${selectedDate}`)
      .then(data => setOrders(data || []))
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
  }, [selectedDate]);

  useEffect(() => {
    if (user) loadActiveOrders();
  }, [user, loadActiveOrders]);

  useEffect(() => {
    if (!socket || !user) return;
    joinRoom('kitchen');

    const onNew = (newOrder) => {
      try { playKitchenChime(newOrder?.table_number); } catch (e) {}
      loadActiveOrders();
    };
    const onUpdate = () => loadActiveOrders();

    socket.on('new_order', onNew);
    socket.on('order_updated', onUpdate);
    socket.on('item_status_updated', onUpdate);
    socket.on('table_order_updated', onUpdate);

    return () => {
      socket.off('new_order', onNew);
      socket.off('order_updated', onUpdate);
      socket.off('item_status_updated', onUpdate);
      socket.off('table_order_updated', onUpdate);
    };
  }, [socket, user, joinRoom, loadActiveOrders]);

  const handleItemStatusChange = async (itemId, newStatus, rejectionReason = null, prepMins = null) => {
    try {
      await fetchAPI(`/orders/items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, rejection_reason: rejectionReason, prep_time_minutes: prepMins })
      });
      loadActiveOrders();
    } catch (err) {
      alert(`Failed to update item status: ${err.message}`);
    }
  };

  if (!user) {
    return <StaffLoginView defaultRole="chef" onLoginSuccess={(target) => setActivePanel && setActivePanel(target)} />;
  }

  let processedOrders = [...orders];
  if (tableFilter !== 'all') {
    processedOrders = processedOrders.filter(o => o.table_number === tableFilter);
  }
  if (sortOrder === 'oldest') {
    processedOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else {
    processedOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const pendingOrders   = processedOrders.filter(o => o.items && o.items.some(i => i.status === 'pending'));
  const preparingOrders = processedOrders.filter(o => o.items && o.items.some(i => ['preparing', 'accepted', 'cooling'].includes(i.status)));
  const readyOrders     = processedOrders.filter(o => o.items && o.items.some(i => ['ready', 'served'].includes(i.status)));

  // Reusable button style factory
  const btn = (bg, color = '#fff') => ({
    border: 'none', borderRadius: '7px', padding: '0.22rem 0.55rem',
    fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
    background: bg, color,
    display: 'inline-flex', alignItems: 'center', gap: '0.2rem', whiteSpace: 'nowrap'
  });

  const STATUS_COLORS = {
    pending:   { color: 'var(--danger)',  bg: 'var(--danger-bg)' },
    accepted:  { color: '#d97706',        bg: '#fef3c7' },
    preparing: { color: 'var(--warning)', bg: 'var(--warning-bg)' },
    cooling:   { color: '#0284c7',        bg: '#e0f2fe' },
    ready:     { color: '#ea580c',        bg: 'rgba(249,115,22,0.12)' },
    served:    { color: 'var(--success)', bg: 'var(--success-bg)' },
    rejected:  { color: 'var(--danger)',  bg: 'var(--danger-bg)' },
  };

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
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        tables={tables}
        lowStockItems={lowStockItems}
      />

      {loading ? (
        <PageSkeleton title="Connecting Live Kitchen KDS..." icon={ChefHat} />
      ) : (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          {/* Summary badges */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '8px', padding: '0.2rem 0.7rem', fontSize: '0.82rem', fontWeight: 700 }}>🔴 New: {pendingOrders.length}</span>
            <span style={{ background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: '8px', padding: '0.2rem 0.7rem', fontSize: '0.82rem', fontWeight: 700 }}>🔥 Cooking: {preparingOrders.length}</span>
            <span style={{ background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '8px', padding: '0.2rem 0.7rem', fontSize: '0.82rem', fontWeight: 700 }}>🔔 Ready: {readyOrders.length}</span>
          </div>

          {processedOrders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <ChefHat size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <h3>No Active Kitchen Orders</h3>
              <p style={{ fontSize: '0.85rem' }}>New orders will appear here in real-time</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem 0.6rem', width: '140px' }}>Order # &amp; Table</th>
                    <th style={{ padding: '0.5rem 0.6rem', width: '75px' }}>Time</th>
                    <th style={{ padding: '0.5rem 0.6rem', width: '100px' }}>Source</th>
                    <th style={{ padding: '0.5rem 0.6rem' }}>Dishes &amp; Actions</th>
                    <th style={{ padding: '0.5rem 0.6rem', width: '105px' }}>Order Status</th>
                    <th style={{ padding: '0.5rem 0.6rem', width: '70px', textAlign: 'center' }}>KOT</th>
                  </tr>
                </thead>
                <tbody>
                  {processedOrders.map(ord => {
                    const items = ord.items || [];
                    const elapsed = Math.floor((Date.now() - new Date(ord.created_at).getTime()) / 60000);
                    const isOverdue = elapsed > 15;

                    const allPending   = items.filter(i => i.status === 'pending');
                    const allAccepted  = items.filter(i => i.status === 'accepted');
                    const allPreparing = items.filter(i => i.status === 'preparing');
                    const allCooling   = items.filter(i => i.status === 'cooling');
                    const allReady     = items.filter(i => i.status === 'ready');

                    let badge = { label: 'ACTIVE', color: 'var(--text-muted)', bg: 'var(--bg-surface-elevated)' };
                    if (items.every(i => ['served', 'rejected'].includes(i.status))) {
                      badge = { label: '✅ DELIVERED', color: 'var(--success)', bg: 'var(--success-bg)' };
                    } else if (items.some(i => i.status === 'ready')) {
                      badge = { label: '🔔 READY', color: '#ea580c', bg: 'rgba(249,115,22,0.12)' };
                    } else if (items.some(i => i.status === 'cooling')) {
                      badge = { label: '❄️ COOLING', color: '#0284c7', bg: '#e0f2fe' };
                    } else if (items.some(i => ['preparing', 'accepted'].includes(i.status))) {
                      badge = { label: '🔥 COOKING', color: 'var(--warning)', bg: 'var(--warning-bg)' };
                    } else if (items.some(i => i.status === 'pending')) {
                      badge = { label: '🔴 NEW', color: 'var(--danger)', bg: 'var(--danger-bg)' };
                    }

                    return (
                      <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-color)', background: isOverdue ? 'rgba(239,68,68,0.04)' : 'transparent' }}>

                        {/* Order # & Table */}
                        <td style={{ padding: '0.55rem 0.6rem', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.83rem', color: 'var(--brand-primary)' }}>#{ord.order_number}</div>
                          <div style={{ marginTop: '3px' }}>
                            <span className="badge badge-dinein" style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.35rem' }}>Table #{ord.table_number}</span>
                          </div>
                          {isOverdue && <div style={{ marginTop: '3px', fontSize: '0.65rem', fontWeight: 900, color: 'var(--danger)' }}>⚠ OVERDUE</div>}
                        </td>

                        {/* Time */}
                        <td style={{ padding: '0.55rem 0.6rem', verticalAlign: 'top', fontSize: '0.76rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          <div>{formatTime(ord.created_at)}</div>
                          <div style={{ fontWeight: 700, color: isOverdue ? 'var(--danger)' : 'var(--text-muted)' }}>{elapsed}m ago</div>
                        </td>

                        {/* Source */}
                        <td style={{ padding: '0.55rem 0.6rem', verticalAlign: 'top' }}>
                          {(ord.order_source === 'staff' || ord.placed_by_name) ? (
                            <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #f59e0b', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px' }}>
                              🟡 {ord.placed_by_name || 'Staff'}
                            </span>
                          ) : (
                            <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #22c55e', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px' }}>
                              🟢 Customer
                            </span>
                          )}
                        </td>

                        {/* Dishes & Actions */}
                        <td style={{ padding: '0.55rem 0.6rem', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            {items.map(item => {
                              const sc = STATUS_COLORS[item.status] || STATUS_COLORS.pending;
                              return (
                                <div
                                  key={item.id}
                                  style={{
                                    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem',
                                    padding: '0.3rem 0.6rem',
                                    background: 'var(--bg-surface-elevated)',
                                    border: `1px solid ${sc.color}30`,
                                    borderLeft: `3px solid ${sc.color}`,
                                    borderRadius: '7px',
                                  }}
                                >
                                  {/* Dish info */}
                                  <div style={{ minWidth: '120px', flex: 1 }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.8rem' }}>{item.quantity}× {item.item_name}</span>
                                    {item.variant_name && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginLeft: '4px' }}>({item.variant_name})</span>}
                                    {item.spice_level && <span style={{ fontSize: '0.65rem', color: '#ea580c', marginLeft: '4px', fontWeight: 700 }}>🔥 {item.spice_level}</span>}
                                    {item.toppings_summary && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{item.toppings_summary}</div>}
                                    {item.rejection_reason && <div style={{ fontSize: '0.65rem', color: 'var(--danger)', fontWeight: 700 }}>Reason: {item.rejection_reason}</div>}
                                  </div>

                                  {/* Status badge */}
                                  <span style={{ background: sc.bg, color: sc.color, borderRadius: '5px', fontSize: '0.65rem', fontWeight: 800, padding: '1px 7px', whiteSpace: 'nowrap' }}>
                                    {item.status.toUpperCase()}
                                  </span>

                                  {/* Action buttons — inline, no separate box */}
                                  {item.status === 'pending' && (
                                    <>
                                      <select id={`pm-${item.id}`} defaultValue="15"
                                        style={{ padding: '0.15rem 0.25rem', fontSize: '0.66rem', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                                        <option value="5">5m</option>
                                        <option value="10">10m</option>
                                        <option value="15">15m</option>
                                        <option value="20">20m</option>
                                        <option value="30">30m</option>
                                      </select>
                                      <button style={btn('var(--success)')}
                                        onClick={() => {
                                          const el = document.getElementById(`pm-${item.id}`);
                                          handleItemStatusChange(item.id, 'accepted', null, parseInt(el?.value || 15));
                                        }}>✓ Accept</button>
                                      <button style={btn('var(--danger)')} onClick={() => setRejectingItem(item)}>✕ Reject</button>
                                    </>
                                  )}
                                  {item.status === 'accepted' && (
                                    <button style={btn('var(--warning)')} onClick={() => handleItemStatusChange(item.id, 'preparing')}>🔥 Cook</button>
                                  )}
                                  {item.status === 'preparing' && (
                                    <>
                                      <button style={btn('#0284c7')} onClick={() => handleItemStatusChange(item.id, 'cooling')}>❄️ Cool</button>
                                      <button style={btn('var(--success)')} onClick={() => handleItemStatusChange(item.id, 'ready')}>🔔 Ready</button>
                                    </>
                                  )}
                                  {item.status === 'cooling' && (
                                    <button style={btn('var(--success)')} onClick={() => handleItemStatusChange(item.id, 'ready')}>🔔 Ready</button>
                                  )}
                                  {item.status === 'ready' && (
                                    <button style={btn('#7c3aed')} onClick={() => handleItemStatusChange(item.id, 'served')}>🚚 Deliver</button>
                                  )}
                                  {item.status === 'served' && <span style={{ fontSize: '0.68rem', color: 'var(--success)', fontWeight: 800 }}>✅ Done</span>}
                                  {item.status === 'rejected' && <span style={{ fontSize: '0.68rem', color: 'var(--danger)', fontWeight: 800 }}>✕ Rejected</span>}
                                </div>
                              );
                            })}

                            {/* Bulk action bar (only when >1 items in same state) */}
                            {(allPending.length > 1 || allAccepted.length > 1 || allPreparing.length > 1 || allCooling.length > 1 || allReady.length > 1) && (
                              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', paddingTop: '0.3rem', borderTop: '1px dashed var(--border-color)' }}>
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, alignSelf: 'center' }}>Bulk:</span>
                                {allPending.length > 1 && <button style={btn('var(--success)')} onClick={() => allPending.forEach(i => handleItemStatusChange(i.id, 'accepted', null, 15))}>✓ Accept All ({allPending.length})</button>}
                                {allAccepted.length > 1 && <button style={btn('var(--warning)')} onClick={() => allAccepted.forEach(i => handleItemStatusChange(i.id, 'preparing'))}>🔥 Cook All ({allAccepted.length})</button>}
                                {allPreparing.length > 1 && <>
                                  <button style={btn('#0284c7')} onClick={() => allPreparing.forEach(i => handleItemStatusChange(i.id, 'cooling'))}>❄️ Cool All ({allPreparing.length})</button>
                                  <button style={btn('var(--success)')} onClick={() => allPreparing.forEach(i => handleItemStatusChange(i.id, 'ready'))}>🔔 Ready All ({allPreparing.length})</button>
                                </>}
                                {allCooling.length > 1 && <button style={btn('var(--success)')} onClick={() => allCooling.forEach(i => handleItemStatusChange(i.id, 'ready'))}>🔔 Ready Cooled ({allCooling.length})</button>}
                                {allReady.length > 1 && <button style={btn('#7c3aed')} onClick={() => allReady.forEach(i => handleItemStatusChange(i.id, 'served'))}>🚚 Deliver All ({allReady.length})</button>}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Order Status */}
                        <td style={{ padding: '0.55rem 0.6rem', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          <span style={{ background: badge.bg, color: badge.color, borderRadius: '7px', fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.5rem', display: 'inline-block' }}>
                            {badge.label}
                          </span>
                        </td>

                        {/* KOT Print */}
                        <td style={{ padding: '0.55rem 0.6rem', verticalAlign: 'top', textAlign: 'center' }}>
                          <button
                            onClick={() => setPrintingOrder(ord)}
                            title="Print KOT"
                            style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.28rem 0.5rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', fontWeight: 700 }}
                          >
                            <Printer size={13} /> KOT
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
