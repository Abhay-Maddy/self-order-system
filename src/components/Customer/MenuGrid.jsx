import React, { useContext } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { LanguageContext } from '../../context/LanguageContext';
import { Plus, Flame, AlertCircle } from 'lucide-react';

export const MenuGrid = ({ items, onSelectItem }) => {
  const { t } = useContext(LanguageContext);

  if (!items || items.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '1.1rem' }}>No dishes found matching your selection.</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '1.25rem'
    }}>
      {items.map(item => {
        const isOutOfStock = item.stock_quantity <= 0;
        const isLowStock = item.stock_quantity > 0 && item.stock_quantity <= item.low_stock_threshold;

        return (
          <div
            key={item.id}
            className="glass-card animate-slide-up"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
              opacity: isOutOfStock ? 0.6 : 1,
              transition: 'transform 0.2s ease',
            }}
          >
            {/* Image & Badges */}
            <div style={{ position: 'relative', height: '180px', width: '100%', overflow: 'hidden' }}>
              <img
                src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'}
                alt={item.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span className={`badge ${item.is_veg ? 'badge-veg' : 'badge-nonveg'}`}>
                  {item.is_veg ? 'VEG' : 'NON-VEG'}
                </span>
                {item.spice_level === 'hot' && (
                  <span className="badge" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                    <Flame size={12} /> Spicy
                  </span>
                )}
              </div>

              {isOutOfStock && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.65)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '1rem'
                }}>
                  SOLD OUT
                </div>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>{item.name}</h3>
                {item.subtitle && (
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '0.4rem' }}>
                    {item.subtitle}
                  </div>
                )}
                {item.tags && (
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                    {item.tags.split(',').map((t, idx) => (
                      <span key={idx} className="badge" style={{ background: 'var(--bg-surface-elevated)', color: 'var(--text-primary)', fontSize: '0.7rem' }}>
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {item.description}
                </p>
              </div>

              <div>
                {isLowStock && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600, marginBottom: '0.5rem' }}>
                    <AlertCircle size={14} />
                    <span>Only {item.stock_quantity} left in stock!</span>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                    {formatCurrency(item.price)}
                  </span>

                  <button
                    disabled={isOutOfStock}
                    onClick={() => onSelectItem(item)}
                    className="btn btn-primary btn-sm"
                    style={{ gap: '0.3rem' }}
                  >
                    <span>{item.variants && item.variants.length > 0 ? t('customise') : t('add')}</span>
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
