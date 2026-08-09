import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { TableSessionHeader } from './TableSessionHeader';
import { CategoryTabs } from './CategoryTabs';
import { MenuGrid } from './MenuGrid';
import { ItemCustomizationModal } from './ItemCustomizationModal';
import { CartDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';
import { OrderTracker } from './OrderTracker';
import { OrderStatusBar } from './OrderStatusBar';
import { GoogleReviewModal } from './GoogleReviewModal';
import { OrderHistoryModal } from './OrderHistoryModal';
import { AamantranSplash } from './AamantranSplash';
import { BottomCartBar } from './BottomCartBar';
import { WelcomeLanding } from './WelcomeLanding';
import { Modal } from '../Common/Modal';
import { Printer, Download, FileText, LayoutDashboard, X, Users, User, CheckCircle } from 'lucide-react';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { fetchAPI } from '../../utils/api';
import { SocketContext } from '../../context/SocketContext';
import { AuthContext } from '../../context/AuthContext';
import { safeStorage, safeSessionStorage } from '../../utils/storage';
import { PageSkeleton } from '../Common/PageSkeleton';


export const CustomerPanel = ({ setActivePanel }) => {
  const { socket, joinRoom } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const { tableNumber: urlTableNumber } = useParams(); // from /menu/:tableNumber or /*/customer-menu/:tableNumber
  const navigate = useNavigate();
  const location = useLocation();

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

  // --- Pending review state (for guest post-order review popup) ---
  const [pendingReviewData, setPendingReviewData] = useState(null);
  const [showPendingReview, setShowPendingReview] = useState(false);

  // Determine initial table: URL param takes priority, then ?table= query param
  const getInitialTable = () => {
    if (urlTableNumber) return urlTableNumber.toUpperCase();
    const qParam = new URLSearchParams(window.location.search).get('table');
    if (qParam) return qParam.toUpperCase();
    return 'T-01';
  };

  const [selectedTable, setSelectedTable] = useState(getInitialTable);
  const [orderFor, setOrderFor] = useState('customer'); // 'self' or 'customer'

  // Check if table parameter is present in URL (either path param or query param)
  const hasTableParam = Boolean(urlTableNumber) || Boolean(new URLSearchParams(window.location.search).get('table'));

  // "Who is ordering?" modal — ONLY shown to logged-in users, and only once per login session
  // Skipped automatically when:
  //   (a) user is NOT logged in (non-staff guest customers go straight to menu)
  //   (b) table is already set via QR param (?table=T-01)
  //   (c) already selected in this session
  const [showOrderSelectModal, setShowOrderSelectModal] = useState(false);
  const [modalOrderFor, setModalOrderFor] = useState('customer');
  const [modalTable, setModalTable] = useState('T-01');

  // Rejection notifications for customer (when kitchen rejects their item)
  const [rejectionToasts, setRejectionToasts] = useState([]);

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
  const [isCustomerBillOpen, setIsCustomerBillOpen] = useState(false);
  const [tamperAlert, setTamperAlert] = useState(false);

  // Parse query param / URL path table with anti-tamper session security
  useEffect(() => {
    if (urlTableNumber) {
      // From URL path param /menu/T-01 — set table directly (anti-tamper still applies)
      const cleanTable = urlTableNumber.toUpperCase();
      const storedScannedTable = safeSessionStorage.getItem('scanned_table_qr');
      if (!storedScannedTable) {
        safeSessionStorage.setItem('scanned_table_qr', cleanTable);
        setSelectedTable(cleanTable);
      } else if (storedScannedTable !== cleanTable) {
        setTamperAlert(true);
        setSelectedTable(storedScannedTable);
      } else {
        setSelectedTable(cleanTable);
      }
    } else {
      // Legacy: ?table= query param
      const params = new URLSearchParams(window.location.search);
      const tableParam = params.get('table');
      if (tableParam) {
        const cleanTable = tableParam.toUpperCase();
        const storedScannedTable = safeSessionStorage.getItem('scanned_table_qr');
        if (!storedScannedTable) {
          safeSessionStorage.setItem('scanned_table_qr', cleanTable);
          setSelectedTable(cleanTable);
        } else if (storedScannedTable !== cleanTable) {
          setTamperAlert(true);
          setSelectedTable(storedScannedTable);
        } else {
          setSelectedTable(cleanTable);
        }
      }
    }
  }, [urlTableNumber]);

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

  // Restore active order from localStorage on mount / reload
  useEffect(() => {
    const savedOrderId = safeStorage.getItem('aamantran_last_order_id');
    if (savedOrderId) {
      fetchAPI(`/orders/track/${savedOrderId}`)
        .then(order => {
          if (order && order.status !== 'completed' && order.status !== 'cancelled') {
            setActiveOrder(order);
          }
        })
        .catch(err => console.error('Failed to restore active order:', err));
    }
  }, []);

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

  // Show "Who is Ordering?" modal when a user logs in (not for guests)
  // Reset when user changes or logs out
  useEffect(() => {
    if (user && !hasTableParam && !sessionStorage.getItem('aamantran_order_mode_set')) {
      setShowOrderSelectModal(true);
    }
    if (!user) {
      // When user logs out, clear the session flag so next login re-triggers modal
      sessionStorage.removeItem('aamantran_order_mode_set');
      setShowOrderSelectModal(false);

      // Check for pending review for guest users
      try {
        const rawPending = safeStorage.getItem('aamantran_pending_review');
        if (rawPending) {
          const reviewData = JSON.parse(rawPending);
          const timeSince = Date.now() - (reviewData.completedAt || 0);
          // Show if it was from a previous session (>= 30s old) — simulates "next visit"
          if (timeSince >= 30000) {
            setPendingReviewData(reviewData);
            setShowPendingReview(true);
          }
        }
      } catch (e) {}
    }
  }, [user, hasTableParam]);

  // Listen for item rejections — show bell toast notification on customer's screen
  useEffect(() => {
    if (!socket) return;
    const handleRejection = (data) => {
      if (!data || data.status !== 'rejected') return;
      // Only show if it's for the current table or active order
      if (
        (activeOrder && (data.orderId === activeOrder.id || data.order_id === activeOrder.id)) ||
        (selectedTable && data.tableNumber === selectedTable)
      ) {
        const toast = {
          id: Date.now(),
          itemName: data.itemName || data.item_name || 'Item',
          reason: data.rejection_reason || data.rejectionReason || 'No stock available'
        };
        setRejectionToasts(prev => [toast, ...prev.slice(0, 2)]);
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
          setRejectionToasts(prev => prev.filter(t => t.id !== toast.id));
        }, 10000);
      }
    };
    socket.on('item_status_updated', handleRejection);
    return () => socket.off('item_status_updated', handleRejection);
  }, [socket, activeOrder, selectedTable]);

  const [sortBy, setSortBy] = useState('default'); // 'default', 'price_low', 'price_high', 'name'

  // Comprehensive Filter & Search logic
  const filteredItems = allItems.filter(item => {
    // 1. Dietary Type Filter (All / Veg Only / Non-Veg Only)
    if (vegOnly === 'veg' || vegOnly === true) {
      if (item.is_veg !== 1) return false;
    } else if (vegOnly === 'non_veg') {
      if (item.is_veg === 1) return false;
    }

    // 2. Multi-field Search Filter (Dish Name, Subtitle, Description, Tags, Category, Subcategory, Dietary Tags)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();

      const matchName = item.name && item.name.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle && item.subtitle.toLowerCase().includes(q);
      const matchDesc = item.description && item.description.toLowerCase().includes(q);
      const matchTags = item.tags && item.tags.toLowerCase().includes(q);
      const matchSpice = item.spice_level && item.spice_level.toLowerCase().includes(q);

      // Match Category Name & Subcategory Name
      let matchCat = false;
      const catObj = categories.find(c => String(c.id) === String(item.category_id));
      if (catObj) {
        if (catObj.name && catObj.name.toLowerCase().includes(q)) matchCat = true;
        const subObj = (catObj.subcategories || []).find(s => String(s.id) === String(item.subcategory_id));
        if (subObj && subObj.name && subObj.name.toLowerCase().includes(q)) matchCat = true;
      }
      if (item.category_name && item.category_name.toLowerCase().includes(q)) matchCat = true;
      if (item.subcategory_name && item.subcategory_name.toLowerCase().includes(q)) matchCat = true;

      // Match Dietary Type Tags directly in Search Box
      let matchDietary = false;
      if (['veg', 'vegetarian', 'pure veg', 'pure-veg'].includes(q)) {
        if (item.is_veg === 1) matchDietary = true;
      }
      if (['non veg', 'nonveg', 'non-veg', 'chicken', 'mutton', 'fish', 'egg'].includes(q)) {
        if (item.is_veg === 0) matchDietary = true;
      }
      if (q === 'vegan' && (item.is_vegan === 1 || (item.tags && item.tags.toLowerCase().includes('vegan')))) {
        matchDietary = true;
      }
      if ((q === 'gluten free' || q === 'gluten-free') && (item.is_gluten_free === 1 || (item.tags && item.tags.toLowerCase().includes('gluten')))) {
        matchDietary = true;
      }

      if (!matchName && !matchSubtitle && !matchDesc && !matchTags && !matchSpice && !matchCat && !matchDietary) {
        return false;
      }
    }

    if (activeCategory !== 'all') {
      const catObj = categories.find(c => String(c.id) === String(activeCategory));
      if (catObj) {
        const catNameLower = catObj.name.toLowerCase();
        const subcatIds = (catObj.subcategories || []).map(s => String(s.id));
        const matchesCategory = String(item.category_id) === String(activeCategory);
        const matchesSubcategory = subcatIds.includes(String(item.subcategory_id));
        const matchesTags = item.tags && item.tags.toLowerCase().includes(catNameLower);

        if (activeSubcat !== 'all') {
          const subObj = (catObj.subcategories || []).find(s => String(s.id) === String(activeSubcat));
          const subNameLower = subObj ? subObj.name.toLowerCase() : '';
          const matchesSubTag = subNameLower && item.tags && item.tags.toLowerCase().includes(subNameLower);
          if (String(item.subcategory_id) !== String(activeSubcat) && !matchesSubTag) return false;
        } else {
          if (!matchesCategory && !matchesSubcategory && !matchesTags) return false;
        }
      } else {
        if (String(item.subcategory_id) !== String(activeCategory) && String(item.category_id) !== String(activeCategory)) {
          return false;
        }
      }
    }
    return true;
  });

  const displayedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'price_low') return Number(a.price) - Number(b.price);
    if (sortBy === 'price_high') return Number(b.price) - Number(a.price);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const handleAddToCart = (cartItem) => {
    const newItem = {
      ...cartItem,
      cart_id: cartItem.cart_id || `cart_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    };
    setCart(prevCart => {
      const existingIdx = prevCart.findIndex(i =>
        i.id === newItem.id &&
        JSON.stringify(i.selected_variant) === JSON.stringify(newItem.selected_variant) &&
        JSON.stringify(i.selected_addons) === JSON.stringify(newItem.selected_addons)
      );

      if (existingIdx > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIdx].quantity + (newItem.quantity || 1);
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          total_price: (updated[existingIdx].unit_price || updated[existingIdx].price) * newQty
        };
        return updated;
      } else {
        return [...prevCart, newItem];
      }
    });
  };

  const updateQuantity = (cartId, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.cart_id === cartId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          const unitPrice = item.unit_price || item.price;
          return {
            ...item,
            quantity: newQty,
            total_price: unitPrice * newQty
          };
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Helper: build the correct URL for "Continue to Menu" based on current path context
  const buildMenuUrl = (table, pathContext) => {
    const path = pathContext || location.pathname;
    if (table === 'None' || !table) return path.startsWith('/') ? path.replace(/\/customer-menu.*/, '') : '/';
    // Extract role/name from current path for staff contexts
    const parts = path.split('/').filter(Boolean); // e.g. ['admin','john','customer-menu']
    if (parts[0] === 'admin' && parts[1]) return `/admin/${parts[1]}/customer-menu/${table}`;
    if (parts[0] === 'cashier' && parts[1]) return `/cashier/${parts[1]}/customer-menu/${table}`;
    if (parts[0] === 'waiter' && parts[1]) return `/waiter/${parts[1]}/customer-menu/${table}`;
    return `/menu/${table}`; // guest / generic
  };

  const handlePlaceOrderSuccess = async (orderPayload) => {
    const formattedPayload = {
      ...orderPayload,
      items: (orderPayload.items || []).map(it => ({
        ...it,
        item_id: it.item_id || it.id
      }))
    };

    const createdOrder = await fetchAPI('/orders', {
      method: 'POST',
      body: JSON.stringify(formattedPayload)
    });

    setActiveOrder(createdOrder);
    if (createdOrder && createdOrder.id) {
      safeStorage.setItem('aamantran_last_order_id', createdOrder.id);

      // For non-logged-in guests: save a pending review record
      if (!user) {
        try {
          safeStorage.setItem('aamantran_pending_review', JSON.stringify({
            orderId: createdOrder.id,
            orderNumber: createdOrder.order_number,
            items: formattedPayload.items || [],
            tableNumber: selectedTable,
            completedAt: Date.now()
          }));
        } catch (e) {}
      }
    }
    setCart([]);
    setAppliedCoupon(null);
    setIsOrderTrackerOpen(true);
    return createdOrder;
  };

  return (
    <div>
      {/* Rejection Bell Toasts — shown to customer when kitchen rejects their item */}
      {rejectionToasts.length > 0 && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99998,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          width: '100%',
          maxWidth: '420px',
          padding: '0 1rem',
          pointerEvents: 'none'
        }}>
          {rejectionToasts.map(toast => (
            <div
              key={toast.id}
              className="animate-slide-in"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.97), rgba(220,38,38,0.97))',
                color: '#fff',
                borderRadius: '14px',
                padding: '0.85rem 1.1rem',
                boxShadow: '0 8px 30px rgba(239,68,68,0.5)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                pointerEvents: 'auto'
              }}
            >
              <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🔔</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                  ❌ Order Item Rejected
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{toast.itemName}</div>
                <div style={{ fontSize: '0.78rem', opacity: 0.9, marginTop: '0.15rem' }}>
                  Reason: {toast.reason}
                </div>
              </div>
              <button
                onClick={() => setRejectionToasts(prev => prev.filter(t => t.id !== toast.id))}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', padding: '0.2rem 0.45rem', fontWeight: 800, flexShrink: 0 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {/* "Who is Ordering?" Modal — shown once per session when no QR param */}
      {showOrderSelectModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="glass-card animate-slide-up" style={{
            width: '100%',
            maxWidth: '420px',
            padding: '2rem 1.5rem',
            borderRadius: '20px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
            border: '1px solid var(--brand-primary)'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--brand-primary), #ea580c)',
                width: '56px', height: '56px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem', color: '#fff',
                boxShadow: '0 6px 20px rgba(249,115,22,0.4)'
              }}>
                <Users size={26} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.35rem' }}>Who is Ordering?</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Please select how you'd like to order</p>
            </div>

            {/* Self / Customer Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <button
                onClick={() => { setModalOrderFor('self'); setModalTable('None'); }}
                style={{
                  flex: 1,
                  padding: '1rem 0.5rem',
                  borderRadius: '14px',
                  border: `2px solid ${modalOrderFor === 'self' ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                  background: modalOrderFor === 'self' ? 'rgba(249,115,22,0.12)' : 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  fontWeight: 700
                }}
              >
                <span style={{ fontSize: '1.75rem' }}>🙋</span>
                <span style={{ fontSize: '0.9rem' }}>Self</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Ordering for yourself</span>
                {modalOrderFor === 'self' && <CheckCircle size={16} color="var(--brand-primary)" />}
              </button>
              <button
                onClick={() => { setModalOrderFor('customer'); if (modalTable === 'None') setModalTable('T-01'); }}
                style={{
                  flex: 1,
                  padding: '1rem 0.5rem',
                  borderRadius: '14px',
                  border: `2px solid ${modalOrderFor === 'customer' ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                  background: modalOrderFor === 'customer' ? 'rgba(249,115,22,0.12)' : 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  fontWeight: 700
                }}
              >
                <span style={{ fontSize: '1.75rem' }}>👥</span>
                <span style={{ fontSize: '0.9rem' }}>Customer</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Order for a table</span>
                {modalOrderFor === 'customer' && <CheckCircle size={16} color="var(--brand-primary)" />}
              </button>
            </div>

            {/* Table selector — shown only when Customer is chosen */}
            {modalOrderFor === 'customer' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  Select Table Number
                </label>
                <select
                  value={modalTable}
                  onChange={e => setModalTable(e.target.value)}
                  className="input-field"
                  style={{ fontWeight: 700 }}
                >
                  {(tables.length > 0 ? tables : [
                    { table_number: 'T-01' }, { table_number: 'T-02' }, { table_number: 'T-03' },
                    { table_number: 'T-04' }, { table_number: 'T-05' }, { table_number: 'T-06' }
                  ]).map((tb, i) => (
                    <option key={i} value={tb.table_number}>Table #{tb.table_number}</option>
                  ))}
                </select>
              </div>
            )}

            {/* For Self — show None option info */}
            {modalOrderFor === 'self' && (
              <div style={{
                marginBottom: '1.25rem',
                padding: '0.75rem 1rem',
                background: 'var(--bg-surface-elevated)',
                borderRadius: '10px',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)'
              }}>
                ℹ️ Ordering without a table assignment (takeaway / self-pickup)
              </div>
            )}

            {/* OK Button */}
            <button
              onClick={() => {
                const newTable = modalOrderFor === 'self' ? 'None' : modalTable;
                setOrderFor(modalOrderFor);
                setSelectedTable(newTable);
                sessionStorage.setItem('aamantran_order_mode_set', 'true');
                setShowOrderSelectModal(false);
                // Update URL to reflect the selected table
                const menuUrl = buildMenuUrl(newTable, location.pathname);
                navigate(menuUrl, { replace: true });
              }}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', fontWeight: 800, borderRadius: '12px' }}
            >
              Continue to Menu →
            </button>
          </div>
        </div>
      )}
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

      <div id="menu-catalog-section" className="container" style={{ padding: 'clamp(0.5rem, 2vw, 1.5rem) clamp(0.4rem, 1.5vw, 1rem) 4rem' }}>
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
          orderFor={orderFor}
          setOrderFor={setOrderFor}
          tables={tables}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          vegOnly={vegOnly}
          setVegOnly={setVegOnly}
          sortBy={sortBy}
          setSortBy={setSortBy}
          cartItemCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
          onOpenCart={() => setIsCartOpen(true)}
          activeOrder={activeOrder}
          onOpenOrderTracker={() => setIsOrderTrackerOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenBillInvoice={() => {
            if (activeOrder) {
              setIsCustomerBillOpen(true);
            } else {
              setIsHistoryOpen(true);
            }
          }}
          setActivePanel={setActivePanel}
        />

        {/* Inline Active Order Status Bar — Top of Menu Section */}
        <OrderStatusBar
          activeOrder={activeOrder}
          onOpenOrderTracker={() => setIsOrderTrackerOpen(true)}
        />

        {/* Active Filter & Sorting Pill Indicator */}
        {(sortBy !== 'default' || (vegOnly && vegOnly !== 'all') || searchQuery) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--brand-primary)',
            padding: '0.5rem 0.85rem',
            borderRadius: '10px',
            marginBottom: '1rem',
            fontSize: '0.82rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', fontWeight: 700 }}>
              <span style={{ color: 'var(--brand-primary)' }}>⚡ Active View:</span>
              {sortBy !== 'default' && (
                <span className="badge badge-primary">
                  Sort: {sortBy === 'price_low' ? '💰 Price Low-High' : sortBy === 'price_high' ? '💎 Price High-Low' : '🔤 Name (A-Z)'}
                </span>
              )}
              {(vegOnly === 'veg' || vegOnly === true) && (
                <span className="badge badge-veg">
                  🟢 Veg Only
                </span>
              )}
              {vegOnly === 'non_veg' && (
                <span className="badge badge-danger" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                  🔴 Non-Veg Only
                </span>
              )}
              {searchQuery && (
                <span className="badge badge-dinein">
                  🔍 "{searchQuery}"
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSortBy('default');
                setVegOnly(false);
                setSearchQuery('');
              }}
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                border: 'none',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
                transition: 'transform 0.15s ease'
              }}
              title="Remove active sorting & reset view"
            >
              <X size={16} />
            </button>
          </div>
        )}

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
              items={displayedItems}
              onSelectItem={(item) => setSelectedItemForModal(item)}
              onDirectAddToCart={(item) => {
                handleAddToCart({
                  item_id: item.id,
                  item_name: item.name,
                  image_url: item.image_url,
                  variant_name: null,
                  variant_price_modifier: 0,
                  spice_level: item.spice_level || 'medium',
                  toppings_summary: null,
                  toppings_price: 0,
                  fulfillment_type: 'dine_in',
                  quantity: 1,
                  unit_price: Number(item.price),
                  total_price: Number(item.price)
                });
              }}
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
          orderFor={orderFor}
          appliedCoupon={appliedCoupon}
          activeOrder={activeOrder}
          user={user}
          tables={tables}
          hasTableParam={hasTableParam}
          onPlaceOrderSuccess={handlePlaceOrderSuccess}
        />

        <OrderTracker
          order={activeOrder}
          isOpen={isOrderTrackerOpen}
          onClose={() => setIsOrderTrackerOpen(false)}
          onOpenRating={() => setIsRatingOpen(true)}
          onUpdateOrder={() => {
            if (activeOrder) {
              fetchAPI(`/orders/track/${activeOrder.id}`)
                .then(refreshed => setActiveOrder(refreshed))
                .catch(err => console.error(err));
            }
          }}
        />

        <GoogleReviewModal
          isOpen={isRatingOpen}
          onClose={() => setIsRatingOpen(false)}
          orderId={activeOrder?.id}
          order={activeOrder}
        />

        {/* Post-order guest review popup — shown on next visit after ordering */}
        <GoogleReviewModal
          isOpen={showPendingReview}
          onClose={() => {
            setShowPendingReview(false);
            setPendingReviewData(null);
            safeStorage.removeItem('aamantran_pending_review');
          }}
          onSkip={() => {
            setShowPendingReview(false);
            setPendingReviewData(null);
            safeStorage.removeItem('aamantran_pending_review');
          }}
          orderId={pendingReviewData?.orderId}
          order={pendingReviewData ? {
            id: pendingReviewData.orderId,
            order_number: pendingReviewData.orderNumber,
            items: pendingReviewData.items || []
          } : null}
        />

        <OrderHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onSelectOrderToTrack={(selectedOrd) => {
            setActiveOrder(selectedOrd);
            setIsOrderTrackerOpen(true);
          }}
        />

        {/* CUSTOMER BILL INVOICE MODAL */}
        {isCustomerBillOpen && activeOrder && (
          <Modal isOpen={isCustomerBillOpen} onClose={() => setIsCustomerBillOpen(false)} title={`Bill Invoice #${activeOrder.order_number}`}>
            <div>
              <div style={{ background: '#fff', color: '#000', padding: '1.25rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '0.6rem', marginBottom: '0.6rem' }}>
                  <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 900 }}>AAMANTRAN RESTAURANT</h3>
                  <div>Tax Invoice & Bill Receipt • Table #{activeOrder.table_number}</div>
                  <div>Date: {new Date(activeOrder.created_at).toLocaleString()}</div>
                  <div>Order Ref: #{activeOrder.order_number}</div>
                </div>

                <table style={{ width: '100%', marginBottom: '0.6rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000', textAlign: 'left' }}>
                      <th style={{ padding: '0.25rem 0' }}>Qty & Item</th>
                      <th style={{ padding: '0.25rem 0', textAlign: 'right' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeOrder.items || []).map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                        <td style={{ padding: '0.25rem 0' }}>
                          {it.quantity}x {it.item_name}
                          {it.fulfillment_type === 'packing' && ' [PACKING]'}
                        </td>
                        <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>
                          ₹{(it.total_price || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ borderTop: '1px dashed #000', paddingTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal (Total Revenue):</span>
                    <span>₹{(activeOrder.total_amount || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>CGST (2.5%):</span>
                    <span>₹{((activeOrder.tax_amount || 0) / 2).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>SGST (2.5%):</span>
                    <span>₹{((activeOrder.tax_amount || 0) / 2).toFixed(2)}</span>
                  </div>
                  {activeOrder.discount_amount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                      <span>Discount:</span>
                      <span>-₹{(activeOrder.discount_amount || 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '0.95rem', borderTop: '1px solid #000', paddingTop: '0.35rem', marginTop: '0.2rem' }}>
                    <span>GRAND TOTAL:</span>
                    <span>₹{(activeOrder.net_amount || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ marginTop: '0.35rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                    Payment: {(activeOrder.payment_mode || 'cash').toUpperCase()} ({(activeOrder.payment_status || 'pending').toUpperCase()})
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '0.75rem', paddingTop: '0.4rem', borderTop: '1px dashed #000', fontSize: '0.72rem' }}>
                  Thank you for dining at Aamantran! Visit again soon!
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button onClick={() => setIsCustomerBillOpen(false)} className="btn btn-secondary">Close</button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="btn btn-primary"
                  style={{ gap: '0.4rem' }}
                >
                  <Printer size={16} /> Download / Print Bill
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};
