import React, { useState, useContext } from 'react';
import { Modal } from '../Common/Modal';
import { formatCurrency } from '../../utils/formatters';
import { LanguageContext } from '../../context/LanguageContext';
import { CreditCard, Banknote, Phone, CheckCircle, ShieldCheck } from 'lucide-react';

export const CheckoutModal = ({
  isOpen,
  onClose,
  cart,
  tableNumber,
  appliedCoupon,
  onPlaceOrderSuccess
}) => {
  const { t } = useContext(LanguageContext);

  const [paymentMode, setPaymentMode] = useState('online'); // 'online' or 'cash'
  const [customerPhone, setCustomerPhone] = useState('');
  const [scheduledTime, setScheduledTime] = useState('ASAP (~15 mins)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const discountAmount = appliedCoupon ? appliedCoupon.discount_amount : 0;
  const netBeforeTax = Math.max(0, subtotal - discountAmount);
  const taxAmount = (netBeforeTax * 0.05);
  const grandTotal = netBeforeTax + taxAmount;

  const [orderSource, setOrderSource] = useState('customer'); // 'customer' or 'waiter'

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const orderPayload = {
        table_number: tableNumber,
        customer_phone: customerPhone || null,
        payment_mode: paymentMode,
        scheduled_time: scheduledTime,
        order_source: orderSource,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        items: cart
      };

      const res = await onPlaceOrderSuccess(orderPayload);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Order submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Checkout - Table #${tableNumber}`}>
      <div>
        {/* Preferred Serving Time Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.85rem' }}>
            ⏱️ Preferred Serving Time / Schedule Order:
          </label>
          <select
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="input-field"
            style={{ fontWeight: 600 }}
          >
            <option value="ASAP (~15 mins)">⚡ ASAP (~15-20 mins prep)</option>
            <option value="In 30 mins">🕒 Serve in 30 mins</option>
            <option value="In 45 mins">🕒 Serve in 45 mins</option>
            <option value="In 60 mins">🕒 Serve in 1 hour</option>
          </select>
        </div>

        {/* Phone number input for order history */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.85rem' }}>
            Mobile Number (Optional - for instant WhatsApp updates & order history):
          </label>
          <div style={{ position: 'relative' }}>
            <Phone size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+91 9876543210"
              className="input-field"
              style={{ paddingLeft: '2.2rem' }}
            />
          </div>
        </div>

        {/* Payment Mode Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            {t('selectPayment')}:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1rem',
              background: paymentMode === 'online' ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
              border: `1px solid ${paymentMode === 'online' ? 'var(--brand-primary)' : 'var(--border-color)'}`,
              borderRadius: 'var(--border-radius-sm)',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMode === 'online'}
                  onChange={() => setPaymentMode('online')}
                />
                <CreditCard size={20} style={{ color: 'var(--brand-primary)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('payOnline')}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>UPI, Credit/Debit Cards, NetBanking</span>
                </div>
              </div>
              <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.9rem 1rem',
              background: paymentMode === 'cash' ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
              border: `1px solid ${paymentMode === 'cash' ? 'var(--brand-primary)' : 'var(--border-color)'}`,
              borderRadius: 'var(--border-radius-sm)',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMode === 'cash'}
                  onChange={() => setPaymentMode('cash')}
                />
                <Banknote size={20} style={{ color: 'var(--success)' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('payCash')}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pay at table or counter when food arrives</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        {errorMessage && (
          <div style={{ padding: '0.6rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {errorMessage}
          </div>
        )}

        {/* Order Action Button */}
        <button
          onClick={handleConfirmOrder}
          disabled={isSubmitting}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', gap: '0.5rem' }}
        >
          {isSubmitting ? (
            <span>Processing Order...</span>
          ) : (
            <>
              <CheckCircle size={20} />
              <span>Confirm Order ({formatCurrency(grandTotal)})</span>
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};
