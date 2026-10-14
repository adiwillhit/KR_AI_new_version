import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { meetingsAPI, projectsAPI, participantsAPI } from '../services/endpoints.js';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarDays, Users, Save } from 'lucide-react';
import Spinner from '../components/Spinner.jsx';
import { getErrorMessage } from '../utils/helpers.js';

export default function CreateMeetingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultProjectId = searchParams.get('projectId') || '';
  const [projects, setProjects] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      projectId: defaultProjectId,
      title: '',
      description: '',
      date: new Date().toISOString().slice(0, 16),
      duration: '',
      participantIds: [],
    },
  });

  const selectedProjectId = watch('projectId');

  useEffect(() => {
    projectsAPI.getAll().then(({ data }) => setProjects(data.data.projects));
  }, []);

  useEffect(() => {
    if (!selectedProjectId) { setParticipants([]); return; }
    setLoadingParticipants(true);
    participantsAPI.getByProject(selectedProjectId)
      .then(({ data }) => setParticipants(data.data.participants))
      .catch(() => setParticipants([]))
      .finally(() => setLoadingParticipants(false));
  }, [selectedProjectId]);

  const onSubmit = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : 0,
        date: new Date(formData.date).toISOString(),
      };
      const { data } = await meetingsAPI.create(payload);
      toast.success('Meeting created!');
      navigate(`/meetings/${data.data.meeting._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
      <Link to="/meetings" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '1.5rem' }}>
        <ArrowLeft size={14} /> Back to Meetings
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Create Meeting</h1>
          <p className="page-subtitle">Fill in the meeting details below.</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Project */}
          <div className="form-group">
            <label className="label">Project *</label>
            <select
              className={`input ${errors.projectId ? 'input-error' : ''}`}
              {...register('projectId', { required: 'Please select a project' })}
            >
              <option value="">Select a project...</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            {errors.projectId && <span className="error-msg">{errors.projectId.message}</span>}
          </div>

          {/* Title */}
          <div className="form-group">
            <label className="label">Meeting Title *</label>
            <input
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="e.g., Sprint 2 Planning"
              {...register('title', { required: 'Title is required', maxLength: { value: 300, message: 'Title too long' } })}
            />
            {errors.title && <span className="error-msg">{errors.title.message}</span>}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              placeholder="What will be discussed?"
              style={{ resize: 'vertical' }}
              {...register('description')}
            />
          </div>

          {/* Date & Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="label">Date & Time *</label>
              <input
                type="datetime-local"
                className={`input ${errors.date ? 'input-error' : ''}`}
                {...register('date', { required: 'Date is required' })}
              />
              {errors.date && <span className="error-msg">{errors.date.message}</span>}
            </div>
            <div className="form-group">
              <label className="label">Duration (minutes)</label>
              <input
                type="number"
                className="input"
                placeholder="e.g., 60"
                min={0}
                max={480}
                {...register('duration')}
              />
            </div>
          </div>

          {/* Participants */}
          <div className="form-group">
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={13} /> Participants
              {loadingParticipants && <Spinner size={12} />}
            </label>
            {!selectedProjectId ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-faint)', padding: '0.5rem 0' }}>
                Select a project first to add participants.
              </p>
            ) : participants.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-faint)', padding: '0.5rem 0' }}>
                No participants in this project yet.{' '}
                <Link to={`/projects/${selectedProjectId}`} style={{ color: '#818cf8' }}>Add participants →</Link>
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {participants.map((p) => {
                  const checkbox = register('participantIds');
                  return (
                    <label
                      key={p._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.4rem 0.75rem',
                        borderRadius: 8,
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        transition: 'border-color 0.15s',
                      }}
                    >
                      <input
                        type="checkbox"
                        value={p._id}
                        style={{ accentColor: 'var(--color-accent)' }}
                        {...checkbox}
                      />
                      {p.name}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
            <Link to="/meetings" className="btn btn-secondary">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Spinner size={16} color="white" /> : <Save size={16} />}
              {saving ? 'Creating...' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
