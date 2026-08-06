import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../utils/api';
import QRCode from 'qrcode';
import { QrCode, Plus, Download, Printer, Trash2 } from 'lucide-react';

export const TableQRManager = () => {
  const [tables, setTables] = useState([]);
  const [qrDataUrls, setQrDataUrls] = useState({});
  const [tableNumberInput, setTableNumberInput] = useState('');
  const [capacityInput, setCapacityInput] = useState(4);
  const [zoneInput, setZoneInput] = useState('Main Dining');

  const loadTables = () => {
    fetchAPI('/tables')
      .then(async (data) => {
        setTables(data || []);
        // Generate QR Code Data URLs for each table
        const qrMap = {};
        for (const tb of data) {
          const tableUrl = `${window.location.origin}/?table=${tb.table_number}`;
          try {
            const url = await QRCode.toDataURL(tableUrl, { width: 300, margin: 2 });
            qrMap[tb.table_number] = url;
          } catch (err) {
            console.error('QR generation failed:', err);
          }
        }
        setQrDataUrls(qrMap);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadTables();
  }, []);

  const [statusMsg, setStatusMsg] = useState('');

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!tableNumberInput.trim()) return;

    try {
      await fetchAPI('/tables', {
        method: 'POST',
        body: JSON.stringify({
          table_number: tableNumberInput.toUpperCase(),
          capacity: capacityInput,
          location_zone: zoneInput
        })
      });
      setTableNumberInput('');
      setStatusMsg(`✓ Table #${tableNumberInput.toUpperCase()} QR code created successfully!`);
      loadTables();
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      setStatusMsg(`⚠️ Error: ${err.message}`);
    }
  };

  const handleDeleteTable = async (id, tableNum) => {
    try {
      await fetchAPI(`/tables/${id}`, { method: 'DELETE' });
      setStatusMsg(`✓ Table #${tableNum} deleted successfully.`);
      loadTables();
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      setStatusMsg(`⚠️ Error: ${err.message}`);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem' }}>Table & Scannable QR Code Generator</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Each table receives a unique QR code that pre-binds customer sessions without app installs or logins (`C1`, `A4`).
        </span>
      </div>

      {statusMsg && (
        <div style={{
          padding: '0.65rem 1rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '1rem',
          background: statusMsg.startsWith('✓') ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: statusMsg.startsWith('✓') ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${statusMsg.startsWith('✓') ? 'var(--success)' : 'var(--danger)'}`
        }}>
          {statusMsg}
        </div>
      )}

      {/* Add Table Form */}
      <form onSubmit={handleAddTable} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem', background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: 'var(--border-radius-sm)' }}>
        <input
          type="text"
          value={tableNumberInput}
          onChange={e => setTableNumberInput(e.target.value)}
          placeholder="Table # (e.g. T-06)"
          className="input-field"
          style={{ width: '160px' }}
          required
        />
        <input
          type="number"
          value={capacityInput}
          onChange={e => setCapacityInput(Number(e.target.value))}
          placeholder="Capacity"
          className="input-field"
          style={{ width: '120px' }}
        />
        <input
          type="text"
          value={zoneInput}
          onChange={e => setZoneInput(e.target.value)}
          placeholder="Zone (e.g. Patio, VIP)"
          className="input-field"
          style={{ width: '180px' }}
        />
        <button type="submit" className="btn btn-primary" style={{ gap: '0.4rem' }}>
          <Plus size={18} />
          <span>Add Table</span>
        </button>
      </form>

      {/* Table Cards Grid with Downloadable QR Codes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {tables.map(tb => (
          <div key={tb.id} className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--brand-primary)', marginBottom: '0.2rem' }}>
              TABLE #{tb.table_number}
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              {tb.location_zone} • Cap: {tb.capacity} persons
            </div>

            {/* QR Code Image */}
            {qrDataUrls[tb.table_number] ? (
              <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '8px', display: 'inline-block', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                <img src={qrDataUrls[tb.table_number]} alt={`QR ${tb.table_number}`} style={{ width: '160px', height: '160px', display: 'block' }} />
              </div>
            ) : (
              <div>Generating QR...</div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <a
                href={qrDataUrls[tb.table_number]}
                download={`QR_Table_${tb.table_number}.png`}
                className="btn btn-secondary btn-sm"
                title="Download QR Card"
              >
                <Download size={14} />
              </a>
              <button
                onClick={() => handleDeleteTable(tb.id, tb.table_number)}
                className="btn btn-danger btn-sm"
                title="Delete Table"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
