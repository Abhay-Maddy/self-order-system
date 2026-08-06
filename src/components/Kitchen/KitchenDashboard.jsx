import React, { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatTime, getTodayDateString } from '../../utils/formatters';
import { ShoppingBag, Clock, ChefHat, Bell, CheckCircle, RefreshCw, Calendar, Flame } from 'lucide-react';

export const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());

  const loadData = useCallback(() => {
    setLoadingOrders(true);
    fetchAPI(`/orders/all?date=${selectedDate}`)
      .then(data => setOrders(data || []))
      .catch(err => console.error('Kitchen Dashboard orders load error:', err))
      .finally(() => setLoadingOrders(false));
  }, [selectedDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate kitchen-specific stats from orders
  const todayOrders = orders.length;
  const allItems = orders.flatMap(o => o.items || []);
  const newOrderCount = allItems.filter(i => i.status === 'pending').length;
  const cookingCount = allItems.filter(i => i.status === 'preparing' || i.status === 'accepted').length;
  const readyCount = allItems.filter(i => i.status === 'ready').length;
  const servedCount = allItems.filter(i => i.status === 'served').length;

  // Determine overall kitchen status for each order
  const getKitchenStatus = (order) => {
    const items = order.items || [];
    if (items.length === 0) return 'unknown';
    if (items.every(i => i.status === 'served')) return 'served';
    if (items.every(i => ['served', 'rejected'].includes(i.status))) return 'completed';
    if (items.some(i => i.status === 'ready')) return 'ready';
    if (items.some(i => i.status === 'preparing' || i.status === 'accepted')) return 'preparing';
    if (items.some(i => i.status === 'pending')) return 'pending';
    return 'unknown';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', fontWeight: 700, fontSize: '0.75rem' }}>🔴 New / Pending</span>;
      case 'preparing':
        return <span className="badge" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', fontWeight: 700, fontSize: '0.75rem' }}>🟡 Cooking</span>;
      case 'ready':
        return <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)', fontWeight: 700, fontSize: '0.75rem' }}>🟢 Ready</span>;
      case 'served':
        return <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)', fontWeight: 700, fontSize: '0.75rem' }}>✅ Served</span>;
      case 'completed':
        return <span className="badge" style={{ background: 'var(--bg-surface-elevated)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem' }}>✓ Done</span>;
      default:
        return <span className="badge" style={{ fontSize: '0.75rem' }}>{status}</span>;
    }
  };

  const isToday = selectedDate === getTodayDateString();

  return (
    <div>
      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>{isToday ? "Today's" : selectedDate} Orders</span>
            <div style={{ background: 'var(--info-bg)', color: 'var(--info)', padding: '0.35rem', borderRadius: '8px' }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--brand-primary)' }}>{todayOrders}</h2>
        </div>

        <div className="glass-card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>New / Pending</span>
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.35rem', borderRadius: '8px' }}>
              <Bell size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--danger)' }}>{newOrderCount}</h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>items awaiting kitchen</span>
        </div>

        <div className="glass-card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cooking / Prep</span>
            <div style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '0.35rem', borderRadius: '8px' }}>
              <Flame size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--warning)' }}>{cookingCount}</h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>items being prepared</span>
        </div>

        <div className="glass-card" style={{ padding: '1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ready to Pass</span>
            <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '0.35rem', borderRadius: '8px' }}>
              <CheckCircle size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--success)' }}>{readyCount}</h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{servedCount} already served</span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ChefHat style={{ color: 'var(--brand-primary)' }} size={20} />
              Kitchen Orders Log
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              View kitchen item statuses by date
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input-field"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
              />
            </div>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(getTodayDateString())}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '0.78rem', gap: '0.3rem' }}
              >
                Today
              </button>
            )}
            <button onClick={loadData} className="btn btn-secondary btn-sm" style={{ gap: '0.3rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Order #</th>
                <th style={{ padding: '0.75rem' }}>Table</th>
                <th style={{ padding: '0.75rem' }}>Time</th>
                <th style={{ padding: '0.75rem' }}>Dishes</th>
                <th style={{ padding: '0.75rem' }}>Kitchen Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(ord => {
                const kitchenStatus = getKitchenStatus(ord);
                return (
                  <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                      #{ord.order_number}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge badge-dinein" style={{ fontSize: '0.8rem' }}>
                        #{ord.table_number}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {formatTime(ord.created_at)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 600 }}>{(ord.items || []).length} items</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(ord.items || []).map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {getStatusBadge(kitchenStatus)}
                      {/* Per-item breakdown dots */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.3rem' }}>
                        {(ord.items || []).map((item, idx) => (
                          <span
                            key={idx}
                            title={`${item.item_name}: ${item.status}`}
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background:
                                item.status === 'pending' ? 'var(--danger)' :
                                item.status === 'preparing' || item.status === 'accepted' ? 'var(--warning)' :
                                item.status === 'ready' ? 'var(--success)' :
                                item.status === 'served' ? '#22c55e' :
                                item.status === 'rejected' ? '#6b7280' :
                                'var(--text-muted)',
                              display: 'inline-block'
                            }}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && !loadingOrders && (
                <tr>
                  <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No orders found for {isToday ? 'today' : selectedDate}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loadingOrders && (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading kitchen orders...
          </div>
        )}
      </div>
    </div>
  );
};
