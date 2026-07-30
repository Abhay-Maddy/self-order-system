import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/formatters';
import { DollarSign, ShoppingBag, Clock, Flame, Star } from 'lucide-react';

export const DashboardOverview = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchAPI('/reports/analytics')
      .then(data => setStats(data))
      .catch(err => console.error('Analytics load error:', err));
  }, []);

  if (!stats) return <div>Loading dashboard analytics...</div>;

  return (
    <div>
      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Today Revenue</span>
            <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '0.4rem', borderRadius: '8px' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--brand-primary)' }}>{formatCurrency(stats.todayRevenue)}</h2>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Orders</span>
            <div style={{ background: 'var(--info-bg)', color: 'var(--info)', padding: '0.4rem', borderRadius: '8px' }}>
              <ShoppingBag size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.75rem' }}>{stats.totalOrders}</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats.activeOrders} Currently Active</span>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Avg Prep Time</span>
            <div style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '0.4rem', borderRadius: '8px' }}>
              <Clock size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.75rem' }}>{stats.avgPrepMinutes} mins</h2>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Top Selling Dish</span>
            <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.4rem', borderRadius: '8px' }}>
              <Flame size={20} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.1rem', marginTop: '0.2rem' }}>{stats.topDish}</h3>
        </div>
      </div>

      {/* Customer Satisfaction Card */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>Customer Satisfaction Rating</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Based on {stats.totalReviews} verified post-order diner reviews
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--warning-bg)', color: 'var(--warning)', padding: '0.6rem 1.2rem', borderRadius: '9999px', fontWeight: 800, fontSize: '1.25rem' }}>
          <Star size={24} fill="#f59e0b" />
          <span>{stats.avgRating} / 5.0</span>
        </div>
      </div>
    </div>
  );
};
