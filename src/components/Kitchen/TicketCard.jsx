import React, { useState, useEffect } from 'react';
import { formatTime } from '../../utils/formatters';
import { Clock, Printer, Flame } from 'lucide-react';

export const TicketCard = ({ order, onItemStatusChange, onPrintKOT, onOpenRejectModal }) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
    const calculateElapsed = () => {
      if (!order.created_at) return;
      const start = new Date(order.created_at).getTime();
      const diff = Math.floor((Date.now() - start) / (1000 * 60));
      setElapsedMinutes(diff);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 10000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  const isOverdue = elapsedMinutes > 15; // Visual alert if > 15m

  return (
    <div
      className={`glass-card animate-slide-up ${isOverdue ? 'overdue-alert' : ''}`}
      style={{
        padding: '1rem',
        marginBottom: '1rem',
        borderLeft: `4px solid ${isOverdue ? 'var(--danger)' : 'var(--brand-primary)'}`
      }}
    >
      {/* Ticket Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--brand-primary)' }}>
              TABLE #{order.table_number}
            </span>

            {/* Green vs Yellow Order Origin Dot Indicator */}
            {order.order_source === 'waiter' ? (
              <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #f59e0b', fontSize: '0.75rem', fontWeight: 800 }}>
                🟡 Waiter Order
              </span>
            ) : (
              <span className="badge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #22c55e', fontSize: '0.75rem', fontWeight: 800 }}>
                🟢 Customer QR
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            #{order.order_number} • {formatTime(order.created_at)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.25rem 0.6rem',
            borderRadius: '6px',
            background: isOverdue ? 'var(--danger-bg)' : 'var(--bg-surface-elevated)',
            color: isOverdue ? 'var(--danger)' : 'var(--text-primary)',
            fontWeight: 700,
            fontSize: '0.8rem'
          }}>
            <Clock size={14} />
            <span>{elapsedMinutes}m ago</span>
          </div>

          <button onClick={() => onPrintKOT(order)} className="btn btn-secondary btn-sm" title="Print KOT Ticket" style={{ padding: '0.3rem 0.5rem' }}>
            <Printer size={16} />
          </button>
        </div>
      </div>

      {/* Item List with Per-Item Actions (K3, K5) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {order.items && order.items.map(item => (
          <div
            key={item.id}
            style={{
              padding: '0.65rem 0.8rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {item.quantity}x {item.item_name}
                </div>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                  <span className={`badge ${item.fulfillment_type === 'dine_in' ? 'badge-dinein' : 'badge-packing'}`}>
                    {item.fulfillment_type === 'dine_in' ? 'Dine-In' : 'Packing'}
                  </span>
                  {item.variant_name && (
                    <span className="badge" style={{ background: 'var(--bg-surface-elevated)' }}>
                      {item.variant_name}
                    </span>
                  )}
                  {item.spice_level && (
                    <span className="badge" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                      <Flame size={10} /> {item.spice_level}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons per item */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                {item.status === 'pending' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Prep time:</span>
                      <select
                        id={`prep-mins-${item.id}`}
                        defaultValue="15"
                        className="input-field"
                        style={{ padding: '0.15rem 0.3rem', fontSize: '0.75rem', width: 'auto' }}
                      >
                        <option value="5">5 min</option>
                        <option value="10">10 min</option>
                        <option value="15">15 min</option>
                        <option value="20">20 min</option>
                        <option value="30">30 min</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button
                        onClick={() => {
                          const selectEl = document.getElementById(`prep-mins-${item.id}`);
                          const mins = selectEl ? parseInt(selectEl.value) : 15;
                          onItemStatusChange(item.id, 'accepted', null, mins);
                        }}
                        className="btn btn-success btn-sm"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        Accept & Set Time
                      </button>
                      <button
                        onClick={() => onOpenRejectModal(item)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {item.status === 'accepted' && (
                  <button
                    onClick={() => onItemStatusChange(item.id, 'preparing')}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'var(--warning)' }}
                  >
                    Start Cooking
                  </button>
                )}

                {item.status === 'preparing' && (
                  <button
                    onClick={() => onItemStatusChange(item.id, 'ready')}
                    className="btn btn-success btn-sm"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    Mark Ready
                  </button>
                )}

                {item.status === 'ready' && (
                  <button
                    onClick={() => onItemStatusChange(item.id, 'served')}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    Mark Served
                  </button>
                )}

                {item.status === 'served' && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)' }}>✓ Served</span>
                )}

                {item.status === 'rejected' && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--danger)' }}>✕ Rejected</span>
                )}
              </div>
            </div>

            {item.toppings_summary && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Toppings: {item.toppings_summary}
              </div>
            )}

            {item.rejection_reason && (
              <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.2rem' }}>
                Reason: {item.rejection_reason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
