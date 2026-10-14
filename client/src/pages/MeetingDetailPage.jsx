import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { meetingsAPI, actionItemsAPI } from '../services/endpoints.js';
import PageLoader from '../components/PageLoader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Upload, FileAudio, FileText, Brain,
  CheckSquare, AlertTriangle, Ban, Tag, Trash2,
  Clock, Users, RefreshCw, MessageSquare, Info,
  Download, Mail, Send, CheckCircle2, Circle, Sparkles, X
} from 'lucide-react';
import {
  formatDate, formatTimestamp, formatFileSize,
  getProcessingStatusInfo, getErrorMessage, truncate
} from '../utils/helpers.js';
import Spinner from '../components/Spinner.jsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Info },
  { id: 'transcript', label: 'Transcript', icon: FileText },
  { id: 'summary', label: 'Summary', icon: Brain },
  { id: 'decisions', label: 'Decisions', icon: CheckSquare },
  { id: 'actions', label: 'Action Items', icon: AlertTriangle },
  { id: 'risks', label: 'Risks & Blockers', icon: Ban },
  { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
];

function UploadSection({ meetingId, onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const allowed = ['.mp3', '.wav', '.m4a', '.mp4', '.txt'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      toast.error(`File type not supported. Allowed: ${allowed.join(', ')}`);
      return;
    }
    const maxBytes = 500 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error('File is too large (max 500 MB).');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('recording', file);
      const { data } = await meetingsAPI.uploadRecording(meetingId, formData);
      toast.success('Recording uploaded! Automated pipeline started.');
      onUploaded(data.data.meeting);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      onClick={() => !uploading && fileInputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? 'var(--color-accent)' : 'var(--color-border)'}`,
        borderRadius: 12,
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        cursor: uploading ? 'wait' : 'pointer',
        transition: 'all 0.2s',
        background: dragging ? 'rgba(99,102,241,0.04)' : 'var(--color-surface-2)',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.m4a,.mp4,.txt"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
      {uploading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <Spinner size={32} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Uploading recording...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Upload size={24} color="var(--color-accent)" />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
              Drop your recording here, or click to browse
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Supports MP3, WAV, M4A, MP4, TXT · Max 500 MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ProcessingStatus({ status, error }) {
  const si = getProcessingStatusInfo(status);
  const isProcessing = ['uploaded', 'queued', 'transcribing', 'transcribed', 'analyzing', 'analyzed', 'embedding'].includes(status);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '1rem 1.25rem',
        borderRadius: 10,
        background: si.bg,
        border: `1px solid ${si.border}`,
      }}
    >
      {isProcessing ? (
        <Spinner size={18} color={si.color} />
      ) : (
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: si.color, flexShrink: 0 }} />
      )}
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: si.color }}>{si.label}</div>
        {status === 'failed' && error && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{error}</div>
        )}
        {status === 'transcribing' && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            Transcribing audio with timestamped speaker turns...
          </div>
        )}
        {status === 'analyzing' && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            Extracting summary, decisions, action items, and risks...
          </div>
        )}
        {status === 'embedding' && (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            Building RAG vector embeddings for AI Assistant...
          </div>
        )}
      </div>
    </div>
  );
}

function EmptySection({ message }) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem', background: 'var(--color-surface-2)', borderRadius: 10, border: '1px solid var(--color-border)' }}>
      {message}
    </div>
  );
}

export default function MeetingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Tab data states
  const [decisions, setDecisions] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [risksBlockers, setRisksBlockers] = useState({ risks: [], blockers: [] });

  // Assistant Chat states
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your AI Meeting Assistant. Ask me anything about what was discussed, decisions made, or assigned tasks.',
      sources: [],
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Email modal
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchMeeting = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await meetingsAPI.getById(id);
      setMeeting(data.data.meeting);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMeeting(); }, [id]);

  // Load sub-resources when tabs are opened
  useEffect(() => {
    if (!meeting) return;
    if (activeTab === 'decisions') {
      meetingsAPI.getDecisions(id).then((res) => setDecisions(res.data.data.decisions || [])).catch(() => {});
    } else if (activeTab === 'actions') {
      meetingsAPI.getActionItems(id).then((res) => setActionItems(res.data.data.actionItems || [])).catch(() => {});
    } else if (activeTab === 'risks') {
      meetingsAPI.getRisksAndBlockers(id).then((res) => setRisksBlockers(res.data.data || { risks: [], blockers: [] })).catch(() => {});
    }
  }, [activeTab, meeting, id]);

  // Polling for processing updates
  useEffect(() => {
    const processing = ['uploaded', 'queued', 'transcribing', 'transcribed', 'analyzing', 'analyzed', 'embedding'];
    if (!meeting || !processing.includes(meeting.processingStatus)) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await meetingsAPI.getById(id);
        setMeeting(data.data.meeting);
      } catch { /* silent */ }
    }, 4000);
    return () => clearInterval(interval);
  }, [meeting?.processingStatus, id]);

  const handleDelete = async () => {
    try {
      await meetingsAPI.delete(id);
      toast.success('Meeting deleted.');
      navigate('/meetings');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleReanalyze = async () => {
    try {
      await meetingsAPI.reanalyze(id);
      toast.success('AI analysis restarted!');
      fetchMeeting();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to trigger re-analysis.'));
    }
  };

  const handleExport = async (format = 'markdown') => {
    try {
      const response = await meetingsAPI.exportMinutes(id, format);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${meeting.title.replace(/\s+/g, '_')}_minutes.${format === 'markdown' ? 'md' : 'txt'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Meeting minutes downloaded!');
    } catch {
      toast.error('Failed to export minutes.');
    }
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      const recipients = customEmail.trim() ? customEmail.split(',').map((e) => e.trim()) : undefined;
      const { data } = await meetingsAPI.sendEmail(id, { customRecipients: recipients });
      toast.success(data.data?.simulated ? 'Dispatched (Simulated mode)!' : 'Email sent successfully!');
      setEmailModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to dispatch email.'));
    } finally {
      setSendingEmail(false);
    }
  };

  const handleToggleActionStatus = async (item) => {
    const nextStatus = item.status === 'completed' ? 'pending' : 'completed';
    try {
      await actionItemsAPI.update(item._id, { status: nextStatus });
      setActionItems((prev) =>
        prev.map((i) => (i._id === item._id ? { ...i, status: nextStatus } : i))
      );
      toast.success(nextStatus === 'completed' ? 'Task completed!' : 'Task re-opened.');
    } catch {
      toast.error('Failed to update task.');
    }
  };

  const handleChatSubmit = async (queryText) => {
    const q = queryText || chatInput;
    if (!q || !q.trim() || chatLoading) return;

    const userMsg = { role: 'user', text: q };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const { data } = await meetingsAPI.chat(id, q);
      const assistantMsg = {
        role: 'assistant',
        text: data.data.answer,
        sources: data.data.sources || [],
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Sorry, I encountered an issue analyzing the transcript.', sources: [] },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return <PageLoader message="Loading meeting..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchMeeting} />;
  if (!meeting) return null;

  const si = getProcessingStatusInfo(meeting.processingStatus);
  const transcript = meeting.transcriptId;
  const isProcessing = ['uploaded', 'queued', 'transcribing', 'transcribed', 'analyzing', 'analyzed', 'embedding'].includes(meeting.processingStatus);

  return (
    <div className="animate-fade-in">
      {/* Back */}
      <Link to="/meetings" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '1.25rem' }}>
        <ArrowLeft size={14} /> Back to Meetings
      </Link>

      {/* Header */}
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ marginBottom: 0 }}>{meeting.title}</h1>
            <span className="badge" style={{ background: si.bg, color: si.color, borderColor: si.border }}>
              {si.label}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            <span>📁 {meeting.projectId?.name}</span>
            <span>📅 {formatDate(meeting.date)}</span>
            {meeting.duration > 0 && <span>⏱ {meeting.duration} min</span>}
            <span>👥 {meeting.participants?.length || 0} participants</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {meeting.transcriptId && !isProcessing && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleReanalyze}
              title="Re-run AI Analysis"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RefreshCw size={13} /> Re-analyze
            </button>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleExport('markdown')}
            title="Download Meeting Minutes as Markdown"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Download size={13} /> Export .md
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setEmailModalOpen(true)}
            title="Send Meeting Minutes via Email"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Mail size={13} /> Email
          </button>

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setDeleteConfirm(true)}
            style={{ color: 'var(--color-danger)' }}
            title="Delete Meeting"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.625rem 1rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tabId ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: activeTab === tabId ? '#818cf8' : 'var(--color-text-muted)',
              fontWeight: activeTab === tabId ? 600 : 400,
              fontSize: '0.825rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              marginBottom: '-1px',
              whiteSpace: 'nowrap',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Processing Status */}
            {meeting.processingStatus !== 'idle' && (
              <ProcessingStatus status={meeting.processingStatus} error={meeting.processingError} />
            )}

            {/* Recording Upload */}
            {(meeting.processingStatus === 'idle') && (
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileAudio size={17} color="var(--color-accent)" /> Upload Recording
                </h3>
                <UploadSection meetingId={meeting._id} onUploaded={setMeeting} />
              </div>
            )}

            {/* Recording info */}
            {meeting.recording && (
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileAudio size={17} color="var(--color-accent)" /> Attached Recording
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', background: 'var(--color-surface-2)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                  <FileAudio size={20} color="var(--color-accent)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{meeting.recording.originalName}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      {formatFileSize(meeting.recording.size)} · {meeting.recording.mimetype}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Participants */}
            {meeting.participants?.length > 0 && (
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={17} color="var(--color-accent)" /> Participants
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {meeting.participants.map((p) => (
                    <div
                      key={p._id}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: 'var(--color-surface-2)', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: '0.8rem' }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: 'white',
                        }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {meeting.description && (
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Description</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>{meeting.description}</p>
              </div>
            )}

            {meeting.summary && (
              <div className="card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Brain size={18} color="var(--color-accent)" /> Executive Summary
                  </h3>
                  <button onClick={() => setActiveTab('summary')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                    View Full Summary & Key Points →
                  </button>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.7 }}>
                  {meeting.summary}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TRANSCRIPT */}
        {activeTab === 'transcript' && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={17} color="var(--color-accent)" /> Transcript
            </h3>
            {!transcript ? (
              isProcessing ? (
                <ProcessingStatus status={meeting.processingStatus} />
              ) : (
                <EmptySection message="No transcript available. Upload a recording and it will be transcribed automatically." />
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 600, overflowY: 'auto', paddingRight: '0.5rem' }}>
                {transcript.segments?.length > 0 ? (
                  transcript.segments.map((seg, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 8,
                        background: 'var(--color-surface-2)',
                        borderLeft: '3px solid var(--color-accent)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {formatTimestamp(seg.start)} – {formatTimestamp(seg.end)}
                        </span>
                        <span style={{ fontWeight: 600, color: '#818cf8' }}>{seg.speaker}</span>
                      </div>
                      <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--color-text)' }}>{seg.text}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {transcript.fullText || 'Transcript is empty.'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* SUMMARY */}
        {activeTab === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Meeting Summary</h3>
              {meeting.summary ? (
                <p style={{ fontSize: '0.9rem', lineHeight: 1.8, color: 'var(--color-text)' }}>{meeting.summary}</p>
              ) : (
                <EmptySection message="Summary will appear here after AI analysis completes." />
              )}
            </div>
            {meeting.keyPoints?.length > 0 && (
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Key Points</h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', padding: 0 }}>
                  {meeting.keyPoints.map((kp, i) => (
                    <li key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                      <span style={{ color: 'var(--color-accent)', fontWeight: 700, flexShrink: 0 }}>·</span>
                      {kp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {meeting.topics?.length > 0 && (
              <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Topics Discussed</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {meeting.topics.map((t, i) => (
                    <span key={i} className="tag">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DECISIONS */}
        {activeTab === 'decisions' && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckSquare size={17} color="#10b981" /> Decisions ({decisions.length})
            </h3>
            {decisions.length === 0 ? (
              <EmptySection message="No decisions recorded yet. Run AI analysis from the Overview tab once a transcript is ready." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {decisions.map((d) => (
                  <div
                    key={d._id}
                    style={{
                      padding: '0.875rem 1rem',
                      borderRadius: 8,
                      background: 'var(--color-surface-2)',
                      borderLeft: '4px solid #10b981',
                    }}
                  >
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '0.35rem' }}>
                      {d.text}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span>👤 {d.madeBy || 'Team'}</span>
                      {d.context && <span>💬 {d.context}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACTION ITEMS */}
        {activeTab === 'actions' && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={17} color="#f59e0b" /> Action Items ({actionItems.length})
            </h3>
            {actionItems.length === 0 ? (
              <EmptySection message="No action items found yet. AI will extract actionable commitments during analysis." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {actionItems.map((item) => {
                  const isDone = item.status === 'completed';
                  return (
                    <div
                      key={item._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.875rem',
                        padding: '0.75rem 1rem',
                        borderRadius: 8,
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        opacity: isDone ? 0.6 : 1,
                      }}
                    >
                      <button
                        onClick={() => handleToggleActionStatus(item)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDone ? '#10b981' : 'var(--color-text-faint)' }}
                      >
                        {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                      </button>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', textDecoration: isDone ? 'line-through' : 'none' }}>
                          {item.task}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                          <span>👤 @{item.owner}</span>
                          {item.deadline && <span>⏱ Due: {item.deadline}</span>}
                        </div>
                      </div>
                      <span className={`badge badge-${item.priority === 'high' ? 'error' : item.priority === 'medium' ? 'warning' : 'info'}`}>
                        {item.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* RISKS & BLOCKERS */}
        {activeTab === 'risks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={17} color="#ef4444" /> Identified Risks
              </h3>
              {risksBlockers.risks?.length === 0 ? (
                <EmptySection message="No risks detected in this meeting." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {risksBlockers.risks.map((r) => (
                    <div key={r._id} style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'rgba(239,68,68,0.06)', borderLeft: '4px solid #ef4444' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>{r.text}</p>
                        <span className="badge badge-error">{r.severity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Ban size={17} color="#f59e0b" /> Blockers
              </h3>
              {risksBlockers.blockers?.length === 0 ? (
                <EmptySection message="No blockers reported in this meeting." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {risksBlockers.blockers.map((b) => (
                    <div key={b._id} style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'rgba(245,158,11,0.06)', borderLeft: '4px solid #f59e0b' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>{b.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI ASSISTANT (RAG) */}
        {activeTab === 'assistant' && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
              <Sparkles size={18} color="var(--color-accent)" />
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>MeetMind AI Assistant</h3>
              <span className="badge badge-info" style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                Contextual RAG
              </span>
            </div>

            {/* Quick Prompt Chips */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {[
                'What were the key decisions made?',
                'Who was assigned action items and deadlines?',
                'What technical risks or blockers were discussed?',
                'Summarize the meeting in 3 bullet points',
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChatSubmit(q)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Message Area */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem', maxHeight: 420 }}>
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    background: msg.role === 'user' ? 'var(--color-accent)' : 'var(--color-surface-2)',
                    color: msg.role === 'user' ? 'white' : 'var(--color-text)',
                    padding: '0.75rem 1rem',
                    borderRadius: 12,
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    border: msg.role === 'assistant' ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  <p>{msg.text}</p>
                  {msg.sources?.length > 0 && (
                    <div style={{ marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      <strong>Citations from transcript:</strong>
                      {msg.sources.map((s, si) => (
                        <div key={si} style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>
                          • [{formatTimestamp(s.startTime)}]: "{truncate(s.text, 80)}" (Relevance: {s.score})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', background: 'var(--color-surface-2)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Spinner size={16} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Searching transcript with RAG...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleChatSubmit(); }}
              style={{ display: 'flex', gap: '0.5rem' }}
            >
              <input
                className="input"
                style={{ flex: 1 }}
                placeholder="Ask about discussion, tasks, decisions..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={chatLoading}
              />
              <button className="btn btn-primary" type="submit" disabled={chatLoading || !chatInput.trim()}>
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Meeting"
          message={`Delete "${meeting.title}"? All transcripts, action items, and AI analysis will be removed.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}

      {/* Email Minutes Modal */}
      {emailModalOpen && (
        <div className="modal-overlay" onClick={() => setEmailModalOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={18} color="var(--color-accent)" /> Send Meeting Minutes
              </h3>
              <button className="btn-ghost btn btn-sm" onClick={() => setEmailModalOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Dispatch formatted executive summary, decisions, and action items directly to attendees or custom emails.
            </p>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Custom Recipients (comma separated):
              </label>
              <input
                className="input"
                placeholder="e.g. dev-team@company.com, sarah@company.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-faint)', display: 'block', marginTop: '0.25rem' }}>
                Leave empty to send to all registered meeting participants.
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setEmailModalOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSendEmail}
                disabled={sendingEmail}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {sendingEmail ? <Spinner size={14} color="white" /> : <Send size={14} />}
                {sendingEmail ? 'Sending...' : 'Send Minutes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
