import React, { useEffect, useState } from 'react';
import { Clock, ChefHat, Bell, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export const OrderStatusBar = ({ activeOrder, onOpenOrderTracker }) => {
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!activeOrder) return;

    const updateTimer = () => {
      let targetTime = null;
      if (activeOrder.estimated_ready_at) {
        targetTime = new Date(activeOrder.estimated_ready_at).getTime();
      } else if (activeOrder.created_at) {
        const prepMins = activeOrder.prep_time_minutes || 15;
        targetTime = new Date(activeOrder.created_at).getTime() + prepMins * 60 * 1000;
      }

      if (!targetTime) {
        setTimeLeftStr('~15 mins');
        return;
      }

      const diffMs = targetTime - Date.now();
      if (diffMs <= 0) {
        setTimeLeftStr('Almost ready!');
        setIsOverdue(true);
      } else {
        const totalSecs = Math.floor(diffMs / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setTimeLeftStr(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
        setIsOverdue(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeOrder]);

  if (!activeOrder) return null;

  const items = activeOrder.items || [];
  const pendingCount = items.filter(i => i.status === 'pending').length;
  const preparingCount = items.filter(i => i.status === 'preparing' || i.status === 'accepted').length;
  const readyCount = items.filter(i => i.status === 'ready').length;
  const servedCount = items.filter(i => i.status === 'served').length;
  const totalItems = items.length;

  // Determine overall order phase
  let phase = 'received';
  let phaseIcon = <Clock size={16} />;
  let phaseColor = 'var(--text-muted)';
  let phaseLabel = 'Order Received';

  if (servedCount === totalItems && totalItems > 0) {
    phase = 'served';
    phaseIcon = <CheckCircle2 size={16} />;
    phaseColor = 'var(--success)';
    phaseLabel = 'All Served ✓';
  } else if (readyCount > 0) {
    phase = 'ready';
    phaseIcon = <Bell size={16} className="animate-bounce" />;
    phaseColor = 'var(--success)';
    phaseLabel = `${readyCount} Ready to Serve`;
  } else if (preparingCount > 0) {
    phase = 'preparing';
    phaseIcon = <ChefHat size={16} />;
    phaseColor = 'var(--warning)';
    phaseLabel = 'Kitchen Preparing';
  } else if (pendingCount > 0) {
    phase = 'pending';
    phaseIcon = <Clock size={16} className="animate-pulse" />;
    phaseColor = 'var(--brand-primary)';
    phaseLabel = 'Awaiting Kitchen';
  }

  // Progress percentage
  const progressPercent = totalItems > 0
    ? Math.round(((servedCount + readyCount * 0.75 + preparingCount * 0.4) / totalItems) * 100)
    : 0;

  return (
    <div
      onClick={onOpenOrderTracker}
      className="glass-card animate-slide-up"
      style={{
        padding: '0.85rem 1rem',
        marginTop: '1.5rem',
        marginBottom: '0.5rem',
        cursor: 'pointer',
        border: `1px solid ${phaseColor}`,
        borderLeft: `4px solid ${phaseColor}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Progress background bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: `${progressPercent}%`,
        background: `${phaseColor}10`,
        transition: 'width 0.5s ease',
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} style={{ color: 'var(--brand-primary)' }} className="animate-pulse" />
            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
              Order #{activeOrder.order_number}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Table #{activeOrder.table_number}
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: isOverdue ? 'var(--danger)' : 'var(--brand-primary)',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}>
            <Clock size={14} />
            <span>⏳ {timeLeftStr}</span>
          </div>
        </div>

        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: phaseColor, fontWeight: 700, fontSize: '0.85rem' }}>
            {phaseIcon}
            <span>{phaseLabel}</span>
          </div>

          {/* Item status dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {items.map((item, idx) => (
              <span
                key={idx}
                title={`${item.item_name}: ${item.status}`}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background:
                    item.status === 'pending' ? 'var(--text-muted)' :
                    item.status === 'preparing' || item.status === 'accepted' ? 'var(--warning)' :
                    item.status === 'ready' ? 'var(--success)' :
                    item.status === 'served' ? '#22c55e' :
                    item.status === 'rejected' ? 'var(--danger)' :
                    'var(--text-muted)',
                  border: '1.5px solid var(--bg-surface)',
                  transition: 'background 0.3s ease'
                }}
              />
            ))}
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
              Tap to track →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
