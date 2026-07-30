import React, { useContext } from 'react';
import { LanguageContext } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LangToggle = () => {
  const { lang, setLang } = useContext(LanguageContext);

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
      className="btn btn-secondary btn-sm"
      style={{ fontSize: '0.8rem', gap: '0.3rem' }}
    >
      <Globe size={14} />
      <span>{lang === 'en' ? 'EN' : 'हिन्दी'}</span>
    </button>
  );
};
