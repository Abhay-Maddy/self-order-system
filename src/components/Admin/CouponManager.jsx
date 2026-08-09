import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/formatters';
import { Modal } from '../Common/Modal';
import { Tag, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';

export const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [minOrder, setMinOrder] = useState(200);

  // Edit Coupon State
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [editCode, setEditCode] = useState('');
  const [editDiscountType, setEditDiscountType] = useState('percentage');
  const [editDiscountValue, setEditDiscountValue] = useState(10);
  const [editMinOrder, setEditMinOrder] = useState(0);
  const [editUsageLimit, setEditUsageLimit] = useState(100);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
    setErrorMsg('');
    setSuccessMsg('');

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
      setSuccessMsg('✓ Coupon created successfully!');
      loadCoupons();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create coupon.');
    }
  };

  const handleOpenEdit = (c) => {
    setEditingCoupon(c);
    setEditCode(c.code || '');
    setEditDiscountType(c.discount_type || 'percentage');
    setEditDiscountValue(c.discount_value || 0);
    setEditMinOrder(c.min_order_amount || 0);
    setEditUsageLimit(c.usage_limit || 100);
    setErrorMsg('');
  };

  const handleUpdateCoupon = async (e) => {
    e.preventDefault();
    if (!editCode.trim() || !editingCoupon) return;
    setErrorMsg('');

    try {
      await fetchAPI(`/coupons/${editingCoupon.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          code: editCode,
          discount_type: editDiscountType,
          discount_value: editDiscountValue,
          min_order_amount: editMinOrder,
          usage_limit: editUsageLimit
        })
      });
      setSuccessMsg(`✓ Coupon '${editCode}' updated successfully!`);
      setEditingCoupon(null);
      loadCoupons();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update coupon.');
    }
  };

  const handleDeleteCoupon = async (id, codeName) => {
    if (window.confirm(`Delete coupon code '${codeName}'?`)) {
      try {
        await fetchAPI(`/coupons/${id}`, { method: 'DELETE' });
        setSuccessMsg(`✓ Coupon '${codeName}' deleted.`);
        loadCoupons();
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        setErrorMsg(err.message || 'Failed to delete coupon.');
      }
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Tag style={{ color: 'var(--brand-primary)' }} />
          Discounts &amp; Promotional Coupons
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Create and manage percentage or flat fixed discount vouchers for customers
        </span>
      </div>

      {errorMsg && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '0.5rem 0.8rem', background: 'var(--danger-bg)', borderRadius: '6px', fontSize: '0.85rem' }}>{errorMsg}</div>}
      {successMsg && <div style={{ color: 'var(--success)', marginBottom: '1rem', padding: '0.5rem 0.8rem', background: 'var(--success-bg)', borderRadius: '6px', fontSize: '0.85rem' }}>{successMsg}</div>}

      {/* Create Coupon Form */}
      <form onSubmit={handleCreateCoupon} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem', background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', alignItems: 'center' }}>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="Code (e.g. FESTIVE20)"
          className="input-field"
          style={{ width: '180px', fontWeight: 700 }}
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

        <button type="submit" className="btn btn-primary" style={{ gap: '0.4rem', fontWeight: 700 }}>
          <Plus size={18} />
          <span>Create Coupon</span>
        </button>
      </form>

      {/* Edit Coupon Modal */}
      {editingCoupon && (
        <Modal isOpen={Boolean(editingCoupon)} onClose={() => setEditingCoupon(null)} title={`Edit Coupon: ${editingCoupon.code}`}>
          <form onSubmit={handleUpdateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Coupon Code:</label>
              <input
                type="text"
                required
                value={editCode}
                onChange={e => setEditCode(e.target.value.toUpperCase())}
                className="input-field"
                style={{ fontWeight: 800 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Discount Type:</label>
                <select
                  value={editDiscountType}
                  onChange={e => setEditDiscountType(e.target.value)}
                  className="input-field"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Discount Value:</label>
                <input
                  type="number"
                  required
                  value={editDiscountValue}
                  onChange={e => setEditDiscountValue(Number(e.target.value))}
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Minimum Order Amount (₹):</label>
                <input
                  type="number"
                  value={editMinOrder}
                  onChange={e => setEditMinOrder(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Usage Limit:</label>
                <input
                  type="number"
                  value={editUsageLimit}
                  onChange={e => setEditUsageLimit(Number(e.target.value))}
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1, gap: '0.4rem', fontWeight: 800 }}>
                <CheckCircle size={18} /> Save Coupon Changes
              </button>
              <button type="button" onClick={() => setEditingCoupon(null)} className="btn btn-secondary btn-lg">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Coupons Table */}
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
                  <Tag size={14} style={{ marginRight: '0.3rem', display: 'inline' }} />
                  {c.code}
                </td>
                <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{c.discount_type}</td>
                <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                  {c.discount_type === 'percentage' ? `${c.discount_value}%` : formatCurrency(c.discount_value)}
                </td>
                <td style={{ padding: '0.75rem' }}>{formatCurrency(c.min_order_amount)}</td>
                <td style={{ padding: '0.75rem' }}>{c.times_used} / {c.usage_limit}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => handleOpenEdit(c)} className="btn btn-secondary btn-sm" title="Edit Coupon Code & Details" style={{ padding: '0.3rem 0.5rem' }}>
                      <Edit size={14} /> Edit
                    </button>
                    <button onClick={() => handleDeleteCoupon(c.id, c.code)} className="btn btn-danger btn-sm" title="Delete Coupon" style={{ padding: '0.3rem 0.5rem' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
