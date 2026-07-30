import React, { useContext } from 'react';
import { LanguageContext } from '../../context/LanguageContext';
import { QrCode, Search, ShoppingBag, Leaf, Sparkles, History } from 'lucide-react';

export const TableSessionHeader = ({
  selectedTable,
  setSelectedTable,
  tables,
  searchQuery,
  setSearchQuery,
  vegOnly,
  setVegOnly,
  cartItemCount,
  onOpenCart,
  activeOrder,
  onOpenOrderTracker,
  onOpenHistory
}) => {
  const { t } = useContext(LanguageContext);

  return (
    <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
        {/* Table Locked Session Banner (No Customer Table Switching) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--brand-primary), #ea580c)',
            color: '#fff',
            padding: '0.65rem 1.25rem',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 800,
            fontSize: '1rem',
            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)'
          }}>
            <QrCode size={20} />
            <span>Table #{selectedTable}</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            • Self-Order Session
          </span>
        </div>

        {/* Action Triggers: Live Order Tracker Badge, Past History & Cart Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onOpenHistory}
            className="btn btn-secondary"
            title="My Past Orders History (C11)"
            style={{ gap: '0.4rem' }}
          >
            <History size={18} />
            <span>History</span>
          </button>

          {activeOrder && (
            <button
              onClick={onOpenOrderTracker}
              className="btn btn-secondary animate-slide-up"
              style={{ borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)', fontWeight: 700 }}
            >
              <Sparkles size={18} className="animate-spin" />
              <span>Track Order ({activeOrder.order_number})</span>
            </button>
          )}

          <button onClick={onOpenCart} className="btn btn-primary btn-lg" style={{ position: 'relative' }}>
            <ShoppingBag size={20} />
            <span>{t('cart')}</span>
            {cartItemCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                background: 'var(--danger)',
                color: '#fff',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 800,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Live Search & Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="input-field"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <button
          onClick={() => setVegOnly(!vegOnly)}
          className={`btn ${vegOnly ? 'btn-success' : 'btn-secondary'}`}
          style={{ gap: '0.4rem' }}
        >
          <Leaf size={18} />
          <span>{t('vegOnly')}</span>
        </button>
      </div>
    </div>
  );
};
