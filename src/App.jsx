import React, { useState, useEffect, useContext, Component } from 'react';
import { Navbar } from './components/Common/Navbar';
import { CustomerPanel } from './components/Customer/CustomerPanel';
import { KitchenPanel } from './components/Kitchen/KitchenPanel';
import { AdminPanel } from './components/Admin/AdminPanel';
import { WaiterPanel } from './components/Waiter/WaiterPanel';
import { StaffLoginView } from './components/Common/StaffLoginView';
import { BellAlert } from './components/Common/BellAlert';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { safeStorage, safeSessionStorage } from './utils/storage';
import { Utensils, RefreshCw, AlertTriangle } from 'lucide-react';

// Error Boundary to prevent blank white screen crashes
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught React Error:", error, errorInfo);
    try {
      safeStorage.removeItem('aamantran_last_order_id');
    } catch (e) { }
  }

  render() {
    if (this.state.hasError) {
      const handleReset = () => {
        try {
          safeStorage.removeItem('staff_token');
          safeStorage.removeItem('aamantran_last_order_id');
          safeSessionStorage.clear();
        } catch (e) { }
        this.setState({ hasError: false, error: null });
        window.location.reload();
      };

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-surface, #0f172a)',
          color: '#ffffff',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(249, 115, 22, 0.12)',
            padding: '1.25rem',
            borderRadius: '50%',
            marginBottom: '1.5rem',
            border: '1px solid var(--brand-primary, #f97316)'
          }}>
            <RefreshCw size={42} className="animate-spin text-brand" style={{ color: 'var(--brand-primary, #f97316)' }} />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Aamantran Self-Ordering Platform
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted, #94a3b8)', maxWidth: '440px', marginBottom: '1.75rem', lineHeight: '1.5' }}>
            We are updating system data for a better experience! Please wait a few seconds and then click refresh.
          </p>
          <button
            onClick={handleReset}
            className="btn btn-primary btn-lg"
            style={{
              padding: '0.8rem 1.75rem',
              borderRadius: '25px',
              fontSize: '0.95rem',
              fontWeight: 800,
              gap: '0.5rem',
              background: 'linear-gradient(135deg, var(--brand-primary, #f97316), #ea580c)',
              boxShadow: '0 8px 25px rgba(249, 115, 22, 0.4)'
            }}
          >
            <RefreshCw size={18} />
            <span>Refresh Page</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const getPanelForUserRole = (u) => {
  if (!u) return 'customer';
  const role = typeof u === 'string' ? u : (u.role || '');
  const username = typeof u === 'object' ? (u.username || '') : '';
  const name = typeof u === 'object' ? (u.name || '') : '';

  if (role === 'waiter' || username === 'waiter1' || name.toLowerCase().includes('waiter')) return 'waiter';
  if (role === 'chef' || username === 'chef1' || name.toLowerCase().includes('chef')) return 'kitchen';
  if (['admin', 'cashier'].includes(role)) return 'admin';
  return 'customer';
};

function AppContent() {
  const [activePanel, setActivePanelState] = useState('customer');
  const { user, loading } = useContext(AuthContext);
  const isInitialLoad = React.useRef(true);

  const setActivePanel = (panel) => {
    setActivePanelState(panel);
  };

  useEffect(() => {
    if (!loading) {
      if (user) {
        const isWaiter = user.role === 'waiter' || user.username === 'waiter1' || (user.name && user.name.toLowerCase().includes('waiter'));
        const isChef = user.role === 'chef' || user.username === 'chef1' || (user.name && user.name.toLowerCase().includes('chef'));

        if (isInitialLoad.current || activePanel === 'staff-login') {
          setActivePanelState(getPanelForUserRole(user));
          isInitialLoad.current = false;
        } else if (isWaiter && activePanel === 'admin') {
          setActivePanelState('waiter');
        } else if (isChef && activePanel === 'admin') {
          setActivePanelState('kitchen');
        }
      } else {
        if (isInitialLoad.current) {
          isInitialLoad.current = false;
        } else if (['admin', 'kitchen', 'waiter'].includes(activePanel)) {
          setActivePanelState('customer');
        }
      }
    }
  }, [user, loading, activePanel]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#f97316'
      }}>
        <div style={{
          padding: '1.5rem',
          borderRadius: '50%',
          background: 'rgba(249, 115, 22, 0.1)',
          marginBottom: '1rem'
        }}>
          <Utensils size={40} className="animate-bounce" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Aamantran</h2>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Loading Self-Ordering Platform...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activePanel={activePanel} setActivePanel={setActivePanel} />
      <BellAlert />

      <main style={{ flex: 1 }}>
        {activePanel === 'customer' && <CustomerPanel setActivePanel={setActivePanel} />}
        {activePanel === 'kitchen' && <KitchenPanel setActivePanel={setActivePanel} />}
        {activePanel === 'waiter' && <WaiterPanel setActivePanel={setActivePanel} />}
        {activePanel === 'admin' && <AdminPanel setActivePanel={setActivePanel} />}
        {activePanel === 'staff-login' && !user && (
          <StaffLoginView onLoginSuccess={(target) => setActivePanel(target)} />
        )}
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '1.25rem 1rem',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6rem',
        flexWrap: 'wrap'
      }}>
        <span>Aamantran QR Self-Ordering Platform, Created by Abhay Maddy</span>
        <a
          href="https://github.com/Abhay-Maddy"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            padding: '0.35rem',
            borderRadius: '50%',
            transition: 'all 0.3s ease',
            width: '32px',
            height: '32px'
          }}
          title="View on GitHub"
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#2563eb';
            e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)';
            e.currentTarget.style.transform = 'scale(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <SocketProvider>
              <AppContent />
            </SocketProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
