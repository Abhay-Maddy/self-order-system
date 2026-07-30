import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { fetchAPI } from '../../utils/api';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { Printer, Download, Receipt } from 'lucide-react';

export const GSTInvoiceModal = ({ orderId, isOpen, onClose }) => {
  const [invoiceData, setInvoiceData] = useState(null);

  useEffect(() => {
    if (orderId && isOpen) {
      fetchAPI(`/reports/invoice/${orderId}`)
        .then(data => setInvoiceData(data))
        .catch(err => console.error(err));
    }
  }, [orderId, isOpen]);

  if (!isOpen || !invoiceData) return null;

  const { order, items, settings } = invoiceData;
  const cGst = (order.tax_amount / 2);
  const sGst = (order.tax_amount / 2);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`GST Tax Invoice - Order #${order.order_number}`} maxWidth="650px">
      <div>
        <div id="gst-invoice-print" style={{
          background: '#fff',
          color: '#000',
          padding: '1.75rem',
          borderRadius: '8px',
          border: '1px solid #ccc',
          fontSize: '0.9rem',
          marginBottom: '1rem'
        }}>
          {/* Restaurant Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#000', margin: 0 }}>{settings.name}</h2>
            <div style={{ fontSize: '0.85rem' }}>{settings.address}</div>
            <div style={{ fontSize: '0.85rem' }}>Phone: {settings.phone} • GSTIN: <b>{settings.gstin}</b></div>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: '0.4rem' }}>TAX INVOICE</div>
          </div>

          {/* Bill Meta Details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <div>
              <div>Invoice No: <b>{order.order_number}</b></div>
              <div>Table No: <b>TABLE #{order.table_number}</b></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>Date: {new Date(order.created_at).toLocaleDateString()}</div>
              <div>Time: {formatTime(order.created_at)}</div>
              <div>Payment Mode: <b>{order.payment_mode.toUpperCase()}</b></div>
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000', borderTop: '1px solid #000', textAlign: 'left' }}>
                <th style={{ padding: '0.4rem' }}>HSN</th>
                <th style={{ padding: '0.4rem' }}>Item Description</th>
                <th style={{ padding: '0.4rem' }}>Qty</th>
                <th style={{ padding: '0.4rem' }}>Rate</th>
                <th style={{ padding: '0.4rem', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.4rem' }}>2106</td>
                  <td style={{ padding: '0.4rem' }}>
                    {it.item_name} {it.variant_name ? `(${it.variant_name})` : ''}
                  </td>
                  <td style={{ padding: '0.4rem' }}>{it.quantity}</td>
                  <td style={{ padding: '0.4rem' }}>₹{it.unit_price.toFixed(2)}</td>
                  <td style={{ padding: '0.4rem', textAlign: 'right' }}>₹{it.total_price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tax Breakdown (CGST 2.5% + SGST 2.5%) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: '1px solid #000', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>₹{order.total_amount.toFixed(2)}</span>
            </div>

            {order.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                <span>Discount:</span>
                <span>-₹{order.discount_amount.toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CGST @ 2.5%:</span>
              <span>₹{cGst.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SGST @ 2.5%:</span>
              <span>₹{sGst.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', borderTop: '2px solid #000', paddingTop: '0.4rem', marginTop: '0.3rem' }}>
              <span>Grand Total:</span>
              <span>₹{order.net_amount.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.75rem', color: '#666' }}>
            Thank you for dining with us! This is a computer generated GST Tax Invoice.
          </div>
        </div>

        <button onClick={handlePrint} className="btn btn-primary btn-lg" style={{ width: '100%', gap: '0.5rem' }}>
          <Printer size={20} />
          <span>Print GST Tax Invoice</span>
        </button>
      </div>
    </Modal>
  );
};
