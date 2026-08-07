import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/formatters';
import { Users, Phone, Calendar, IndianRupee, ArrowUpDown, Filter, Edit, Check, Search } from 'lucide-react';

export const CustomerDatabaseView = () => {
  const [customers, setCustomers] = useState([]);
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'spend', 'visits'
  const [filterDate, setFilterDate] = useState('');
  const [editingPhone, setEditingPhone] = useState(null);
  const [customDateValue, setCustomDateValue] = useState('');

  const loadCustomers = () => {
    fetchAPI('/orders/customers')
      .then(data => setCustomers(data || []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSaveCustomDate = (phone) => {
    if (!customDateValue) {
      setEditingPhone(null);
      return;
    }
    // Update local state customer record's last_visit
    setCustomers(prev => prev.map(c => {
      if (c.customer_phone === phone) {
        return { ...c, last_visit: customDateValue };
      }
      return c;
    }));
    setEditingPhone(null);
    setCustomDateValue('');
  };

  const [searchPhone, setSearchPhone] = useState('');

  // Filter & Sort customers
  const filteredCustomers = customers.filter(c => {
    if (searchPhone.trim()) {
      const q = searchPhone.trim().toLowerCase();
      const phoneMatch = c.customer_phone && c.customer_phone.toLowerCase().includes(q);
      const nameMatch = c.name && c.name.toLowerCase().includes(q);
      if (!phoneMatch && !nameMatch) return false;
    }
    if (!filterDate) return true;
    const cDate = new Date(c.last_visit).toISOString().slice(0, 10);
    return cDate === filterDate;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.last_visit).getTime() - new Date(a.last_visit).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.last_visit).getTime() - new Date(b.last_visit).getTime();
    } else if (sortBy === 'spend') {
      return (b.total_spent || 0) - (a.total_spent || 0);
    } else if (sortBy === 'visits') {
      return (b.total_orders || 0) - (a.total_orders || 0);
    }
    return 0;
  });

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users style={{ color: 'var(--brand-primary)' }} />
            Customer Database & Repeat Visit Tracking
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Track diner visit frequency, phone numbers, lifetime spend, and sort/filter by visit dates.
          </span>
        </div>

        {/* Filters & Sorting Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Left Side Phone Search Input */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="Search phone number..."
              className="input-field"
              style={{ paddingLeft: '2.2rem', paddingRight: '0.5rem', height: '36px', fontSize: '0.82rem' }}
            />
          </div>
          {/* Date Filter Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} style={{ color: 'var(--brand-primary)' }} />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="input-field"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem' }}
              title="Filter customers who visited on this date"
            />
            {filterDate && (
              <button onClick={() => setFilterDate('')} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}>
                Clear Date
              </button>
            )}
          </div>

          {/* Sort By Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowUpDown size={16} style={{ color: 'var(--brand-primary)' }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', fontWeight: 600 }}
            >
              <option value="newest">🗓️ Newest Visit Date (Recent Diners)</option>
              <option value="oldest">⏳ Oldest Visit Date (First Diners)</option>
              <option value="spend">💰 Highest Lifetime Spend</option>
              <option value="visits">⭐ Most Visits / Frequency</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.75rem' }}>Customer Phone</th>
              <th style={{ padding: '0.75rem' }}>Total Visits / Orders</th>
              <th style={{ padding: '0.75rem' }}>Lifetime Spend</th>
              <th style={{ padding: '0.75rem' }}>Last Visit Date (Editable)</th>
              <th style={{ padding: '0.75rem' }}>Diner Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedCustomers.map((c, idx) => (
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
                  {editingPhone === c.customer_phone ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <input
                        type="date"
                        value={customDateValue || new Date(c.last_visit).toISOString().slice(0, 10)}
                        onChange={(e) => setCustomDateValue(e.target.value)}
                        className="input-field"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem' }}
                      />
                      <button onClick={() => handleSaveCustomDate(c.customer_phone)} className="btn btn-success btn-sm" style={{ padding: '0.25rem 0.4rem' }}>
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{new Date(c.last_visit).toLocaleDateString()}</span>
                      <button
                        onClick={() => {
                          setEditingPhone(c.customer_phone);
                          setCustomDateValue(new Date(c.last_visit).toISOString().slice(0, 10));
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                        title="Edit Last Visit Date"
                      >
                        <Edit size={12} /> Edit Date
                      </button>
                    </div>
                  )}
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
            {sortedCustomers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  {filterDate ? `No customer visits found on date: ${filterDate}` : 'No customer records captured yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
