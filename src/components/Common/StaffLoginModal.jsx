import React, { useState, useContext } from 'react';
import { Modal } from './Modal';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../utils/api';
import { ShieldCheck, ChefHat, UserCheck, Lock, User, LogIn, Send, HelpCircle, ArrowRight, ChevronDown } from 'lucide-react';

export const StaffLoginModal = ({ isOpen, onClose, setActivePanel }) => {
  const { login } = useContext(AuthContext);

  const [authMode, setAuthMode] = useState('login'); // 'login' or 'request'
  const [showWhoCanLogin, setShowWhoCanLogin] = useState(true);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('cashier');

  const [loginError, setLoginError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);

    try {
      const loggedUser = await login(username, password);
      setIsSubmitting(false);
      onClose();

      // Route to appropriate panel based on role
      if (loggedUser.role === 'admin') {
        setActivePanel('admin');
      } else {
        setActivePanel('kitchen');
      }
    } catch (err) {
      setLoginError(err.message || 'Invalid username or password.');
      setIsSubmitting(false);
    }
  };

  const handleStaffRequestSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setRequestSuccess('');
    setIsSubmitting(true);

    try {
      const res = await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, name, role })
      });
      setRequestSuccess(res.message || 'Staff registration request submitted successfully!');
      setUsername('');
      setPassword('');
      setName('');
      setEmail('');
    } catch (err) {
      setLoginError(err.message || 'Failed to submit registration request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSelectRole = (userType) => {
    if (userType === 'admin') {
      setUsername('Abhay_Maddy');
      setPassword('abhaymddy123');
    } else if (userType === 'chef') {
      setUsername('chef1');
      setPassword('chef123');
    } else if (userType === 'cashier') {
      setUsername('cashier1');
      setPassword('cashier123');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Staff & Kitchen Portal Sign-In">
      <div>
        {/* Toggle sub-tabs: Sign In vs Request Account */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface-elevated)', padding: '0.25rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setLoginError(''); setRequestSuccess(''); }}
            className={`btn btn-sm ${authMode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, border: 'none' }}
          >
            <LogIn size={14} /> Sign In
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('request'); setLoginError(''); setRequestSuccess(''); }}
            className={`btn btn-sm ${authMode === 'request' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, border: 'none' }}
          >
            <Send size={14} /> Request Staff Account
          </button>
        </div>

        {/* "Who can log in?" Guidance Accordion / Button */}
        <div style={{ marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={() => setShowWhoCanLogin(!showWhoCanLogin)}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', justifyContent: 'space-between', padding: '0.5rem 0.75rem', fontSize: '0.8rem', borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <HelpCircle size={15} />
              <span>Who can log in? (Roles & Access)</span>
            </div>
            <ChevronDown size={14} style={{ transform: showWhoCanLogin ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {showWhoCanLogin && (
            <div className="glass-card animate-slide-up" style={{ padding: '0.85rem', marginTop: '0.5rem', background: 'var(--bg-surface-elevated)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={16} color="var(--brand-primary)" />
                <strong>Admin</strong> <ArrowRight size={13} /> Master Controls (Menu, Staff, Billing, Settings)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ChefHat size={16} color="#f59e0b" />
                <strong>Chef (Safe)</strong> <ArrowRight size={13} /> Kitchen Display System (KDS), KOT Prints & Cooking Status
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserCheck size={16} color="#10b981" />
                <strong>Waiter / Cashier</strong> <ArrowRight size={13} /> Live Orders, Table Billing & Hand-ordering
              </div>
            </div>
          )}
        </div>

        {loginError && (
          <div style={{ color: 'var(--danger)', padding: '0.6rem 0.8rem', background: 'var(--danger-bg)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {loginError}
          </div>
        )}

        {requestSuccess && (
          <div style={{ color: 'var(--success)', padding: '0.6rem 0.8rem', background: 'var(--success-bg)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {requestSuccess}
          </div>
        )}

        {authMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Quick Role Fill Presets */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                Select Role to Sign In:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleQuickSelectRole('admin')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', gap: '0.3rem' }}
                >
                  <ShieldCheck size={13} color="var(--brand-primary)" /> Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelectRole('chef')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', gap: '0.3rem' }}
                >
                  <ChefHat size={13} color="#f59e0b" /> Chef
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelectRole('cashier')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', gap: '0.3rem' }}
                >
                  <UserCheck size={13} color="#10b981" /> Waiter
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. Abhay_Maddy or chef1"
                  className="input-field"
                  style={{ paddingLeft: '2.2rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: '2.2rem' }}
                />
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg" style={{ marginTop: '0.5rem' }}>
              {isSubmitting ? 'Signing in...' : 'Sign In to Portal'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleStaffRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Full Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Sharma" className="input-field" />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Email Address</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="rahul@aamantran.com" className="input-field" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Username</label>
                <input type="text" required value={username} onChange={e => setUsername(e.target.value)} placeholder="rahul_staff" className="input-field" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Requested Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="input-field">
                  <option value="chef">Chef / Kitchen</option>
                  <option value="cashier">Cashier / Waiter</option>
                  <option value="admin">Sub-Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="input-field" />
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg" style={{ marginTop: '0.5rem' }}>
              {isSubmitting ? 'Submitting...' : 'Submit Request for Approval'}
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};
