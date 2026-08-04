import React, { useContext } from 'react';
import { LanguageContext } from '../../context/LanguageContext';

export const LangToggle = () => {
  const { lang, setLang } = useContext(LanguageContext);
  const isHindi = lang === 'hi';

  return (
    <button
      onClick={() => setLang(isHindi ? 'en' : 'hi')}
      className="btn btn-secondary btn-sm"
      title={isHindi ? 'Switch to English' : 'हिन्दी में बदलें'}
      style={{
        fontSize: '0.78rem',
        gap: '0.35rem',
        fontWeight: 700,
        padding: '0.4rem 0.75rem',
        borderRadius: '20px',
        border: '1.5px solid var(--brand-primary)',
        color: 'var(--brand-primary)',
        letterSpacing: '0.02em',
        transition: 'all 0.2s ease'
      }}
    >
      <span style={{ fontSize: '1rem', lineHeight: 1 }}>{isHindi ? '🇮🇳' : '🇬🇧'}</span>
      <span>{isHindi ? 'हिन्दी' : 'EN'}</span>
    </button>
  );
};
