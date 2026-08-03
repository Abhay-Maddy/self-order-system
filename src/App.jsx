import React, { useState } from 'react';
import { Navbar } from './components/Common/Navbar';
import { CustomerPanel } from './components/Customer/CustomerPanel';
import { KitchenPanel } from './components/Kitchen/KitchenPanel';
import { AdminPanel } from './components/Admin/AdminPanel';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

export function App() {
  const [activePanel, setActivePanel] = useState('customer');

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <SocketProvider>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <Navbar activePanel={activePanel} setActivePanel={setActivePanel} />
              
              <main style={{ flex: 1 }}>
                {activePanel === 'customer' && <CustomerPanel />}
                {activePanel === 'kitchen' && <KitchenPanel />}
                {activePanel === 'admin' && <AdminPanel />}
              </main>

              <footer style={{ textAlign: 'center', padding: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Aamantran QR Self-Ordering Platform • Powered by Antigravity AI
              </footer>
            </div>
          </SocketProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
