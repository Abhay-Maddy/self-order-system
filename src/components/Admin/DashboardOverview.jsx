import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { Modal } from '../Common/Modal';
import { DollarSign, ShoppingBag, Clock, Flame, Star, Printer, CheckCircle, RefreshCw, Calendar } from 'lucide-react';

export const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [printingOrder, setPrintingOrder] = useState(null);

  const loadData = () => {
    fetchAPI('/reports/analytics')
      .then(data => setStats(data))
      .catch(err => console.error('Analytics load error:', err));

    setLoadingOrders(true);
    fetchAPI(`/orders/all?date=${selectedDate}`)
      .then(data => setOrders(data || []))
      .catch(err => console.error('Orders load error:', err))
      .finally(() => setLoadingOrders(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleVerifyPayment = async (orderId) => {
    try {
      await fetchAPI(`/orders/${orderId}/payment-verify`, {
        method: 'PATCH',
        body: JSON.stringify({ payment_status: 'completed' })
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!stats) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading dashboard analytics...</div>;

  return (
    <div>
      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Today Revenue</span>
            <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '0.4rem', borderRadius: '8px' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--brand-primary)' }}>{formatCurrency(stats.todayRevenue)}</h2>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Today Daily Orders</span>
            <div style={{ background: 'var(--info-bg)', color: 'var(--info)', padding: '0.4rem', borderRadius: '8px' }}>
              <ShoppingBag size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--brand-primary)' }}>{stats.todayOrders || 0}</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats.activeOrders} Currently Active • {stats.totalOrders} Lifetime</span>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Avg Prep Time</span>
            <div style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '0.4rem', borderRadius: '8px' }}>
              <Clock size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.75rem' }}>{stats.avgPrepMinutes} mins</h2>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Top Selling Dish</span>
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.4rem', borderRadius: '8px' }}>
              <Flame size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.1rem', marginTop: '0.2rem' }}>{stats.topDish}</h3>
        </div>
      </div>

      {/* Customer Satisfaction Card */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>Customer Satisfaction Rating</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Based on {stats.totalReviews} verified post-order diner reviews
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--warning-bg)', color: 'var(--warning)', padding: '0.6rem 1.2rem', borderRadius: '9999px', fontWeight: 800, fontSize: '1.25rem' }}>
          <Star size={24} fill="#f59e0b" />
          <span>{stats.avgRating} / 5.0</span>
        </div>
      </div>

      {/* DAY-BY-DAY ORDERS TABLE */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag style={{ color: 'var(--brand-primary)' }} size={20} />
              Daily Orders Dashboard & Bill Printing
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Filter orders by day, verify cash payments, and print bills
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
            <button onClick={loadData} className="btn btn-secondary btn-sm" style={{ gap: '0.3rem' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem' }}>Order #</th>
                <th style={{ padding: '0.75rem' }}>Table</th>
                <th style={{ padding: '0.75rem' }}>Time</th>
                <th style={{ padding: '0.75rem' }}>Dishes</th>
                <th style={{ padding: '0.75rem' }}>Amount</th>
                <th style={{ padding: '0.75rem' }}>Payment</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(ord => {
                const isPaid = ord.payment_status === 'completed';
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
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {(ord.items || []).map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                      {formatCurrency(ord.net_amount)}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>
                        {ord.payment_mode}
                      </div>
                      <span className={`badge ${isPaid ? 'badge-veg' : 'badge-nonveg'}`} style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                        {isPaid ? 'PAID ✓' : 'UNPAID'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge" style={{ background: 'var(--bg-surface-elevated)', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                        {ord.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {!isPaid && (
                        <button
                          onClick={() => handleVerifyPayment(ord.id)}
                          className="btn btn-primary btn-sm"
                          style={{ marginRight: '0.4rem', padding: '0.35rem 0.6rem', fontSize: '0.78rem', background: 'var(--success)' }}
                          title="Mark payment as received / paid"
                        >
                          <CheckCircle size={13} /> Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => setPrintingOrder(ord)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem' }}
                        title="Print Customer Receipt / Bill"
                      >
                        <Printer size={13} /> Bill
                      </button>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && !loadingOrders && (
                <tr>
                  <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No orders found for selected date: {selectedDate}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT BILL MODAL */}
      {printingOrder && (
        <Modal isOpen={Boolean(printingOrder)} onClose={() => setPrintingOrder(null)} title={`Customer Bill #${printingOrder.order_number}`}>
          <div>
            {/* Top Close / Cut Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                🖨️ Tax Invoice & Bill Preview
              </span>
              <button
                onClick={() => setPrintingOrder(null)}
                className="btn btn-danger btn-sm"
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', gap: '0.3rem' }}
                title="Close Bill View"
              >
                <span>✖ Cut / Close Bill</span>
              </button>
            </div>

            <div id="printable-bill" style={{ background: '#fff', color: '#000', padding: '1.5rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 900 }}>AAMANTRAN RESTAURANT</h3>
                <div>Self-Ordering System • Table #{printingOrder.table_number}</div>
                <div>Date: {new Date(printingOrder.created_at).toLocaleString()}</div>
                <div>Order Ref: #{printingOrder.order_number}</div>
              </div>

              <table style={{ width: '100%', marginBottom: '0.75rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                    <th style={{ padding: '0.3rem 0' }}>Qty & Item</th>
                    <th style={{ padding: '0.3rem 0', textAlign: 'right' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(printingOrder.items || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                      <td style={{ padding: '0.3rem 0' }}>
                        {it.quantity}x {it.item_name}
                        {it.fulfillment_type === 'packing' && ' [PACKING]'}
                      </td>
                      <td style={{ padding: '0.3rem 0', textAlign: 'right' }}>
                        ₹{(it.total_price || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed #000', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>₹{(printingOrder.total_amount || 0).toFixed(2)}</span>
                </div>
                {printingOrder.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Discount:</span>
                    <span>-₹{(printingOrder.discount_amount || 0).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>GST Tax (5%):</span>
                  <span>₹{(printingOrder.tax_amount || 0).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1rem', borderTop: '1px solid #000', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
                  <span>GRAND TOTAL:</span>
                  <span>₹{(printingOrder.net_amount || 0).toFixed(2)}</span>
                </div>
                <div style={{ marginTop: '0.4rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                  Payment: {printingOrder.payment_mode.toUpperCase()} ({printingOrder.payment_status.toUpperCase()})
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px dashed #000', fontSize: '0.75rem' }}>
                Thank you for dining at Aamantran! Have a wonderful day!
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button onClick={() => setPrintingOrder(null)} className="btn btn-danger" style={{ padding: '0.5rem 1rem' }}>
                ✖ Close / Cancel
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="btn btn-primary"
                style={{ gap: '0.4rem' }}
              >
                <Printer size={16} /> Print Bill Now
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
