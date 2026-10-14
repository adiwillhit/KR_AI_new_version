import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} color={danger ? 'var(--color-danger)' : 'var(--color-warning)'} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{message}</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ padding: '0.25rem' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
