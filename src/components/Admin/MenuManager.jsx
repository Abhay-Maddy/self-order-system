import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/formatters';
import { Modal } from '../Common/Modal';
import { Plus, Edit, Trash2, Leaf } from 'lucide-react';

export const MenuManager = () => {
  const [menuTree, setMenuTree] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    subcategory_id: 1,
    name: '',
    subtitle: '',
    tags: '',
    description: '',
    price: 100,
    is_veg: true,
    is_vegan: false,
    is_gluten_free: false,
    spice_level: 'medium',
    image_url: '',
    stock_quantity: 50,
    low_stock_threshold: 5
  });

  const loadMenu = () => {
    fetchAPI('/menu')
      .then(data => {
        setMenuTree(data.categories || []);
        setAllItems(data.allItems || []);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      subcategory_id: 1,
      name: '',
      subtitle: 'Chef Special',
      tags: 'Creamy, Mild',
      description: '',
      price: 150,
      is_veg: true,
      is_vegan: false,
      is_gluten_free: false,
      spice_level: 'medium',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      stock_quantity: 40,
      low_stock_threshold: 5
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      subcategory_id: item.subcategory_id,
      name: item.name,
      subtitle: item.subtitle || '',
      tags: item.tags || '',
      description: item.description || '',
      price: item.price,
      is_veg: Boolean(item.is_veg),
      is_vegan: Boolean(item.is_vegan),
      is_gluten_free: Boolean(item.is_gluten_free),
      spice_level: item.spice_level || 'medium',
      image_url: item.image_url || '',
      stock_quantity: item.stock_quantity,
      low_stock_threshold: item.low_stock_threshold
    });
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Delete this menu item?')) {
      await fetchAPI(`/menu/items/${itemId}`, { method: 'DELETE' });
      loadMenu();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await fetchAPI(`/menu/items/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await fetchAPI('/menu/items', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setIsModalOpen(false);
      loadMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem' }}>Menu Catalog & Tag Manager</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Admin edit access for all item names, subtitles, tags (Creamy, Cold, Flak, Veg/Non-Veg), prices, and stock
          </span>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ gap: '0.4rem' }}>
          <Plus size={18} />
          <span>Add New Menu Item</span>
        </button>
      </div>

      {/* Items Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.75rem' }}>Item & Subtitle</th>
              <th style={{ padding: '0.75rem' }}>Custom Tags</th>
              <th style={{ padding: '0.75rem' }}>Price</th>
              <th style={{ padding: '0.75rem' }}>Stock</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allItems.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    {item.subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600 }}>{item.subtitle}</div>}
                  </div>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span className={`badge ${item.is_veg ? 'badge-veg' : 'badge-nonveg'}`} style={{ marginRight: '0.3rem' }}>
                    {item.is_veg ? 'VEG' : 'NON-VEG'}
                  </span>
                  {item.tags && item.tags.split(',').map((t, i) => (
                    <span key={i} className="badge" style={{ background: 'var(--bg-surface-elevated)', marginRight: '0.2rem', fontSize: '0.7rem' }}>
                      {t.trim()}
                    </span>
                  ))}
                </td>
                <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                  {formatCurrency(item.price)}
                </td>
                <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                  {item.stock_quantity}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span className={`badge ${item.is_active ? 'badge-veg' : 'badge-nonveg'}`}>
                    {item.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  <button onClick={() => handleOpenEdit(item)} className="btn btn-secondary btn-sm" style={{ marginRight: '0.4rem' }}>
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDeleteItem(item.id)} className="btn btn-danger btn-sm">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Edit Item & Subtitles' : 'Add New Item'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Dish Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="input-field" />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Subtitle / Highlight</label>
              <input type="text" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} placeholder="e.g. Creamy Cashew Gravy" className="input-field" />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Custom Tags (Comma Separated)</label>
            <input type="text" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="e.g. Creamy, Cold Brew, Crispy Flakes" className="input-field" />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Description</label>
            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input-field" rows={2} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Price (₹)</label>
              <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} required className="input-field" />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Stock Quantity</label>
              <input type="number" value={formData.stock_quantity} onChange={e => setFormData({ ...formData, stock_quantity: Number(e.target.value) })} required className="input-field" />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Image URL</label>
            <input type="text" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="input-field" />
          </div>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.is_veg} onChange={e => setFormData({ ...formData, is_veg: e.target.checked })} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Vegetarian</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '0.5rem' }}>
            {editingItem ? 'Update Menu Item & Tags' : 'Create Menu Item'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
