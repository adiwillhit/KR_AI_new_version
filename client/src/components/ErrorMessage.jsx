import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ message = 'Something went wrong.', onRetry }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          background: 'rgba(239,68,68,0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertCircle size={24} color="var(--color-danger)" />
      </div>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: 320, lineHeight: 1.5 }}>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}
