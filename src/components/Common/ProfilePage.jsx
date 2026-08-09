import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../utils/api';
import { User, Mail, Lock, Key, CheckCircle, ArrowLeft } from 'lucide-react';

export const ProfilePage = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    personal_email: '',
    username: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        personal_email: user.personal_email || '',
        username: user.username || '',
        password: ''
      });
    } else {
      // Not logged in → redirect to home
      navigate('/', { replace: true });
    }
  }, [user]);

  if (!user) return null;

  const getRoleBadgeStyle = (role) => {
    const styles = {
      admin:   { bg: 'rgba(249,115,22,0.15)', color: 'var(--brand-primary)', border: 'rgba(249,115,22,0.3)' },
      chef:    { bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
      waiter:  { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.3)' },
      cashier: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
    };
    return styles[role] || styles.admin;
  };

  const roleLabel = {
    admin: '📊 Admin', chef: '👨‍🍳 Chef', waiter: '🤵 Waiter', cashier: '💳 Cashier'
  };

  const badgeStyle = getRoleBadgeStyle(user.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetchAPI('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (res.user && res.token) {
        login({ user: res.user, token: res.token });
      }

      setSuccessMsg(res.message || 'Profile updated successfully!');
      setFormData(f => ({ ...f, password: '' }));
      setTimeout(() => {
        navigate(-1); // go back to where they came from
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem 2rem', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary btn-sm"
            style={{ borderRadius: '50%', padding: '0.4rem', flexShrink: 0 }}
            title="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1.2 }}>My Profile &amp; Settings</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Update your credentials and contact details</p>
          </div>
        </div>

        {/* User Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          background: 'var(--bg-surface-elevated)',
          padding: '0.9rem 1rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--brand-primary), #ea580c)',
            color: '#fff',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: '1.1rem',
            flexShrink: 0
          }}>
            {(user.name || user.username).charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>{user.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>@{user.username}</span>
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.55rem',
                borderRadius: '20px',
                background: badgeStyle.bg,
                color: badgeStyle.color,
                border: `1px solid ${badgeStyle.border}`,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {roleLabel[user.role] || user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div style={{ color: 'var(--danger)', padding: '0.65rem 0.9rem', background: 'var(--danger-bg)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ color: 'var(--success)', padding: '0.65rem 0.9rem', background: 'var(--success-bg)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
              />
            </div>
          </div>

          {/* Company Email */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Work / Company Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="work@aamantran.com"
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
              />
            </div>
          </div>

          {/* Personal Email */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Personal Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={formData.personal_email}
                onChange={e => setFormData({ ...formData, personal_email: e.target.value })}
                placeholder="personal@email.com"
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Username (Sign-in ID)</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })}
                placeholder="Username"
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>New Password <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(leave blank to keep current)</span></label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave blank to keep current password"
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg"
              style={{ flex: 1, gap: '0.45rem', fontWeight: 800 }}
            >
              <CheckCircle size={18} />
              <span>{isSubmitting ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary btn-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
