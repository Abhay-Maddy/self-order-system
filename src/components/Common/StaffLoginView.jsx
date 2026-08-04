import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../utils/api';
import { Lock, ChefHat, Shield, CreditCard, UserCheck, ArrowRight } from 'lucide-react';

export const StaffLoginView = ({ onLoginSuccess, defaultRole = 'chef' }) => {
  const { login } = useContext(AuthContext);

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [selectedRole, setSelectedRole] = useState(defaultRole); // 'chef', 'waiter', 'admin', 'cashier'
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
      setUsername('chef1');
      setPassword('chef123');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const loggedUser = await login(username, password);
      const targetPanel = ['chef', 'waiter'].includes(loggedUser.role) ? 'kitchen' : 'admin';
      if (onLoginSuccess) {
        onLoginSuccess(targetPanel);
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

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      {/* Centered Staff Login Card matching Image */}
      <div className="glass-card animate-slide-up" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '2.5rem 2rem',
        borderRadius: '16px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Circle Lock Icon */}
        <div style={{
          background: 'linear-gradient(135deg, var(--brand-primary), #ea580c)',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          color: '#ffffff',
          boxShadow: '0 8px 25px rgba(249, 115, 22, 0.45)'
        }}>
          <Lock size={28} />
        </div>

        {/* Title & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem' }}>
            {mode === 'login' ? 'Aamantran Restaurant Staff Portal' : 'Request Staff Account'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {mode === 'login' ? 'Authorized staff login to access restaurant management systems' : 'Submit your details for authorized staff approval'}
          </p>
        </div>

        {/* Error / Success Messages */}
        {errorMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 600, textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', fontWeight: 600, textAlign: 'center' }}>
            {successMsg}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Select Role Option */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                Select Role / Staff Position
              </label>
              <select
                value={selectedRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="input-field"
                style={{ fontWeight: 700, fontSize: '0.9rem' }}
              >
                <option value="chef">👨‍🍳 Chef / Kitchen</option>
                <option value="waiter">🤵 Waiter / Server</option>
                <option value="admin">📊 Owner / Admin</option>
                <option value="cashier">💳 Billing Cashier</option>
              </select>
            </div>

            {/* Username Input */}
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
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
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
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

            {/* Solid Orange Action Button matching Image */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '1rem',
                marginTop: '0.5rem',
                padding: '0.85rem',
                background: 'linear-gradient(135deg, var(--brand-primary), #ea580c)',
                boxShadow: '0 6px 20px rgba(249, 115, 22, 0.4)'
              }}
            >
              {isSubmitting ? 'Authenticating...' : 'Log In to Staff Portal'}
            </button>

            {/* Request Account Toggle */}
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

            {/* Default Demo Credentials Box matching Image */}
            <div style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              padding: '0.65rem 0.9rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginTop: '0.5rem'
            }}>
              Default Demo Credentials: <b style={{ color: 'var(--text-primary)' }}>{selectedRole === 'admin' ? 'admin / admin123' : selectedRole === 'cashier' ? 'cashier1 / cashier123' : 'chef1 / chef123'}</b>
            </div>
          </form>
        ) : (
          /* Registration Request Form */
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                Requested Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="input-field"
                style={{ fontWeight: 700 }}
              >
                <option value="chef">👨‍🍳 Chef / Kitchen</option>
                <option value="waiter">🤵 Waiter / Server</option>
                <option value="cashier">💳 Billing Cashier</option>
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
              style={{ width: '100%', borderRadius: '10px', fontWeight: 800, marginTop: '0.5rem' }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Registration Request'}
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
    </div>
  );
};
