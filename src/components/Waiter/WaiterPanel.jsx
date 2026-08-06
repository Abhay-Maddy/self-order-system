import React, { useState, useEffect, useContext, useCallback } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatTime } from '../../utils/formatters';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import { PageSkeleton } from '../Common/PageSkeleton';
import { StaffLoginView } from '../Common/StaffLoginView';
import { UserCheck, Bell, CheckCircle2, Clock, Utensils, RefreshCw, Filter } from 'lucide-react';

export const WaiterPanel = () => {
  const { user } = useContext(AuthContext);
  const { socket, joinRoom } = useContext(SocketContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableFilter, setTableFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('ready'); // 'ready' or 'delivered'

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
    }
  }, [user, loadOrders]);

  // Join WebSocket rooms for live order updates
  useEffect(() => {
    if (!socket || !user) return;

    joinRoom('kitchen');

    const handleOrderUpdate = () => {
      loadOrders();
    };

    socket.on('new_order', handleOrderUpdate);
    socket.on('order_updated', handleOrderUpdate);
    socket.on('item_status_updated', handleOrderUpdate);

    return () => {
      socket.off('new_order', handleOrderUpdate);
      socket.off('order_updated', handleOrderUpdate);
      socket.off('item_status_updated', handleOrderUpdate);
    };
  }, [socket, user, joinRoom, loadOrders]);

  // Handle Mark Delivered / Served
  const handleMarkServed = async (itemId) => {
    try {
      await fetchAPI(`/orders/items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'served' })
      });
      loadOrders();
    } catch (err) {
      alert(`Failed to update item: ${err.message}`);
    }
  };

  const handleMarkAllOrderServed = async (orderId, items) => {
    try {
      const readyItems = items.filter(i => i.status === 'ready' || i.status === 'preparing' || i.status === 'accepted');
      for (const item of readyItems) {
        await fetchAPI(`/orders/items/${item.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'served' })
        });
      }
      loadOrders();
    } catch (err) {
      alert(`Failed to complete order delivery: ${err.message}`);
    }
  };

  if (!user) {
    return <StaffLoginView defaultRole="waiter" />;
  }

  // Filter orders
  let filteredOrders = [...orders];
  if (tableFilter !== 'all') {
    filteredOrders = filteredOrders.filter(o => o.table_number === tableFilter);
  }

  // Orders with ready items awaiting delivery
  const readyForDeliveryOrders = filteredOrders.filter(o =>
    o.items && o.items.some(i => i.status === 'ready')
  );

  // Orders with active items (pending / preparing)
  const cookingOrders = filteredOrders.filter(o =>
    o.items && o.items.some(i => i.status === 'pending' || i.status === 'preparing' || i.status === 'accepted') &&
    !o.items.some(i => i.status === 'ready')
  );

  // Delivered orders (all items served)
  const deliveredOrders = filteredOrders.filter(o =>
    o.items && o.items.length > 0 && o.items.every(i => ['served', 'rejected'].includes(i.status))
  );

  const uniqueTables = Array.from(new Set(orders.map(o => o.table_number))).sort();

  return (
    <div className="container" style={{ padding: '1.5rem 1rem 4rem' }}>
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
                Staff User: <strong>{user.name || user.username}</strong> • {readyForDeliveryOrders.length} Orders Ready to Deliver
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <Filter size={16} style={{ color: 'var(--brand-primary)' }} />
              <select
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="input-field"
                style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
              >
                <option value="all">All Tables</option>
                {uniqueTables.map(t => (
                  <option key={t} value={t}>Table #{t}</option>
                ))}
              </select>
            </div>

            <button onClick={loadOrders} className="btn btn-secondary btn-sm" title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          onClick={() => setActiveTab('ready')}
          className={`btn ${activeTab === 'ready' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.9rem', gap: '0.4rem' }}
        >
          <Bell size={16} />
          <span>Ready for Delivery ({readyForDeliveryOrders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('cooking')}
          className={`btn ${activeTab === 'cooking' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.9rem', gap: '0.4rem' }}
        >
          <Clock size={16} />
          <span>In Kitchen Prep ({cookingOrders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('delivered')}
          className={`btn ${activeTab === 'delivered' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.9rem', gap: '0.4rem' }}
        >
          <CheckCircle2 size={16} />
          <span>Delivered Log ({deliveredOrders.length})</span>
        </button>
      </div>

      {loading ? (
        <PageSkeleton title="Connecting Live Waiter KDS..." icon={UserCheck} />
      ) : (
        <>
          {/* READY FOR DELIVERY TAB */}
          {activeTab === 'ready' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {readyForDeliveryOrders.map(ord => (
                <div key={ord.id} className="glass-card animate-slide-up" style={{ padding: '1.25rem', borderLeft: '4px solid var(--success)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--brand-primary)' }}>
                        TABLE #{ord.table_number}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        #{ord.order_number} • {formatTime(ord.created_at)}
                      </div>
                    </div>
                    <span className="badge badge-veg" style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem' }}>
                      🔔 READY TO SERVE
                    </span>
                  </div>

                  {/* Items List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {(ord.items || []).map(item => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          background: 'var(--bg-surface)',
                          borderRadius: '8px',
                          border: item.status === 'ready' ? '1px solid var(--success)' : '1px solid var(--border-color)'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            {item.quantity}x {item.item_name}
                          </div>
                          {item.variant_name && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({item.variant_name})</span>
                          )}
                          <span className={`badge ${item.fulfillment_type === 'dine_in' ? 'badge-dinein' : 'badge-packing'}`} style={{ marginLeft: '0.3rem', fontSize: '0.7rem' }}>
                            {item.fulfillment_type === 'dine_in' ? 'Dine-In' : 'Takeaway'}
                          </span>
                        </div>

                        {item.status === 'ready' ? (
                          <button
                            onClick={() => handleMarkServed(item.id)}
                            className="btn btn-success btn-sm"
                            style={{ gap: '0.3rem', padding: '0.35rem 0.65rem' }}
                          >
                            <CheckCircle2 size={14} /> Deliver
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                            {item.status.toUpperCase()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleMarkAllOrderServed(ord.id, ord.items)}
                    className="btn btn-primary btn-lg"
                    style={{ width: '100%', gap: '0.5rem', borderRadius: '10px', background: 'var(--success)' }}
                  >
                    <CheckCircle2 size={18} />
                    <span>Deliver Entire Table Order</span>
                  </button>
                </div>
              ))}

              {readyForDeliveryOrders.length === 0 && (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
                  <Bell size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <h3>No Orders Ready for Delivery</h3>
                  <p style={{ fontSize: '0.85rem' }}>When the kitchen marks dishes as ready, they will instantly pop up here!</p>
                </div>
              )}
            </div>
          )}

          {/* IN KITCHEN PREP TAB */}
          {activeTab === 'cooking' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {cookingOrders.map(ord => (
                <div key={ord.id} className="glass-card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--warning)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>TABLE #{ord.table_number}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>#{ord.order_number}</div>
                    </div>
                    <span className="badge" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', fontSize: '0.78rem' }}>
                      ⏳ In Kitchen Prep
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {(ord.items || []).map(item => (
                      <div key={item.id} style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                        • {item.quantity}x {item.item_name} — <em>({item.status})</em>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {cookingOrders.length === 0 && (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
                  <h3>No Orders Currently Cooking</h3>
                </div>
              )}
            </div>
          )}

          {/* DELIVERED LOG TAB */}
          {activeTab === 'delivered' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {deliveredOrders.map(ord => (
                <div key={ord.id} className="glass-card" style={{ padding: '1.25rem', opacity: 0.85 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>TABLE #{ord.table_number}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>#{ord.order_number}</div>
                    </div>
                    <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)', fontSize: '0.78rem' }}>
                      ✓ Delivered
                    </span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {(ord.items || []).map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                  </div>
                </div>
              ))}

              {deliveredOrders.length === 0 && (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
                  <h3>No Delivered Orders Yet</h3>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
