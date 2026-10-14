/**
 * Shared frontend utility helpers.
 */

/**
 * Format a date to a human-readable string.
 */
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

/**
 * Relative time string (e.g., "2 days ago").
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return '—';
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return formatDate(dateStr);
}

/**
 * Format seconds into MM:SS timestamp string.
 */
export function formatTimestamp(seconds) {
  if (seconds == null) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

/**
 * Get processing status display info.
 */
export function getProcessingStatusInfo(status) {
  const map = {
    idle: { label: 'No Recording', color: 'var(--color-text-faint)', bg: 'rgba(71,85,105,0.2)', border: 'var(--color-border)' },
    uploaded: { label: 'Uploaded', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)', border: 'rgba(34,211,238,0.2)' },
    queued: { label: 'Queued', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
    transcribing: { label: 'Transcribing', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    transcribed: { label: 'Transcribed', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    analyzing: { label: 'Analyzing', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    analyzed: { label: 'Analyzed', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    embedding: { label: 'Embedding', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    completed: { label: 'Completed', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
    failed: { label: 'Failed', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' },
  };
  return map[status] || map.idle;
}

/**
 * Get action item status badge info.
 */
export function getActionStatusInfo(status) {
  const map = {
    pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
    in_progress: { label: 'In Progress', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)', border: 'rgba(34,211,238,0.2)' },
    completed: { label: 'Completed', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
    cancelled: { label: 'Cancelled', color: 'var(--color-text-faint)', bg: 'rgba(71,85,105,0.2)', border: 'var(--color-border)' },
  };
  return map[status] || map.pending;
}

/**
 * Truncate text to a max length.
 */
export function truncate(str, maxLen = 120) {
  if (!str) return '';
  return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;
}

/**
 * Extract an error message from an Axios error.
 */
export function getErrorMessage(err, fallback = 'Something went wrong.') {
  return err?.response?.data?.message || err?.message || fallback;
}
