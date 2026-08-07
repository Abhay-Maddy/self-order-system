import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { fetchAPI } from '../../utils/api';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { Printer, Download, Receipt } from 'lucide-react';

export const GSTInvoiceModal = ({ orderId, orders = [], isOpen, onClose }) => {
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setInvoiceData(null);
      return;
    }

    setLoading(true);

    if (orders && orders.length > 1) {
      // MULTI-ORDER CONSOLIDATED BILL
      // Fetch restaurant settings first using sample order
      fetchAPI('/reports/invoice/' + orders[0].id)
        .then(sampleData => {
          const settings = sampleData?.settings || {
            name: 'Aamantran Bistro',
            address: '123 Spice Avenue, Culinary District, Mumbai - 400001',
            phone: '+91 98765 43210',
            gstin: '27AAAAA0000A1Z5',
            tax_rate: 5.0,
            currency: '₹'
          };

          // Combine items & aggregate totals across all selected orders
          let allItems = [];
          let cumulativeTotal = 0;
          let cumulativeTax = 0;
          let cumulativeDiscount = 0;
          let cumulativeNet = 0;

          const orderNums = [];
          const tableNums = new Set();
          const paymentModes = new Set();

          orders.forEach(ord => {
            orderNums.push(`#${ord.order_number}`);
            tableNums.add(`T-${String(ord.table_number).padStart(2, '0')}`);
            if (ord.payment_mode) paymentModes.add(ord.payment_mode.toUpperCase());

            cumulativeTotal += Number(ord.total_amount) || 0;
            cumulativeTax += Number(ord.tax_amount) || 0;
            cumulativeDiscount += Number(ord.discount_amount) || 0;
            cumulativeNet += Number(ord.net_amount) || 0;

            if (Array.isArray(ord.items)) {
              ord.items.forEach(it => {
                allItems.push({
                  ...it,
                  order_number: ord.order_number,
                  table_number: ord.table_number
                });
              });
            }
          });

          // Consolidate identical items (same name, variant, unit_price)
          const itemMap = new Map();
          allItems.forEach(it => {
            const key = `${it.item_name}_${it.variant_name || ''}_${it.unit_price}`;
            if (itemMap.has(key)) {
              const existing = itemMap.get(key);
              existing.quantity += it.quantity;
              existing.total_price += it.total_price;
            } else {
              itemMap.set(key, { ...it });
            }
          });

          const consolidatedOrder = {
            order_number: `CONSOLIDATED (${orders.length} ORDERS: ${orderNums.join(', ')})`,
            table_number: Array.from(tableNums).join(', '),
            created_at: orders[0].created_at || new Date().toISOString(),
            payment_mode: Array.from(paymentModes).join(' / ') || 'MULTIPLE',
            total_amount: cumulativeTotal,
            tax_amount: cumulativeTax,
            discount_amount: cumulativeDiscount,
            net_amount: cumulativeNet,
            isConsolidated: true,
            orderCount: orders.length
          };

          setInvoiceData({
            order: consolidatedOrder,
            items: Array.from(itemMap.values()),
            settings
          });
        })
        .catch(err => console.error('Consolidated invoice load error:', err))
        .finally(() => setLoading(false));

    } else {
      // SINGLE ORDER INVOICE
      const targetId = orderId || (orders && orders.length === 1 ? orders[0].id : null);
      if (!targetId) {
        setLoading(false);
        return;
      }

      fetchAPI(`/reports/invoice/${targetId}`)
        .then(data => setInvoiceData(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [orderId, orders, isOpen]);

  if (!isOpen) return null;
  if (loading || !invoiceData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Preparing GST Tax Invoice..." maxWidth="650px">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading invoice data...
        </div>
      </Modal>
    );
  }

  const { order, items, settings } = invoiceData;
  const cGst = (order.tax_amount / 2);
  const sGst = (order.tax_amount / 2);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={order.isConsolidated ? `Consolidated Bill (${order.orderCount} Orders)` : `GST Tax Invoice - Order #${order.order_number}`}
      maxWidth="650px"
    >
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
            <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: '0.4rem' }}>
              {order.isConsolidated ? 'CONSOLIDATED TAX INVOICE' : 'TAX INVOICE'}
            </div>
          </div>

          {/* Bill Meta Details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <div style={{ maxWidth: '60%' }}>
              <div>Invoice No: <b>{order.order_number}</b></div>
              <div>Table No: <b>{order.table_number.includes('T-') ? order.table_number : `TABLE #${order.table_number}`}</b></div>
              {order.isConsolidated && (
                <div style={{ fontSize: '0.78rem', color: '#555', marginTop: '2px' }}>
                  * Merged Bill of {order.orderCount} Selected Orders
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>Date: {new Date(order.created_at).toLocaleDateString()}</div>
              <div>Time: {formatTime(order.created_at)}</div>
              <div>Payment Mode: <b>{(order.payment_mode || 'CASH').toUpperCase()}</b></div>
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
                  <td style={{ padding: '0.4rem' }}>₹{Number(it.unit_price || 0).toFixed(2)}</td>
                  <td style={{ padding: '0.4rem', textAlign: 'right' }}>₹{Number(it.total_price || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tax Breakdown */}
          {(() => {
            const taxRate = settings && settings.tax_rate ? settings.tax_rate : 5.0;
            const halfRate = (taxRate / 2).toFixed(1);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: '1px solid #000', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal (Total Revenue):</span>
                  <span>₹{Number(order.total_amount || 0).toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CGST @ {halfRate}%:</span>
                  <span>₹{cGst.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>SGST @ {halfRate}%:</span>
                  <span>₹{sGst.toFixed(2)}</span>
                </div>

                {order.discount_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                    <span>Discount:</span>
                    <span>-₹{Number(order.discount_amount || 0).toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', borderTop: '2px solid #000', paddingTop: '0.4rem', marginTop: '0.3rem' }}>
                  <span>Grand Total:</span>
                  <span>₹{Number(order.net_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            );
          })()}

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', fontWeight: 600, color: '#444' }}>
            Thank you for dining at Aamantran. Please visit us again ❤️
          </div>
        </div>

        {/* Top / Action Print Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button
            onClick={handlePrint}
            className="btn btn-primary"
            style={{ padding: '0.55rem 1rem', borderRadius: '8px', gap: '0.4rem', fontWeight: 800 }}
            title="Print GST Invoice"
          >
            <Printer size={18} />
            <span>{order.isConsolidated ? 'Print Consolidated Bill' : 'Print Invoice'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
