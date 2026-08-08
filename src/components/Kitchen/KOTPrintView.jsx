import React from 'react';
import { Modal } from '../Common/Modal';
import { formatTime } from '../../utils/formatters';
import { Printer } from 'lucide-react';

export const KOTPrintView = ({ order, orders = [], isOpen, onClose }) => {
  if (!isOpen) return null;

  const targetOrders = orders.length > 0 ? orders : (order ? [order] : []);
  if (targetOrders.length === 0) return null;

  const isConsolidated = targetOrders.length > 1;

  let displayTableNumbers = [];
  let displayOrderNumbers = [];
  let allItems = [];

  targetOrders.forEach(ord => {
    if (ord.table_number) displayTableNumbers.push(`TABLE #${ord.table_number}`);
    if (ord.order_number) displayOrderNumbers.push(`#${ord.order_number}`);

    if (Array.isArray(ord.items)) {
      ord.items.forEach(it => {
        allItems.push({
          ...it,
          table_number: ord.table_number,
          order_number: ord.order_number
        });
      });
    }
  });

  const uniqueTables = Array.from(new Set(displayTableNumbers)).join(', ');
  const orderNumsStr = displayOrderNumbers.join(', ');

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isConsolidated ? `Consolidated KOT (${targetOrders.length} Orders)` : `KOT Ticket - ${displayTableNumbers[0] || 'Order'}`}
    >
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
            <h2 style={{ fontSize: '1.3rem', color: '#000', margin: '0 0 0.3rem' }}>
              {isConsolidated ? 'CONSOLIDATED KITCHEN ORDER TICKET' : 'KITCHEN ORDER TICKET (KOT)'}
            </h2>
            <div style={{ fontSize: '1rem', fontWeight: 800 }}>{uniqueTables}</div>
            <div style={{ fontSize: '0.82rem' }}>Ticket(s): {orderNumsStr}</div>
            <div style={{ fontSize: '0.82rem' }}>Time: {formatTime(targetOrders[0].created_at)}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', borderBottom: '2px dashed #000', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
            {allItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: isConsolidated ? '1px dotted #ccc' : 'none', paddingBottom: isConsolidated ? '4px' : '0' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                    {item.quantity}x {item.item_name} [{item.fulfillment_type === 'dine_in' ? 'DINE-IN' : 'PACKING'}]
                  </div>
                  {isConsolidated && <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#333' }}>• Table #{item.table_number} ({item.order_number})</div>}
                  {item.variant_name && <div>• Variant: {item.variant_name}</div>}
                  {item.spice_level && <div>• Spice: {item.spice_level.toUpperCase()}</div>}
                  {item.toppings_summary && <div>• Toppings: {item.toppings_summary}</div>}
                </div>
                <div style={{ fontWeight: 700 }}>{item.status ? item.status.toUpperCase() : 'PENDING'}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>
            Printed via Aamantran KDS System
          </div>
        </div>

        <button onClick={handlePrint} className="btn btn-primary btn-lg" style={{ width: '100%', gap: '0.5rem', fontWeight: 800 }}>
          <Printer size={20} />
          <span>{isConsolidated ? `Print Consolidated KOT (${targetOrders.length} Orders)` : 'Print KOT Ticket'}</span>
        </button>
      </div>
    </Modal>
  );
};
