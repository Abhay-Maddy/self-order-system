import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { fetchAPI } from '../../utils/api';
import { formatCurrency, formatTime, getTodayDateString, getLocalDateString } from '../../utils/formatters';
import { Modal } from '../Common/Modal';
import { GSTInvoiceModal } from './GSTInvoiceModal';
import { IndianRupee, ShoppingBag, Clock, Flame, Star, Printer, CheckCircle, RefreshCw, Calendar, Search, Utensils, CreditCard, AlertCircle, RotateCcw, ChevronDown } from 'lucide-react';
import { SocketContext } from '../../context/SocketContext';
import { playKitchenChime } from '../../utils/sound';

export const DashboardOverview = ({ setActivePanel }) => {
  const { socket, connected, joinRoom } = useContext(SocketContext);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString());
  const [searchQuery, setSearchQuery] = useState('');
  const [printingOrders, setPrintingOrders] = useState([]);

  // Checkbox selection & keyboard shortcut state
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

  // Active dropdown popovers state
  const [activePayDropdownId, setActivePayDropdownId] = useState(null);
  const [activeRefundDropdownId, setActiveRefundDropdownId] = useState(null);

  // Split payment modal state
  const [splitPayOrder, setSplitPayOrder] = useState(null);
  const [cashPaidInput, setCashPaidInput] = useState('');
  const [onlinePaidInput, setOnlinePaidInput] = useState('');

  // Refund modal state
  const [refundingOrder, setRefundingOrder] = useState(null);
  const [refundMode, setRefundMode] = useState('cash'); // 'cash', 'online', 'split'
  const [refundCashAmount, setRefundCashAmount] = useState('');
  const [refundOnlineAmount, setRefundOnlineAmount] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('Customer Requested Refund');

  const dateInputRef = useRef(null);
  // Deduplicate chime: track last announced order ID to avoid double-play
  const lastAnnouncedOrderId = useRef(null);

  const loadData = () => {
    setLoadingOrders(true);
    Promise.all([
      fetchAPI(`/reports/analytics?date=${selectedDate}`),
      fetchAPI(`/orders/all?date=${selectedDate}`)
    ])
      .then(([statsData, ordersData]) => {
        if (statsData) setStats(statsData);
        if (ordersData) setOrders(ordersData);
      })
      .catch(err => console.error('Dashboard load error:', err))
      .finally(() => setLoadingOrders(false));
  };

  useEffect(() => {
    joinRoom('admin');
  }, [socket, connected]);

  useEffect(() => {
    loadData();

    // Auto-detect system date change (midnight rollover)
    const interval = setInterval(() => {
      const currentToday = getTodayDateString();
      if (selectedDate === currentToday) {
        setSelectedDate(currentToday);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedDate]);

  // Real-time socket listener for instant incoming orders & status updates
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder) => {
      console.log('⚡ Admin Dashboard received real-time new order:', newOrder);
      // Only play chime once per unique order (avoid double-play with BellAlert)
      const orderId = newOrder?.id || newOrder?.order_number;
      if (orderId && lastAnnouncedOrderId.current === orderId) return;
      lastAnnouncedOrderId.current = orderId;
      playKitchenChime(newOrder.table_number, newOrder.items);

      setOrders(prevOrders => {
        const existingIdx = prevOrders.findIndex(o => o.id === newOrder.id || o.order_number === newOrder.order_number);
        if (existingIdx > -1) {
          const updated = [...prevOrders];
          updated[existingIdx] = newOrder;
          return updated;
        }
        return [newOrder, ...prevOrders];
      });

      // Reload fresh analytics summary
      fetchAPI(`/reports/analytics?date=${selectedDate}`)
        .then(s => s && setStats(s))
        .catch(err => console.error(err));
    };

    const handleStatusUpdate = () => {
      loadData();
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_updated', handleStatusUpdate);
    socket.on('item_status_updated', handleStatusUpdate);
    socket.on('table_order_updated', handleStatusUpdate);

    return () => {
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_updated', handleStatusUpdate);
      socket.off('item_status_updated', handleStatusUpdate);
      socket.off('table_order_updated', handleStatusUpdate);
    };
  }, [socket, selectedDate]);

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActivePayDropdownId(null);
      setActiveRefundDropdownId(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Keyboard 'P' / 'p' or Ctrl+P listener to print selected bill(s)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const isP = e.key === 'p' || e.key === 'P';
      const isCtrlP = (e.ctrlKey || e.metaKey) && isP;

      if (isP || isCtrlP) {
        e.preventDefault();
        if (selectedOrderIds.length > 0) {
          const selectedList = orders.filter(o => selectedOrderIds.includes(o.id));
          if (selectedList.length > 0) {
            setPrintingOrders(selectedList);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrderIds, orders]);

  // Refresh Button action
  const handleRefresh = () => {
    loadData();
  };

  // Print selected order(s)
  const handlePrintSelected = () => {
    if (selectedOrderIds.length === 0) return;
    const selectedList = orders.filter(o => selectedOrderIds.includes(o.id));
    if (selectedList.length > 0) {
      setPrintingOrders(selectedList);
    }
  };

  // Reset date to today
  const handleResetToToday = () => {
    const today = getTodayDateString();
    setSelectedDate(today);
  };

  // Handle row click selection (except when clicking buttons/inputs)
  const handleRowClick = (e, orderId) => {
    const target = e.target;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a') ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT'
    ) {
      return;
    }
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  // Update Single or Dual Payment
  const handleUpdatePayment = async (orderId, paymentMode, paymentStatus = 'completed', cashPaid = 0, onlinePaid = 0) => {
    try {
      await fetchAPI(`/orders/${orderId}/payment-verify`, {
        method: 'PATCH',
        body: JSON.stringify({
          payment_mode: paymentMode,
          payment_status: paymentStatus,
          cash_paid: cashPaid,
          online_paid: onlinePaid
        })
      });
      setActivePayDropdownId(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit Dual / Split Payment
  const handleSplitPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!splitPayOrder) return;

    const cVal = Number(cashPaidInput) || 0;
    const oVal = Number(onlinePaidInput) || 0;

    if (cVal + oVal <= 0) {
      alert('Please enter valid Cash or Online payment amounts.');
      return;
    }

    try {
      await fetchAPI(`/orders/${splitPayOrder.id}/payment-verify`, {
        method: 'PATCH',
        body: JSON.stringify({
          payment_mode: 'cash_and_online',
          payment_status: 'completed',
          cash_paid: cVal,
          online_paid: oVal
        })
      });
      setSplitPayOrder(null);
      setCashPaidInput('');
      setOnlinePaidInput('');
      loadData();
    } catch (err) {
      alert(`Split Payment error: ${err.message}`);
    }
  };

  // Submit Refund (Cash, Online, or Both Split)
  const handleProcessRefundSubmit = async (e) => {
    e.preventDefault();
    if (!refundingOrder) return;

    let payload = {
      refund_reason: refundReason,
      refund_mode: refundMode
    };

    if (refundMode === 'split') {
      const cRef = Number(refundCashAmount) || 0;
      const oRef = Number(refundOnlineAmount) || 0;
      if (cRef + oRef <= 0) {
        alert('Please enter valid cash/online refund amounts.');
        return;
      }
      payload.refund_cash_amount = cRef;
      payload.refund_online_amount = oRef;
      payload.refund_amount = cRef + oRef;
    } else {
      const rAmt = Number(refundAmount) || 0;
      if (rAmt <= 0) {
        alert('Please enter a valid refund amount.');
        return;
      }
      payload.refund_amount = rAmt;
      if (refundMode === 'cash') payload.refund_cash_amount = rAmt;
      if (refundMode === 'online') payload.refund_online_amount = rAmt;
    }

    try {
      await fetchAPI(`/orders/${refundingOrder.id}/refund`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      setRefundingOrder(null);
      setRefundAmount('');
      setRefundCashAmount('');
      setRefundOnlineAmount('');
      setRefundReason('Customer Requested Refund');
      loadData();
    } catch (err) {
      alert(`Refund error: ${err.message}`);
    }
  };

  if (!stats) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading dashboard analytics...</div>;

  const isToday = selectedDate === getTodayDateString();
  const dashboardTitle = isToday ? "Today's Orders Dashboard & Bill Printing" : `${selectedDate}'s Orders Dashboard & Bill Printing`;
  const revenueLabel = isToday ? 'Today Revenue' : `Revenue (${selectedDate})`;
  const ordersLabel = isToday ? 'Today total Orders' : `Total Orders (${selectedDate})`;

  // Filter and sort orders: NEW / Active / Pending / Unpaid orders ALWAYS go to the VERY TOP!
  const filteredOrders = orders.filter(ord => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const orderNum = (ord.order_number || '').toLowerCase();
    const tableNum = String(ord.table_number || '').toLowerCase();
    const phone = (ord.customer_phone || '').toLowerCase();
    const itemsStr = (ord.items || []).map(i => i.item_name).join(' ').toLowerCase();
    const modeStr = (ord.payment_mode || '').toLowerCase();
    return orderNum.includes(q) || tableNum.includes(q) || phone.includes(q) || itemsStr.includes(q) || modeStr.includes(q);
  }).sort((a, b) => {
    const aIsActive = ['active', 'pending', 'pending_verification'].includes(a.status) || a.payment_status === 'pending' || a.payment_status === 'unpaid';
    const bIsActive = ['active', 'pending', 'pending_verification'].includes(b.status) || b.payment_status === 'pending' || b.payment_status === 'unpaid';

    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;

    return (new Date(b.created_at || 0) - new Date(a.created_at || 0)) || (b.id - a.id);
  });

  return (
    <div>
      {/* Metric Cards Grid — Stacks cleanly on mobile (2 cols on tablet/mobile, 4 cols on desktop) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div className="glass-card" style={{ padding: '1rem 1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{revenueLabel}</span>
            <div style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '0.35rem', borderRadius: '6px' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--brand-primary)', margin: 0 }}>{formatCurrency(stats.todayRevenue)}</h2>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{ordersLabel}</span>
            <div style={{ background: 'var(--info-bg)', color: 'var(--info)', padding: '0.35rem', borderRadius: '6px' }}>
              <ShoppingBag size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--brand-primary)', margin: 0 }}>{stats.todayOrders || 0}</h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{stats.activeOrders} Active • {stats.totalOrders} Total</span>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Avg Prep Time</span>
            <div style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '0.35rem', borderRadius: '6px' }}>
              <Clock size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--brand-primary)', margin: 0 }}>
            {stats.avgPrepTime || (stats.avgPrepMinutes ? `${stats.avgPrepMinutes} mins` : '14 mins')}
          </h2>
        </div>

        <div className="glass-card" style={{ padding: '1rem 1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Top Selling Dish</span>
            <div style={{ background: 'rgba(234, 88, 12, 0.15)', color: '#ea580c', padding: '0.35rem', borderRadius: '6px' }}>
              <Flame size={18} />
            </div>
          </div>
          <h2 style={{ fontSize: '1rem', color: 'var(--brand-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {stats.topDish}
          </h2>
        </div>
      </div>

      {/* DAY-BY-DAY / TODAY ORDERS TABLE */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>
              {dashboardTitle}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>

            {/* Print & Deselect Header Controls — VISIBLE ONLY WHEN SELECTED */}
            {selectedOrderIds.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handlePrintSelected}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 800, gap: '0.4rem', padding: '0.4rem 0.85rem', background: 'var(--brand-primary)', color: '#fff', fontSize: '0.82rem' }}
                  title="Print Selected Bill Invoice(s) (Shortcut: P or Ctrl+P)"
                >
                  <Printer size={15} />
                  <span>
                    {selectedOrderIds.length > 1
                      ? `Print Bill (${selectedOrderIds.length})`
                      : `Print Bill`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderIds([])}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem', padding: '0.4rem 0.65rem' }}
                >
                  Deselect All
                </button>
              </>
            )}

            {/* Search Input Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-surface-elevated)', padding: '0.25rem 0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)', width: '180px' }}>
              <Search size={13} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.78rem', width: '100%', outline: 'none' }}
              />
            </div>

            {/* Date Selection Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-surface-elevated)', padding: '0.25rem 0.55rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <Calendar size={13} style={{ color: 'var(--brand-primary)' }} />
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.78rem', cursor: 'pointer', outline: 'none' }}
              />
            </div>

            {!isToday && (
              <button
                onClick={handleResetToToday}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.25rem', padding: '0.3rem 0.55rem', fontSize: '0.78rem' }}
                title="Jump back to Today"
              >
                <Clock size={13} />
                <span>Today</span>
              </button>
            )}

            {selectedDate !== 'all' && (
              <button
                onClick={() => setSelectedDate('all')}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.25rem', padding: '0.3rem 0.55rem', fontSize: '0.78rem' }}
                title="View All Dates History"
              >
                <Calendar size={13} />
                <span>All Dates</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.25rem', padding: '0.3rem 0.55rem', fontSize: '0.78rem' }}
              title="Refresh Today's Orders & Data"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Orders Table — Sized for Full Screen Display */}
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.45rem 0.4rem', width: '28px' }}>
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOrderIds(filteredOrders.map(o => o.id));
                      } else {
                        setSelectedOrderIds([]);
                      }
                    }}
                    style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                    title="Select All Orders"
                  />
                </th>
                <th style={{ padding: '0.45rem 0.4rem', width: '150px' }}>Order # &amp; Details</th>
                <th style={{ padding: '0.45rem 0.4rem', width: '180px' }}>Dishes Breakdown</th>
                <th style={{ padding: '0.45rem 0.4rem', width: '75px' }}>Amount</th>
                <th style={{ padding: '0.45rem 0.4rem', width: '85px' }}>Payment Mode</th>
                <th style={{ padding: '0.45rem 0.4rem', width: '125px' }}>Payment Status</th>
                <th style={{ padding: '0.45rem 0.4rem', width: '95px' }}>Order Status</th>
                <th style={{ padding: '0.45rem 0.4rem', textAlign: 'right', width: '130px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(ord => {
                const isRefunded = ord.status === 'refunded' || ord.payment_status === 'refunded' || (Number(ord.refunded_amount) || 0) > 0;
                const isPaid = ord.payment_status === 'completed' && !isRefunded;
                const items = ord.items || [];
                const isSelected = selectedOrderIds.includes(ord.id);

                const onlinePaid = Number(ord.online_paid) || (ord.payment_mode === 'online' && ord.payment_status === 'completed' ? Number(ord.net_amount) : 0);
                const cashPaid = Number(ord.cash_paid) || (ord.payment_mode === 'cash' && ord.payment_status === 'completed' ? Number(ord.net_amount) : 0);
                const remDue = Math.max(0, (Number(ord.net_amount) || 0) - (onlinePaid + cashPaid));
                const isMixedPay = ord.payment_mode === 'cash_and_online' || (onlinePaid > 0 && remDue > 0);

                // Order Lifecycle Status
                const isAllServedOrRejected = items.length > 0 && items.every(i => ['served', 'rejected'].includes(i.status));
                const hasReadyItem = items.some(i => i.status === 'ready');
                const hasPreparingItem = items.some(i => i.status === 'preparing' || i.status === 'accepted');
                const hasPendingItem = items.some(i => i.status === 'pending');
                const hasRejectedItem = items.some(i => i.status === 'rejected');

                let statusBadge = { label: (ord.status || 'ACTIVE').toUpperCase(), color: 'var(--text-muted)', bg: 'var(--bg-surface-elevated)' };
                if (isAllServedOrRejected) {
                  statusBadge = { label: 'DELIVERED', color: 'var(--success)', bg: 'var(--success-bg)' };
                } else if (hasReadyItem) {
                  statusBadge = { label: 'READY TO SERVE', color: '#ea580c', bg: 'rgba(249, 115, 22, 0.15)' };
                } else if (hasPreparingItem) {
                  statusBadge = { label: 'COOKING / PREP', color: 'var(--warning)', bg: 'var(--warning-bg)' };
                } else if (hasPendingItem) {
                  statusBadge = { label: 'NEW ORDER', color: 'var(--info)', bg: 'var(--info-bg)' };
                } else if (hasRejectedItem) {
                  statusBadge = { label: 'REJECTED', color: 'var(--danger)', bg: 'var(--danger-bg)' };
                }

                const rejectedItems = items.filter(i => i.status === 'rejected');

                return (
                  <tr
                    key={ord.id}
                    onClick={(e) => handleRowClick(e, ord.id)}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(234, 88, 12, 0.12)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                  >
                    {/* Checkbox Selector */}
                    <td style={{ padding: '0.45rem 0.4rem', width: '28px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedOrderIds(prev =>
                            prev.includes(ord.id) ? prev.filter(id => id !== ord.id) : [...prev, ord.id]
                          );
                        }}
                        style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                      />
                    </td>

                    {/* Order #, Date, Time & Table Number */}
                    <td style={{ padding: '0.45rem 0.4rem', width: '150px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--brand-primary)' }}>
                        #{ord.order_number}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        📅 {getLocalDateString(ord.created_at)} • {formatTime(ord.created_at)}
                      </div>
                      <div style={{ marginTop: '3px' }}>
                        <span className="badge badge-dinein" style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.1rem 0.35rem' }}>
                          Table #{ord.table_number}
                        </span>
                      </div>
                    </td>

                    {/* Compact Dishes Breakdown Column with Truncated Dish Names */}
                    <td style={{ padding: '0.45rem 0.4rem', width: '180px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.74rem', marginBottom: '2px', color: 'var(--text-muted)' }}>
                        🍽️ {items.length} Dish{items.length > 1 ? 'es' : ''}:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.74rem' }}>
                        {items.map(i => (
                          <div key={i.id} style={{
                            background: 'var(--bg-surface-elevated)',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'space-between',
                            gap: '0.3rem'
                          }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '125px' }} title={`${i.quantity}x ${i.item_name}`}>
                              <span style={{ fontWeight: 800 }}>{i.quantity}x</span> {i.item_name}
                              {i.variant_name && (
                                <span className="badge badge-primary" style={{ fontSize: '0.6rem', marginLeft: '3px', padding: '0.05rem 0.25rem' }}>
                                  {i.variant_name}
                                </span>
                              )}
                              {i.toppings_summary && (
                                <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', marginLeft: '3px' }}>
                                  (+{i.toppings_summary})
                                </span>
                              )}
                              {i.spice_level && (
                                <span style={{ fontSize: '0.64rem', color: '#ea580c', marginLeft: '3px', fontWeight: 700 }}>
                                  🔥 {i.spice_level}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Display Rejection Reason */}
                      {rejectedItems.length > 0 && (
                        <div style={{
                          marginTop: '0.25rem',
                          padding: '0.2rem 0.4rem',
                          background: 'var(--danger-bg)',
                          color: 'var(--danger)',
                          borderRadius: '4px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <AlertCircle size={11} />
                          <span>Rejection: {rejectedItems.map(ri => ri.rejection_reason || 'Out of Stock').join('; ')}</span>
                        </div>
                      )}
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '0.45rem 0.4rem', fontWeight: 800, color: 'var(--brand-primary)', whiteSpace: 'nowrap', width: '75px' }}>
                      {formatCurrency(ord.net_amount)}
                    </td>

                    {/* Payment Mode (ONLY Mode written) */}
                    <td style={{ padding: '0.45rem 0.4rem', whiteSpace: 'nowrap', width: '85px' }}>
                      <span className="badge" style={{
                        background: isMixedPay ? 'rgba(234, 88, 12, 0.15)' : 'var(--bg-surface-elevated)',
                        color: isMixedPay ? '#ea580c' : 'var(--text-main)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        padding: '0.25rem 0.45rem',
                        textTransform: 'uppercase'
                      }}>
                        {isMixedPay ? 'ONLINE & CASH' : (ord.payment_mode || 'CASH')}
                      </span>
                    </td>

                    {/* Payment Status (Displays REFUNDED, PAID, or UNPAID with Pay Options) */}
                    <td style={{ padding: '0.45rem 0.4rem', position: 'relative', width: '125px' }}>
                      {isRefunded ? (
                        <div>
                          <span className="badge badge-danger" style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.55rem', display: 'inline-block' }}>
                            ↺ REFUNDED
                          </span>
                        </div>
                      ) : isPaid ? (
                        <div>
                          <span className="badge badge-veg" style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.25rem 0.55rem', display: 'inline-block' }}>
                            ✓ PAID
                          </span>
                          {isMixedPay && (
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 700 }}>
                              Cash: {formatCurrency(ord.cash_paid || 0)} | Online: {formatCurrency(ord.online_paid || 0)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '3px' }}>
                            <span className="badge badge-nonveg" style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.4rem' }}>
                              UNPAID
                            </span>
                          </div>
                          {/* Pay Now Button (Direct Pay in Cash) + Arrow Trigger (Opens Options) */}
                          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePayDropdownId(null);
                                handleUpdatePayment(ord.id, 'cash', 'completed', ord.net_amount, 0);
                              }}
                              className="btn btn-primary btn-sm"
                              style={{
                                padding: '0.25rem 0.45rem',
                                fontSize: '0.72rem',
                                background: 'var(--success)',
                                fontWeight: 800,
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                                borderRight: '1px solid rgba(255,255,255,0.3)'
                              }}
                              title="Click to Pay Full Remaining Amount in Cash"
                            >
                              Pay Now ({formatCurrency(remDue > 0 ? remDue : ord.net_amount)})
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveRefundDropdownId(null);
                                setActivePayDropdownId(prev => prev === ord.id ? null : ord.id);
                              }}
                              className="btn btn-primary btn-sm"
                              style={{
                                padding: '0.25rem 0.35rem',
                                fontSize: '0.72rem',
                                background: 'var(--success)',
                                borderTopLeftRadius: 0,
                                borderBottomLeftRadius: 0
                              }}
                              title="More Payment Options (Card, Online, Split)"
                            >
                              <ChevronDown size={12} />
                            </button>

                            {/* Payment Options Popover Menu */}
                            {activePayDropdownId === ord.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  position: 'absolute',
                                  top: '100%',
                                  left: 0,
                                  marginTop: '4px',
                                  background: 'var(--bg-surface-elevated)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '8px',
                                  boxShadow: 'var(--shadow-md)',
                                  zIndex: 100,
                                  minWidth: '160px',
                                  padding: '0.35rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.25rem'
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePayDropdownId(null);
                                    handleUpdatePayment(ord.id, 'cash', 'completed', ord.net_amount, 0);
                                  }}
                                  className="btn btn-secondary btn-sm"
                                  style={{ justifyContent: 'flex-start', fontSize: '0.73rem', padding: '0.3rem 0.5rem', color: 'var(--success)' }}
                                >
                                  💵 Cash Payment
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePayDropdownId(null);
                                    handleUpdatePayment(ord.id, 'card', 'completed', 0, ord.net_amount);
                                  }}
                                  className="btn btn-secondary btn-sm"
                                  style={{ justifyContent: 'flex-start', fontSize: '0.73rem', padding: '0.3rem 0.5rem', color: '#0284c7', fontWeight: 700 }}
                                >
                                  💳 Card Payment
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePayDropdownId(null);
                                    handleUpdatePayment(ord.id, 'online', 'completed', 0, ord.net_amount);
                                  }}
                                  className="btn btn-secondary btn-sm"
                                  style={{ justifyContent: 'flex-start', fontSize: '0.73rem', padding: '0.3rem 0.5rem', color: 'var(--brand-primary)' }}
                                >
                                  📱 Online / UPI Payment
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivePayDropdownId(null);
                                    setSplitPayOrder(ord);
                                    setCashPaidInput('');
                                    setOnlinePaidInput('');
                                  }}
                                  className="btn btn-secondary btn-sm"
                                  style={{ justifyContent: 'flex-start', fontSize: '0.73rem', padding: '0.3rem 0.5rem', color: '#ea580c', fontWeight: 700 }}
                                >
                                  ⚡ Split Pay (Cash + Online / Card)
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Order Progress Status */}
                    <td style={{ padding: '0.45rem 0.4rem', whiteSpace: 'nowrap', width: '95px' }}>
                      <span className="badge" style={{ background: statusBadge.bg, color: statusBadge.color, textTransform: 'uppercase', fontSize: '0.72rem', fontWeight: 800, padding: '0.25rem 0.45rem' }}>
                        {statusBadge.label}
                      </span>
                    </td>

                    {/* Actions (Bill & Direct Issue Refund) */}
                    <td style={{ padding: '0.45rem 0.4rem', textAlign: 'right', whiteSpace: 'nowrap', width: '130px', position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrintingOrders([ord]);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.25rem 0.45rem', fontSize: '0.74rem', marginRight: '0.25rem' }}
                        title="Print Customer Bill Invoice (Shortcut: P or Ctrl+P)"
                      >
                        <Printer size={12} /> Bill
                      </button>

                      {isRefunded ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', fontSize: '0.7rem', fontWeight: 800, textAlign: 'right', marginTop: '2px' }}>
                          {(ord.refund_cash_amount > 0 && ord.refund_online_amount > 0) ? (
                            <>
                              <div style={{ color: 'var(--success)' }}>Cash: {formatCurrency(ord.refund_cash_amount)}</div>
                              <div style={{ color: 'var(--brand-primary)' }}>Online: {formatCurrency(ord.refund_online_amount)}</div>
                            </>
                          ) : (ord.refund_online_amount > 0 || ord.refund_mode === 'online' || ord.refund_mode === 'card') ? (
                            <div style={{ color: 'var(--brand-primary)' }}>
                              Online/Card: {formatCurrency(ord.refund_online_amount || ord.refunded_amount || ord.net_amount)}
                            </div>
                          ) : (
                            <div style={{ color: 'var(--success)' }}>
                              Cash: {formatCurrency(ord.refund_cash_amount || ord.refunded_amount || ord.net_amount)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePayDropdownId(null);
                            setActiveRefundDropdownId(null);
                            setRefundingOrder(ord);
                            setRefundMode('cash');
                            setRefundAmount(ord.net_amount || ord.total_amount || '');
                            setRefundCashAmount('');
                            setRefundOnlineAmount('');
                            setRefundReason('Customer Requested Refund');
                          }}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.25rem 0.45rem', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                          title="Click to Issue Refund"
                        >
                          <RotateCcw size={12} />
                          <span>Refund</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && !loadingOrders && (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{searchQuery ? `No orders found matching "${searchQuery}"` : `No orders found for selected date: ${selectedDate}`}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DUAL / SPLIT PAYMENT SETTLEMENT MODAL */}
      {splitPayOrder && (
        <Modal isOpen={Boolean(splitPayOrder)} onClose={() => setSplitPayOrder(null)} title={`Split Payment Settlement (Order #${splitPayOrder.order_number})`}>
          <form onSubmit={handleSplitPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 800, color: 'var(--brand-primary)', marginBottom: '0.2rem' }}>
                Table #{splitPayOrder.table_number} • Order #{splitPayOrder.order_number}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                Total Payable Bill: <span style={{ color: 'var(--brand-primary)' }}>{formatCurrency(splitPayOrder.net_amount || splitPayOrder.total_amount)}</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                💵 Cash Payment Amount (₹):
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={splitPayOrder.net_amount || splitPayOrder.total_amount}
                value={cashPaidInput}
                onChange={(e) => {
                  const cVal = e.target.value;
                  setCashPaidInput(cVal);
                  const tot = Number(splitPayOrder.net_amount || splitPayOrder.total_amount);
                  const rem = Math.max(0, tot - (Number(cVal) || 0));
                  setOnlinePaidInput(rem > 0 ? String(rem.toFixed(2)) : '0');
                }}
                required
                className="input-field"
                placeholder="Enter Cash portion e.g. 200"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                💳 Online / Card Payment Amount (₹):
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={splitPayOrder.net_amount || splitPayOrder.total_amount}
                value={onlinePaidInput}
                onChange={(e) => setOnlinePaidInput(e.target.value)}
                required
                className="input-field"
                placeholder="Enter Online/Card portion e.g. 300"
              />
            </div>

            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Total Settlement Recorded: {formatCurrency((Number(cashPaidInput) || 0) + (Number(onlinePaidInput) || 0))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 1, fontWeight: 800 }}>
                Confirm Split Payment
              </button>
              <button type="button" onClick={() => setSplitPayOrder(null)} className="btn btn-secondary btn-lg">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ENHANCED REFUND SYSTEM MODAL (CASH / ONLINE / CARD / SPLIT) */}
      {refundingOrder && (() => {
        const maxRefundable = Number(refundingOrder.net_amount || refundingOrder.total_amount) || 0;
        const totalRequestedRefund = refundMode === 'split'
          ? ((Number(refundCashAmount) || 0) + (Number(refundOnlineAmount) || 0))
          : (Number(refundAmount) || 0);
        const isOverRefund = totalRequestedRefund > maxRefundable + 0.01;

        return (
          <Modal isOpen={Boolean(refundingOrder)} onClose={() => setRefundingOrder(null)} title={`Issue Refund for Order #${refundingOrder.order_number}`}>
            <form onSubmit={handleProcessRefundSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 800, color: 'var(--brand-primary)', marginBottom: '0.2rem' }}>
                  Table #{refundingOrder.table_number} • Order #{refundingOrder.order_number}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Total Net Order Bill: <b>{formatCurrency(maxRefundable)}</b>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                  Select Refund Mode:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setRefundMode('cash');
                      setRefundAmount(maxRefundable);
                    }}
                    className={`btn ${refundMode === 'cash' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ fontSize: '0.74rem' }}
                  >
                    💵 Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRefundMode('online');
                      setRefundAmount(maxRefundable);
                    }}
                    className={`btn ${refundMode === 'online' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ fontSize: '0.74rem' }}
                  >
                    📱 Online
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRefundMode('split');
                      setRefundCashAmount('');
                      setRefundOnlineAmount('');
                    }}
                    className={`btn ${refundMode === 'split' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    style={{ fontSize: '0.74rem' }}
                  >
                    ⚡ Split
                  </button>
                </div>
              </div>

              {refundMode === 'split' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      💵 Cash Refund Amount (₹):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={maxRefundable}
                      value={refundCashAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRefundCashAmount(val);
                        const cNum = Number(val) || 0;
                        const rem = Math.max(0, maxRefundable - cNum);
                        setRefundOnlineAmount(rem > 0 ? String(rem.toFixed(2)) : '0');
                      }}
                      className="input-field"
                      placeholder="e.g. 100"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      📱 Online / Card Refund Amount (₹):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={maxRefundable}
                      value={refundOnlineAmount}
                      onChange={(e) => setRefundOnlineAmount(e.target.value)}
                      className="input-field"
                      placeholder="e.g. 150"
                    />
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: isOverRefund ? 'var(--danger)' : 'var(--text-main)' }}>
                    Total Refund Summary: {formatCurrency(totalRequestedRefund)}
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    Refund Amount (₹ Editable):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={maxRefundable}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    required
                    className="input-field"
                    style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--danger)' }}
                    placeholder="e.g. 50.00"
                  />
                </div>
              )}

              {/* OVER-REFUND WARNING ERROR ALERT */}
              {isOverRefund && (
                <div style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  border: '1px solid var(--danger)',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <AlertCircle size={16} />
                  <span>⚠ Money is over the order total (₹{maxRefundable.toFixed(2)})! Over payment/refund is not allowed.</span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                  Reason for Refund:
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  required
                  className="input-field"
                  placeholder="e.g. Item unavailable / Customer dissatisfied"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={isOverRefund || totalRequestedRefund <= 0}
                  className="btn btn-danger btn-lg"
                  style={{
                    flex: 1,
                    fontWeight: 800,
                    gap: '0.4rem',
                    opacity: (isOverRefund || totalRequestedRefund <= 0) ? 0.5 : 1,
                    cursor: (isOverRefund || totalRequestedRefund <= 0) ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RotateCcw size={16} />
                  <span>Confirm Refund</span>
                </button>
                <button type="button" onClick={() => setRefundingOrder(null)} className="btn btn-secondary btn-lg">
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        );
      })()}

      {/* Modern GST Tax Invoice Bill Modal (Supports single bill or multi-order consolidated bill) */}
      <GSTInvoiceModal
        orders={printingOrders}
        isOpen={printingOrders.length > 0}
        onClose={() => setPrintingOrders([])}
      />

    </div >
  );
};
