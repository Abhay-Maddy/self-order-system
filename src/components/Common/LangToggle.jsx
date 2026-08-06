import React, { useContext } from 'react';
import { LanguageContext } from '../../context/LanguageContext';

export const LangToggle = () => {
  const { lang, setLang } = useContext(LanguageContext);
  const isHindi = lang === 'hi';

  return (
    <button
      onClick={() => setLang(isHindi ? 'en' : 'hi')}
      className="btn btn-secondary btn-sm"
      title={isHindi ? 'Switch to English' : 'हिन्दी में बदलें (Translate to Hindi)'}
      style={{
        fontSize: '0.8rem',
        gap: '0.4rem',
        fontWeight: 800,
        padding: '0.4rem 0.85rem',
        borderRadius: '20px',
        border: '1.5px solid var(--brand-primary)',
        background: isHindi ? 'rgba(249, 115, 22, 0.15)' : 'var(--bg-surface-elevated)',
        color: 'var(--brand-primary)',
        letterSpacing: '0.02em',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
    >
      <span>{isHindi ? '🇮🇳 हिन्दी (HI)' : '🇬🇧 EN / हिन्दी'}</span>
    </button>
  );
};
