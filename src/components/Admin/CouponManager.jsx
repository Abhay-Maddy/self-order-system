import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/formatters';
import { Tag, Plus, Trash2 } from 'lucide-react';

export const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrder, setMinOrder] = useState(200);

  const loadCoupons = () => {
    fetchAPI('/coupons')
      .then(data => setCoupons(data || []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      await fetchAPI('/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code,
          discount_type: discountType,
          discount_value: discountValue,
          min_order_amount: minOrder
        })
      });
      setCode('');
      loadCoupons();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (window.confirm('Delete coupon code?')) {
      await fetchAPI(`/coupons/${id}`, { method: 'DELETE' });
      loadCoupons();
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem' }}>Discounts & Promotional Coupons</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Create percentage or flat fixed discount vouchers for customers (`C6`, `A6`).
        </span>
      </div>

      <form onSubmit={handleCreateCoupon} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem', background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="Code (e.g. FESTIVE20)"
          className="input-field"
          style={{ width: '180px' }}
          required
        />

        <select
          value={discountType}
          onChange={e => setDiscountType(e.target.value)}
          className="input-field"
          style={{ width: '150px' }}
        >
          <option value="percentage">Percentage (%)</option>
          <option value="fixed">Fixed Amount (₹)</option>
        </select>

        <input
          type="number"
          value={discountValue}
          onChange={e => setDiscountValue(Number(e.target.value))}
          placeholder="Discount Value"
          className="input-field"
          style={{ width: '130px' }}
          required
        />

        <input
          type="number"
          value={minOrder}
          onChange={e => setMinOrder(Number(e.target.value))}
          placeholder="Min Order Amount"
          className="input-field"
          style={{ width: '150px' }}
        />

        <button type="submit" className="btn btn-primary" style={{ gap: '0.4rem' }}>
          <Plus size={18} />
          <span>Create Coupon</span>
        </button>
      </form>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.75rem' }}>Coupon Code</th>
              <th style={{ padding: '0.75rem' }}>Discount Type</th>
              <th style={{ padding: '0.75rem' }}>Discount Value</th>
              <th style={{ padding: '0.75rem' }}>Min Order</th>
              <th style={{ padding: '0.75rem' }}>Times Used</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                  <Tag size={14} inline style={{ marginRight: '0.3rem' }} />
                  {c.code}
                </td>
                <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{c.discount_type}</td>
                <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                  {c.discount_type === 'percentage' ? `${c.discount_value}%` : formatCurrency(c.discount_value)}
                </td>
                <td style={{ padding: '0.75rem' }}>{formatCurrency(c.min_order_amount)}</td>
                <td style={{ padding: '0.75rem' }}>{c.times_used} / {c.usage_limit}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  <button onClick={() => handleDeleteCoupon(c.id)} className="btn btn-danger btn-sm">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
