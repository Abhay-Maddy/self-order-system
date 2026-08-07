import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../utils/api';
import { Package, AlertCircle, RefreshCw, Search } from 'lucide-react';

export const InventoryManager = () => {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadStock = () => {
    fetchAPI('/inventory')
      .then(data => setItems(data || []))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadStock();
  }, []);

  const handleUpdateStock = async (itemId, newQty, threshold, isActive) => {
    try {
      await fetchAPI(`/inventory/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ stock_quantity: newQty, low_stock_threshold: threshold, is_active: isActive })
      });
      loadStock();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredItems = items.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || (item.category_name && item.category_name.toLowerCase().includes(q));
  });

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem' }}>Stock & Inventory Monitor</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Real-time inventory levels, low-stock threshold triggers (`K10`, `A7`).
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Left Side Inventory Search Bar */}
          <div style={{ position: 'relative', width: '240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stock item..."
              className="input-field"
              style={{ paddingLeft: '2.2rem', paddingRight: '0.5rem', height: '36px', fontSize: '0.82rem' }}
            />
          </div>

          <button onClick={loadStock} className="btn btn-secondary btn-sm">
            <RefreshCw size={16} /> Sync Stock
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.75rem' }}>Dish Name</th>
              <th style={{ padding: '0.75rem' }}>Current Stock</th>
              <th style={{ padding: '0.75rem' }}>Low Threshold Alert</th>
              <th style={{ padding: '0.75rem' }}>Stock Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Replenish Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => {
              const isLow = item.stock_quantity <= item.low_stock_threshold && item.stock_quantity > 0;
              const isZero = item.stock_quantity <= 0;

              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>{item.name}</td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: isZero ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--text-primary)' }}>
                      {item.stock_quantity}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                    ≤ {item.low_stock_threshold} units
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {isZero && <span className="badge badge-nonveg">SOLD OUT</span>}
                    {isLow && <span className="badge badge-packing"><AlertCircle size={12} /> Low Stock</span>}
                    {!isZero && !isLow && <span className="badge badge-veg">In Stock</span>}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleUpdateStock(item.id, item.stock_quantity + 10, item.low_stock_threshold, true)}
                        className="btn btn-secondary btn-sm"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => handleUpdateStock(item.id, item.stock_quantity + 50, item.low_stock_threshold, true)}
                        className="btn btn-secondary btn-sm"
                      >
                        +50
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
