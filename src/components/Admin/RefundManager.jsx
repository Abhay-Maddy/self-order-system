import React, { useState } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/formatters';
import { RotateCcw, Search, CheckCircle } from 'lucide-react';

export const RefundManager = () => {
  const [orderQuery, setOrderQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [refundReason, setRefundReason] = useState('Customer Complaint / Item Cancelled');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderQuery.trim()) return;

    setLoading(true);
    setMessage('');
    try {
      const data = await fetchAPI(`/orders/track/${orderQuery.trim()}`);
      setSearchedOrder(data);
    } catch (err) {
      alert('Order not found.');
      setSearchedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!searchedOrder) return;
    if (window.confirm(`Confirm processing refund of ${formatCurrency(searchedOrder.net_amount)} for Order #${searchedOrder.order_number}?`)) {
      try {
        await fetchAPI(`/orders/${searchedOrder.id}/refund`, {
          method: 'POST',
          body: JSON.stringify({ refund_reason: refundReason })
        });
        setMessage('Refund processed successfully! Order status updated to Refunded.');
        setSearchedOrder({ ...searchedOrder, payment_status: 'refunded', status: 'refunded' });
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem' }}>Refund Processing & Order Lookup</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Search orders by ID or Order Number and log full/partial refunds (`A10`).
        </span>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', maxWidth: '450px' }}>
        <input
          type="text"
          value={orderQuery}
          onChange={e => setOrderQuery(e.target.value)}
          placeholder="Enter Order ID / Number (e.g. ORD-260729-1234)"
          className="input-field"
        />
        <button type="submit" className="btn btn-primary" style={{ gap: '0.4rem' }}>
          <Search size={18} />
          <span>Lookup</span>
        </button>
      </form>

      {message && (
        <div style={{ padding: '0.75rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          {message}
        </div>
      )}

      {searchedOrder && (
        <div className="glass-card" style={{ padding: '1.25rem', background: 'var(--bg-surface-elevated)', maxWidth: '550px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Order #{searchedOrder.order_number}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Table #{searchedOrder.table_number} • Mode: {searchedOrder.payment_mode.toUpperCase()}</div>
            </div>
            <div>
              <span className="badge badge-dinein">{searchedOrder.payment_status.toUpperCase()}</span>
            </div>
          </div>

          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-primary)', marginBottom: '1rem' }}>
            Amount: {formatCurrency(searchedOrder.net_amount)}
          </div>

          {searchedOrder.payment_status !== 'refunded' ? (
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Refund Reason:</label>
              <input
                type="text"
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                className="input-field"
                style={{ marginBottom: '1rem' }}
              />

              <button onClick={handleProcessRefund} className="btn btn-danger btn-lg" style={{ width: '100%', gap: '0.5rem' }}>
                <RotateCcw size={18} />
                <span>Issue Full Refund ({formatCurrency(searchedOrder.net_amount)})</span>
              </button>
            </div>
          ) : (
            <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.9rem' }}>
              ✓ This order has been refunded. Reason: {searchedOrder.refund_reason || 'N/A'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
