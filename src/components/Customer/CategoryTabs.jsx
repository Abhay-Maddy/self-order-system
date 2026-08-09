import React from 'react';

export const CategoryTabs = ({ categories, activeCategory, setActiveCategory, activeSubcat, setActiveSubcat }) => {
  if (!categories || !categories.length) return null;

  const currentCategoryObj = categories.find(c => String(c.id) === String(activeCategory)) || categories[0];

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Category Tabs */}
      <div className="category-tabs-wrapper" style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
        <button
          onClick={() => { setActiveCategory('all'); setActiveSubcat('all'); }}
          className={`btn ${activeCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '9999px', whiteSpace: 'nowrap' }}
        >
          All Items
        </button>
        {categories.map(cat => {
          const isActive = String(activeCategory) === String(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setActiveSubcat('all'); }}
              className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: '9999px', whiteSpace: 'nowrap' }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Subcategory Pills (Only if subcategories exist & more than 1) */}
      {activeCategory !== 'all' && currentCategoryObj && currentCategoryObj.subcategories && currentCategoryObj.subcategories.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginTop: '0.75rem' }}>
          <button
            onClick={() => setActiveSubcat('all')}
            className={`btn btn-sm ${activeSubcat === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '8px', fontSize: '0.85rem' }}
          >
            All Subcategories
          </button>
          {currentCategoryObj.subcategories.map(sub => {
            const isSubActive = String(activeSubcat) === String(sub.id);
            return (
              <button
                key={sub.id}
                onClick={() => setActiveSubcat(sub.id)}
                className={`btn btn-sm ${isSubActive ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: '8px', fontSize: '0.85rem' }}
              >
                {sub.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
