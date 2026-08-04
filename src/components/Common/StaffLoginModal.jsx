import React, { useState, useContext } from 'react';
import { Modal } from './Modal';
import { AuthContext } from '../../context/AuthContext';
import { ChefHat, Shield, Lock, KeyRound, ArrowDown, UserCheck } from 'lucide-react';

export const StaffLoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const { login } = useContext(AuthContext);

  const [selectedRole, setSelectedRole] = useState('chef'); // 'chef' or 'admin'
  const [username, setUsername] = useState('chef1');
  const [password, setPassword] = useState('chef123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleRoleTabChange = (role) => {
    setSelectedRole(role);
    setErrorMsg('');
    if (role === 'chef') {
      setUsername('chef1');
      setPassword('chef123');
    } else {
      setUsername('admin');
      setPassword('admin123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const loggedUser = await login(username, password);
      if (onLoginSuccess) {
        onLoginSuccess(loggedUser.role === 'chef' ? 'kitchen' : 'admin');
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Invalid staff credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (userDemo, passDemo, targetPanel) => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await login(userDemo, passDemo);
      if (onLoginSuccess) {
        onLoginSuccess(targetPanel);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Staff & Management Sign In" maxWidth="480px">
      <div className="animate-shift-down">
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem', textAlign: 'center' }}>
          Select your authorized staff role to access live operations
        </p>

        {/* Role Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          background: 'var(--bg-surface-elevated)',
          padding: '0.35rem',
          borderRadius: 'var(--border-radius-sm)',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            onClick={() => handleRoleTabChange('chef')}
            className={`btn btn-sm ${selectedRole === 'chef' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', gap: '0.4rem', justifyContent: 'center' }}
          >
            <ChefHat size={16} />
            <span>Kitchen Chef</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange('admin')}
            className={`btn btn-sm ${selectedRole === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none', gap: '0.4rem', justifyContent: 'center' }}
          >
            <Shield size={16} />
            <span>Admin / Cashier</span>
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '0.65rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="input-field"
              placeholder="e.g. chef1 or admin"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg" style={{ width: '100%', gap: '0.5rem' }}>
            <KeyRound size={18} />
            <span>{isSubmitting ? 'Authenticating...' : `Sign In as ${selectedRole === 'chef' ? 'Chef' : 'Admin'}`}</span>
          </button>
        </form>

        {/* One-Click Quick Demo Shortcuts */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.6rem', textAlign: 'center' }}>
            ⚡ Instant One-Click Demo Access
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => handleQuickDemoLogin('chef1', 'chef123', 'kitchen')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', fontSize: '0.8rem' }}
            >
              <span>👨‍🍳 Head Chef Pass (`chef1`)</span>
              <span className="badge badge-dinein">Quick Pass →</span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('admin', 'admin123', 'admin')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', fontSize: '0.8rem' }}
            >
              <span>📊 Owner Admin (`admin`)</span>
              <span className="badge badge-veg">Quick Pass →</span>
            </button>

            <button
              onClick={() => handleQuickDemoLogin('cashier1', 'cashier123', 'admin')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', fontSize: '0.8rem' }}
            >
              <span>💳 Cashier Billing (`cashier1`)</span>
              <span className="badge badge-packing">Quick Pass →</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
