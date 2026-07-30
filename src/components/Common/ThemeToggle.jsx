import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-secondary btn-sm"
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
      style={{ padding: '0.4rem 0.6rem', borderRadius: '50%' }}
    >
      {theme === 'dark' ? <Sun size={18} className="text-warning" /> : <Moon size={18} />}
    </button>
  );
};
