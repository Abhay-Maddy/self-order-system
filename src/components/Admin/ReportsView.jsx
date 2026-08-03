import React from 'react';
import { fetchAPI } from '../../utils/api';
import { FileText, Download } from 'lucide-react';

export const ReportsView = () => {
  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('staff_token');
      const res = await fetch('/api/reports/export', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aamantran_sales_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Export failed.');
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem' }}>Operational Reports & Data Exports</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Download item sales performance, revenue logs, and tax data in CSV format (`A11`).
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', background: 'var(--bg-surface-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <FileText size={20} className="text-brand" />
            <h3 style={{ fontSize: '1.05rem' }}>Sales & Order Log Report</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Exports full raw log of orders, table numbers, payment modes, GST taxes, and net totals.
          </p>
          <button onClick={handleExportCSV} className="btn btn-primary" style={{ gap: '0.4rem', width: '100%' }}>
            <Download size={18} />
            <span>Download Sales CSV Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
