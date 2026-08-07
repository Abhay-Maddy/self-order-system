import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatCurrency } from '../../utils/formatters';
import { Modal } from '../Common/Modal';
import { Plus, Edit, Trash2, FolderPlus, Layers, ChevronUp, ChevronDown, Image as ImageIcon, Upload, Link as LinkIcon } from 'lucide-react';

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
  const [imageInputType, setImageInputType] = useState('link'); // 'link' or 'gallery'

  const handleGalleryFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setFormData(prev => ({ ...prev, image_url: uploadEvent.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [formData, setFormData] = useState({
    subcategory_id: 1,
    name: '',
    subtitle: '',
    tags: '',
    description: '',
    price: 100,
    is_veg: true,
    dietary_type: 'veg', // 'veg', 'nonveg', 'egg', 'vegan', 'none'
    is_vegan: false,
    is_gluten_free: false,
    spice_level: 'medium',
    image_url: '',
    stock_quantity: 50,
    low_stock_threshold: 5,
    has_customization: false,
    variants: [
      { name: 'Half', price_modifier: 0, pieces: 4 },
      { name: 'Full', price_modifier: 80, pieces: 8 }
    ],
    toppings: [
      { name: 'Extra Cheese', price: 30 },
      { name: 'Garlic Butter', price: 20 },
      { name: 'Crispy Fries', price: 40 }
    ]
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
      dietary_type: 'veg',
      is_vegan: false,
      is_gluten_free: false,
      spice_level: 'medium',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      stock_quantity: 40,
      low_stock_threshold: 5,
      has_customization: false,
      variants: [
        { name: 'Half', price_modifier: 0, pieces: 4 },
        { name: 'Full', price_modifier: 80, pieces: 8 }
      ],
      toppings: [
        { name: 'Extra Cheese', price: 30 },
        { name: 'Garlic Butter', price: 20 },
        { name: 'Crispy Fries', price: 40 }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    let parsedVariants = [
      { name: 'Half', price_modifier: 0, pieces: 4 },
      { name: 'Full', price_modifier: 80, pieces: 8 }
    ];
    let parsedToppings = [
      { name: 'Extra Cheese', price: 30 },
      { name: 'Garlic Butter', price: 20 },
      { name: 'Crispy Fries', price: 40 }
    ];

    if (item.variants) {
      parsedVariants = typeof item.variants === 'string' ? JSON.parse(item.variants) : item.variants;
    }
    if (item.toppings) {
      parsedToppings = typeof item.toppings === 'string' ? JSON.parse(item.toppings) : item.toppings;
    }

    const dType = item.dietary_type || (item.is_veg ? 'veg' : 'nonveg');

    setFormData({
      subcategory_id: item.subcategory_id,
      name: item.name,
      subtitle: item.subtitle || '',
      tags: item.tags || '',
      description: item.description || '',
      price: item.price,
      is_veg: Boolean(item.is_veg),
      dietary_type: dType,
      is_vegan: Boolean(item.is_vegan),
      is_gluten_free: Boolean(item.is_gluten_free),
      spice_level: item.spice_level || 'medium',
      image_url: item.image_url || '',
      stock_quantity: item.stock_quantity,
      low_stock_threshold: item.low_stock_threshold,
      has_customization: Boolean(item.has_customization),
      variants: parsedVariants,
      toppings: parsedToppings
    });
    setIsModalOpen(true);
  };

  const [menuStatusMsg, setMenuStatusMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMenuStatusMsg('');
    try {
      if (editingItem) {
        await fetchAPI(`/menu/items/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setMenuStatusMsg(`✓ Dish '${formData.name}' updated successfully!`);
      } else {
        await fetchAPI('/menu/items', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setMenuStatusMsg(`✓ New Dish '${formData.name}' added successfully!`);
      }
      setIsModalOpen(false);
      loadMenu();
      setTimeout(() => setMenuStatusMsg(''), 4000);
    } catch (err) {
      setMenuStatusMsg(`⚠️ Error: ${err.message}`);
    }
  };

  // Delete Dish
  const handleDeleteItem = async (itemId) => {
    try {
      await fetchAPI(`/menu/items/${itemId}`, { method: 'DELETE' });
      setMenuStatusMsg('✓ Dish deleted successfully.');
      loadMenu();
      setTimeout(() => setMenuStatusMsg(''), 4000);
    } catch (err) {
      setMenuStatusMsg(`⚠️ Error: ${err.message}`);
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
      setMenuStatusMsg(`✓ Main Category '${newCatName.trim()}' added successfully!`);
      loadMenu();
      setTimeout(() => setMenuStatusMsg(''), 4000);
    } catch (err) {
      setMenuStatusMsg(`⚠️ Error: ${err.message}`);
    }
  };

  // Delete Main Category
  const handleDeleteCategory = async (catId, catName) => {
    try {
      await fetchAPI(`/menu/categories/${catId}`, { method: 'DELETE' });
      setMenuStatusMsg(`✓ Main Category '${catName}' deleted.`);
      loadMenu();
      setTimeout(() => setMenuStatusMsg(''), 4000);
    } catch (err) {
      setMenuStatusMsg(`⚠️ Error: ${err.message}`);
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

      {menuStatusMsg && (
        <div style={{
          padding: '0.65rem 1rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '1rem',
          background: menuStatusMsg.startsWith('✓') ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: menuStatusMsg.startsWith('✓') ? 'var(--success)' : 'var(--danger)',
          border: `1px solid ${menuStatusMsg.startsWith('✓') ? 'var(--success)' : 'var(--danger)'}`
        }}>
          {menuStatusMsg}
        </div>
      )}

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
                    {item.dietary_type !== 'none' && (
                      <span
                        className={`badge ${item.dietary_type === 'nonveg' ? 'badge-nonveg' : 'badge-veg'}`}
                        style={{ marginRight: '0.3rem', fontSize: '0.72rem' }}
                      >
                        {item.dietary_type === 'nonveg' ? '🔴 NON-VEG' : item.dietary_type === 'egg' ? '🥚 EGG' : item.dietary_type === 'vegan' ? '🌱 VEGAN' : '🟢 VEG'}
                      </span>
                    )}
                    {typeof item.tags === 'string' && item.tags.trim() && item.tags.split(',').map((t, i) => (
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
                  <td style={{ padding: '0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', gap: '0.3rem' }}
                        title="Edit Dish & Customizations"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', gap: '0.3rem' }}
                        title="Delete Dish"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
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
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.3rem' }}>Dietary Type Tag</label>
              <select
                className="input-field"
                value={formData.dietary_type || (formData.is_veg ? 'veg' : 'nonveg')}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    dietary_type: val,
                    is_veg: val === 'veg' || val === 'vegan'
                  });
                }}
              >
                <option value="veg">🟢 Veg</option>
                <option value="nonveg">🔴 Non-Veg</option>
                <option value="egg">🥚 Contains Egg</option>
                <option value="vegan">🌱 Vegan</option>
                <option value="none">⚪ None (No Badge Shown)</option>
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

          {/* CUSTOMIZATION OPTIONS BUILDER */}
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--brand-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--brand-primary)' }}>Enable Customization Modal &amp; Options</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>If enabled, diners can choose portion sizes (Half/Full/Large/XL) &amp; extra toppings.</div>
              </div>
              <input
                type="checkbox"
                checked={formData.has_customization}
                onChange={(e) => setFormData({ ...formData, has_customization: e.target.checked })}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            {formData.has_customization && (
              <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                {/* 1. Portion Sizes Builder */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.82rem' }}>📐 Portion / Size Options (Editable):</label>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        variants: [...(formData.variants || []), { name: 'Large', price_modifier: 120, pieces: 10 }]
                      })}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      <Plus size={12} /> Add Size
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {(formData.variants || []).map((v, vIdx) => (
                      <div key={vIdx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.4rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => {
                            const newV = [...formData.variants];
                            newV[vIdx].name = e.target.value;
                            setFormData({ ...formData, variants: newV });
                          }}
                          className="input-field"
                          placeholder="e.g. Half / Full / Extra Large"
                          style={{ padding: '0.25rem 0.4rem', fontSize: '0.8rem' }}
                        />
                        <input
                          type="number"
                          value={v.price_modifier}
                          onChange={(e) => {
                            const newV = [...formData.variants];
                            newV[vIdx].price_modifier = Number(e.target.value);
                            setFormData({ ...formData, variants: newV });
                          }}
                          className="input-field"
                          placeholder="+₹ Price"
                          style={{ padding: '0.25rem 0.4rem', fontSize: '0.8rem' }}
                        />
                        <input
                          type="number"
                          value={v.pieces || 0}
                          onChange={(e) => {
                            const newV = [...formData.variants];
                            newV[vIdx].pieces = Number(e.target.value);
                            setFormData({ ...formData, variants: newV });
                          }}
                          className="input-field"
                          placeholder="Pcs"
                          style={{ padding: '0.25rem 0.4rem', fontSize: '0.8rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newV = formData.variants.filter((_, i) => i !== vIdx);
                            setFormData({ ...formData, variants: newV });
                          }}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.25rem 0.4rem' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Extra Toppings / Add-ons Builder */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.82rem' }}>🧀 Extra Toppings &amp; Add-ons (Editable):</label>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        toppings: [...(formData.toppings || []), { name: 'Extra Cheese', price: 30 }]
                      })}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      <Plus size={12} /> Add Topping
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {(formData.toppings || []).map((top, tIdx) => (
                      <div key={tIdx} style={{ display: 'grid', gridTemplateColumns: '3fr 2fr auto', gap: '0.4rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={top.name}
                          onChange={(e) => {
                            const newT = [...formData.toppings];
                            newT[tIdx].name = e.target.value;
                            setFormData({ ...formData, toppings: newT });
                          }}
                          className="input-field"
                          placeholder="e.g. Extra Cheese / Garlic Dip"
                          style={{ padding: '0.25rem 0.4rem', fontSize: '0.8rem' }}
                        />
                        <input
                          type="number"
                          value={top.price}
                          onChange={(e) => {
                            const newT = [...formData.toppings];
                            newT[tIdx].price = Number(e.target.value);
                            setFormData({ ...formData, toppings: newT });
                          }}
                          className="input-field"
                          placeholder="+₹ Price"
                          style={{ padding: '0.25rem 0.4rem', fontSize: '0.8rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newT = formData.toppings.filter((_, i) => i !== tIdx);
                            setFormData({ ...formData, toppings: newT });
                          }}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.25rem 0.4rem' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
              Dish Photo Option:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setImageInputType('link')}
                className={`btn btn-sm ${imageInputType === 'link' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ gap: '0.4rem', fontSize: '0.8rem' }}
              >
                <LinkIcon size={14} />
                <span>Option 1: Paste Link URL</span>
              </button>

              <button
                type="button"
                onClick={() => setImageInputType('gallery')}
                className={`btn btn-sm ${imageInputType === 'gallery' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ gap: '0.4rem', fontSize: '0.8rem' }}
              >
                <ImageIcon size={14} />
                <span>Option 2: Pick from Gallery / Device</span>
              </button>
            </div>

            {imageInputType === 'link' ? (
              <div>
                <input
                  type="text"
                  className="input-field"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            ) : (
              <div style={{ border: '2px dashed var(--border-color)', padding: '1rem', borderRadius: '10px', textAlign: 'center', background: 'var(--bg-surface-elevated)' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryFileSelect}
                  style={{ display: 'none' }}
                  id="gallery-file-input"
                />
                <label htmlFor="gallery-file-input" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', gap: '0.4rem', display: 'inline-flex' }}>
                  <Upload size={14} /> Choose Photo from Device / Gallery
                </label>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Supports PNG, JPG, WEBP photos from your gallery
                </div>
              </div>
            )}

            {/* Live Image Preview */}
            {formData.image_url && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <img
                  src={formData.image_url}
                  alt="Dish preview"
                  style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'; }}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  ✅ Image Ready & Previewed
                </span>
              </div>
            )}
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
