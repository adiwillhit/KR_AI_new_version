import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, CalendarDays,
  CheckSquare, BookMarked, BrainCircuit, Settings,
  LogOut, Menu, X, Sparkles
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/meetings', icon: CalendarDays, label: 'Meetings' },
  { to: '/action-items', icon: CheckSquare, label: 'Action Items' },
  { to: '/decisions', icon: BookMarked, label: 'Decisions' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '240px',
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'width 0.2s ease',
        flexShrink: 0,
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? '1rem' : '1.25rem 1.25rem',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
          }}
        >
          <Sparkles size={18} color="white" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', whiteSpace: 'nowrap' }}>
              MeetMind
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--color-text-faint)', marginTop: '1px' }}>
              AI Meeting Assistant
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn-ghost btn btn-sm"
          style={{ marginLeft: 'auto', padding: '0.3rem' }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <Menu size={16} /> : <X size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={collapsed ? label : ''}
            style={collapsed ? { justifyContent: 'center', padding: '0.65rem' } : {}}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div
        style={{
          padding: '0.75rem',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {!collapsed && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.75rem',
              borderRadius: 8,
              background: 'var(--color-surface-2)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: 'white',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="sidebar-link"
          style={collapsed ? { justifyContent: 'center', padding: '0.65rem' } : {}}
          title="Logout"
        >
          <LogOut size={16} style={{ color: 'var(--color-danger)' }} />
          {!collapsed && <span style={{ color: 'var(--color-danger)' }}>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
