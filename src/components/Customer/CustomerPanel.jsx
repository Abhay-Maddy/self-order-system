import React, { useState, useEffect, useContext } from 'react';
import { TableSessionHeader } from './TableSessionHeader';
import { CategoryTabs } from './CategoryTabs';
import { MenuGrid } from './MenuGrid';
import { ItemCustomizationModal } from './ItemCustomizationModal';
import { CartDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';
import { OrderTracker } from './OrderTracker';
import { GoogleReviewModal } from './GoogleReviewModal';
import { OrderHistoryModal } from './OrderHistoryModal';
import { AmantradhaSplash } from './AmantradhaSplash';
import { fetchAPI } from '../../utils/api';
import { SocketContext } from '../../context/SocketContext';

export const CustomerPanel = () => {
  const { socket, joinRoom } = useContext(SocketContext);
  const [showSplash, setShowSplash] = useState(true);

  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('T-01');

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubcat, setActiveSubcat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [cart, setCart] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [activeOrder, setActiveOrder] = useState(null);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Parse query param table e.g. ?table=T-04
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    if (tableParam) {
      setSelectedTable(tableParam.toUpperCase());
    }
  }, []);

  // Fetch Menu and Tables
  useEffect(() => {
    fetchAPI('/menu')
      .then(data => {
        setCategories(data.categories || []);
        setAllItems(data.allItems || []);
      })
      .catch(err => console.error('Menu load error:', err));

    fetchAPI('/tables')
      .then(data => setTables(data || []))
      .catch(err => console.error('Tables load error:', err));
  }, []);

  // Join table WebSocket room
  useEffect(() => {
    if (selectedTable) {
      joinRoom(`table_${selectedTable}`);
    }
  }, [selectedTable, socket]);

  // Real-time item status update listener
  useEffect(() => {
    if (!socket) return;

    const handleItemStatusUpdated = (data) => {
      if (activeOrder && (data.orderId === activeOrder.id || data.tableNumber === selectedTable)) {
        // Refresh live order state
        fetchAPI(`/orders/track/${activeOrder.id}`)
          .then(refreshedOrder => {
            setActiveOrder(refreshedOrder);
          })
          .catch(err => console.error('Failed to update live order status:', err));
      }
    };

    socket.on('item_status_updated', handleItemStatusUpdated);
    return () => {
      socket.off('item_status_updated', handleItemStatusUpdated);
    };
  }, [socket, activeOrder, selectedTable]);

  // Filter items
  const filteredItems = allItems.filter(item => {
    if (vegOnly && item.is_veg !== 1) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description && item.description.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    if (activeCategory !== 'all') {
      const catObj = categories.find(c => c.id === activeCategory);
      if (catObj && catObj.subcategories) {
        const subcatIds = catObj.subcategories.map(s => s.id);
        if (activeSubcat !== 'all') {
          if (item.subcategory_id !== activeSubcat) return false;
        } else {
          if (!subcatIds.includes(item.subcategory_id)) return false;
        }
      }
    }
    return true;
  });

  const handleAddToCart = (cartItem) => {
    setCart([...cart, cartItem]);
  };

  const handlePlaceOrderSuccess = async (orderPayload) => {
    const createdOrder = await fetchAPI('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload)
    });

    setActiveOrder(createdOrder);
    setCart([]);
    setAppliedCoupon(null);
    setIsOrderTrackerOpen(true);
    return createdOrder;
  };

  return (
    <div className="container" style={{ padding: '1.5rem 1rem 4rem' }}>
      {showSplash && (
        <AmantradhaSplash
          tableNumber={selectedTable}
          onComplete={() => setShowSplash(false)}
        />
      )}
      <TableSessionHeader
        selectedTable={selectedTable}
        setSelectedTable={setSelectedTable}
        tables={tables}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        vegOnly={vegOnly}
        setVegOnly={setVegOnly}
        cartItemCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        activeOrder={activeOrder}
        onOpenOrderTracker={() => setIsOrderTrackerOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      <CategoryTabs
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeSubcat={activeSubcat}
        setActiveSubcat={setActiveSubcat}
      />

      <MenuGrid
        items={filteredItems}
        onSelectItem={(item) => setSelectedItemForModal(item)}
      />

      {/* Floating Bottom Pop-Up Cart Bar */}
      <BottomCartBar
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Modals & Drawers */}
      <ItemCustomizationModal
        item={selectedItemForModal}
        isOpen={Boolean(selectedItemForModal)}
        onClose={() => setSelectedItemForModal(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        setCart={setCart}
        appliedCoupon={appliedCoupon}
        setAppliedCoupon={setAppliedCoupon}
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        tableNumber={selectedTable}
        appliedCoupon={appliedCoupon}
        onPlaceOrderSuccess={handlePlaceOrderSuccess}
      />

      <OrderTracker
        order={activeOrder}
        isOpen={isOrderTrackerOpen}
        onClose={() => setIsOrderTrackerOpen(false)}
        onOpenRating={() => setIsRatingOpen(true)}
      />

      <GoogleReviewModal
        isOpen={isRatingOpen}
        onClose={() => setIsRatingOpen(false)}
        orderId={activeOrder?.id}
      />

      <OrderHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectOrderToTrack={(ord) => {
          setActiveOrder(ord);
          setIsOrderTrackerOpen(true);
        }}
      />
    </div>
  );
};
