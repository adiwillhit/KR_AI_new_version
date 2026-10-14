import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { decisionsAPI, projectsAPI } from '../services/endpoints.js';
import PageLoader from '../components/PageLoader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { BookMarked, Search, Filter, Calendar, User, ArrowUpRight } from 'lucide-react';
import { formatDate } from '../utils/helpers.js';

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [decRes, projRes] = await Promise.all([
        decisionsAPI.getAll({
          projectId: selectedProject || undefined,
          search: search || undefined,
        }),
        projectsAPI.getAll(),
      ]);
      setDecisions(decRes.data.data.decisions || []);
      setProjects(projRes.data.data.projects || []);
    } catch {
      setError('Failed to load decisions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [search, selectedProject]);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
          Decisions Log
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Historical record of all key architectural, product, and operational decisions agreed upon in meetings.
        </p>
      </div>

      {/* Filter and Search Bar */}
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
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)' }} />
          <input
            className="input"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search decisions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          style={{ width: 'auto', minWidth: 180 }}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <PageLoader message="Loading decisions log..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchData} />
      ) : decisions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <BookMarked size={48} style={{ color: 'var(--color-text-faint)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No Decisions Found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Decisions are extracted automatically by AI during meeting processing.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
          {decisions.map((dec) => (
            <div key={dec._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '4px solid #10b981' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.5 }}>
                {dec.text}
              </p>

              {dec.context && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  "{dec.context}"
                </p>
              )}

              <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={13} color="#10b981" /> {dec.madeBy || 'Team Consensus'}
                </span>

                {dec.meetingId && (
                  <Link
                    to={`/meetings/${dec.meetingId._id || dec.meetingId}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      color: 'var(--color-accent)',
                      textDecoration: 'none',
                    }}
                  >
                    {dec.meetingId.title || 'Meeting'} <ArrowUpRight size={12} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
