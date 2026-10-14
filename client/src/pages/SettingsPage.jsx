import { useState, useEffect } from 'react';
import { systemAPI } from '../services/endpoints.js';
import PageLoader from '../components/PageLoader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import {
  Settings, CheckCircle, XCircle, RefreshCw, Cpu,
  Database, Mic, Mail, Sparkles, Layers, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      const { data } = await systemAPI.getStatus();
      setStatus(data.data.status);
    } catch {
      toast.error('Failed to query system status.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  if (loading) return <PageLoader message="Checking system components..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
            System Settings & Status
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Infrastructure diagnostic, AI engine connectivity, and pipeline architecture status.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn btn-secondary"
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* MongoDB */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Database size={20} color="#10b981" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Database</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>MongoDB (Mongoose ODM)</p>
              </div>
            </div>
            {status?.database?.connected ? (
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle size={12} /> Connected
              </span>
            ) : (
              <span className="badge badge-error" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <XCircle size={12} /> Offline
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Stores users, projects, meetings, transcripts, chunks, action items, decisions, and risks.
          </p>
        </div>

        {/* Ollama LLM */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={20} color="var(--color-accent)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Local LLM (Ollama)</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{status?.ollama?.model || 'llama3.2'}</p>
              </div>
            </div>
            {status?.ollama?.available ? (
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle size={12} /> Active
              </span>
            ) : (
              <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={12} /> Local Fallback
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            {status?.ollama?.available
              ? 'Local Ollama service detected. Fast GPU/CPU inference active for summarization and Q&A.'
              : 'Ollama is offline; built-in local NLP heuristic intelligence engine is handling extractions seamlessly.'}
          </p>
        </div>

        {/* Whisper */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mic size={20} color="#f59e0b" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Speech-to-Text</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Whisper / Audio Ingestion</p>
              </div>
            </div>
            {status?.whisper?.available ? (
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle size={12} /> Whisper CLI
              </span>
            ) : (
              <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={12} /> Smart Parser
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Ingests MP3, WAV, M4A, MP4 recordings, and direct TXT transcript uploads with speaker segmentation.
          </p>
        </div>

        {/* Email Dispatch */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(236,72,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={20} color="#ec4899" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Email Follow-ups</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Nodemailer SMTP</p>
              </div>
            </div>
            {status?.smtp?.configured ? (
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle size={12} /> SMTP Active
              </span>
            ) : (
              <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Sparkles size={12} /> Simulation Mode
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            {status?.smtp?.configured
              ? 'SMTP host connected for automated meeting minutes and action items dispatch.'
              : 'Safe simulation mode: emails are logged in development mode without sending actual mail.'}
          </p>
        </div>
      </div>

      {/* Architecture & Implementation Roadmap */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} color="var(--color-accent)" /> 5-Phase Master Specification Architecture
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>✓</div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Phase 1 — Project Management & Meeting Workspace Foundation</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                Full auth with JWT & bcrypt, project workspaces with member roles, participant profiles, meeting scheduling, recording upload and dark-themed UI.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>✓</div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Phase 2 — Audio & Video Ingestion + Transcription Pipeline</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                Multi-format media ingestion (MP3, WAV, M4A, MP4, TXT), resilient queue worker, Whisper integration, and timestamped speaker dialogue extraction.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>✓</div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Phase 3 — AI Intelligence Engine</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                Automated executive summary, key discussion points, topic categorization, action item assignment with deadlines & priority, decisions log, and risks/blockers detection.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>✓</div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Phase 4 — RAG System & Contextual AI Meeting Assistant</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                Transcript semantic chunking, embedding generation, vector cosine similarity search, and interactive conversational Q&A assistant with timestamp citations.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>✓</div>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Phase 5 — Automated Follow-ups, Email Dispatch & Export</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                One-click Markdown & Text meeting minutes export, automated email dispatch to attendees, and universal action items tracking board.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
