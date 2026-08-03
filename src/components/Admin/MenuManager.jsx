import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/formatters';
import { Modal } from '../Common/Modal';
import { Plus, Edit, Trash2, FolderPlus, Tag, Layers } from 'lucide-react';

export const MenuManager = () => {
  const [menuTree, setMenuTree] = useState([]);
  const [allItems, setAllItems] = useState([]);

  // Item Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Subcategory Manager Modal
  const [isSubcatModalOpen, setIsSubcatModalOpen] = useState(false);
  const [newSubcatName, setNewSubcatName] = useState('');
  const [selectedCatForSubcat, setSelectedCatForSubcat] = useState('');

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
        if (data.categories && data.categories.length > 0) {
          setSelectedCatForSubcat(data.categories[0].id);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadMenu();
  }, []);

  // All flat subcategories for dropdown selection
  const allSubcategories = menuTree.flatMap(c => (c.subcategories || []).map(s => ({
    ...s,
    category_name: c.name
  })));

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      subcategory_id: allSubcategories[0]?.id || 1,
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

  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    if (!newSubcatName.trim() || !selectedCatForSubcat) return;
    try {
      await fetchAPI('/menu/subcategories', {
        method: 'POST',
        body: JSON.stringify({
          category_id: Number(selectedCatForSubcat),
          name: newSubcatName.trim(),
          sort_order: 0
        })
      });
      setNewSubcatName('');
      loadMenu();
      alert('New Subtype / Subcategory added successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSubcategory = async (subId, subName) => {
    if (!window.confirm(`Are you sure you want to delete subcategory '${subName}'?`)) return;
    try {
      await fetchAPI(`/menu/subcategories/${subId}`, { method: 'DELETE' });
      loadMenu();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers style={{ color: 'var(--brand-primary)' }} />
            Menu Categories, Subtypes & Items Manager
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage Starters, Main Course, Beverages, Desserts, and custom Subtypes / Dishes
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setIsSubcatModalOpen(true)} className="btn btn-secondary" style={{ gap: '0.4rem' }}>
            <FolderPlus size={16} />
            <span>Manage Subtypes</span>
          </button>
          <button onClick={handleOpenAdd} className="btn btn-primary" style={{ gap: '0.4rem' }}>
            <Plus size={18} />
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.75rem' }}>Dish & Subtitle</th>
              <th style={{ padding: '0.75rem' }}>Category & Subtype</th>
              <th style={{ padding: '0.75rem' }}>Tags</th>
              <th style={{ padding: '0.75rem' }}>Price</th>
              <th style={{ padding: '0.75rem' }}>Stock</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allItems.map(item => {
              const subObj = allSubcategories.find(s => s.id === item.subcategory_id);
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      {item.subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600 }}>{item.subtitle}</div>}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                    {subObj ? (
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{subObj.category_name}</div>
                        <span style={{ color: 'var(--text-muted)' }}>Subtype: {subObj.name}</span>
                      </div>
                    ) : 'Default Category'}
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
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <button onClick={() => handleOpenEdit(item)} className="btn btn-secondary btn-sm" style={{ marginRight: '0.4rem' }}>
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDeleteItem(item.id)} className="btn btn-danger btn-sm">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Subcategory / Subtype Management Modal */}
      <Modal isOpen={isSubcatModalOpen} onClose={() => setIsSubcatModalOpen(false)} title="Manage Categories & Subtypes">
        <div>
          {/* Add Subtype Form */}
          <form onSubmit={handleAddSubcategory} style={{ padding: '1rem', background: 'var(--bg-surface-elevated)', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', fontWeight: 700 }}>Add New Subtype (e.g. Starters, Soups, Desserts)</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem' }}>Main Category:</label>
                <select value={selectedCatForSubcat} onChange={e => setSelectedCatForSubcat(e.target.value)} className="input-field" style={{ fontSize: '0.85rem' }}>
                  {menuTree.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', marginBottom: '0.3rem' }}>Subtype / Subcategory Name:</label>
                <input
                  type="text"
                  required
                  value={newSubcatName}
                  onChange={e => setNewSubcatName(e.target.value)}
                  placeholder="e.g. Tandoori Starters or Shakes"
                  className="input-field"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '0.4rem' }}>
              <Plus size={16} />
              <span>Create New Subtype</span>
            </button>
          </form>

          {/* List Existing Subcategories */}
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Existing Subtypes List</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
            {menuTree.map(cat => (
              <div key={cat.id} style={{ marginBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  Category: {cat.name}
                </div>
                {(cat.subcategories || []).map(sub => (
                  <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '0.3rem', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>• {sub.name}</span>
                    <button type="button" onClick={() => handleDeleteSubcategory(sub.id, sub.name)} className="btn btn-danger btn-sm" style={{ padding: '0.2rem 0.4rem' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Add / Edit Item Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Edit Dish & Subtitle' : 'Add New Dish'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Select Subtype / Category</label>
            <select
              value={formData.subcategory_id}
              onChange={e => setFormData({ ...formData, subcategory_id: Number(e.target.value) })}
              className="input-field"
              style={{ fontWeight: 600 }}
            >
              {allSubcategories.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.category_name} ➔ {sub.name}
                </option>
              ))}
            </select>
          </div>

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
            {editingItem ? 'Update Menu Item' : 'Create Menu Item'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
