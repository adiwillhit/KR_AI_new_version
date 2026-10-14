import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { Toaster } from 'react-hot-toast';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: 'auto',
          padding: '2rem',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            fontSize: '0.85rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
          error: { iconTheme: { primary: '#ef4444', secondary: 'white' } },
        }}
      />
    </div>
  );
}
