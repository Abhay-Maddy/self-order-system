import React from 'react';
import { Modal } from '../Common/Modal';
import { formatTime } from '../../utils/formatters';
import { Printer } from 'lucide-react';

export const KOTPrintView = ({ order, isOpen, onClose }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`KOT Ticket - Table #${order.table_number}`}>
      <div>
        <div id="kot-ticket-print" style={{
          background: '#fff',
          color: '#000',
          padding: '1.5rem',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          border: '1px solid #ccc',
          marginBottom: '1rem'
        }}>
          <div style={{ textAlign: 'center', borderBottom: '2px dashed #000', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#000' }}>KITCHEN ORDER TICKET (KOT)</h2>
            <div style={{ fontSize: '1rem', fontWeight: 800 }}>TABLE #{order.table_number}</div>
            <div>Ticket: {order.order_number}</div>
            <div>Time: {formatTime(order.created_at)}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderBottom: '2px dashed #000', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            {order.items && order.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                    {item.quantity}x {item.item_name} [{item.fulfillment_type === 'dine_in' ? 'DINE-IN' : 'PACKING'}]
                  </div>
                  {item.variant_name && <div>• Variant: {item.variant_name}</div>}
                  {item.spice_level && <div>• Spice: {item.spice_level.toUpperCase()}</div>}
                  {item.toppings_summary && <div>• Toppings: {item.toppings_summary}</div>}
                </div>
                <div style={{ fontWeight: 700 }}>{item.status.toUpperCase()}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>
            Printed via GourmetBites KDS System
          </div>
        </div>

        <button onClick={handlePrint} className="btn btn-primary btn-lg" style={{ width: '100%', gap: '0.5rem' }}>
          <Printer size={20} />
          <span>Print KOT Ticket</span>
        </button>
      </div>
    </Modal>
  );
};
