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

    if (!customerPhone || !customerPhone.trim() || customerPhone.trim().length < 10) {
      setErrorMessage('Mobile Phone Number is COMPULSORY (*)! Please enter a valid 10-digit mobile number before placing your order.');
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
      // Simulate bank verification delay for online payment
      if (paymentMode === 'online') {
        await new Promise(resolve => setTimeout(resolve, 1200));
        setPaymentStatus('success');
        await new Promise(resolve => setTimeout(resolve, 600));
      }

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
          placedByRole = 'staff_for_customer';
          orderSource = 'customer';
        }
      } else {
        // Guest (not logged in)
        placedByName = '';
        placedByRole = 'guest';
        orderSource = 'customer';
      }

      const orderPayload = {
        table_number: finalTable,
        customer_phone: customerPhone || null,
        payment_mode: paymentMode,
        payment_status: paymentMode === 'online' ? 'completed' : 'pending',
        utr_reference: upiIdInput || null,
        scheduled_time: scheduledTime,
        order_source: orderSource,
        placed_by_name: placedByName,
        placed_by_role: placedByRole,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        items: safeCart
      };

      setIsCheckoutOpen && setIsCheckoutOpen(false);
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
        {/* Guest Table Selector — only shown when not logged in and no QR param */}
        {showTableSelector && (
          <div style={{ marginBottom: '1.25rem', padding: '0.9rem', background: 'rgba(249,115,22,0.08)', border: '2px solid var(--brand-primary)', borderRadius: '12px' }}>
            <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--brand-primary)' }}>
              👥 Select Your Table Number
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
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              ℹ️ Choose the table number shown at your table
            </div>
          </div>
        )}
        {/* Mobile Number Input (Compulsory) */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.85rem' }}>
            📱 Mobile Number <span style={{ color: 'var(--danger)', fontWeight: 800 }}>*</span> (Compulsory for SMS & Live Updates):
          </label>
          <div style={{ position: 'relative' }}>
            <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="tel"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Enter 10-digit Mobile Number (e.g. 9876543210)"
              className="input-field"
              style={{ paddingLeft: '2.4rem', fontSize: '0.9rem', fontWeight: 600 }}
            />
          </div>
        </div>

        {/* Primary Payment Mode Selection (Online vs Cash) */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            Choose Payment Method:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: isMobileSmall ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => {
                setPaymentMode('online');
                setErrorMessage('');
              }}
              style={{
                padding: '0.85rem 0.75rem',
                borderRadius: 'var(--border-radius-sm)',
                border: `2px solid ${paymentMode === 'online' ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                background: paymentMode === 'online' ? 'rgba(249, 115, 22, 0.08)' : 'var(--bg-surface)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--brand-primary)', marginBottom: '0.2rem' }}>
                <CreditCard size={18} />
                <span>Online Payment</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>UPI QR, GPay, PhonePe, Cards</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMode('cash');
                setErrorMessage('');
              }}
              style={{
                padding: '0.85rem 0.75rem',
                borderRadius: 'var(--border-radius-sm)',
                border: `2px solid ${paymentMode === 'cash' ? 'var(--success)' : 'var(--border-color)'}`,
                background: paymentMode === 'cash' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--success)', marginBottom: '0.2rem' }}>
                <Banknote size={18} />
                <span>Pay Cash</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pay at table or cash desk</span>
            </button>
          </div>
        </div>

        {/* ONLINE PAYMENT INTERACTIVE SYSTEM (3 CLEAN OPTIONS: UPI QR, UPI APPS, CARDS) */}
        {paymentMode === 'online' && (
          <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.25rem', borderColor: 'var(--brand-primary)' }}>
            {/* 3 Clean Sub-Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobileSmall ? '1fr' : '1fr 1fr 1fr', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.55rem', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => setOnlineOption('upi_qr')}
                className={`btn btn-sm ${onlineOption === 'upi_qr' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ gap: '0.3rem', fontSize: '0.78rem', justifyContent: 'center' }}
              >
                <QrCode size={14} />
                <span>1. UPI QR</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlineOption('upi_apps')}
                className={`btn btn-sm ${onlineOption === 'upi_apps' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ gap: '0.3rem', fontSize: '0.78rem', justifyContent: 'center' }}
              >
                <Smartphone size={14} />
                <span>2. UPI Apps</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlineOption('card')}
                className={`btn btn-sm ${onlineOption === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ gap: '0.3rem', fontSize: '0.78rem', justifyContent: 'center' }}
              >
                <CreditCard size={14} />
                <span>3. Cards</span>
              </button>
            </div>

            {/* Option 1: UPI QR CODE WITH APP LOGO BUTTONS */}
            {onlineOption === 'upi_qr' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-block', background: '#fff', padding: '0.6rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)', marginBottom: '0.75rem' }}>
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="UPI Payment QR Code" style={{ width: '160px', height: '160px', display: 'block' }} />
                  ) : (
                    <div style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      Generating QR...
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                  Scan & Pay <span style={{ color: 'var(--brand-primary)' }}>{formatCurrency(grandTotal)}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Merchant UPI: <code>{merchantUpiId}</code>
                </div>

                {/* Direct App Launch Buttons under QR */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobileSmall ? '1fr' : '1fr 1fr', gap: '0.5rem' }}>
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Table%20${tableNumber}`}
                    style={{ background: '#e0f2fe', color: '#0284c7', padding: '0.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  >
                    <span>Google Pay</span>
                  </a>
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Table%20${tableNumber}`}
                    style={{ background: '#f3e8ff', color: '#7e22ce', padding: '0.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  >
                    <span>PhonePe</span>
                  </a>
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Table%20${tableNumber}`}
                    style={{ background: '#e0e7ff', color: '#3730a3', padding: '0.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  >
                    <span>Paytm</span>
                  </a>
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Table%20${tableNumber}`}
                    style={{ background: '#fef3c7', color: '#b45309', padding: '0.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                  >
                    <span>BHIM Pay</span>
                  </a>
                </div>
              </div>
            )}

            {/* Option 2: UPI DIRECT APPS */}
            {onlineOption === 'upi_apps' && (
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Tap your app to launch & pay <strong style={{ color: 'var(--brand-primary)' }}>{formatCurrency(grandTotal)}</strong>:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: isMobileSmall ? '1fr' : '1fr 1fr', gap: '0.6rem' }}>
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Table%20${tableNumber}`}
                    className="btn btn-secondary"
                    style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none', fontWeight: 700, padding: '0.65rem' }}
                  >
                    <span>Google Pay</span>
                  </a>
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Table%20${tableNumber}`}
                    className="btn btn-secondary"
                    style={{ background: '#f3e8ff', color: '#6b21a8', borderColor: '#e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none', fontWeight: 700, padding: '0.65rem' }}
                  >
                    <span>PhonePe</span>
                  </a>
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Table%20${tableNumber}`}
                    className="btn btn-secondary"
                    style={{ background: '#e0e7ff', color: '#3730a3', borderColor: '#c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none', fontWeight: 700, padding: '0.65rem' }}
                  >
                    <span>Paytm</span>
                  </a>
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Table%20${tableNumber}`}
                    className="btn btn-secondary"
                    style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none', fontWeight: 700, padding: '0.65rem' }}
                  >
                    <span>BHIM UPI</span>
                  </a>
                </div>
              </div>
            )}

            {/* Option 3: CARDS */}
            {onlineOption === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <input type="text" placeholder="Card Number (4532 •••• •••• 8901)" className="input-field" style={{ fontSize: '0.85rem' }} />
                <div style={{ display: 'grid', gridTemplateColumns: isMobileSmall ? '1fr' : '1fr 1fr', gap: '0.5rem' }}>
                  <input type="text" placeholder="MM / YY" className="input-field" style={{ fontSize: '0.85rem' }} />
                  <input type="password" placeholder="CVV" className="input-field" style={{ fontSize: '0.85rem' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* CASH PAYMENT INSTRUCTION BANNER */}
        {paymentMode === 'cash' && (
          <div style={{ padding: '0.9rem', background: 'var(--success-bg)', border: '1px dashed var(--success)', borderRadius: 'var(--border-radius-sm)', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--success)', marginBottom: '0.3rem' }}>
              <Banknote size={18} />
              <span>Cash Payment at Table / Counter</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Your order will be sent to the kitchen immediately. You can pay cash to the server when food is served or at the cash desk.
            </p>
          </div>
        )}

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
          style={{ width: '100%', gap: '0.5rem', background: paymentMode === 'cash' ? 'var(--success)' : 'var(--brand-primary)' }}
        >
          {isSubmitting ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} className="animate-spin" />
              <span>{paymentStatus === 'verifying' ? 'Verifying Online Payment...' : 'Processing Order...'}</span>
            </div>
          ) : (
            <>
              <CheckCircle size={20} />
              <span>
                {paymentMode === 'online' ? `Pay & Confirm Order (${formatCurrency(grandTotal)})` : `Confirm Cash Order (${formatCurrency(grandTotal)})`}
              </span>
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};
