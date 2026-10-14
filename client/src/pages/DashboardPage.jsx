import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { meetingsAPI } from '../services/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageLoader from '../components/PageLoader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import {
  FolderKanban, CalendarDays, CheckSquare, Clock,
  ArrowRight, Zap, TrendingUp, AlertCircle
} from 'lucide-react';
import { formatDate, formatRelativeTime, getProcessingStatusInfo } from '../utils/helpers.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await meetingsAPI.getDashboard();
      setStats(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) return <PageLoader message="Loading dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchStats} />;

  const statCards = [
    {
      label: 'Total Projects',
      value: stats.totalProjects,
      icon: FolderKanban,
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.12)',
      to: '/projects',
    },
    {
      label: 'Total Meetings',
      value: stats.totalMeetings,
      icon: CalendarDays,
      color: '#22d3ee',
      bg: 'rgba(34,211,238,0.1)',
      to: '/meetings',
    },
    {
      label: 'Pending Actions',
      value: stats.pendingActionItems?.length || 0,
      icon: CheckSquare,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      to: '/action-items',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Good {getGreeting()},{' '}
            <span style={{ background: 'linear-gradient(90deg, #6366f1, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {user?.name?.split(' ')[0]}
            </span> 👋
          </h1>
          <p className="page-subtitle">Here's what's happening across your projects.</p>
        </div>
        <Link to="/meetings/create" className="btn btn-primary">
          <Zap size={16} />
          New Meeting
        </Link>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map(({ label, value, icon: Icon, color, bg, to }) => (
          <Link key={label} to={to} style={{ textDecoration: 'none' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: bg }}>
                <Icon size={22} color={color} />
              </div>
              <div>
                <div className="stat-value">{value}</div>
                <div className="stat-label">{label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Meetings */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={17} color="var(--color-accent)" />
              Recent Meetings
            </h2>
            <Link to="/meetings" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#818cf8', textDecoration: 'none' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {stats.recentMeetings?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CalendarDays size={24} /></div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No meetings yet</p>
              <Link to="/meetings/create" className="btn btn-primary btn-sm">Create First Meeting</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.recentMeetings.map((m) => {
                const statusInfo = getProcessingStatusInfo(m.processingStatus);
                return (
                  <Link
                    key={m._id}
                    to={`/meetings/${m._id}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 8,
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-light)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                            {m.projectId?.name} · {formatRelativeTime(m.date)}
                          </div>
                        </div>
                        <span
                          className="badge"
                          style={{ background: statusInfo.bg, color: statusInfo.color, borderColor: statusInfo.border, flexShrink: 0, fontSize: '0.65rem' }}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Pending Action Items */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={17} color="#f59e0b" />
              Pending Actions
            </h2>
            <Link to="/action-items" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#818cf8', textDecoration: 'none' }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {stats.pendingActionItems?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CheckSquare size={24} /></div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No pending action items</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.pendingActionItems.map((item) => (
                <div
                  key={item._id}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 8,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderLeft: '3px solid var(--color-warning)',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.task}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    <span>👤 {item.owner}</span>
                    {item.deadline && <span>· 📅 {item.deadline}</span>}
                    {item.meetingId && <span>· {item.meetingId.title}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
