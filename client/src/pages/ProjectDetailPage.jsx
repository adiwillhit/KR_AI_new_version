import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectsAPI, meetingsAPI, participantsAPI } from '../services/endpoints.js';
import PageLoader from '../components/PageLoader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import toast from 'react-hot-toast';
import {
  ArrowLeft, CalendarDays, Users, Plus, Settings, Trash2,
  UserPlus, UserMinus, Edit, Search
} from 'lucide-react';
import { formatDate, formatRelativeTime, getProcessingStatusInfo, getErrorMessage } from '../utils/helpers.js';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('meetings');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, meetRes, partRes] = await Promise.all([
        projectsAPI.getById(id),
        meetingsAPI.getByProject(id),
        participantsAPI.getByProject(id),
      ]);
      setProject(projRes.data.data.project);
      setMeetings(meetRes.data.data.meetings);
      setParticipants(partRes.data.data.participants);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleDeleteMeeting = async () => {
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

  if (loading) return <PageLoader message="Loading project..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;
  if (!project) return null;

  const tabs = [
    { id: 'meetings', label: `Meetings (${meetings.length})` },
    { id: 'participants', label: `Participants (${participants.length})` },
  ];

  return (
    <div className="animate-fade-in">
      {/* Back */}
      <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '1.25rem' }}>
        <ArrowLeft size={14} /> Back to Projects
      </Link>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="page-subtitle">{project.description}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Users size={13} /> {project.members?.length || 0} members
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <CalendarDays size={13} /> Created {formatRelativeTime(project.createdAt)}
            </span>
            <span
              className="badge"
              style={{
                background: project.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(71,85,105,0.2)',
                color: project.status === 'active' ? '#10b981' : 'var(--color-text-muted)',
                borderColor: project.status === 'active' ? 'rgba(16,185,129,0.2)' : 'var(--color-border)',
              }}
            >
              {project.status}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            to={`/meetings/create?projectId=${project._id}`}
            className="btn btn-primary"
          >
            <Plus size={16} /> New Meeting
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '0.625rem 1.25rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === t.id ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === t.id ? '#818cf8' : 'var(--color-text-muted)',
              fontWeight: activeTab === t.id ? 600 : 400,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              marginBottom: '-1px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Meetings Tab */}
      {activeTab === 'meetings' && (
        <div>
          {meetings.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-state-icon"><CalendarDays size={28} /></div>
              <h3 style={{ fontWeight: 600 }}>No meetings yet</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Create your first meeting for this project.</p>
              <Link to={`/meetings/create?projectId=${project._id}`} className="btn btn-primary">
                <Plus size={16} /> Create Meeting
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {meetings.map((m) => {
                const si = getProcessingStatusInfo(m.processingStatus);
                return (
                  <div key={m._id} className="card" style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                      <Link to={`/meetings/${m._id}`} style={{ textDecoration: 'none', flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.3rem' }}>
                          {m.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          <span>📅 {formatDate(m.date)}</span>
                          {m.duration > 0 && <span>⏱ {m.duration} min</span>}
                          <span>👥 {m.participants?.length || 0} participants</span>
                        </div>
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
        </div>
      )}

      {/* Participants Tab */}
      {activeTab === 'participants' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <Link
              to={`/projects/${id}/participants/add`}
              className="btn btn-secondary btn-sm"
            >
              <UserPlus size={14} /> Add Participant
            </Link>
          </div>
          {participants.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-state-icon"><Users size={28} /></div>
              <h3 style={{ fontWeight: 600 }}>No participants yet</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Add participants to track who attends meetings.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {participants.map((p) => (
                <div key={p._id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'white',
                        flexShrink: 0,
                      }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </div>
                      {p.email && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.email}
                        </div>
                      )}
                      {p.role && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>{p.role}</div>}
                    </div>
                    {p.speakerLabel && (
                      <span className="tag">{p.speakerLabel}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Meeting"
          message={`Delete "${deleteTarget.title}"? All associated data will be permanently removed.`}
          onConfirm={handleDeleteMeeting}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
