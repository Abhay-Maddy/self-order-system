import React from 'react';
import { Utensils, ChefHat, LayoutDashboard, Sparkles } from 'lucide-react';

export const PageSkeleton = ({ title = 'Loading GourmetBites...', icon: Icon = Utensils }) => {
  return (
    <div className="container animate-slide-up" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
      <div className="glass-card" style={{ padding: '3rem 2rem', maxWidth: '520px', margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--brand-primary), #f59e0b)',
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          color: '#fff',
          boxShadow: '0 8px 25px rgba(249, 115, 22, 0.4)',
          animation: 'pulseGlow 2s infinite'
        }}>
          <Icon size={32} />
        </div>

        <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <span>{title}</span>
          <Sparkles size={18} className="text-brand animate-spin" />
        </h3>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Synchronizing live catalog, orders & kitchen pipeline...
        </p>

        {/* Skeleton lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '320px', margin: '0 auto' }}>
          <div style={{ height: '14px', background: 'var(--bg-surface-elevated)', borderRadius: '6px', width: '100%', animation: 'pulse 1.5s infinite' }}></div>
          <div style={{ height: '14px', background: 'var(--bg-surface-elevated)', borderRadius: '6px', width: '75%', margin: '0 auto', animation: 'pulse 1.5s infinite' }}></div>
        </div>
      </div>
    </div>
  );
};
