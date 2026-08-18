import React, { createContext, useState, useEffect, useContext } from 'react';
import { fetchAPI } from '../utils/api';
import { SocketContext } from './SocketContext';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const { socket } = useContext(SocketContext) || {};
  const [settings, setSettings] = useState({
    name: 'Aamantran Bistro',
    address: '123 Gourmet Avenue, Foodville',
    phone: '+91 9876543210',
    email: 'contact@aamantran.com',
    gstin: '27AAAAA0000A1Z5',
    currency: '₹',
    tax_rate: 5,
    google_maps_review_url: 'https://maps.google.com/?q=Aamantran+Bistro'
  });

  const loadSettings = () => {
    fetchAPI('/settings')
      .then(data => {
        if (data) setSettings(prev => ({ ...prev, ...data }));
      })
      .catch(err => console.error('Failed to load settings:', err));
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleSettingsUpdated = (updated) => {
      if (updated) setSettings(prev => ({ ...prev, ...updated }));
    };
    socket.on('settings_updated', handleSettingsUpdated);
    return () => socket.off('settings_updated', handleSettingsUpdated);
  }, [socket]);

  const updateSettings = async (newSettings) => {
    const updated = await fetchAPI('/settings', {
      method: 'PUT',
      body: JSON.stringify(newSettings)
    });
    setSettings(prev => ({ ...prev, ...newSettings }));
    return updated;
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings, updateSettings, refreshSettings: loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
