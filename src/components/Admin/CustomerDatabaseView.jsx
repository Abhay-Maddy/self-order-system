import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/formatters';
import { Users, Phone, Calendar, DollarSign } from 'lucide-react';

export const CustomerDatabaseView = () => {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchAPI('/orders/customers')
      .then(data => setCustomers(data || []))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem' }}>Customer Database & Repeat Visit Tracking</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Track diner visit frequency, phone numbers, and lifetime spend history (`A9`).
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.75rem' }}>Customer Phone</th>
              <th style={{ padding: '0.75rem' }}>Total Visits / Orders</th>
              <th style={{ padding: '0.75rem' }}>Lifetime Spend</th>
              <th style={{ padding: '0.75rem' }}>Last Visit Date</th>
              <th style={{ padding: '0.75rem' }}>Diner Status</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                  <Phone size={14} inline style={{ marginRight: '0.4rem' }} />
                  {c.customer_phone}
                </td>
                <td style={{ padding: '0.75rem', fontWeight: 800 }}>{c.total_orders} visits</td>
                <td style={{ padding: '0.75rem', fontWeight: 800, color: 'var(--success)' }}>
                  {formatCurrency(c.total_spent)}
                </td>
                <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(c.last_visit).toLocaleDateString()}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {c.total_orders > 1 ? (
                    <span className="badge badge-veg">Repeat VIP Diner</span>
                  ) : (
                    <span className="badge badge-dinein">New Guest</span>
                  )}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No customer records captured yet. Phone numbers entered during checkout will appear here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
