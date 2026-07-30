import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = '550px' }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="glass-card animate-slide-up" style={{
        width: '100%',
        maxWidth,
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'var(--bg-surface)',
        padding: '1.5rem',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.25rem' }}>{title}</h3>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ borderRadius: '50%', padding: '0.3rem' }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
