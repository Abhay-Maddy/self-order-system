import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../utils/api';
import { Modal } from '../Common/Modal';
import { Lock, ChefHat, Shield, CreditCard, UserCheck, ArrowRight, Eye, EyeOff, HelpCircle } from 'lucide-react';

export const StaffLoginView = ({ onLoginSuccess, defaultRole = 'admin' }) => {
  const { login } = useContext(AuthContext);

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [selectedRole, setSelectedRole] = useState(defaultRole); // 'chef', 'waiter', 'admin', 'cashier'
  const [username, setUsername] = useState(defaultRole === 'admin' ? 'admin' : defaultRole === 'cashier' ? 'cashier1' : defaultRole === 'waiter' ? 'waiter1' : 'chef1');
  const [password, setPassword] = useState(defaultRole === 'admin' ? 'admin123' : defaultRole === 'cashier' ? 'cashier123' : defaultRole === 'waiter' ? 'waiter123' : 'chef123');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
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
    } else if (newRole === 'waiter') {
      setUsername('waiter1');
      setPassword('waiter123');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const loggedUser = await login(username, password);
      let targetPanel = 'kitchen';
      if (loggedUser.role === 'chef') targetPanel = 'kitchen';
      else if (loggedUser.role === 'waiter') targetPanel = 'waiter';
      else if (['admin', 'cashier'].includes(loggedUser.role)) targetPanel = 'admin';

      if (onLoginSuccess) {
        // Pass both the panel name (for legacy) and the full user object (for URL routing)
        onLoginSuccess(targetPanel, loggedUser);
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
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        position: 'relative'
      }}>
        {/* Top Right Close Button */}
        {onLoginSuccess && (
          <button
            onClick={() => onLoginSuccess('customer')}
            className="btn btn-secondary btn-sm"
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}
            title="Close Login & Return to Customer Menu"
          >
            ✖
          </button>
        )}
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
                <option value="admin">📊 Owner / Admin</option>
                <option value="cashier">💳 Billing Cashier</option>
                <option value="chef">👨‍🍳 Chef / Kitchen</option>
                <option value="waiter">🤵 Waiter / Server</option>
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

            {/* Password Input with Eye Icon Toggle */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field"
                  placeholder="••••••••"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '0.2rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
              Default Demo Credentials: <b style={{ color: 'var(--text-primary)' }}>
                {selectedRole === 'admin' ? 'admin / admin123' : selectedRole === 'cashier' ? 'cashier1 / cashier123' : selectedRole === 'waiter' ? 'waiter1 / waiter123' : 'chef1 / chef123'}
              </b>
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
                <option value="admin">📊 Sub-Admin</option>
                <option value="cashier">💳 Billing Cashier</option>
                <option value="chef">👨‍🍳 Chef / Kitchen</option>
                <option value="waiter">🤵 Waiter / Server</option>
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

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        title="Forgot Staff Password"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--brand-primary)' }}>
              🔒 Password Reset Instructions
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Staff accounts are managed by the Main Admin Owner. If you forgot your password, please ask your <strong>Main Admin</strong> to reset your credentials from the <strong>Admin Portal → Staff Approvals</strong> tab.
            </p>
          </div>

          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            <strong>Default Demo Passwords for Testing:</strong>
            <ul style={{ marginTop: '0.4rem', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
              <li><strong>Owner / Admin:</strong> <code>admin</code> / <code>admin123</code></li>
              <li><strong>Billing Cashier:</strong> <code>cashier1</code> / <code>cashier123</code></li>
              <li><strong>Chef / Kitchen:</strong> <code>chef1</code> / <code>chef123</code></li>
              <li><strong>Waiter / Server:</strong> <code>waiter1</code> / <code>waiter123</code></li>
            </ul>
          </div>

          <button
            onClick={() => setIsForgotPasswordOpen(false)}
            className="btn btn-primary"
            style={{ width: '100%', borderRadius: '8px' }}
          >
            Got it, Back to Login
          </button>
        </div>
      </Modal>
    </div>
  );
};
