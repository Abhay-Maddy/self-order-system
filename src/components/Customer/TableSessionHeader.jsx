import React, { useState, useContext } from 'react';
import { LanguageContext } from '../../context/LanguageContext';
import { AuthContext } from '../../context/AuthContext';
import { QrCode, Search, ShoppingBag, Menu, History, Sparkles, X, Info, RefreshCw, FileText, LayoutDashboard, SlidersHorizontal, Leaf, ArrowLeft } from 'lucide-react';

export const TableSessionHeader = ({
  selectedTable,
  setSelectedTable,
  orderFor = 'customer',
  setOrderFor,
  tables = [],
  searchQuery,
  setSearchQuery,
  vegOnly,
  setVegOnly,
  sortBy,
  setSortBy,
  cartItemCount,
  onOpenCart,
  activeOrder,
  onOpenOrderTracker,
  onOpenHistory,
  onOpenBillInvoice,
  setActivePanel,
  onOpenOrderSelectModal
}) => {
  const { t } = useContext(LanguageContext);
  const { user } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false);

  // Check if table parameter is present in URL (e.g. ?table=T-01)
  const hasTableParam = Boolean(new URLSearchParams(window.location.search).get('table'));

  const defaultTables = [
    { table_number: 'T-01' }, { table_number: 'T-02' }, { table_number: 'T-03' },
    { table_number: 'T-04' }, { table_number: 'T-05' }, { table_number: 'T-06' }
  ];
  const tableList = tables && tables.length > 0 ? tables : defaultTables;

  // Only Admin and Cashier are allowed to edit table numbers. Waiter, Chef, and Customer have fixed table numbers.
  const canEditTable = user && (user.role === 'admin' || user.role === 'cashier' || user.username === 'admin' || user.username === 'cashier1');

  const displayTable = (selectedTable && selectedTable !== 'None' && selectedTable !== 'Takeaway') ? selectedTable : 'T-01';

  return (
    <div className="glass-card" style={{ padding: '0.85rem 1rem', marginBottom: '1.25rem', position: 'relative', zIndex: 50 }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>

        {/* Interactive Mode & Table Badge Chip */}
        <div
          onClick={() => {
            if (canEditTable) setIsTableSelectorOpen(!isTableSelectorOpen);
          }}
          style={{
            background: 'linear-gradient(135deg, var(--brand-primary), #ea580c)',
            color: '#fff',
            padding: '0.45rem 0.85rem',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontWeight: 800,
            fontSize: '0.85rem',
            boxShadow: '0 3px 10px rgba(249, 115, 22, 0.3)',
            whiteSpace: 'nowrap',
            cursor: canEditTable ? 'pointer' : 'default'
          }}
          title={canEditTable ? "Click to switch Table Number" : `Table #${displayTable}`}
        >
          <QrCode size={16} />
          <span>Table #{displayTable}</span>
          {canEditTable && <span style={{ fontSize: '0.75rem', opacity: 0.9, marginLeft: '2px' }}>✏️</span>}
        </div>

        {/* Back to Dashboard Button — role-aware */}
        {user && setActivePanel && (() => {
          const isWaiter = user.role === 'waiter' || user.username === 'waiter1' || (user.name && user.name.toLowerCase().includes('waiter'));
          const isChef = user.role === 'chef' || user.username === 'chef1' || (user.name && user.name.toLowerCase().includes('chef'));
          const isAdmin = ['admin', 'cashier'].includes(user.role);

          if (isWaiter || isChef) {
            const targetPanel = isWaiter ? 'waiter' : 'kitchen';
            const label = isWaiter ? '← Waiter Dashboard' : '← Kitchen Dashboard';
            return (
              <button
                type="button"
                onClick={() => setActivePanel(targetPanel)}
                className="btn btn-secondary"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  gap: '0.4rem',
                  borderRadius: '10px',
                  border: '1px solid var(--brand-primary)',
                  color: 'var(--brand-primary)',
                  whiteSpace: 'nowrap'
                }}
                title="Return to your staff dashboard"
              >
                {label}
              </button>
            );
          } else if (isAdmin) {
            return (
              <button
                type="button"
                onClick={() => setActivePanel('admin')}
                className="btn btn-primary"
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  gap: '0.4rem',
                  borderRadius: '10px',
                  boxShadow: '0 3px 10px rgba(249, 115, 22, 0.3)',
                  whiteSpace: 'nowrap',
                  background: 'linear-gradient(135deg, var(--brand-primary), #ea580c)'
                }}
                title="Return to Admin Panel"
              >
                <LayoutDashboard size={16} />
                <span>Admin Panel</span>
              </button>
            );
          }
          return null;
        })()}

        {/* Search Box */}
        <div style={{ flex: 1, position: 'relative', minWidth: '180px' }}>
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

      {/* Table Selector Dropdown (When Switch Table is clicked by staff) */}
      {isTableSelectorOpen && user && (
        <div
          className="glass-card animate-slide-up"
          style={{
            position: 'absolute',
            left: '0.5rem',
            top: 'calc(100% + 4px)',
            width: '240px',
            maxWidth: 'calc(100vw - 1rem)',
            boxSizing: 'border-box',
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
              {t('selectTable')}
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

      {/* 3-Line Hamburger Dropdown Menu Overlay */}
      {isMenuOpen && (
        <div
          className="glass-card animate-slide-up"
          style={{
            position: 'absolute',
            right: '0.5rem',
            top: 'calc(100% + 4px)',
            width: '290px',
            maxWidth: 'calc(100vw - 1rem)',
            boxSizing: 'border-box',
            zIndex: 99999,
            padding: '0.85rem',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--brand-primary)',
            borderRadius: '12px',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.2rem 0.4rem 0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
              TABLE OPTIONS & SORTING
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

            {/* 3. View & Download Bill Invoice */}
            <button
              onClick={() => { setIsMenuOpen(false); if (onOpenBillInvoice) onOpenBillInvoice(); }}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'flex-start', gap: '0.6rem', padding: '0.65rem 0.85rem', color: 'var(--success)', borderColor: 'var(--success)', fontWeight: 700 }}
            >
              <FileText size={18} />
              <span>View & Download Bill Invoice</span>
            </button>

            {/* 4. Track Active Order (if exists) */}
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

            {/* 5. Go to Dashboard Button — role-aware, inside hamburger menu */}
            {user && setActivePanel && (() => {
              const isWaiter = user.role === 'waiter' || user.username === 'waiter1' || (user.name && user.name.toLowerCase().includes('waiter'));
              const isChef = user.role === 'chef' || user.username === 'chef1' || (user.name && user.name.toLowerCase().includes('chef'));
              const isAdmin = ['admin', 'cashier'].includes(user.role);

              if (isWaiter || isChef) {
                const targetPanel = isWaiter ? 'waiter' : 'kitchen';
                const label = isWaiter ? '← Back to Waiter Dashboard' : '← Back to Kitchen Dashboard';
                return (
                  <button
                    onClick={() => { setIsMenuOpen(false); setActivePanel(targetPanel); }}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'flex-start', gap: '0.6rem', padding: '0.65rem 0.85rem', borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)', fontWeight: 700 }}
                  >
                    <ArrowLeft size={18} style={{ color: 'var(--brand-primary)' }} />
                    <span>{label}</span>
                  </button>
                );
              } else if (isAdmin) {
                return (
                  <button
                    onClick={() => { setIsMenuOpen(false); setActivePanel('admin'); }}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'flex-start', gap: '0.6rem', padding: '0.65rem 0.85rem', borderColor: 'var(--brand-primary)', fontWeight: 700 }}
                  >
                    <LayoutDashboard size={18} style={{ color: 'var(--brand-primary)' }} />
                    <span>Go to Admin Panel</span>
                  </button>
                );
              }
              return null;
            })()}

            {/* 6. Comprehensive Sort & Filter Options */}
            <div style={{ marginTop: '0.4rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <SlidersHorizontal size={13} style={{ color: 'var(--brand-primary)' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    SORT EVERYTHING
                  </span>
                </div>
                {((sortBy && sortBy !== 'default') || (vegOnly && vegOnly !== 'all')) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (setSortBy) setSortBy('default');
                      if (setVegOnly) setVegOnly(false);
                    }}
                    style={{
                      background: 'var(--danger-bg)',
                      color: 'var(--danger)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.2rem 0.45rem',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.2rem'
                    }}
                    title="Remove all sorting and reset menu filters"
                  >
                    <X size={12} />
                    <span>Remove Sort</span>
                  </button>
                )}
              </div>

              {/* Active Sort Banner */}
              {((sortBy && sortBy !== 'default') || (vegOnly && vegOnly !== 'all')) && (
                <div style={{ padding: '0.4rem 0.6rem', background: 'rgba(249, 115, 22, 0.1)', border: '1px solid var(--brand-primary)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>
                    Active: {sortBy === 'price_low' ? '💰 Price Low-High' : sortBy === 'price_high' ? '💎 Price High-Low' : sortBy === 'name' ? '🔤 Name (A-Z)' : 'Filtered'} {(vegOnly === 'veg' || vegOnly === true) ? '• 🟢 Veg Only' : vegOnly === 'non_veg' ? '• 🔴 Non-Veg Only' : ''}
                  </span>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => { if (setSortBy) setSortBy('price_low'); }}
                  className={`btn btn-sm ${sortBy === 'price_low' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem', justifyContent: 'center' }}
                >
                  💰 Price Low-High
                </button>
                <button
                  type="button"
                  onClick={() => { if (setSortBy) setSortBy('price_high'); }}
                  className={`btn btn-sm ${sortBy === 'price_high' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem', justifyContent: 'center' }}
                >
                  💎 Price High-Low
                </button>
                <button
                  type="button"
                  onClick={() => { if (setSortBy) setSortBy('name'); }}
                  className={`btn btn-sm ${sortBy === 'name' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem', justifyContent: 'center' }}
                >
                  🔤 Name (A-Z)
                </button>
                <button
                  type="button"
                  onClick={() => { if (setSortBy) setSortBy('default'); }}
                  className={`btn btn-sm ${sortBy === 'default' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.4rem 0.2rem', justifyContent: 'center' }}
                >
                  ✨ Default Menu
                </button>
              </div>

              {/* Dietary Food Type Filter Options (All, Veg Only, Non-Veg Only) */}
              {setVegOnly && (
                <div style={{ marginTop: '0.6rem', background: 'var(--bg-surface)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Leaf size={12} color="var(--success)" />
                    <span>DIETARY TYPE FILTER</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.3rem' }}>
                    <button
                      type="button"
                      onClick={() => setVegOnly(false)}
                      className={`btn btn-sm ${(!vegOnly || vegOnly === 'all') ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.72rem', padding: '0.35rem 0.1rem', justifyContent: 'center' }}
                    >
                      🍽️ All
                    </button>
                    <button
                      type="button"
                      onClick={() => setVegOnly('veg')}
                      className={`btn btn-sm ${(vegOnly === 'veg' || vegOnly === true) ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.72rem', padding: '0.35rem 0.1rem', justifyContent: 'center', borderColor: 'var(--success)' }}
                    >
                      🟢 Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setVegOnly('non_veg')}
                      className={`btn btn-sm ${vegOnly === 'non_veg' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ fontSize: '0.72rem', padding: '0.35rem 0.1rem', justifyContent: 'center', borderColor: 'var(--danger)' }}
                    >
                      🔴 Non-Veg
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Table Info Banner */}
            <div style={{ marginTop: '0.4rem', padding: '0.5rem 0.75rem', background: 'var(--bg-surface)', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Info size={14} color="var(--brand-primary)" />
              <span>Self-Ordering Active {selectedTable ? `for Table #${selectedTable}` : ''}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

