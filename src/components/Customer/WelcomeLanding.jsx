import React from 'react';
import { Utensils, QrCode, Sparkles, ChefHat, Shield, ArrowRight, Heart } from 'lucide-react';

export const WelcomeLanding = ({ onStartOrdering }) => {
  return (
    <div className="animate-slide-up" style={{ paddingBottom: '3rem' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-surface-elevated))',
        borderBottom: '1px solid var(--border-color)',
        padding: '3rem 1rem 4rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow ambient background circles */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          height: '300px',
          background: 'rgba(249, 115, 22, 0.12)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }} />

        <div className="container" style={{ maxWidth: '800px', position: 'relative', zIndex: 2 }}>
          <div className="badge badge-dinein" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', borderRadius: '9999px', marginBottom: '1.25rem' }}>
            <Sparkles size={14} className="animate-spin" />
            <span>Next-Gen Dine-In QR Ordering</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', lineHeight: '1.15', marginBottom: '1rem', fontWeight: 800 }}>
            Delicious Flavors, <br />
            <span style={{ background: 'linear-gradient(135deg, var(--brand-primary), #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Instant QR Self-Ordering
            </span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Browse our full digital culinary catalog, customize your dishes with extra toppings, and place real-time kitchen orders directly from your phone.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onStartOrdering} className="btn btn-primary btn-lg" style={{ gap: '0.6rem', boxShadow: '0 8px 25px rgba(249, 115, 22, 0.4)' }}>
              <Utensils size={20} />
              <span>Explore Digital Menu</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="container" style={{ padding: '3rem 1rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ background: 'var(--brand-primary)', color: '#fff', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <QrCode size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>No App Install</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Scan table QR code to automatically start your session without app downloads or sign-ups.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ background: 'var(--success)', color: '#fff', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <ChefHat size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Live Kitchen Sync</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Orders drop straight into the chef's real-time queue with status updates per dish.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ background: 'var(--info)', color: '#fff', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Shield size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Flexible Payments</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Pay via UPI, Cards, NetBanking online or select Cash payment at your table.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
