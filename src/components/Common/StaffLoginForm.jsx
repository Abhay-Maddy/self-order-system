import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../utils/api';
import { Lock, UserCheck, ChefHat, Shield, CreditCard, User } from 'lucide-react';

export const StaffLoginForm = ({ onLoginSuccess, defaultRole = 'chef' }) => {
  const { login } = useContext(AuthContext);

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [selectedRole, setSelectedRole] = useState(defaultRole); // 'chef', 'admin', 'cashier', 'waiter'
  const [username, setUsername] = useState(defaultRole === 'admin' ? 'admin' : 'chef1');
  const [password, setPassword] = useState(defaultRole === 'admin' ? 'admin123' : 'chef123');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRoleChange = (newRole) => {
    setSelectedRole(newRole);
    setErrorMsg('');
    setSuccessMsg('');
    if (newRole === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (newRole === 'chef') {
      setUsername('chef1');
      setPassword('chef123');
    } else if (newRole === 'cashier') {
      setUsername('cashier1');
      setPassword('cashier123');
    } else {
      setUsername('');
      setPassword('');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const loggedUser = await login(username, password);
      if (onLoginSuccess) {
        onLoginSuccess(loggedUser.role === 'chef' ? 'kitchen' : 'admin');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid username or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, name, role: selectedRole })
      });
      setSuccessMsg(res.message || 'Staff request submitted! Pending Admin approval.');
      setUsername('');
      setPassword('');
      setName('');
      setEmail('');
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = (roleKey) => {
    switch (roleKey) {
      case 'chef': return 'Kitchen Portal';
      case 'admin': return 'Admin Dashboard';
      case 'cashier': return 'Cashier Billing';
      case 'waiter': return 'Waiter / Staff';
      default: return 'Staff Portal';
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Circle Lock Icon */}
      <div style={{
        background: 'linear-gradient(135deg, var(--brand-primary), #ea580c)',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.25rem',
        color: '#ffffff',
        boxShadow: '0 6px 20px rgba(249, 115, 22, 0.4)'
      }}>
        <Lock size={26} />
      </div>

      {/* Header Titles */}
      <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.35rem' }}>
        {mode === 'login' ? `${getRoleLabel(selectedRole)} Sign-In` : 'Request Staff Account'}
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        {mode === 'login' ? 'Staff login required to access system features' : 'Submit your details for authorized staff approval'}
      </p>

      {/* Alert Messages */}
      {errorMsg && (
        <div style={{ padding: '0.65rem 0.9rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: '0.65rem 0.9rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {/* Mode Switch Form */}
      {mode === 'login' ? (
        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', textAlign: 'left' }}>
          {/* Select Staff Role */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Select Staff Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="input-field"
              style={{ fontWeight: 700, fontSize: '0.9rem' }}
            >
              <option value="chef">👨‍🍳 Kitchen Chef</option>
              <option value="admin">📊 Owner / Admin</option>
              <option value="cashier">💳 Cashier & Billing</option>
              <option value="waiter">🤵 Waiter / Staff</option>
            </select>
          </div>

          {/* Username Input */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="input-field"
              placeholder={`e.g. ${selectedRole === 'admin' ? 'admin' : selectedRole === 'cashier' ? 'cashier1' : 'chef1'}`}
            />
          </div>

          {/* Password Input */}
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          {/* Full-width Solid Orange Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-lg"
            style={{
              width: '100%',
              borderRadius: 'var(--border-radius-sm)',
              fontWeight: 800,
              fontSize: '1rem',
              marginTop: '0.5rem',
              padding: '0.85rem'
            }}
          >
            {isSubmitting ? 'Authenticating...' : `Log In to ${getRoleLabel(selectedRole)}`}
          </button>

          {/* Request Staff Account Toggle */}
          <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            New Staff?{' '}
            <button
              type="button"
              onClick={() => setMode('register')}
              style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 700 }}
            >
              Request Staff Account
            </button>
          </div>

          {/* Clean Demo Hint Box matching Image 1 */}
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-color)',
            padding: '0.6rem 0.8rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            textAlign: 'center',
            marginTop: '0.25rem'
          }}>
            Default Demo Credentials: <b style={{ color: 'var(--text-primary)' }}>{selectedRole === 'admin' ? 'admin / admin123' : selectedRole === 'cashier' ? 'cashier1 / cashier123' : 'chef1 / chef123'}</b>
          </div>
        </form>
      ) : (
        /* Registration Request Form */
        <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              Staff Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input-field"
              style={{ fontWeight: 700 }}
            >
              <option value="chef">👨‍🍳 Kitchen Chef</option>
              <option value="cashier">💳 Cashier & Billing</option>
              <option value="waiter">🤵 Waiter / Staff</option>
              <option value="admin">📊 Sub-Admin</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-field"
              placeholder="e.g. Marco Rossi"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
              placeholder="marco@restaurant.com"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="input-field"
                placeholder="marco123"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', borderRadius: 'var(--border-radius-sm)', fontWeight: 800, marginTop: '0.5rem' }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Staff Account Request'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem' }}>
            Already registered?{' '}
            <button
              type="button"
              onClick={() => setMode('login')}
              style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 700 }}
            >
              Back to Login
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
