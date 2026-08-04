import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/formatters';
import { Modal } from '../Common/Modal';
import { Plus, Edit, Trash2, FolderPlus, Layers, ChevronUp, ChevronDown } from 'lucide-react';

export const MenuManager = () => {
  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);

  // Item Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Category Manager Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Filter by category in admin table view
  const [filterCategoryId, setFilterCategoryId] = useState('all');

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
        setCategories(data.categories || []);
        setAllItems(data.allItems || []);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadMenu();
  }, []);

  // All flat subcategories for dropdown selection mapping
  const allSubcategories = categories.flatMap(c => (c.subcategories || []).map(s => ({
    ...s,
    category_name: c.name,
    category_id: c.id
  })));

  // Filtered items for the table
  const displayedItems = filterCategoryId === 'all'
    ? allItems
    : allItems.filter(item => {
        const sub = allSubcategories.find(s => s.id === item.subcategory_id);
        return sub && String(sub.category_id) === String(filterCategoryId);
      });

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

  // Reorder items: swap sort_order of two adjacent items
  const handleReorderItem = async (item, direction) => {
    const list = displayedItems;
    const idx = list.findIndex(i => i.id === item.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const swapItem = list[swapIdx];
    const sortA = swapItem.sort_order != null ? swapItem.sort_order : swapIdx;
    const sortB = item.sort_order != null ? item.sort_order : idx;
    try {
      await fetchAPI(`/menu/items/${item.id}/sort`, {
        method: 'PATCH',
        body: JSON.stringify({ sort_order: sortA })
      });
      await fetchAPI(`/menu/items/${swapItem.id}/sort`, {
        method: 'PATCH',
        body: JSON.stringify({ sort_order: sortB })
      });
      loadMenu();
    } catch (err) {
      console.error('Item reorder failed:', err);
    }
  };

  // Reorder categories: swap sort_order of two adjacent categories
  const handleReorderCategory = async (cat, direction) => {
    const idx = categories.findIndex(c => c.id === cat.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    const swapCat = categories[swapIdx];
    const sortA = swapCat.sort_order != null ? swapCat.sort_order : swapIdx;
    const sortB = cat.sort_order != null ? cat.sort_order : idx;
    try {
      await fetchAPI(`/menu/categories/${cat.id}/sort`, {
        method: 'PATCH',
        body: JSON.stringify({ sort_order: sortA })
      });
      await fetchAPI(`/menu/categories/${swapCat.id}/sort`, {
        method: 'PATCH',
        body: JSON.stringify({ sort_order: sortB })
      });
      loadMenu();
    } catch (err) {
      console.error('Category reorder failed:', err);
    }
  };

  // Add Main Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await fetchAPI('/menu/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim(),
          sort_order: categories.length + 1
        })
      });
      // Automatically create a default subcategory container for this main category
      if (res && res.id) {
        await fetchAPI('/menu/subcategories', {
          method: 'POST',
          body: JSON.stringify({
            category_id: res.id,
            name: `${newCatName.trim()} Items`,
            sort_order: 0
          })
        });
      }
      setNewCatName('');
      setNewCatDesc('');
      loadMenu();
      alert('New Main Category added successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Main Category
  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Are you sure you want to delete Main Category '${catName}'?`)) return;
    try {
      await fetchAPI(`/menu/categories/${catId}`, { method: 'DELETE' });
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
            Menu Categories & Dishes Manager
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Use ↑↓ arrows to reorder categories and dishes shown to customers
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setIsCatModalOpen(true)} className="btn btn-secondary" style={{ gap: '0.4rem' }}>
            <FolderPlus size={16} />
            <span>Manage Main Categories</span>
          </button>
          <button onClick={handleOpenAdd} className="btn btn-primary" style={{ gap: '0.4rem' }}>
            <Plus size={18} />
            <span>Add New Dish</span>
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Filter by Category:</span>
        <select
          className="input-field"
          value={filterCategoryId}
          onChange={e => setFilterCategoryId(e.target.value)}
          style={{ width: 'auto', minWidth: '180px', padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Items Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.75rem', width: '60px' }}>Order</th>
              <th style={{ padding: '0.75rem' }}>Dish & Subtitle</th>
              <th style={{ padding: '0.75rem' }}>Category</th>
              <th style={{ padding: '0.75rem' }}>Tags</th>
              <th style={{ padding: '0.75rem' }}>Price</th>
              <th style={{ padding: '0.75rem' }}>Stock</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedItems.map((item, idx) => {
              const subObj = allSubcategories.find(s => s.id === item.subcategory_id);
              const catName = subObj ? subObj.category_name : 'General';
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleReorderItem(item, 'up')}
                        disabled={idx === 0}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.15rem 0.3rem', opacity: idx === 0 ? 0.3 : 1 }}
                        title="Move Up"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        onClick={() => handleReorderItem(item, 'down')}
                        disabled={idx === displayedItems.length - 1}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.15rem 0.3rem', opacity: idx === displayedItems.length - 1 ? 0.3 : 1 }}
                        title="Move Down"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      {item.subtitle && <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 600 }}>{item.subtitle}</div>}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', fontWeight: 700 }}>{catName}</td>
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

      {/* Main Category Management Modal */}
      <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title="Manage Main Menu Categories">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'var(--bg-surface-elevated)', borderRadius: '10px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Add New Main Category</h4>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Snacks, Soups, Chef Specials"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              required
            />
            <input
              type="text"
              className="input-field"
              placeholder="Description (Optional)"
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }}>
              <Plus size={16} /> Add Category
            </button>
          </form>

          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Existing Main Categories</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
              {categories.map((cat, idx) => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      onClick={() => handleReorderCategory(cat, 'up')}
                      disabled={idx === 0}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.15rem 0.3rem', opacity: idx === 0 ? 0.3 : 1 }}
                      title="Move Up"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={() => handleReorderCategory(cat, 'down')}
                      disabled={idx === categories.length - 1}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.15rem 0.3rem', opacity: idx === categories.length - 1 ? 0.3 : 1 }}
                      title="Move Down"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{idx + 1}. {cat.name}</span>
                    {cat.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat.description}</div>}
                  </div>
                  <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="btn btn-danger btn-sm" style={{ padding: '0.3rem 0.6rem' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Item Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Edit Dish' : 'Add New Dish'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Select Main Category</label>
            <select
              className="input-field"
              value={formData.subcategory_id}
              onChange={(e) => setFormData({ ...formData, subcategory_id: Number(e.target.value) })}
            >
              {allSubcategories.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.category_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Dish Name</label>
              <input type="text" required className="input-field" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Subtitle / Highlight</label>
              <input type="text" className="input-field" value={formData.subtitle} onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Price (₹)</label>
              <input type="number" step="1" required className="input-field" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Stock Quantity</label>
              <input type="number" required className="input-field" value={formData.stock_quantity} onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })} />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Dietary Type</label>
              <select className="input-field" value={formData.is_veg ? 'veg' : 'nonveg'} onChange={(e) => setFormData({ ...formData, is_veg: e.target.value === 'veg' })}>
                <option value="veg">🟢 Veg</option>
                <option value="nonveg">🔴 Non-Veg</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Tags (comma-separated)</label>
            <input type="text" className="input-field" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="e.g. Creamy, Mild, Spicy" />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Description</label>
            <textarea className="input-field" rows="2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Image URL</label>
            <input type="url" className="input-field" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Dish</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
