import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { actionItemsAPI, projectsAPI } from '../services/endpoints.js';
import PageLoader from '../components/PageLoader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import toast from 'react-hot-toast';
import {
  CheckSquare, Filter, Clock, User, Calendar, CheckCircle2,
  Circle, AlertCircle, Trash2, ArrowUpRight
} from 'lucide-react';
import { formatDate } from '../utils/helpers.js';

export default function ActionItemsPage() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedProject, setSelectedProject] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [itemsRes, projRes] = await Promise.all([
        actionItemsAPI.getAll({
          projectId: selectedProject || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        }),
        projectsAPI.getAll(),
      ]);
      setItems(itemsRes.data.data.actionItems || []);
      setProjects(projRes.data.data.projects || []);
    } catch (err) {
      setError('Failed to load action items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProject, statusFilter, priorityFilter]);

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'completed' ? 'pending' : 'completed';
    try {
      await actionItemsAPI.update(item._id, { status: nextStatus });
      setItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, status: nextStatus } : i))
      );
      toast.success(nextStatus === 'completed' ? 'Marked task as completed!' : 'Re-opened task.');
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await actionItemsAPI.delete(id);
      setItems((prev) => prev.filter((i) => i._id !== id));
      toast.success('Action item deleted.');
    } catch {
      toast.error('Failed to delete item.');
    }
  };

  const getPriorityBadge = (p) => {
    if (p === 'high') return <span className="badge badge-error">High</span>;
    if (p === 'medium') return <span className="badge badge-warning">Medium</span>;
    return <span className="badge badge-info">Low</span>;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
            Action Items
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Track commitments, task owners, and deliverables extracted by AI across all meetings.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className="card"
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '1.5rem',
          padding: '1rem 1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          <Filter size={16} /> Filters:
        </div>

        {/* Project selector */}
        <select
          className="input"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          style={{ width: 'auto', minWidth: 160 }}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          className="input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        {/* Priority filter */}
        <select
          className="input"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="all">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {loading ? (
        <PageLoader message="Loading action items..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchData} />
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <CheckSquare size={48} style={{ color: 'var(--color-text-faint)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No Action Items Found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Action items are automatically detected when AI analyzes meeting transcripts.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((item) => {
            const isDone = item.status === 'completed';
            return (
              <div
                key={item._id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  opacity: isDone ? 0.65 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <button
                  onClick={() => handleToggleStatus(item)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDone ? 'var(--color-accent)' : 'var(--color-text-faint)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {isDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      textDecoration: isDone ? 'line-through' : 'none',
                      marginBottom: '0.35rem',
                    }}
                  >
                    {item.task}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <User size={14} color="var(--color-accent)" /> {item.owner || 'Unassigned'}
                    </span>
                    {item.deadline && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} /> Due: {item.deadline}
                      </span>
                    )}
                    {item.projectId?.name && (
                      <span className="tag" style={{ fontSize: '0.7rem' }}>
                        {item.projectId.name}
                      </span>
                    )}
                    {item.meetingId && (
                      <Link
                        to={`/meetings/${item.meetingId._id || item.meetingId}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          color: 'var(--color-accent)',
                          textDecoration: 'none',
                        }}
                      >
                        {item.meetingId.title || 'Meeting'} <ArrowUpRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  {getPriorityBadge(item.priority)}
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="btn-ghost btn btn-sm"
                    style={{ color: 'var(--color-danger)', padding: '0.35rem' }}
                    title="Delete item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
