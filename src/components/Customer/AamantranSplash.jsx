import React, { useEffect, useState } from 'react';
import { QrCode, Sparkles, UtensilsCrossed, ShieldCheck } from 'lucide-react';

export const AamantranSplash = ({ tableNumber, onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 400);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s ease-in-out',
        pointerEvents: fadeOut ? 'none' : 'auto',
        padding: '2rem',
        textAlign: 'center'
      }}
    >
      {/* Background Ambient Glow */}
      <div
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.25) 0%, rgba(245, 158, 11, 0) 70%)',
          filter: 'blur(40px)',
          animation: 'pulseGlow 2s infinite ease-in-out'
        }}
      />

      {/* Main Animated Icon Container */}
      <div style={{ position: 'relative', marginBottom: '2rem' }}>
        {/* Rotating Outer Gold Ring */}
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: '2px dashed #f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 30px rgba(245, 158, 11, 0.4)',
            animation: 'spinSlow 12s linear infinite'
          }}
        />

        {/* Center Branding Icon */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '85px',
              height: '85px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #f97316 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(249, 115, 22, 0.5)',
              transform: 'scale(1)',
              animation: 'popIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <UtensilsCrossed size={42} color="#ffffff" />
          </div>
        </div>

        {/* Animated Scan Beam Line Effect */}
        <div
          style={{
            position: 'absolute',
            width: '140px',
            height: '3px',
            left: '-10px',
            background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)',
            boxShadow: '0 0 12px #fbbf24',
            animation: 'scanBeam 1.8s ease-in-out infinite'
          }}
        />
      </div>

      {/* Branding Name Reveal: AAMANTRAN */}
      <h1
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '2.5rem',
          fontWeight: 800,
          letterSpacing: '0.05em',
          background: 'linear-gradient(135deg, #ffffff 0%, #fbbf24 60%, #f97316 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.4rem',
          textShadow: '0 4px 20px rgba(245, 158, 11, 0.3)'
        }}
      >
        AAMANTRAN
      </h1>

      <p style={{ fontSize: '0.95rem', color: '#cbd5e1', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        Fine Dining & Self-Ordering
      </p>

      {/* Table Welcome Chip: ONLY shown when URL contains physical QR table param */}
      {tableNumber && Boolean(new URLSearchParams(window.location.search).get('table')) && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            padding: '0.6rem 1.4rem',
            borderRadius: '9999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            color: '#fef3c7',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.6s ease-out'
          }}
        >
          <QrCode size={18} color="#f59e0b" />
          <span>Connected to Table #{tableNumber}</span>
          <ShieldCheck size={16} color="#10b981" />
        </div>
      )}

      {/* Footer loading dots */}
      <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
        <Sparkles size={14} className="animate-spin" color="#f59e0b" />
        <span>Preparing Menu...</span>
      </div>

      <style>{`
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes scanBeam {
          0% { top: 0%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};
