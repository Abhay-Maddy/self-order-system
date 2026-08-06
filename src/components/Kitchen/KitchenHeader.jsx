import React, { useState } from 'react';
import { playKitchenChime } from '../../utils/sound';
import { ChefHat, Volume2, VolumeX, RefreshCw, Filter, ArrowUpDown, AlertCircle, Calendar } from 'lucide-react';
import { getTodayDateString } from '../../utils/formatters';

export const KitchenHeader = ({
  activeCount,
  onRefresh,
  user,
  tableFilter,
  setTableFilter,
  sortOrder,
  setSortOrder,
  selectedDate,
  setSelectedDate,
  tables,
  lowStockItems
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleTestSound = () => {
    playKitchenChime();
  };

  const isToday = selectedDate === getTodayDateString();

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Low Stock Warning Alert Banner */}
      {lowStockItems && lowStockItems.length > 0 && (
        <div style={{
          background: 'var(--warning-bg)',
          color: 'var(--warning)',
          border: '1px solid var(--warning)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--border-radius-sm)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          <AlertCircle size={20} />
          <span>
            <b>Low Stock Alert:</b> {lowStockItems.map(i => `${i.name} (${i.stock_quantity} left)`).join(', ')}
          </span>
        </div>
      )}

      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--danger), #f59e0b)', color: '#fff', padding: '0.6rem', borderRadius: '12px', display: 'flex' }}>
              <ChefHat size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem' }}>Kitchen Display System (KDS)</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Staff User: {user ? user.name : 'Chef Pass'} • {activeCount} Active Orders
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={handleTestSound} className="btn btn-secondary btn-sm" title="Test Alert Audio Chime">
              <Volume2 size={16} />
              <span>Test Sound</span>
            </button>

            <button onClick={() => setSoundEnabled(!soundEnabled)} className="btn btn-secondary btn-sm">
              {soundEnabled ? <Volume2 size={16} className="text-success" /> : <VolumeX size={16} className="text-danger" />}
              <span>Alerts: {soundEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button onClick={onRefresh} className="btn btn-secondary btn-sm" title="Manual Sync Refresh">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Filter, Date & Sorting Control Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
          {/* Date Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
            <Calendar size={16} className="text-brand" />
            <span>Order Date:</span>
            <input
              type="date"
              value={selectedDate || getTodayDateString()}
              onChange={e => setSelectedDate && setSelectedDate(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
            />
            {!isToday && (
              <button
                onClick={() => setSelectedDate && setSelectedDate(getTodayDateString())}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
              >
                Today
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
            <Filter size={16} className="text-brand" />
            <span>Filter Table:</span>
            <select
              value={tableFilter}
              onChange={e => setTableFilter(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
            >
              <option value="all">All Tables</option>
              {tables && tables.map(t => (
                <option key={t.id} value={t.table_number}>{t.table_number}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
            <ArrowUpDown size={16} className="text-brand" />
            <span>Sort Time:</span>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="input-field"
              style={{ width: 'auto', padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
            >
              <option value="oldest">Oldest First (FIFO Priority)</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
