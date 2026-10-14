import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../services/endpoints.js';
import PageLoader from '../components/PageLoader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import toast from 'react-hot-toast';
import {
  FolderKanban, Plus, Search, Trash2, Edit, Users,
  CalendarDays, MoreVertical, X, Check, Archive
} from 'lucide-react';
import { formatRelativeTime, getErrorMessage } from '../utils/helpers.js';
import { useForm } from 'react-hook-form';

function ProjectFormModal({ project, onClose, onSaved }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: project?.name || '', description: project?.description || '' },
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let saved;
      if (project) {
        const res = await projectsAPI.update(project._id, data);
        saved = res.data.data.project;
        toast.success('Project updated.');
      } else {
        const res = await projectsAPI.create(data);
        saved = res.data.data.project;
        toast.success('Project created!');
      }
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{project ? 'Edit Project' : 'Create New Project'}</h3>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="label">Project Name *</label>
            <input
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="e.g., Mobile App Development"
              {...register('name', { required: 'Project name is required' })}
            />
            {errors.name && <span className="error-msg">{errors.name.message}</span>}
          </div>
          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              placeholder="What is this project about?"
              style={{ resize: 'vertical' }}
              {...register('description')}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await projectsAPI.getAll();
      setProjects(data.data.projects);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async () => {
    try {
      await projectsAPI.delete(deleteTarget._id);
      setProjects((p) => p.filter((x) => x._id !== deleteTarget._id));
      toast.success('Project deleted.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageLoader message="Loading projects..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchProjects} />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditProject(null); setShowForm(true); }}>
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 380 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)' }} />
        <input
          type="text"
          className="input"
          placeholder="Search projects..."
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
          <div className="empty-state-icon"><FolderKanban size={28} /></div>
          <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>
            {search ? 'No projects match your search' : 'No projects yet'}
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {search ? 'Try a different search term.' : 'Create your first project to get started.'}
          </p>
          {!search && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Create First Project
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filtered.map((project) => (
            <div key={project._id} className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <Link
                  to={`/projects/${project._id}`}
                  style={{ textDecoration: 'none', flex: 1 }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: `linear-gradient(135deg, hsl(${(project.name.charCodeAt(0) * 13) % 360}, 65%, 55%), hsl(${(project.name.charCodeAt(0) * 7 + 60) % 360}, 65%, 65%))`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'white',
                      marginBottom: '0.75rem',
                      flexShrink: 0,
                    }}
                  >
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                    {project.name}
                  </h3>
                  {project.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {project.description}
                    </p>
                  )}
                </Link>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setEditProject(project); setShowForm(true); }}
                    title="Edit"
                    style={{ padding: '0.3rem' }}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDeleteTarget(project)}
                    title="Delete"
                    style={{ padding: '0.3rem', color: 'var(--color-danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="divider" style={{ margin: '0.75rem 0' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Users size={12} />
                  {(project.members?.length || 0)} member{project.members?.length !== 1 ? 's' : ''}
                </span>
                <span>{formatRelativeTime(project.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProjectFormModal
          project={editProject}
          onClose={() => { setShowForm(false); setEditProject(null); }}
          onSaved={(saved) => {
            if (editProject) {
              setProjects((p) => p.map((x) => (x._id === saved._id ? saved : x)));
            } else {
              setProjects((p) => [saved, ...p]);
            }
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Project"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
