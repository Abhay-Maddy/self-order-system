import React, { useState, useEffect, useContext } from 'react';
import { Modal } from './Modal';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../utils/api';
import { User, Mail, Lock, Key, CheckCircle, Shield } from 'lucide-react';

export const UserProfileModal = ({ isOpen, onClose }) => {
  const { user, login } = useContext(AuthContext);

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
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

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
      setTimeout(() => {
        onClose();
        setSuccessMsg('');
      }, 800);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Profile & Account Settings">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-surface-elevated)', padding: '0.8rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
          <div style={{ background: 'var(--brand-primary)', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
            {(user.name || user.username).charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{user.name} ({user.role ? user.role.toUpperCase() : 'STAFF'})</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}><strong>{user.username}</strong></span>
          </div>
        </div>

        {errorMsg && <div style={{ color: 'var(--danger)', padding: '0.6rem 0.8rem', background: 'var(--danger-bg)', borderRadius: '6px', fontSize: '0.85rem' }}>{errorMsg}</div>}
        {successMsg && <div style={{ color: 'var(--success)', padding: '0.6rem 0.8rem', background: 'var(--success-bg)', borderRadius: '6px', fontSize: '0.85rem' }}>{successMsg}</div>}

        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
            Full Name: <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}></span>
          </label>
          <div style={{ position: 'relative' }}>
            <User size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              className="input-field"
              style={{ paddingLeft: '2.2rem' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
            System / Work Email: <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}></span>
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="work@aamantran.com"
              className="input-field"
              style={{ paddingLeft: '2.2rem' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
            Personal Email: <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}></span>
          </label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="email"
              value={formData.personal_email}
              onChange={e => setFormData({ ...formData, personal_email: e.target.value })}
              placeholder="personal@email.com"
              className="input-field"
              style={{ paddingLeft: '2.2rem' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
            Username (Sign-in ID): <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}></span>
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              placeholder="Username"
              className="input-field"
              style={{ paddingLeft: '2.2rem' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
            New Password: <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}></span>
          </label>
          <div style={{ position: 'relative' }}>
            <Key size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder="Leave blank to keep current password"
              className="input-field"
              style={{ paddingLeft: '2.2rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg" style={{ flex: 1, gap: '0.4rem' }}>
            <CheckCircle size={18} />
            <span>{isSubmitting ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
          <button type="button" onClick={onClose} className="btn btn-secondary btn-lg">Cancel</button>
        </div>
      </form>
    </Modal>
  );
};
