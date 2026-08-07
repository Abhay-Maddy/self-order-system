import React, { useState, useEffect } from 'react';
import { formatTime } from '../../utils/formatters';
import { Clock, Printer, Flame, CheckCircle, Snowflake, Truck, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  pending:   { label: '🔴 New',       color: 'var(--danger)',  bg: 'var(--danger-bg)' },
  accepted:  { label: '✓ Accepted',  color: '#d97706',        bg: '#fef3c7' },
  preparing: { label: '🔥 Cooking',   color: 'var(--warning)', bg: 'var(--warning-bg)' },
  cooling:   { label: '❄️ Cooling',   color: '#0284c7',        bg: '#e0f2fe' },
  ready:     { label: '🔔 Ready',     color: 'var(--success)', bg: 'var(--success-bg)' },
  served:    { label: '✅ Served',    color: 'var(--success)', bg: 'var(--success-bg)' },
  rejected:  { label: '✕ Rejected',  color: 'var(--danger)',  bg: 'var(--danger-bg)' },
};

export const TicketCard = ({ order, onItemStatusChange, onPrintKOT, onOpenRejectModal }) => {
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    if (!order || !order.created_at) return;
    const calc = () => {
      const diff = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
      setElapsedMinutes(diff);
    };
    calc();
    const iv = setInterval(calc, 10000);
    return () => clearInterval(iv);
  }, [order.created_at]);

  if (!order) return null;
  const isOverdue = elapsedMinutes > 15;

  const overallStatus = (() => {
    const items = order.items || [];
    if (!items.length) return 'unknown';
    if (items.every(i => i.status === 'served')) return 'served';
    if (items.some(i => i.status === 'ready')) return 'ready';
    if (items.some(i => i.status === 'cooling')) return 'cooling';
    if (items.some(i => i.status === 'preparing' || i.status === 'accepted')) return 'preparing';
    if (items.some(i => i.status === 'pending')) return 'pending';
    return 'done';
  })();

  const sc = STATUS_CONFIG[overallStatus] || STATUS_CONFIG.pending;

  const allPending  = (order.items || []).filter(i => i.status === 'pending');
  const allAccepted = (order.items || []).filter(i => i.status === 'accepted');
  const allPreparing= (order.items || []).filter(i => i.status === 'preparing');
  const allCooling  = (order.items || []).filter(i => i.status === 'cooling');
  const allReady    = (order.items || []).filter(i => i.status === 'ready');

  const btnBase = { border: 'none', borderRadius: '8px', padding: '0.26rem 0.6rem', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' };

  return (
    <div
      className="animate-slide-up"
      style={{
        background: 'var(--bg-surface)',
        border: `2px solid ${isOverdue ? 'var(--danger)' : sc.color}`,
        borderRadius: '14px',
        padding: '0.85rem',
        minWidth: '285px',
        maxWidth: '315px',
        flex: '0 0 auto',
        boxShadow: isOverdue ? '0 0 0 3px rgba(239,68,68,0.15)' : '0 2px 10px rgba(0,0,0,0.07)',
        position: 'relative',
      }}
    >
      {isOverdue && (
        <div style={{ position: 'absolute', top: '-7px', right: '-7px', background: 'var(--danger)', color: '#fff', borderRadius: '999px', fontSize: '0.62rem', fontWeight: 900, padding: '2px 8px' }}>
          OVERDUE!
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--brand-primary)' }}>TABLE #{order.table_number}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>#{order.order_number} • {formatTime(order.created_at)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: isOverdue ? 'var(--danger-bg)' : 'var(--bg-surface-elevated)', color: isOverdue ? 'var(--danger)' : 'var(--text-muted)', borderRadius: '999px', padding: '0.15rem 0.45rem', fontSize: '0.7rem', fontWeight: 700 }}>
            <Clock size={11} /> {elapsedMinutes}m
          </span>
          <button onClick={() => onPrintKOT(order)} title="Print KOT" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.2rem 0.38rem', cursor: 'pointer', display: 'flex' }}>
            <Printer size={13} />
          </button>
        </div>
      </div>

      {/* Source + Status row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
        {order.order_source === 'staff' || order.placed_by_name ? (
          <span style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #f59e0b', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px' }}>
            🟡 {order.placed_by_name || 'Staff'}
          </span>
        ) : (
          <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #22c55e', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px' }}>
            🟢 Customer QR
          </span>
        )}
        <span style={{ background: sc.bg, color: sc.color, borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, padding: '1px 7px' }}>
          {sc.label}
        </span>
      </div>

      {/* Item Pills */}
      <div style={{ marginBottom: '0.6rem' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {(order.items || []).length} Items — tap to manage
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
          {(order.items || []).map(item => {
            const isc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            return (
              <button
                key={item.id}
                onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                title={`${item.item_name} — ${item.status}`}
                style={{
                  background: isc.bg, color: isc.color, border: `1.5px solid ${isc.color}`,
                  borderRadius: '999px', padding: '0.12rem 0.5rem',
                  fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.2rem',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isc.color, flexShrink: 0 }} />
                {item.quantity}× {item.item_name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded Item Actions */}
      {(order.items || []).map(item => {
        if (expandedItem !== item.id) return null;
        const isc = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
        return (
          <div key={`exp-${item.id}`} style={{ background: 'var(--bg-surface-elevated)', border: `1px solid ${isc.color}`, borderRadius: '10px', padding: '0.6rem', marginBottom: '0.5rem' }}>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
              {item.quantity}× {item.item_name}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginBottom: '0.4rem' }}>
              {item.variant_name && <span style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.68rem', padding: '1px 5px' }}>{item.variant_name}</span>}
              {item.spice_level && <span style={{ background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: '6px', fontSize: '0.68rem', padding: '1px 5px', display: 'flex', alignItems: 'center', gap: '2px' }}><Flame size={9}/> {item.spice_level}</span>}
              <span style={{ background: isc.bg, color: isc.color, borderRadius: '6px', fontSize: '0.68rem', padding: '1px 5px', fontWeight: 700 }}>{isc.label}</span>
            </div>
            {item.toppings_summary && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Toppings: {item.toppings_summary}</div>}
            {item.rejection_reason && <div style={{ fontSize: '0.7rem', color: 'var(--danger)', marginBottom: '0.3rem' }}>Reason: {item.rejection_reason}</div>}

            {/* All action buttons horizontally */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              {item.status === 'pending' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <select id={`pm-${item.id}`} defaultValue="15" style={{ padding: '0.2rem 0.35rem', fontSize: '0.68rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                      <option value="5">5m</option><option value="10">10m</option><option value="15">15m</option><option value="20">20m</option><option value="30">30m</option>
                    </select>
                    <button onClick={() => { const el=document.getElementById(`pm-${item.id}`); onItemStatusChange(item.id,'accepted',null,parseInt(el?.value||15)); setExpandedItem(null); }} style={{ ...btnBase, background: 'var(--success)', color: '#fff' }}>✓ Accept</button>
                  </div>
                  <button onClick={() => { onOpenRejectModal(item); setExpandedItem(null); }} style={{ ...btnBase, background: 'var(--danger)', color: '#fff' }}>✕ Reject</button>
                </>
              )}
              {item.status === 'accepted' && (
                <button onClick={() => { onItemStatusChange(item.id,'preparing'); setExpandedItem(null); }} style={{ ...btnBase, background: 'var(--warning)', color: '#fff' }}>🔥 Start Cooking</button>
              )}
              {item.status === 'preparing' && (
                <>
                  <button onClick={() => { onItemStatusChange(item.id,'cooling'); setExpandedItem(null); }} style={{ ...btnBase, background: '#0284c7', color: '#fff' }}>❄️ Cooling</button>
                  <button onClick={() => { onItemStatusChange(item.id,'ready'); setExpandedItem(null); }} style={{ ...btnBase, background: 'var(--success)', color: '#fff' }}>🔔 Mark Ready</button>
                </>
              )}
              {item.status === 'cooling' && (
                <button onClick={() => { onItemStatusChange(item.id,'ready'); setExpandedItem(null); }} style={{ ...btnBase, background: 'var(--success)', color: '#fff' }}>🔔 Mark Ready</button>
              )}
              {item.status === 'ready' && (
                <button onClick={() => { onItemStatusChange(item.id,'served'); setExpandedItem(null); }} style={{ ...btnBase, background: '#7c3aed', color: '#fff' }}>🚚 Deliver</button>
              )}
              {item.status === 'served' && <div style={{ color: 'var(--success)', fontWeight: 800, fontSize: '0.75rem' }}>✅ Delivered</div>}
              {item.status === 'rejected' && <div style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '0.75rem' }}>✕ Rejected</div>}
            </div>
          </div>
        );
      })}

      {/* Bulk Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.55rem', marginTop: '0.4rem' }}>
        {allPending.length > 0 && (
          <>
            <button onClick={() => allPending.forEach(i => onItemStatusChange(i.id,'accepted',null,15))} style={{ ...btnBase, background: 'var(--success)', color: '#fff' }}>✓ Accept All ({allPending.length})</button>
            <button onClick={() => allPending.forEach(i => onOpenRejectModal(i))} style={{ ...btnBase, background: 'var(--danger)', color: '#fff' }}>✕ Reject All</button>
          </>
        )}
        {allAccepted.length > 0 && (
          <button onClick={() => allAccepted.forEach(i => onItemStatusChange(i.id,'preparing'))} style={{ ...btnBase, background: 'var(--warning)', color: '#fff' }}>🔥 Cook All ({allAccepted.length})</button>
        )}
        {allPreparing.length > 0 && (
          <>
            <button onClick={() => allPreparing.forEach(i => onItemStatusChange(i.id,'cooling'))} style={{ ...btnBase, background: '#0284c7', color: '#fff' }}>❄️ Cool All ({allPreparing.length})</button>
            <button onClick={() => allPreparing.forEach(i => onItemStatusChange(i.id,'ready'))} style={{ ...btnBase, background: 'var(--success)', color: '#fff' }}>🔔 Ready All ({allPreparing.length})</button>
          </>
        )}
        {allCooling.length > 0 && (
          <button onClick={() => allCooling.forEach(i => onItemStatusChange(i.id,'ready'))} style={{ ...btnBase, background: 'var(--success)', color: '#fff' }}>🔔 Ready Cooled ({allCooling.length})</button>
        )}
        {allReady.length > 0 && (
          <button onClick={() => allReady.forEach(i => onItemStatusChange(i.id,'served'))} style={{ ...btnBase, background: '#7c3aed', color: '#fff' }}>🚚 Deliver All ({allReady.length})</button>
        )}
      </div>
    </div>
  );
};



