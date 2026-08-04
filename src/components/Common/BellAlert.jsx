import React, { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import { playKitchenChime } from '../../utils/sound';
import { Bell, CheckCircle, X } from 'lucide-react';

export const BellAlert = () => {
  const { socket, joinRoom } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!socket || !user) return;

    if (['admin', 'chef', 'cashier'].includes(user.role)) {
      joinRoom('admin');
      joinRoom('kitchen');
    }

    const handleNewOrder = (order) => {
      try { playKitchenChime(); } catch (e) {}
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([200, 100, 200]); } catch (e) {}
      }

      const newNotif = {
        id: Date.now(),
        type: 'new_order',
        title: '🔔 New Order Live!',
        message: `Table #${order.table_number || '?'} • Order #${order.order_number || ''}`,
        time: new Date().toLocaleTimeString()
      };

      setNotifications(prev => [newNotif, ...prev.slice(0, 4)]);
    };

    const handleOrderUpdated = (order) => {
      if (order && (order.status === 'completed' || order.status === 'served')) {
        const notif = {
          id: Date.now(),
          type: 'order_completed',
          title: '✅ Order Completed!',
          message: `Table #${order.table_number || '?'} • Order #${order.order_number || ''}`,
          time: new Date().toLocaleTimeString()
        };
        setNotifications(prev => [notif, ...prev.slice(0, 4)]);
      }
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_updated', handleOrderUpdated);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_updated', handleOrderUpdated);
    };
  }, [socket, user, joinRoom]);

  useEffect(() => {
    if (notifications.length === 0) return;
    const timer = setTimeout(() => {
      setNotifications(prev => prev.slice(0, -1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [notifications]);

  if (!user || !['admin', 'chef', 'cashier'].includes(user.role) || notifications.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '75px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      maxWidth: '320px',
      width: '100%',
      pointerEvents: 'none'
    }}>
      {notifications.map(n => (
        <div
          key={n.id}
          className="glass-card animate-slide-in"
          style={{
            padding: '0.85rem 1rem',
            background: n.type === 'new_order' ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.95), rgba(234, 88, 12, 0.95))' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
            color: '#fff',
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            pointerEvents: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {n.type === 'new_order' ? <Bell size={20} className="animate-bounce" /> : <CheckCircle size={20} />}
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{n.title}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{n.message}</div>
            </div>
          </div>
          <button
            onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.8 }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
