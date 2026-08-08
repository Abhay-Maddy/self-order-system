import React, { useState } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/formatters';
import { RotateCcw, Search, AlertCircle } from 'lucide-react';
import { Modal } from '../Common/Modal';

export const RefundManager = () => {
  const [orderQuery, setOrderQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [refundingOrder, setRefundingOrder] = useState(null);
  const [refundMode, setRefundMode] = useState('cash');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundCashAmount, setRefundCashAmount] = useState('');
  const [refundOnlineAmount, setRefundOnlineAmount] = useState('');
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

  const handleOpenRefundModal = (ord) => {
    setRefundingOrder(ord);
    setRefundMode('cash');
    const tot = Number(ord.net_amount || ord.total_amount) || 0;
    setRefundAmount(tot);
    setRefundCashAmount('');
    setRefundOnlineAmount('');
    setRefundReason('Customer Complaint / Item Cancelled');
  };

  const handleProcessRefundSubmit = async (e) => {
    e.preventDefault();
    if (!refundingOrder) return;

    const maxRefundable = Number(refundingOrder.net_amount || refundingOrder.total_amount) || 0;

    let payload = {
      refund_reason: refundReason,
      refund_mode: refundMode
    };

    if (refundMode === 'split') {
      const cRef = Number(refundCashAmount) || 0;
      const oRef = Number(refundOnlineAmount) || 0;
      const totalRequested = cRef + oRef;

      if (totalRequested <= 0) {
        alert('Please enter valid cash/online refund amounts.');
        return;
      }

      if (totalRequested > maxRefundable + 0.01) {
        alert(`⚠ Error: Total refund amount (₹${totalRequested.toFixed(2)}) exceeds maximum order bill (₹${maxRefundable.toFixed(2)}). Over-payment refund is not allowed.`);
        return;
      }

      payload.refund_cash_amount = cRef;
      payload.refund_online_amount = oRef;
      payload.refund_amount = totalRequested;
    } else {
      const rAmt = Number(refundAmount) || 0;
      if (rAmt <= 0) {
        alert('Please enter a valid refund amount.');
        return;
      }
      if (rAmt > maxRefundable + 0.01) {
        alert(`⚠ Error: Refund amount (₹${rAmt.toFixed(2)}) exceeds maximum order bill (₹${maxRefundable.toFixed(2)}). Over-payment refund is not allowed.`);
        return;
      }
      payload.refund_amount = rAmt;
      if (refundMode === 'cash') payload.refund_cash_amount = rAmt;
      if (refundMode === 'online') payload.refund_online_amount = rAmt;
    }

    try {
      const updated = await fetchAPI(`/orders/${refundingOrder.id}/refund`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      setMessage(`Refund of ${formatCurrency(payload.refund_amount)} processed successfully for Order #${refundingOrder.order_number}!`);
      setSearchedOrder(updated);
      setRefundingOrder(null);
    } catch (err) {
      alert(`Refund error: ${err.message}`);
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
        <div style={{ padding: '0.75rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.5rem', fontWeight: 700 }}>
          {message}
        </div>
      )}

      {searchedOrder && (
        <div className="glass-card" style={{ padding: '1.25rem', background: 'var(--bg-surface-elevated)', maxWidth: '550px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Order #{searchedOrder.order_number}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Table #{searchedOrder.table_number} • Mode: {searchedOrder.payment_mode ? searchedOrder.payment_mode.toUpperCase() : 'N/A'}</div>
            </div>
            <div>
              <span className="badge badge-dinein">{(searchedOrder.payment_status || 'PENDING').toUpperCase()}</span>
            </div>
          </div>

          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-primary)', marginBottom: '1rem' }}>
            Amount: {formatCurrency(searchedOrder.net_amount || searchedOrder.total_amount)}
          </div>

          {searchedOrder.payment_status !== 'refunded' ? (
            <div>
              <button onClick={() => handleOpenRefundModal(searchedOrder)} className="btn btn-danger btn-lg" style={{ width: '100%', gap: '0.5rem', fontWeight: 800 }}>
                <RotateCcw size={18} />
                <span>Issue Refund ({formatCurrency(searchedOrder.net_amount || searchedOrder.total_amount)})</span>
              </button>
            </div>
          ) : (
            <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.9rem', background: 'var(--danger-bg)', padding: '0.75rem', borderRadius: '8px' }}>
              ✓ Refund Processed ({formatCurrency(searchedOrder.refunded_amount || searchedOrder.net_amount)})
              {searchedOrder.refund_reason && <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Reason: {searchedOrder.refund_reason}</div>}
            </div>
          )}
        </div>
      )}

      {/* RICH ISSUE REFUND MODAL */}
      {refundingOrder && (() => {
        const maxRefundable = Number(refundingOrder.net_amount || refundingOrder.total_amount) || 0;
        const totalRequestedRefund = refundMode === 'split'
          ? ((Number(refundCashAmount) || 0) + (Number(refundOnlineAmount) || 0))
          : (Number(refundAmount) || 0);
        const isOverRefund = totalRequestedRefund > maxRefundable + 0.01;

        return (
          <Modal isOpen={Boolean(refundingOrder)} onClose={() => setRefundingOrder(null)} title={`Issue Refund for Order #${refundingOrder.order_number}`}>
            <form onSubmit={handleProcessRefundSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 800, color: 'var(--brand-primary)', marginBottom: '0.2rem' }}>
                  Table #{refundingOrder.table_number} • Order #{refundingOrder.order_number}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Total Net Order Bill: <b>{formatCurrency(maxRefundable)}</b>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Select Refund Mode:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setRefundMode('cash');
                      setRefundAmount(maxRefundable);
                    }}
                    className={`btn ${refundMode === 'cash' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ fontSize: '0.74rem' }}
                  >
                    💵 Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRefundMode('online');
                      setRefundAmount(maxRefundable);
                    }}
                    className={`btn ${refundMode === 'online' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ fontSize: '0.74rem' }}
                  >
                    📱 Online
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRefundMode('split');
                      setRefundCashAmount('');
                      setRefundOnlineAmount('');
                    }}
                    className={`btn ${refundMode === 'split' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ fontSize: '0.74rem' }}
                  >
                    ⚡ Split
                  </button>
                </div>
              </div>

              {refundMode === 'split' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      💵 Cash Refund Amount (₹):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={maxRefundable}
                      value={refundCashAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRefundCashAmount(val);
                        const cNum = Number(val) || 0;
                        const rem = Math.max(0, maxRefundable - cNum);
                        setRefundOnlineAmount(rem > 0 ? String(rem.toFixed(2)) : '0');
                      }}
                      className="input-field"
                      placeholder="e.g. 100"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      📱 Online / Card Refund Amount (₹):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={maxRefundable}
                      value={refundOnlineAmount}
                      onChange={(e) => setRefundOnlineAmount(e.target.value)}
                      className="input-field"
                      placeholder="e.g. 150"
                    />
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isOverRefund ? 'var(--danger)' : 'var(--text-main)' }}>
                    Total Refund Summary: {formatCurrency(totalRequestedRefund)}
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    Refund Amount (₹ Editable):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={maxRefundable}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    required
                    className="input-field"
                    style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--danger)' }}
                    placeholder="e.g. 50.00"
                  />
                </div>
              )}

              {/* OVER-REFUND WARNING ERROR ALERT */}
              {isOverRefund && (
                <div style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  border: '1px solid var(--danger)',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <AlertCircle size={16} />
                  <span>⚠ Money is over the order total (₹{maxRefundable.toFixed(2)})! Over payment/refund is not allowed.</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                  Reason for Refund:
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  required
                  className="input-field"
                  placeholder="e.g. Item unavailable / Customer dissatisfied"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={isOverRefund || totalRequestedRefund <= 0}
                  className="btn btn-danger btn-lg"
                  style={{
                    flex: 1,
                    fontWeight: 800,
                    gap: '0.4rem',
                    opacity: (isOverRefund || totalRequestedRefund <= 0) ? 0.5 : 1,
                    cursor: (isOverRefund || totalRequestedRefund <= 0) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RotateCcw size={16} />
                  <span>Confirm Refund</span>
                </button>
                <button type="button" onClick={() => setRefundingOrder(null)} className="btn btn-secondary btn-lg">
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        );
      })()}
    </div>
  );
};
