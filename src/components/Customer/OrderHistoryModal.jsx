import React, { useState, useContext } from 'react';
import { Modal } from '../Common/Modal';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { LanguageContext } from '../../context/LanguageContext';
import { fetchAPI } from '../../utils/api';
import { Phone, History, Search } from 'lucide-react';

export const OrderHistoryModal = ({ isOpen, onClose, onSelectOrderToTrack }) => {
  const { t } = useContext(LanguageContext);
  const [phone, setPhone] = useState('');
  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  if (!isOpen) return null;

  const handleFetchHistory = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await fetchAPI(`/orders/customer-history?phone=${encodeURIComponent(phone.trim())}`);
      setHistoryOrders(data || []);
    } catch (err) {
      console.error(err);
      setHistoryOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Past Orders History (C11)">
      <div>
        <form onSubmit={handleFetchHistory} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Phone size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number..."
              className="input-field"
              style={{ paddingLeft: '2.2rem' }}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ gap: '0.4rem' }}>
            <Search size={16} />
            <span>Find Orders</span>
          </button>
        </form>

        {searched && (
          <div>
            {historyOrders.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                No past orders found for this phone number.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                {historyOrders.map(ord => (
                  <div key={ord.id} className="glass-card" style={{ padding: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Order #{ord.order_number}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Table #{ord.table_number} • {new Date(ord.created_at).toLocaleDateString()} {formatTime(ord.created_at)}
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--brand-primary)', marginTop: '0.2rem' }}>
                        {formatCurrency(ord.net_amount)}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onSelectOrderToTrack(ord);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      Track Order
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
