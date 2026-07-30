import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../utils/api';
import { Settings, Save } from 'lucide-react';

export const SettingsForm = () => {
  const [formData, setFormData] = useState({
    name: 'Amantradha Bistro',
    address: '123 Gourmet Avenue, Foodville',
    phone: '+91 9876543210',
    email: 'contact@amantradha.com',
    currency: 'INR',
    tax_rate: 5,
    google_maps_review_url: 'https://maps.google.com/?q=Amantradha+Bistro'
  });
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    fetchAPI('/settings')
      .then(data => {
        if (data) setFormData(data);
      })
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavedMessage('');
    try {
      await fetchAPI('/settings', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      setSavedMessage('Settings updated successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', maxWidth: '650px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem' }}>Restaurant & System Settings</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Configure branding, GST number, tax rates, operating parameters (`A12`).
        </span>
      </div>

      {savedMessage && (
        <div style={{ padding: '0.75rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {savedMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Restaurant Name</label>
          <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="input-field" />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Address</label>
          <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required className="input-field" rows={2} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>GSTIN Number</label>
            <input type="text" value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value })} required className="input-field" />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Tax Rate (%)</label>
            <input type="number" step="0.1" value={formData.tax_rate} onChange={e => setFormData({ ...formData, tax_rate: Number(e.target.value) })} required className="input-field" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Phone Number</label>
            <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required className="input-field" />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Currency Symbol</label>
            <input type="text" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} required className="input-field" />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Google Maps Review Profile URL</label>
          <input type="text" value={formData.google_maps_review_url} onChange={e => setFormData({ ...formData, google_maps_review_url: e.target.value })} required className="input-field" />
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', gap: '0.5rem', marginTop: '0.5rem' }}>
          <Save size={18} />
          <span>Save Settings</span>
        </button>
      </form>
    </div>
  );
};
