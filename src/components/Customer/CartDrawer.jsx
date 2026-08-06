import React, { useState, useContext } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { LanguageContext } from '../../context/LanguageContext';
import { fetchAPI } from '../../utils/api';
import { X, Trash2, Tag, ArrowRight, ShoppingBag } from 'lucide-react';

export const CartDrawer = ({
  isOpen,
  onClose,
  cart,
  setCart,
  appliedCoupon,
  setAppliedCoupon,
  onProceedToCheckout
}) => {
  const { t } = useContext(LanguageContext);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  if (!isOpen) return null;

  const updateQuantity = (cartId, delta) => {
    setCart(cart.map(item => {
      if (item.cart_id === cartId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        return {
          ...item,
          quantity: newQty,
          total_price: item.unit_price * newQty
        };
      }
      return item;
    }).filter(Boolean));
  };

  const toggleItemFulfillment = (cartId) => {
    setCart(cart.map(item => {
      if (item.cart_id === cartId) {
        const newFulfillment = item.fulfillment_type === 'dine_in' ? 'packing' : 'dine_in';
        return { ...item, fulfillment_type: newFulfillment };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetchAPI('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code: couponCodeInput, cart_amount: subtotal })
      });
      setAppliedCoupon(res);
      setCouponCodeInput('');
    } catch (err) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const netBeforeTax = Math.max(0, subtotal - discountAmount);
  const taxAmount = (netBeforeTax * 0.05); // 5% GST tax default
  const grandTotal = netBeforeTax + taxAmount;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div className="animate-slide-up" style={{
        width: '100%',
        maxWidth: '460px',
        height: '100%',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Header */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={20} className="text-brand" />
            <h3 style={{ fontSize: '1.2rem' }}>{t('cart')} ({cart.length} items)</h3>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ borderRadius: '50%', padding: '0.3rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Cart Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <ShoppingBag size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <p>Your cart is empty. Add some delicious dishes!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.map(item => {
                const itemName = item.item_name || item.name || (item.item && item.item.name) || 'Dish';
                const itemPrice = (typeof item.total_price === 'number' && !isNaN(item.total_price) && item.total_price > 0)
                  ? item.total_price
                  : ((item.unit_price || item.price || 0) * (item.quantity || 1));
                const fulfillment = item.fulfillment_type || 'dine_in';

                return (
                  <div key={item.cart_id || item.id} className="glass-card" style={{ padding: '0.9rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{itemName}</h4>
                      <span style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>
                        {formatCurrency(itemPrice)}
                      </span>
                    </div>

                    {item.variant_name && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Variant: {item.variant_name}
                      </div>
                    )}

                    {item.toppings_summary && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Toppings: {item.toppings_summary}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                      {/* Per-item Fulfillment Toggle */}
                      <button
                        onClick={() => toggleItemFulfillment(item.cart_id)}
                        className={`badge ${fulfillment === 'dine_in' ? 'badge-dinein' : 'badge-packing'}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                        title="Click to toggle Dine-In vs Packing for this item"
                      >
                        {fulfillment === 'dine_in' ? '🍽️ Dine-In' : '📦 Packing'}
                      </button>

                      {/* Quantity Adjustment */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface-elevated)', padding: '0.15rem 0.4rem', borderRadius: '6px' }}>
                        <button
                          onClick={() => updateQuantity(item.cart_id, -1)}
                          className="btn btn-secondary btn-sm"
                          style={{ width: '24px', height: '24px', padding: 0 }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.cart_id, 1)}
                          className="btn btn-secondary btn-sm"
                          style={{ width: '24px', height: '24px', padding: 0 }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Summary & Coupon Section */}
        {cart.length > 0 && (
          <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface-elevated)' }}>
            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Tag size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  placeholder={t('couponPlaceholder')}
                  className="input-field"
                  style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
                />
              </div>
              <button type="submit" disabled={couponLoading} className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
                Apply
              </button>
            </form>

            {couponError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.78rem', marginBottom: '0.75rem' }}>{couponError}</p>
            )}

            {appliedCoupon && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--success-bg)', padding: '0.5rem 0.8rem', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--success)' }}>
                <span>Coupon ({appliedCoupon.code}) applied</span>
                <button onClick={() => setAppliedCoupon(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 700 }}>
                  Remove
                </button>
              </div>
            )}

            {/* Bill Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>{t('subtotal')}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                  <span>{t('discount')}</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>{t('tax')} (5% GST)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', color: 'var(--brand-primary)', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', marginTop: '0.2rem' }}>
                <span>{t('grandTotal')}</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={() => { onClose(); onProceedToCheckout(); }}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', gap: '0.6rem' }}
            >
              <span>{t('checkout')} ({formatCurrency(grandTotal)})</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
