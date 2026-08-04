import React, { useState, useEffect, useContext, useCallback } from 'react';
import { TableSessionHeader } from './TableSessionHeader';
import { CategoryTabs } from './CategoryTabs';
import { MenuGrid } from './MenuGrid';
import { ItemCustomizationModal } from './ItemCustomizationModal';
import { CartDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';
import { OrderTracker } from './OrderTracker';
import { GoogleReviewModal } from './GoogleReviewModal';
import { OrderHistoryModal } from './OrderHistoryModal';
import { AamantranSplash } from './AamantranSplash';
import { BottomCartBar } from './BottomCartBar';
import { WelcomeLanding } from './WelcomeLanding';
import { PageSkeleton } from '../Common/PageSkeleton';
import { fetchAPI } from '../../utils/api';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';

export const CustomerPanel = () => {
  const { socket, joinRoom } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  // Show splash ONLY ONCE per session on first load
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('aamantran_splash_shown');
  });
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  const handleSplashComplete = () => {
    sessionStorage.setItem('aamantran_splash_shown', 'true');
    setShowSplash(false);
  };

  const [categories, setCategories] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('T-01');

  // Check if table parameter is present in URL
  const hasTableParam = Boolean(new URLSearchParams(window.location.search).get('table'));

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
  const [tamperAlert, setTamperAlert] = useState(false);

  // Parse query param table with anti-tamper session security
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    if (tableParam) {
      const cleanTable = tableParam.toUpperCase();
      const storedScannedTable = sessionStorage.getItem('scanned_table_qr');

      if (!storedScannedTable) {
        // Initial physical QR scan -> lock table session
        sessionStorage.setItem('scanned_table_qr', cleanTable);
        setSelectedTable(cleanTable);
      } else if (storedScannedTable !== cleanTable) {
        // URL tampering detected! Revert to original scanned table
        setTamperAlert(true);
        setSelectedTable(storedScannedTable);
      } else {
        setSelectedTable(cleanTable);
      }
    }
  }, []);

  // Fetch Menu and Tables
  useEffect(() => {
    setIsLoadingMenu(true);
    fetchAPI('/menu')
      .then(data => {
        setCategories(data.categories || []);
        setAllItems(data.allItems || []);
      })
      .catch(err => console.error('Menu load error:', err))
      .finally(() => setIsLoadingMenu(false));

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
      const catObj = categories.find(c => String(c.id) === String(activeCategory));
      if (catObj) {
        const subcatIds = (catObj.subcategories || []).map(s => String(s.id));
        const matchesCategory = String(item.category_id) === String(activeCategory);
        const matchesSubcategory = subcatIds.includes(String(item.subcategory_id));
        
        if (activeSubcat !== 'all') {
          if (String(item.subcategory_id) !== String(activeSubcat)) return false;
        } else {
          if (!matchesCategory && !matchesSubcategory) return false;
        }
      } else {
        if (String(item.subcategory_id) !== String(activeCategory) && String(item.category_id) !== String(activeCategory)) {
          return false;
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
    <div>
      {showSplash && (
        <AamantranSplash
          tableNumber={selectedTable}
          onComplete={handleSplashComplete}
        />
      )}

      {/* Render Welcome Landing Hero Page ONLY for generic non-logged in visitors without QR table param */}
      {!hasTableParam && !user && (
        <WelcomeLanding
          onStartOrdering={() => {
            const menuSection = document.getElementById('menu-catalog-section');
            if (menuSection) menuSection.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      <div id="menu-catalog-section" className="container" style={{ padding: '1.5rem 1rem 4rem' }}>
        {tamperAlert && (
          <div style={{
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            border: '1px solid var(--danger)',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1rem',
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span>🔒 <b>Security Alert:</b> Manual URL table tampering blocked! Your session remains locked to your physical scanned <b>Table #{selectedTable}</b>.</span>
          </div>
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

        {isLoadingMenu ? (
          <PageSkeleton title="Loading Digital Menu..." />
        ) : (
          <>
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
          </>
        )}

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
    </div>
  );
};
