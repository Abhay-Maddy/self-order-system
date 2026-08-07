import React, { useState, useEffect, useContext } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/formatters';
import { Clock, Filter, ShoppingBag, Calendar, Eye, RefreshCw } from 'lucide-react';
import { SocketContext } from '../../context/SocketContext';

export const AdminLiveOrdersDrawer = () => {
  const { socket } = useContext(SocketContext);
  const [orders, setOrders] = useState([]);
  const [selectedTableFilter, setSelectedTableFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10)); // Default today's YYYY-MM-DD
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrders = () => {
    setLoading(true);
    fetchAPI('/reports/sales')
      .then(data => {
        const allOrders = data.orders || [];
        setOrders(allOrders);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => loadOrders();
    socket.on('new_order', handleUpdate);
    socket.on('order_status_updated', handleUpdate);
    socket.on('item_status_updated', handleUpdate);
    return () => {
      socket.off('new_order', handleUpdate);
      socket.off('order_status_updated', handleUpdate);
      socket.off('item_status_updated', handleUpdate);
    };
  }, [socket]);

  // Filter by Date (YYYY-MM-DD)
  let filteredOrders = orders.filter(o => {
    const orderDate = new Date(o.created_at).toISOString().slice(0, 10);
    return orderDate === selectedDate;
  });

  // Filter by Table Number
  if (selectedTableFilter !== 'all') {
    filteredOrders = filteredOrders.filter(o => o.table_number === selectedTableFilter);
  }

  // Sort by Table Number numerically e.g. T-01, T-02
  filteredOrders.sort((a, b) => (a.table_number || '').localeCompare(b.table_number || ''));

  // Get list of unique table numbers from orders
  const tableNumbers = Array.from(new Set(orders.map(o => o.table_number))).filter(Boolean);

  const calculateElapsedTime = (createdAt) => {
    const start = new Date(createdAt).getTime();
    const now = Date.now();
    const mins = Math.floor((now - start) / (1000 * 60));
    return mins > 0 ? `${mins} min${mins > 1 ? 's' : ''}` : 'Just now';
  };

  return (
    <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag style={{ color: 'var(--brand-primary)' }} />
            Live Orders & Table Progress Tracker
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time order monitoring, day-by-day date switching, table-wise sorting & preparation progress
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          {/* Day-by-Day Date Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <Calendar size={15} color="var(--brand-primary)" />
            <span style={{ fontWeight: 600 }}>Switch Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.85rem', fontWeight: 700 }}
            />
          </div>

          {/* Table Sort / Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <Filter size={15} color="var(--brand-primary)" />
            <span style={{ fontWeight: 600 }}>Filter Table:</span>
            <select
              value={selectedTableFilter}
              onChange={e => setSelectedTableFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.85rem', fontWeight: 700 }}
            >
              <option value="all">All Active Tables ({filteredOrders.length})</option>
              {tableNumbers.map(tb => (
                <option key={tb} value={tb}>Table #{tb}</option>
              ))}
            </select>
          </div>

          <button onClick={loadOrders} className="btn btn-secondary btn-sm" title="Refresh Live Orders">
            <RefreshCw size={14} /> Sync
          </button>
        </div>
      </div>

      {/* Orders Grid / Side Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 380px' : '1fr', gap: '1.25rem' }}>
        {/* Table Orders List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filteredOrders.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface-elevated)', borderRadius: '10px', gridColumn: '1 / -1' }}>
              No orders found for date <b>{selectedDate}</b> matching table filter.
            </div>
          ) : (
            filteredOrders.map(ord => (
              <div
                key={ord.id}
                onClick={() => setSelectedOrder(ord)}
                className="glass-card"
                style={{
                  padding: '1rem',
                  cursor: 'pointer',
                  border: selectedOrder?.id === ord.id ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
                  background: 'var(--bg-surface)',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <span className="badge badge-dinein" style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                    Table #{ord.table_number}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                    Order #{ord.order_number}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Clock size={13} />
                    <span>Time: {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {formatCurrency(ord.total_amount)}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.4rem' }}>
                  {(ord.items || []).slice(0, 3).map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span>{item.quantity}x {item.item_name}</span>
                      <span className={`badge ${item.status === 'ready' ? 'badge-veg' : item.status === 'preparing' ? 'badge-packing' : 'badge-dinein'}`} style={{ fontSize: '0.65rem' }}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                  {(ord.items || []).length > 3 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{(ord.items || []).length - 3} more items...</span>
                  )}
                </div>

                <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '0.75rem', gap: '0.4rem', justifyContent: 'center' }}>
                  <Eye size={13} /> Inspect Order Details
                </button>
              </div>
            ))
          )}
        </div>

        {/* Detailed Inspector Side Panel */}
        {selectedOrder && (
          <div className="glass-card animate-slide-up" style={{ padding: '1.25rem', background: 'var(--bg-surface-elevated)', border: '1px solid var(--brand-primary)', position: 'sticky', top: '90px', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  Table #{selectedOrder.table_number} Order Inspector
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Order #{selectedOrder.order_number}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary btn-sm">Close</button>
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>
                <span style={{ fontWeight: 600 }}>{new Date(selectedOrder.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Elapsed:</span>
                <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{calculateElapsedTime(selectedOrder.created_at)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Payment Mode:</span>
                <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{selectedOrder.payment_mode || 'UPI'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem', marginTop: '0.6rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)' }}>
                <span>Grand Total:</span>
                <span style={{ color: 'var(--brand-primary)' }}>{formatCurrency(selectedOrder.total_amount)}</span>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Ordered Items Breakdown:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '260px', overflowY: 'auto' }}>
              {(selectedOrder.items || []).map((item, idx) => (
                <div key={idx} style={{ padding: '0.6rem', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '0.2rem' }}>
                    <span>{item.quantity}x {item.item_name}</span>
                    <span>{formatCurrency(item.unit_price * item.quantity)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Prep Status: <b style={{ color: 'var(--brand-primary)', textTransform: 'capitalize' }}>{item.status}</b></span>
                    {item.prep_time_minutes && <span>Est: {item.prep_time_minutes} mins</span>}
                  </div>
                  {item.customization_notes && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.2rem' }}>
                      Note: {item.customization_notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
