import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { GSTInvoiceModal } from './GSTInvoiceModal';
import { Receipt, Search } from 'lucide-react';

export const BillingView = () => {
  const [orders, setOrders] = useState([]);
  const [selectedInvoiceOrderId, setSelectedInvoiceOrderId] = useState(null);

  const loadOrders = () => {
    fetchAPI('/orders/active')
      .then(data => setOrders(data || []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem' }}>Front-of-House Invoices & Cashier Billing</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Generate GST Tax Invoices and process cashier settlements (`A8`).
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.75rem' }}>Order #</th>
              <th style={{ padding: '0.75rem' }}>Table</th>
              <th style={{ padding: '0.75rem' }}>Time</th>
              <th style={{ padding: '0.75rem' }}>Mode</th>
              <th style={{ padding: '0.75rem' }}>Amount</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Tax Invoice Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(ord => (
              <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{ord.order_number}</td>
                <td style={{ padding: '0.75rem', fontWeight: 700 }}>TABLE #{ord.table_number}</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(ord.created_at)}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span className="badge badge-dinein">{ord.payment_mode.toUpperCase()}</span>
                </td>
                <td style={{ padding: '0.75rem', fontWeight: 800 }}>{formatCurrency(ord.net_amount)}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  <button
                    onClick={() => setSelectedInvoiceOrderId(ord.id)}
                    className="btn btn-primary btn-sm"
                    style={{ gap: '0.3rem' }}
                  >
                    <Receipt size={14} />
                    <span>Print GST Invoice</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <GSTInvoiceModal
        orderId={selectedInvoiceOrderId}
        isOpen={Boolean(selectedInvoiceOrderId)}
        onClose={() => setSelectedInvoiceOrderId(null)}
      />
    </div>
  );
};
