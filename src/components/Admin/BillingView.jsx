import React, { useState, useEffect, useContext } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { GSTInvoiceModal } from './GSTInvoiceModal';
import { Receipt, Search } from 'lucide-react';
import { SocketContext } from '../../context/SocketContext';

export const BillingView = () => {
  const { socket } = useContext(SocketContext);
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceOrderId, setSelectedInvoiceOrderId] = useState(null);

  const loadOrders = () => {
    fetchAPI('/orders/active')
      .then(data => setOrders(data || []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => loadOrders();
    socket.on('new_order', handleUpdate);
    socket.on('order_status_updated', handleUpdate);
    socket.on('table_order_updated', handleUpdate);
    return () => {
      socket.off('new_order', handleUpdate);
      socket.off('order_status_updated', handleUpdate);
      socket.off('table_order_updated', handleUpdate);
    };
  }, [socket]);

  const filteredOrders = orders.filter(ord => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const orderNum = (ord.order_number || '').toLowerCase();
    const tableNum = String(ord.table_number || '').toLowerCase();
    const phone = (ord.customer_phone || '').toLowerCase();
    const itemsStr = (ord.items || []).map(i => i.item_name).join(' ').toLowerCase();
    return orderNum.includes(q) || tableNum.includes(q) || phone.includes(q) || itemsStr.includes(q);
  });

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem' }}>Front-of-House Invoices &amp; Cashier Billing</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Generate GST Tax Invoices and process cashier settlements.
          </span>
        </div>

        {/* Search Bar Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-surface-elevated)', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '260px' }}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order #, Table, Items..."
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.85rem' }}
          />
        </div>
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
            {filteredOrders.map(ord => (
              <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{ord.order_number}</td>
                <td style={{ padding: '0.75rem', fontWeight: 700 }}>TABLE #{ord.table_number}</td>
                <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(ord.created_at)}</td>
                <td style={{ padding: '0.75rem' }}>
                  <span className="badge badge-dinein">{(ord.payment_mode || 'cash').toUpperCase()}</span>
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
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {searchQuery ? `No active billing orders matching "${searchQuery}"` : 'No active orders found.'}
                </td>
              </tr>
            )}
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
