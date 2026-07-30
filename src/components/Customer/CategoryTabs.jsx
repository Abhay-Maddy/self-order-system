import React from 'react';

export const CategoryTabs = ({ categories, activeCategory, setActiveCategory, activeSubcat, setActiveSubcat }) => {
  if (!categories || !categories.length) return null;

  const currentCategoryObj = categories.find(c => c.id === activeCategory) || categories[0];

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => { setActiveCategory('all'); setActiveSubcat('all'); }}
          className={`btn ${activeCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '9999px', whiteSpace: 'nowrap' }}
        >
          All Items
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); setActiveSubcat('all'); }}
            className={`btn ${activeCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '9999px', whiteSpace: 'nowrap' }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Subcategory Pills */}
      {activeCategory !== 'all' && currentCategoryObj && currentCategoryObj.subcategories && (
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginTop: '0.75rem' }}>
          <button
            onClick={() => setActiveSubcat('all')}
            className={`btn btn-sm ${activeSubcat === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '8px', fontSize: '0.85rem' }}
          >
            All Subcategories
          </button>
          {currentCategoryObj.subcategories.map(sub => (
            <button
              key={sub.id}
              onClick={() => setActiveSubcat(sub.id)}
              className={`btn btn-sm ${activeSubcat === sub.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '8px', fontSize: '0.85rem' }}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
