import React, { useState, useContext } from 'react';
import { LanguageContext } from '../../context/LanguageContext';
import { QrCode, Search, ShoppingBag, Menu, History, Sparkles, X, Info, RefreshCw } from 'lucide-react';

export const TableSessionHeader = ({
  selectedTable,
  setSelectedTable,
  tables = [],
  searchQuery,
  setSearchQuery,
  cartItemCount,
  onOpenCart,
  activeOrder,
  onOpenOrderTracker,
  onOpenHistory
}) => {
  const { t } = useContext(LanguageContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false);

  // Check if table parameter is present in URL (e.g. ?table=T-01)
  const hasTableParam = Boolean(new URLSearchParams(window.location.search).get('table'));

  const defaultTables = [
    { table_number: 'T-01' }, { table_number: 'T-02' }, { table_number: 'T-03' },
    { table_number: 'T-04' }, { table_number: 'T-05' }, { table_number: 'T-06' }
  ];
  const tableList = tables && tables.length > 0 ? tables : defaultTables;

  return (
    <div className="glass-card" style={{ padding: '0.85rem 1rem', marginBottom: '1.25rem', position: 'relative', zIndex: 50 }}>
      {/* Top Header Bar: Switch Table (if no URL param) + Table Chip + Search + 3-Line Hamburger Menu Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {/* Optional Switch Table Button: Only shown when NO table param is in URL */}
        {!hasTableParam && (
          <button
            type="button"
            onClick={() => setIsTableSelectorOpen(!isTableSelectorOpen)}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.78rem',
              fontWeight: 700,
              gap: '0.3rem',
              borderColor: 'var(--brand-primary)',
              color: 'var(--brand-primary)',
              whiteSpace: 'nowrap'
            }}
            title="Switch Active Table Number"
          >
            <RefreshCw size={13} />
            <span>Switch Table</span>
          </button>
        )}

        {/* Table Number Chip */}
        <div style={{
          background: 'linear-gradient(135deg, var(--brand-primary), #ea580c)',
          color: '#fff',
          padding: '0.5rem 0.85rem',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontWeight: 800,
          fontSize: '0.85rem',
          boxShadow: '0 3px 10px rgba(249, 115, 22, 0.3)',
          whiteSpace: 'nowrap'
        }}>
          <QrCode size={16} />
          <span>Table #{selectedTable}</span>
        </div>

        {/* Search Box */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes, starters..."
            className="input-field"
            style={{ paddingLeft: '2.2rem', paddingRight: '0.5rem', height: '38px', fontSize: '0.85rem' }}
          />
        </div>

        {/* 3-Line Hamburger Dropdown Trigger */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="btn btn-secondary"
          style={{
            padding: '0.5rem 0.6rem',
            position: 'relative',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            cursor: 'pointer'
          }}
          title="Menu & Options"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          {cartItemCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--brand-primary)',
              color: '#fff',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '0.7rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* Table Selector Dropdown (When Switch Table is clicked) */}
      {isTableSelectorOpen && !hasTableParam && (
        <div
          className="glass-card animate-slide-up"
          style={{
            position: 'absolute',
            left: '0.5rem',
            top: 'calc(100% + 4px)',
            width: '240px',
            zIndex: 99999,
            padding: '0.75rem',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--brand-primary)',
            borderRadius: '12px',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
              Select Table Number
            </span>
            <button onClick={() => setIsTableSelectorOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            {tableList.map((tb, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (setSelectedTable) setSelectedTable(tb.table_number);
                  setIsTableSelectorOpen(false);
                }}
                className={`btn btn-sm ${selectedTable === tb.table_number ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0.4rem' }}
              >
                {tb.table_number}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3-Line Hamburger Dropdown Menu Overlay - Positioned UP & OVER dish cards */}
      {isMenuOpen && (
        <div
          className="glass-card animate-slide-up"
          style={{
            position: 'absolute',
            right: '0.5rem',
            top: 'calc(100% + 4px)',
            width: '270px',
            zIndex: 99999,
            padding: '0.75rem',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--brand-primary)',
            borderRadius: '12px',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.2rem 0.4rem 0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
              TABLE OPTIONS & DETAILS
            </span>
            <button
              onClick={() => setIsMenuOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.1rem' }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {/* 1. Your Cart Button */}
            <button
              onClick={() => { setIsMenuOpen(false); onOpenCart(); }}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'space-between', padding: '0.65rem 0.85rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={18} />
                <span>Your Cart</span>
              </div>
              <span className="badge" style={{ background: '#fff', color: 'var(--brand-primary)', fontWeight: 800 }}>
                {cartItemCount} items
              </span>
            </button>

            {/* 2. Order History Button */}
            <button
              onClick={() => { setIsMenuOpen(false); onOpenHistory(); }}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'flex-start', gap: '0.6rem', padding: '0.65rem 0.85rem' }}
            >
              <History size={18} color="#f59e0b" />
              <span>Click to Watch History</span>
            </button>

            {/* 3. Track Active Order (if exists) */}
            {activeOrder && (
              <button
                onClick={() => { setIsMenuOpen(false); onOpenOrderTracker(); }}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'flex-start', gap: '0.6rem', padding: '0.65rem 0.85rem', borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)', fontWeight: 700 }}
              >
                <Sparkles size={18} className="animate-spin" />
                <span>Track Active Order ({activeOrder.order_number})</span>
              </button>
            )}

            {/* 4. Table Info Banner */}
            <div style={{ marginTop: '0.4rem', padding: '0.5rem 0.75rem', background: 'var(--bg-surface)', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Info size={14} color="var(--brand-primary)" />
              <span>Self-Ordering Active for Table #{selectedTable}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
