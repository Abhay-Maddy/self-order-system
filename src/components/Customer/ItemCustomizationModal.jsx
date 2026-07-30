import React, { useState, useContext } from 'react';
import { Modal } from '../Common/Modal';
import { formatCurrency } from '../../utils/formatters';
import { LanguageContext } from '../../context/LanguageContext';
import { Flame, ShoppingBag } from 'lucide-react';

export const ItemCustomizationModal = ({ item, isOpen, onClose, onAddToCart }) => {
  const { t } = useContext(LanguageContext);
  if (!item) return null;

  const [selectedVariant, setSelectedVariant] = useState(
    item.variants && item.variants.length > 0 ? item.variants[0] : null
  );
  const [spiceLevel, setSpiceLevel] = useState(item.spice_level || 'medium');
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [fulfillmentType, setFulfillmentType] = useState('dine_in'); // 'dine_in' or 'packing'
  const [quantity, setQuantity] = useState(1);

  // Available toppings presets
  const availableToppings = [
    { name: 'Extra Cheese', price: 40 },
    { name: 'Garlic Butter Dip', price: 25 },
    { name: 'Crispy Fried Garlic', price: 20 },
  ];

  const toggleTopping = (topping) => {
    if (selectedToppings.some(t => t.name === topping.name)) {
      setSelectedToppings(selectedToppings.filter(t => t.name !== topping.name));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const calculateUnitPrice = () => {
    let price = item.price;
    if (selectedVariant) price += selectedVariant.price_modifier;
    selectedToppings.forEach(t => price += t.price);
    return price;
  };

  const handleAdd = () => {
    const unitPrice = calculateUnitPrice();
    const cartItem = {
      cart_id: `${item.id}-${selectedVariant ? selectedVariant.name : 'std'}-${spiceLevel}-${fulfillmentType}-${Date.now()}`,
      item_id: item.id,
      item_name: item.name,
      image_url: item.image_url,
      variant_name: selectedVariant ? selectedVariant.name : null,
      variant_price_modifier: selectedVariant ? selectedVariant.price_modifier : 0,
      spice_level: spiceLevel,
      toppings_summary: selectedToppings.map(t => t.name).join(', '),
      toppings_price: selectedToppings.reduce((sum, t) => sum + t.price, 0),
      fulfillment_type: fulfillmentType,
      quantity,
      unit_price: unitPrice,
      total_price: unitPrice * quantity
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item.name}>
      <div>
        {/* Description & Base price */}
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {item.description}
        </p>

        {/* Fulfillment Choice (C7: Per-item Dine-In vs Packing) */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Fulfillment Preference for this item:
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setFulfillmentType('dine_in')}
              className={`btn ${fulfillmentType === 'dine_in' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, fontSize: '0.85rem' }}
            >
              🍽️ {t('dineIn')}
            </button>
            <button
              onClick={() => setFulfillmentType('packing')}
              className={`btn ${fulfillmentType === 'packing' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, fontSize: '0.85rem' }}
            >
              📦 {t('packing')}
            </button>
          </div>
        </div>

        {/* Variants Selection */}
        {item.variants && item.variants.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Select Size / Portion:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {item.variants.map(variant => (
                <label
                  key={variant.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.9rem',
                    background: selectedVariant?.name === variant.name ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                    border: `1px solid ${selectedVariant?.name === variant.name ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--border-radius-sm)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="radio"
                      name="variant"
                      checked={selectedVariant?.name === variant.name}
                      onChange={() => setSelectedVariant(variant)}
                    />
                    <span style={{ fontWeight: 600 }}>{variant.name}</span>
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                    {formatCurrency(item.price + variant.price_modifier)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Spice Level Selection */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            <Flame size={16} inline style={{ color: 'var(--danger)' }} /> Select Spice Level:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['mild', 'medium', 'hot'].map(level => (
              <button
                key={level}
                type="button"
                onClick={() => setSpiceLevel(level)}
                className={`btn btn-sm ${spiceLevel === level ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, textTransform: 'capitalize' }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Toppings Multi-Select */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Add Extra Toppings:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {availableToppings.map(topping => {
              const isChecked = selectedToppings.some(t => t.name === topping.name);
              return (
                <label
                  key={topping.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.8rem',
                    background: isChecked ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                    border: `1px solid ${isChecked ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--border-radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleTopping(topping)}
                    />
                    <span>{topping.name}</span>
                  </div>
                  <span>+{formatCurrency(topping.price)}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Quantity Controls & Add Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-surface-elevated)', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="btn btn-secondary btn-sm"
              style={{ width: '28px', height: '28px', padding: 0 }}
            >
              -
            </button>
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="btn btn-secondary btn-sm"
              style={{ width: '28px', height: '28px', padding: 0 }}
            >
              +
            </button>
          </div>

          <button onClick={handleAdd} className="btn btn-primary btn-lg" style={{ gap: '0.5rem' }}>
            <ShoppingBag size={18} />
            <span>Add Item - {formatCurrency(calculateUnitPrice() * quantity)}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
