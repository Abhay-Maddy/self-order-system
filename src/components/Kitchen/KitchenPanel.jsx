import React, { useState, useEffect, useContext } from 'react';
import { KitchenHeader } from './KitchenHeader';
import { TicketCard } from './TicketCard';
import { RejectionReasonModal } from './RejectionReasonModal';
import { KOTPrintView } from './KOTPrintView';
import { fetchAPI } from '../../utils/api';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import { playKitchenChime } from '../../utils/sound';
import { AlertCircle, Lock, RefreshCw } from 'lucide-react';

export const KitchenPanel = () => {
  const { user, login, register } = useContext(AuthContext);
  const { socket, joinRoom } = useContext(SocketContext);

  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [printingOrder, setPrintingOrder] = useState(null);

  // K7 Controls
  const [tableFilter, setTableFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('oldest');

  // Staff Login State
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const loadActiveOrders = () => {
    setLoading(true);
    fetchAPI('/orders/active')
      .then(data => setOrders(data || []))
      .catch(err => console.error('Failed to load active orders:', err))
      .finally(() => setLoading(false));

    fetchAPI('/tables')
      .then(data => setTables(data || []))
      .catch(err => console.error(err));

    fetchAPI('/inventory')
      .then(items => {
        if (items) {
          const low = items.filter(i => i.stock_quantity <= i.low_stock_threshold);
          setLowStockItems(low);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (user && ['chef', 'admin'].includes(user.role)) {
      loadActiveOrders();
    }
  }, [user]);

  // Join Kitchen socket room
  useEffect(() => {
    if (socket) {
      joinRoom('kitchen');
    }
  }, [socket]);

  // Listen for real-time order arrival chime (K2) & stock alerts (K10)
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder) => {
      playKitchenChime(newOrder?.table_number);
      loadActiveOrders();
    };

    const handleItemStatusUpdated = () => {
      loadActiveOrders();
    };

    const handleStockAlert = () => {
      loadActiveOrders();
    };

    socket.on('new_order', handleNewOrder);
    socket.on('item_status_updated', handleItemStatusUpdated);
    socket.on('stock_alert', handleStockAlert);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('item_status_updated', handleItemStatusUpdated);
      socket.off('stock_alert', handleStockAlert);
    };
  }, [socket]);

  const handleItemStatusChange = async (itemId, status, rejectionReason = null, prepTimeMinutes = null) => {
    try {
      await fetchAPI(`/orders/items/${itemId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejection_reason: rejectionReason, prep_time_minutes: prepTimeMinutes })
      });
      loadActiveOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await login(username, password);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    try {
      const res = await register(username, password, name, 'chef');
      setAuthSuccess(res.message);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Staff Approval Guard (K1 requirement)
  if (!user || !['chef', 'admin'].includes(user.role)) {
    return (
      <div className="container" style={{ maxWidth: '440px', padding: '3rem 1rem' }}>
        <div className="glass-card animate-slide-up" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--brand-primary)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: '#fff' }}>
              <Lock size={24} />
            </div>
            <h2 style={{ fontSize: '1.4rem' }}>Chef & Kitchen Portal</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Staff login required to access Kitchen Display System
            </p>
          </div>

          {authError && (
            <div style={{ padding: '0.65rem', background: 'var(--danger-bg)', color: 'var(--danger)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {authError}
            </div>
          )}

          {authSuccess && (
            <div style={{ padding: '0.65rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {authSuccess}
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="input-field" placeholder="e.g. chef1" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-field" placeholder="••••••••" />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Log In to Kitchen</button>
              
              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                New Chef? <button type="button" onClick={() => setAuthMode('register')} style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 700 }}>Request Staff Account</button>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', background: 'var(--bg-surface-elevated)', padding: '0.5rem', borderRadius: '6px' }}>
                Default Demo Credentials: <b>chef1</b> / <b>chef123</b>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="input-field" placeholder="e.g. Chef Marco" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="input-field" placeholder="e.g. chef_marco" />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem' }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="input-field" placeholder="••••••••" />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>Submit Registration Request</button>

              <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                Already registered? <button type="button" onClick={() => setAuthMode('login')} style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontWeight: 700 }}>Back to Login</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Filter & Sort orders (K7)
  let processedOrders = [...orders];
  if (tableFilter !== 'all') {
    processedOrders = processedOrders.filter(o => o.table_number === tableFilter);
  }
  if (sortOrder === 'oldest') {
    processedOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else {
    processedOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // Filter orders by active kitchen status
  const pendingOrders = processedOrders.filter(o => o.items && o.items.some(i => i.status === 'pending'));
  const preparingOrders = processedOrders.filter(o => o.items && o.items.some(i => i.status === 'preparing' || i.status === 'accepted'));
  const readyOrders = processedOrders.filter(o => o.items && o.items.some(i => i.status === 'ready'));

  return (
    <div className="container" style={{ padding: '1.5rem 1rem 4rem' }}>
      <KitchenHeader
        activeCount={orders.length}
        onRefresh={loadActiveOrders}
        user={user}
        tableFilter={tableFilter}
        setTableFilter={setTableFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        tables={tables}
        lowStockItems={lowStockItems}
      />

      {/* 3-Column KDS Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Column 1: New / Pending */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.5rem 0.8rem', background: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--danger)' }}></span>
              New Orders ({pendingOrders.length})
            </h3>
          </div>
          {pendingOrders.map(ord => (
            <TicketCard
              key={ord.id}
              order={ord}
              onItemStatusChange={handleItemStatusChange}
              onPrintKOT={(o) => setPrintingOrder(o)}
              onOpenRejectModal={(item) => setRejectingItem(item)}
            />
          ))}
        </div>

        {/* Column 2: In Cooking / Preparing */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.5rem 0.8rem', background: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)' }}></span>
              Cooking / Prep ({preparingOrders.length})
            </h3>
          </div>
          {preparingOrders.map(ord => (
            <TicketCard
              key={ord.id}
              order={ord}
              onItemStatusChange={handleItemStatusChange}
              onPrintKOT={(o) => setPrintingOrder(o)}
              onOpenRejectModal={(item) => setRejectingItem(item)}
            />
          ))}
        </div>

        {/* Column 3: Ready to Serve */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.5rem 0.8rem', background: 'var(--bg-surface-elevated)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }}></span>
              Ready to Pass ({readyOrders.length})
            </h3>
          </div>
          {readyOrders.map(ord => (
            <TicketCard
              key={ord.id}
              order={ord}
              onItemStatusChange={handleItemStatusChange}
              onPrintKOT={(o) => setPrintingOrder(o)}
              onOpenRejectModal={(item) => setRejectingItem(item)}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      <RejectionReasonModal
        item={rejectingItem}
        isOpen={Boolean(rejectingItem)}
        onClose={() => setRejectingItem(null)}
        onConfirmReject={(itemId, reason) => handleItemStatusChange(itemId, 'rejected', reason)}
      />

      <KOTPrintView
        order={printingOrder}
        isOpen={Boolean(printingOrder)}
        onClose={() => setPrintingOrder(null)}
      />
    </div>
  );
};
