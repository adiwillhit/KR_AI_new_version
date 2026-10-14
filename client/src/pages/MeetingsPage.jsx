import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { meetingsAPI } from '../services/endpoints.js';
import PageLoader from '../components/PageLoader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import toast from 'react-hot-toast';
import { CalendarDays, Plus, Search, Trash2, Filter, X } from 'lucide-react';
import { formatDate, formatRelativeTime, getProcessingStatusInfo, getErrorMessage } from '../utils/helpers.js';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchMeetings = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await meetingsAPI.getAll({ limit: 50 });
      setMeetings(data.data.meetings);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMeetings(); }, []);

  const handleDelete = async () => {
    try {
      await meetingsAPI.delete(deleteTarget._id);
      setMeetings((m) => m.filter((x) => x._id !== deleteTarget._id));
      toast.success('Meeting deleted.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = meetings.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.projectId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageLoader message="Loading meetings..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchMeetings} />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Meetings</h1>
          <p className="page-subtitle">{meetings.length} meeting{meetings.length !== 1 ? 's' : ''} across all projects</p>
        </div>
        <Link to="/meetings/create" className="btn btn-primary">
          <Plus size={16} /> New Meeting
        </Link>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 400 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)' }} />
        <input
          type="text"
          className="input"
          placeholder="Search meetings or projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: '2.25rem' }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-faint)' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon"><CalendarDays size={28} /></div>
          <h3 style={{ fontWeight: 600 }}>
            {search ? 'No meetings match your search' : 'No meetings yet'}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {search ? 'Try a different term.' : 'Create a meeting inside any project.'}
          </p>
          {!search && (
            <Link to="/meetings/create" className="btn btn-primary">
              <Plus size={16} /> Create Meeting
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((m) => {
            const si = getProcessingStatusInfo(m.processingStatus);
            return (
              <div key={m._id} className="card" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                  <Link to={`/meetings/${m._id}`} style={{ textDecoration: 'none', flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.3rem' }}>
                      {m.title}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span>📁 {m.projectId?.name || 'Unknown project'}</span>
                      <span>📅 {formatDate(m.date)}</span>
                      {m.duration > 0 && <span>⏱ {m.duration} min</span>}
                      <span>👥 {m.participants?.length || 0} participants</span>
                    </div>
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <span
                      className="badge"
                      style={{ background: si.bg, color: si.color, borderColor: si.border }}
                    >
                      {si.label}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setDeleteTarget(m)}
                      style={{ padding: '0.3rem', color: 'var(--color-danger)' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Meeting"
          message={`Delete "${deleteTarget.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
