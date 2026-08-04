import React, { useState, useEffect, useContext } from 'react';
import { Modal } from '../Common/Modal';
import { formatCurrency } from '../../utils/formatters';
import { fetchAPI } from '../../utils/api';
import { LanguageContext } from '../../context/LanguageContext';
import { CreditCard, Banknote, Phone, CheckCircle, ShieldCheck, QrCode, Smartphone, Sparkles, Check, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';

export const CheckoutModal = ({
  isOpen,
  onClose,
  cart = [],
  tableNumber,
  appliedCoupon,
  onPlaceOrderSuccess
}) => {
  const { t } = useContext(LanguageContext);

  const [paymentMode, setPaymentMode] = useState('online'); // 'online' or 'cash'
  const [onlineOption, setOnlineOption] = useState('upi_qr'); // 'upi_qr', 'upi_id', 'card'
  const [customerPhone, setCustomerPhone] = useState('');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [scheduledTime, setScheduledTime] = useState('ASAP (~15 mins)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('idle'); // 'idle', 'verifying', 'success'

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

      const orderPayload = {
        table_number: tableNumber,
        customer_phone: customerPhone || null,
        payment_mode: paymentMode,
        payment_status: paymentMode === 'online' ? 'completed' : 'pending',
        utr_reference: upiIdInput || null,
        scheduled_time: scheduledTime,
        order_source: 'customer',
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Checkout & Payment - Table #${tableNumber}`}>
      <div>
        {/* Preferred Serving Time & Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.8rem' }}>
              ⏱️ Schedule Order:
            </label>
            <select
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="input-field"
              style={{ fontWeight: 600, fontSize: '0.85rem' }}
            >
              <option value="ASAP (~15 mins)">⚡ ASAP (~15-20m)</option>
              <option value="In 30 mins">🕒 Serve in 30m</option>
              <option value="In 45 mins">🕒 Serve in 45m</option>
              <option value="In 60 mins">🕒 Serve in 1h</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.4rem', fontSize: '0.8rem' }}>
              📱 Mobile Number <span style={{ color: 'var(--danger)', fontWeight: 800 }}>*</span> (Compulsory):
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="input-field"
                style={{ paddingLeft: '2rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </div>

        {/* Primary Payment Mode Selection (Online vs Cash) */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            Choose Payment Method:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setPaymentMode('online')}
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
                <span>Online / UPI</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>GPay, PhonePe, Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMode('cash')}
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
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pay at table or counter</span>
            </button>
          </div>
        </div>

        {/* ONLINE PAYMENT INTERACTIVE SYSTEM */}
        {paymentMode === 'online' && (
          <div className="glass-card" style={{ padding: '1rem', marginBottom: '1.25rem', borderColor: 'var(--brand-primary)' }}>
            {/* Online Options Sub-Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', overflowX: 'auto' }}>
              <button
                type="button"
                onClick={() => setOnlineOption('upi_apps')}
                className={`btn btn-sm ${onlineOption === 'upi_apps' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ gap: '0.4rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              >
                <Smartphone size={14} />
                <span>UPI Apps (GPay/PhonePe)</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlineOption('upi_qr')}
                className={`btn btn-sm ${onlineOption === 'upi_qr' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ gap: '0.4rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              >
                <QrCode size={14} />
                <span>UPI QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlineOption('upi_id')}
                className={`btn btn-sm ${onlineOption === 'upi_id' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ gap: '0.4rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              >
                <span>UPI VPA ID</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlineOption('card')}
                className={`btn btn-sm ${onlineOption === 'card' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ gap: '0.4rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              >
                <CreditCard size={14} />
                <span>Card</span>
              </button>
            </div>

            {/* Sub-Option 1: UPI DIRECT APP DEEP-LINKS */}
            {onlineOption === 'upi_apps' && (
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Tap your preferred app to pay <strong style={{ color: 'var(--brand-primary)' }}>{formatCurrency(grandTotal)}</strong> to <code>{merchantUpiId}</code>:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Table%20${tableNumber}`}
                    className="btn btn-secondary"
                    style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none', fontWeight: 700, padding: '0.65rem' }}
                  >
                    <span>🌐 Google Pay</span>
                  </a>
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Table%20${tableNumber}`}
                    className="btn btn-secondary"
                    style={{ background: '#f3e8ff', color: '#6b21a8', borderColor: '#e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none', fontWeight: 700, padding: '0.65rem' }}
                  >
                    <span>🟣 PhonePe</span>
                  </a>
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Table%20${tableNumber}`}
                    className="btn btn-secondary"
                    style={{ background: '#e0e7ff', color: '#3730a3', borderColor: '#c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none', fontWeight: 700, padding: '0.65rem' }}
                  >
                    <span>🔷 Paytm</span>
                  </a>
                  <a
                    href={`upi://pay?pa=${encodeURIComponent(merchantUpiId)}&pn=${encodeURIComponent(merchantName)}&am=${grandTotal.toFixed(2)}&cu=INR&tn=Table%20${tableNumber}`}
                    className="btn btn-secondary"
                    style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none', fontWeight: 700, padding: '0.65rem' }}
                  >
                    <span>🇮🇳 BHIM / Any UPI</span>
                  </a>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                    12-Digit UTR / Ref No (Optional for instant verification):
                  </label>
                  <input
                    type="text"
                    value={upiIdInput}
                    onChange={(e) => setUpiIdInput(e.target.value)}
                    placeholder="e.g. 423456789012"
                    className="input-field"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}

            {/* Sub-Option 2: UPI QR CODE */}
            {onlineOption === 'upi_qr' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-block', background: '#fff', padding: '0.5rem', borderRadius: '12px', boxShadow: 'var(--shadow-md)', marginBottom: '0.75rem' }}>
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="UPI Payment QR Code" style={{ width: '150px', height: '150px', display: 'block' }} />
                  ) : (
                    <div style={{ width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      Generating QR...
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                  Scan with GPay, PhonePe, Paytm, BHIM
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Amount to Pay: <strong style={{ color: 'var(--brand-primary)' }}>{formatCurrency(grandTotal)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: '#e0f2fe', color: '#0284c7' }}>Google Pay</span>
                  <span className="badge" style={{ background: '#f3e8ff', color: '#7e22ce' }}>PhonePe</span>
                  <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>Paytm</span>
                  <span className="badge" style={{ background: '#fef3c7', color: '#b45309' }}>BHIM UPI</span>
                </div>
              </div>
            )}

            {/* Sub-Option 3: UPI ID INPUT */}
            {onlineOption === 'upi_id' && (
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  Enter Merchant UPI VPA:
                </label>
                <input
                  type="text"
                  value={merchantUpiId}
                  readOnly
                  className="input-field"
                  style={{ marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 700 }}
                />
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  Your 12-Digit UTR / Transaction Reference No:
                </label>
                <input
                  type="text"
                  value={upiIdInput}
                  onChange={(e) => setUpiIdInput(e.target.value)}
                  placeholder="e.g. 423456789012"
                  className="input-field"
                  style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Pay via your UPI app using ID above, then enter the 12-digit UTR number for admin verification.
                </p>
              </div>
            )}

            {/* Sub-Option 4: CARDS */}
            {onlineOption === 'card' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <input type="text" placeholder="Card Number (4532 •••• •••• 8901)" className="input-field" style={{ fontSize: '0.85rem' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
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
              Your order will be sent to the kitchen immediately. You can pay cash to the server when food is served or at the main counter bill desk.
            </p>
          </div>
        )}

        {/* Error Feedback Alert */}
        {errorMessage && (
          <div style={{ padding: '0.6rem 0.8rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
              <span>{paymentStatus === 'verifying' ? 'Verifying Payment...' : 'Processing Order...'}</span>
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
