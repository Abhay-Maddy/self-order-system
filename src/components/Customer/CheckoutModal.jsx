import React, { useState, useEffect, useContext } from 'react';
import { Modal } from '../Common/Modal';
import { formatCurrency } from '../../utils/formatters';
import { fetchAPI } from '../../utils/api';
import { LanguageContext } from '../../context/LanguageContext';
import { CreditCard, Banknote, Phone, CheckCircle, ShieldCheck, QrCode, Smartphone, Sparkles, Check, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';

import { useIsMobile } from '../../hooks/useIsMobile';

export const CheckoutModal = ({
  isOpen,
  onClose,
  cart = [],
  tableNumber,
  orderFor = 'customer',
  appliedCoupon,
  activeOrder,
  user = null,
  tables = [],
  hasTableParam = false,
  onPlaceOrderSuccess
}) => {
  const { t } = useContext(LanguageContext);
  const isMobileSmall = useIsMobile(480);

  const [paymentMode, setPaymentMode] = useState('online'); // 'online' or 'cash'
  const [onlineOption, setOnlineOption] = useState('upi_qr'); // 'upi_qr', 'upi_apps', 'card'
  const [customerPhone, setCustomerPhone] = useState('');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [scheduledTime, setScheduledTime] = useState('ASAP (~15 mins)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle', 'verifying', 'success'

  // Guest table selection: shown when user is NOT logged in and no QR table param
  const [guestTable, setGuestTable] = useState(tableNumber || 'T-01');
  const isGuest = !user;
  const showTableSelector = isGuest && !hasTableParam;
  const effectiveTable = showTableSelector ? guestTable : tableNumber;

  useEffect(() => {
    if (activeOrder && activeOrder.customer_phone) {
      setCustomerPhone(activeOrder.customer_phone);
    }
  }, [activeOrder, isOpen]);

  const safeCart = Array.isArray(cart) ? cart : [];
  const subtotal = safeCart.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const discountAmount = appliedCoupon ? (appliedCoupon.discount_amount || 0) : 0;
  const netBeforeTax = Math.max(0, subtotal - discountAmount);
  const taxAmount = (netBeforeTax * 0.05);
  const grandTotal = netBeforeTax + taxAmount;

  const [merchantUpiId, setMerchantUpiId] = useState('aamantran@upi');
  const [merchantName, setMerchantName] = useState('Aamantran Restaurant');

  useEffect(() => {
    fetchAPI('/settings')
      .then(s => {
        if (s.payment_upi_id) setMerchantUpiId(s.payment_upi_id);
        if (s.payment_merchant_name) setMerchantName(s.payment_merchant_name);
      })
      .catch(err => console.error(err));
  }, []);

  // Generate dynamic UPI QR Code URL when amount or option changes
  useEffect(() => {
    if (isOpen && grandTotal > 0) {
      const upiString = `upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Table%20${tableNumber}%20Order`;
      QRCode.toDataURL(upiString, { width: 200, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Failed to generate UPI QR:', err));
    }
  }, [isOpen, grandTotal, tableNumber, merchantUpiId, merchantName]);

  if (!isOpen) return null;

  const handleConfirmOrder = async () => {
    const finalTable = showTableSelector ? guestTable : tableNumber;

    if (orderFor === 'customer' && (!finalTable || finalTable === 'None' || !String(finalTable).trim())) {
      setErrorMessage('⚠ Table selection is COMPULSORY for Customer orders! Please choose a valid table number.');
      return;
    }

    const cleanPhone = (customerPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMessage('⚠ Customer Mobile Phone Number must be EXACTLY 10 digits (e.g. 9876543210).');
      return;
    }

    if (paymentMode === 'online' && onlineOption === 'upi_id' && !upiIdInput.trim()) {
      setErrorMessage('Please enter a valid UPI ID (e.g. mobile@upi).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setPaymentStatus('verifying');

    try {
      // Determine placed_by metadata based on user login state and orderFor
      let placedByName = '';
      let placedByRole = '';
      let orderSource = 'customer';

      if (user) {
        // Logged-in user
        placedByName = user.name || user.username || '';
        if (orderFor === 'self') {
          placedByRole = 'self';
          orderSource = 'self';
        } else {
          placedByRole = user.role || 'staff';
          orderSource = 'customer';
        }
      } else {
        // Guest (not logged in)
        placedByName = '';
        placedByRole = 'guest';
        orderSource = 'customer';
      }

      const finalTable = (effectiveTable === 'None' || !effectiveTable || orderFor === 'self') ? 'Takeaway' : effectiveTable;

      const orderPayload = {
        table_number: finalTable,
        customer_phone: customerPhone || null,
        payment_mode: 'cash',
        payment_status: 'pending',
        utr_reference: null,
        scheduled_time: scheduledTime,
        order_source: orderSource,
        placed_by_name: placedByName,
        placed_by_role: placedByRole,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        items: safeCart
      };

      await onPlaceOrderSuccess(orderPayload);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Order submission failed. Please try again.');
      setPaymentStatus('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Checkout & Payment${effectiveTable && effectiveTable !== 'None' ? ` — Table #${effectiveTable}` : ''}`}>
      <div>
        {/* Takeaway Order vs Dine-In Table Banner */}
        {effectiveTable === 'Takeaway' || effectiveTable === 'None' || !effectiveTable || orderFor === 'self' ? (
          <div style={{ marginBottom: '1.25rem', padding: '0.9rem', background: 'rgba(249,115,22,0.08)', border: '2px solid var(--brand-primary)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.95rem' }}>
              <span>🛍️</span>
              <span>Takeaway Order (Self-Pickup)</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.3rem 0 0.6rem 0' }}>
              Direct order without a table. Your order will be prepared for pickup at the counter.
            </p>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              ⏱️ Preferred Pickup / Prep Time:
            </label>
            <select
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="input-field"
              style={{ fontWeight: 600, fontSize: '0.85rem' }}
            >
              <option value="ASAP (~15 mins)">⚡ ASAP (~15-20 mins)</option>
              <option value="In 30 mins">⏳ In 30 mins</option>
              <option value="In 45 mins">⏳ In 45 mins</option>
              <option value="In 1 Hour">⏳ In 1 Hour</option>
            </select>
          </div>
        ) : (
          showTableSelector && (
            <div style={{ marginBottom: '1.25rem', padding: '0.9rem', background: 'rgba(249,115,22,0.08)', border: '2px solid var(--brand-primary)', borderRadius: '12px' }}>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--brand-primary)' }}>
                👥 Select Table Number
              </label>
              <select
                value={guestTable}
                onChange={e => setGuestTable(e.target.value)}
                className="input-field"
                style={{ fontWeight: 700 }}
              >
                {(tables.length > 0 ? tables : [
                  { table_number: 'T-01' }, { table_number: 'T-02' }, { table_number: 'T-03' },
                  { table_number: 'T-04' }, { table_number: 'T-05' }, { table_number: 'T-06' }
                ]).map((tb, i) => (
                  <option key={i} value={tb.table_number}>Table #{tb.table_number}</option>
                ))}
              </select>
            </div>
          )
        )}

        {/* Customer Phone Number Input */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.85rem' }}>
            📱 Customer Phone Number <span style={{ color: 'var(--danger)' }}>* (Compulsory)</span>:
          </label>
          <div style={{ position: 'relative' }}>
            <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
              placeholder="Enter 10-digit Mobile Number (e.g. 9876543210) *"
              className="input-field"
              style={{ paddingLeft: '2.4rem', fontSize: '0.9rem', fontWeight: 600 }}
              required
            />
          </div>
        </div>

        {/* Order Information Banner */}
        <div style={{ padding: '0.85rem', background: 'rgba(249, 115, 22, 0.08)', border: '1px solid var(--brand-primary)', borderRadius: 'var(--border-radius-sm)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--brand-primary)', marginBottom: '0.3rem', fontSize: '0.88rem' }}>
            <Banknote size={18} />
            <span>Order Confirmation</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
            Your order will be sent to the kitchen immediately upon confirmation. Payment can be made at the table / cash counter or via Admin UPI verification.
          </p>
        </div>

        {/* Error Feedback Alert */}
        {errorMessage && (
          <div style={{ padding: '0.66rem 0.85rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Grand Total & Place Order Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.5rem 0', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Grand Total</span>
          <span style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--brand-primary)' }}>{formatCurrency(grandTotal)}</span>
        </div>

        <button
          onClick={handleConfirmOrder}
          disabled={isSubmitting}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', gap: '0.5rem', background: 'var(--brand-primary)', fontWeight: 800 }}
        >
          {isSubmitting ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} className="animate-spin" />
              <span>Placing Order...</span>
            </div>
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
