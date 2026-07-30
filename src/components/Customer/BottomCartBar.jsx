import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export const BottomCartBar = ({ cart, onOpenCart }) => {
  if (!cart || cart.length === 0) return null;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 2rem)',
      maxWidth: '600px',
      zIndex: 900,
    }} className="animate-slide-up">
      <div style={{
        background: 'linear-gradient(135deg, var(--brand-primary), #ea580c)',
        color: '#ffffff',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--border-radius-lg)',
        boxShadow: '0 10px 30px rgba(249, 115, 22, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer'
      }} onClick={onOpenCart}>
        {/* Left Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(4px)',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.95rem'
          }}>
            {totalItems}
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>
              {formatCurrency(subtotal)}
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
              {cart.slice(0, 2).map(i => i.item_name).join(', ')}{cart.length > 2 ? '...' : ''}
            </div>
          </div>
        </div>

        {/* Right CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.95rem' }}>
          <span>View Cart & Checkout</span>
          <ArrowRight size={20} />
        </div>
      </div>
    </div>
  );
};
