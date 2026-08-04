import React, { useState, useEffect, useContext, Component } from 'react';
import { Navbar } from './components/Common/Navbar';
import { CustomerPanel } from './components/Customer/CustomerPanel';
import { KitchenPanel } from './components/Kitchen/KitchenPanel';
import { AdminPanel } from './components/Admin/AdminPanel';
import { StaffLoginView } from './components/Common/StaffLoginView';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
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
  }

  render() {
    if (this.state.hasError) {
      const handleReload = () => {
        try {
          localStorage.removeItem('staff_token');
          sessionStorage.clear();
        } catch (e) {}
        window.location.href = '/';
      };

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'var(--bg-primary, #0f172a)',
          color: 'var(--text-primary, #ffffff)',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            padding: '1.25rem',
            borderRadius: '50%',
            marginBottom: '1rem'
          }}>
            <AlertTriangle size={48} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Aamantran Self-Ordering Platform</h2>
          <p style={{ color: 'var(--text-muted, #94a3b8)', maxWidth: '440px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Click below to clear temporary session cache and restore full platform view.
          </p>
          <button
            onClick={handleReload}
            className="btn btn-primary btn-lg"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#ffffff',
              padding: '0.75rem 1.5rem',
              borderRadius: '9999px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(249, 115, 22, 0.4)'
            }}
          >
            <RefreshCw size={18} />
            <span>Reset Session & Open Menu</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { user, loading } = useContext(AuthContext);
  const [activePanel, setActivePanel] = useState('customer');

  // Auto-redirect if user logs in while on 'staff-login' view
  useEffect(() => {
    if (user && activePanel === 'staff-login') {
      const target = ['chef', 'waiter'].includes(user.role) ? 'kitchen' : 'admin';
      setActivePanel(target);
    }
  }, [user, activePanel]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#ffffff'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #f97316, #f59e0b)',
          padding: '1rem',
          borderRadius: '20px',
          color: '#ffffff',
          marginBottom: '1rem',
          boxShadow: '0 10px 30px rgba(249, 115, 22, 0.4)'
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
      
      <main style={{ flex: 1 }}>
        {activePanel === 'customer' && <CustomerPanel />}
        {activePanel === 'kitchen' && <KitchenPanel />}
        {activePanel === 'admin' && <AdminPanel />}
        {activePanel === 'staff-login' && !user && (
          <StaffLoginView onLoginSuccess={(target) => setActivePanel(target)} />
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Aamantran QR Self-Ordering Platform • Powered by Antigravity AI
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
