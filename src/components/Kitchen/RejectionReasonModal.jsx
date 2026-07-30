import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { AlertTriangle, XCircle } from 'lucide-react';

export const RejectionReasonModal = ({ item, isOpen, onClose, onConfirmReject }) => {
  const [presetReason, setPresetReason] = useState('Out of Ingredients');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen || !item) return null;

  const presets = [
    'Out of Ingredients',
    'Kitchen Equipment Error',
    'Special Customization Not Possible',
    'Chef Unavailable'
  ];

  const handleRejectSubmit = () => {
    const finalReason = presetReason === 'Custom' ? customReason : presetReason;
    onConfirmReject(item.id, finalReason);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Reject Item: ${item.item_name}`}>
      <div>
        <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: 'var(--border-radius-sm)', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          <span>Rejecting this item will notify the customer and auto-replenish stock.</span>
        </div>

        <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          Select Rejection Reason (Required):
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {presets.map(reason => (
            <label
              key={reason}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 0.8rem',
                background: presetReason === reason ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                border: `1px solid ${presetReason === reason ? 'var(--danger)' : 'var(--border-color)'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              <input
                type="radio"
                name="rejectionReason"
                checked={presetReason === reason}
                onChange={() => setPresetReason(reason)}
              />
              <span>{reason}</span>
            </label>
          ))}

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 0.8rem',
              background: presetReason === 'Custom' ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
              border: `1px solid ${presetReason === 'Custom' ? 'var(--danger)' : 'var(--border-color)'}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <input
              type="radio"
              name="rejectionReason"
              checked={presetReason === 'Custom'}
              onChange={() => setPresetReason('Custom')}
            />
            <span>Custom Reason...</span>
          </label>
        </div>

        {presetReason === 'Custom' && (
          <textarea
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Specify reason for customer..."
            className="input-field"
            rows={2}
            style={{ marginBottom: '1.25rem' }}
          />
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
            Cancel
          </button>
          <button onClick={handleRejectSubmit} className="btn btn-danger" style={{ flex: 1, gap: '0.4rem' }}>
            <XCircle size={18} />
            <span>Confirm Rejection</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
