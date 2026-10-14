import Spinner from './Spinner.jsx';

export default function PageLoader({ message = 'Loading...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        gap: '1rem',
      }}
    >
      <Spinner size={32} />
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{message}</p>
    </div>
  );
}
