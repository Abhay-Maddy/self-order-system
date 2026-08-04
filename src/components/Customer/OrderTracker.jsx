import React, { useContext } from 'react';
import { Modal } from '../Common/Modal';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { LanguageContext } from '../../context/LanguageContext';
import { CheckCircle2, Clock, XCircle, ChefHat, Bell, Star } from 'lucide-react';

export const OrderTracker = ({ order, isOpen, onClose, onOpenRating, onUpdateOrder }) => {
  const { t } = useContext(LanguageContext);
  const [timeLeftStr, setTimeLeftStr] = React.useState('');
  const [isOverdue, setIsOverdue] = React.useState(false);

  // Live countdown timer calculation
  React.useEffect(() => {
    if (!order) return;

    const updateTimer = () => {
      let targetTime = null;
      if (order.estimated_ready_at) {
        targetTime = new Date(order.estimated_ready_at).getTime();
      } else if (order.created_at) {
        const prepMins = order.prep_time_minutes || 15;
        targetTime = new Date(order.created_at).getTime() + prepMins * 60 * 1000;
      }

      if (!targetTime) {
        setTimeLeftStr('~15 mins');
        return;
      }

      const diffMs = targetTime - Date.now();
      if (diffMs <= 0) {
        setTimeLeftStr('Almost ready / Serving now');
        setIsOverdue(true);
      } else {
        const totalSecs = Math.floor(diffMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setTimeLeftStr(`${mins}m ${secs < 10 ? '0' : ''}${secs}s remaining`);
        setIsOverdue(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order]);

  if (!isOpen || !order) return null;

  const getItemStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge" style={{ background: 'var(--bg-surface-elevated)', color: 'var(--text-muted)' }}><Clock size={12} /> Received</span>;
      case 'accepted':
        return <span className="badge" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}><CheckCircle2 size={12} /> Accepted</span>;
      case 'preparing':
        return <span className="badge" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}><ChefHat size={12} /> Preparing</span>;
      case 'ready':
        return <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}><Bell size={12} className="animate-bounce" /> Ready to Serve</span>;
      case 'served':
        return <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>✓ Served</span>;
      case 'rejected':
        return <span className="badge" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}><XCircle size={12} /> Unavailable</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const isAllServed = order.items && order.items.every(i => ['served', 'rejected'].includes(i.status));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Order Tracker #${order.order_number}`} maxWidth="600px">
      <div>
        {/* Banner Summary with Live Countdown */}
        <div style={{
          background: isOverdue ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), var(--bg-surface))' : 'linear-gradient(135deg, var(--bg-surface-elevated), var(--bg-surface))',
          border: `1px solid ${isOverdue ? 'var(--danger)' : 'var(--border-color)'}`,
          padding: '1rem',
          borderRadius: 'var(--border-radius-sm)',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Table #{order.table_number} • {formatTime(order.created_at)}</div>
            
            {/* Live Prep Time Countdown */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginTop: '0.3rem',
              color: isOverdue ? 'var(--danger)' : 'var(--brand-primary)',
              fontWeight: 800,
              fontSize: '1rem'
            }}>
              <Clock size={16} className={!isOverdue ? 'animate-pulse' : ''} />
              <span>⏳ {timeLeftStr}</span>
            </div>

            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--brand-primary)', marginTop: '0.2rem' }}>
              {formatCurrency(order.net_amount)} ({order.payment_mode.toUpperCase()})
            </div>
          </div>
          <div>
            <span className="badge badge-dinein" style={{ fontSize: '0.85rem' }}>
              Status: {order.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Live Items Queue */}
        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Order Item Progress:</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {order.items && order.items.map(item => (
            <div key={item.id} className="glass-card" style={{ padding: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.quantity}x {item.item_name}</span>
                  <button
                    onClick={async () => {
                      const nextType = item.fulfillment_type === 'dine_in' ? 'packing' : 'dine_in';
                      try {
                        await fetchAPI(`/orders/items/${item.id}/fulfillment`, {
                          method: 'PATCH',
                          body: JSON.stringify({ fulfillment_type: nextType })
                        });
                        if (order && onUpdateOrder) {
                          onUpdateOrder();
                        }
                      } catch (err) {
                        alert(err.message);
                      }
                    }}
                    title="Click to switch Dine-In / Packing"
                    className={`badge ${item.fulfillment_type === 'dine_in' ? 'badge-dinein' : 'badge-packing'}`}
                    style={{ cursor: 'pointer', border: '1px dashed currentColor' }}
                  >
                    {item.fulfillment_type === 'dine_in' ? '🍽️ Dine-In (Click to Pack)' : '📦 Packing (Click for Dine-In)'}
                  </button>
                </div>
                {getItemStatusBadge(item.status)}
              </div>

              {item.variant_name && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Variant: {item.variant_name}</div>
              )}

              {item.status === 'rejected' && item.rejection_reason && (
                <div style={{ marginTop: '0.4rem', padding: '0.4rem 0.6rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '4px', fontSize: '0.8rem' }}>
                  Kitchen Notice: {item.rejection_reason}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Rating trigger if order is served */}
        {isAllServed && (
          <div style={{ textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Hope you enjoyed your meal!</p>
            <button onClick={() => { onClose(); onOpenRating(); }} className="btn btn-primary" style={{ gap: '0.4rem' }}>
              <Star size={18} />
              <span>Leave a Review</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
